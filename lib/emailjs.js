'use strict';
/* jshint node:true */

var nodemailer = require('nodemailer'),
  EmailTemplate = require('email-templates').EmailTemplate,
  events = require('events'),
  fs = require('fs'),
  path = require('path'),
  Q = require('q'),
  request = require('request'),
  orm = require('./orm'),
  defConfig = require('./config'),
  db = {};

var emailJS = function () {
  events.EventEmitter.call(this);

  var initialized = false,
    templatesDir = null,
    config = null,
    transport = null,
    templates = null,
    ruleSettings = null,
    defaultFrom = null,
    retryInterval = null,
    refreshInterval = null,
    rules = null,
    instance = this;

  this.init = function (_templatesDir, _config, _rules, cb) {
    if (initialized) {
      return handleExcp(cb, new Error('Already initialized'));
    }
    initialized = true;
    templatesDir = _templatesDir;
    config = _config;
    rules = _rules;

    validateInitialization()
    .then(loadTemplates)
    .then(intializeMailService)
    .then(initializeModels)
    .then(initializeListeners.bind(this))
    .then(initializeRetryListener.bind(this))
    .then(function () {    
      log('Ready');
      instance.emit('ready');
    })
    .catch(function (err) {
      handleExcp(cb, err);
    });
  };

  this.send = function (content, options, cb) {
    content = content || {};
    options = options || {};

    var template = templates[options.template];

    if (!template) { // Need a way to indicate text or html template
      return handleExcp(cb, 'Template not found: '+template);
    }
    if (!options || !options.to || !options.subject) {
      return handleExcp(cb, 'Invalid email options: '+options); 
    }

    options.from = options.from ? options.from : defaultFrom;
    renderMail(template, content)
    .then(function (results) {
      options.html = results.html;
      options.text = results.text;
      return sendMail(options);
    })
    .then(function (status) {
      options.content = content;
      if (status && status.accepted.length > 0) {
        var emailToSave = Object.assign({}, options);
        saveToArchive(emailToSave);  
      }
      
      if (status && status.rejected.length > 0) {
        options.to = status.rejected.toString();
        delete options.cc;
        delete options.bcc;
        return Q.reject(new Error('Failed for some recipients:'+status.rejected.toString()));
      }
    })
    .catch(function (err) {
      logErr('Sending mail: ',err.stack);
      options.content = content;
      options.error = err.stack;
      saveToOutbox(options);
      return handleExcp(cb, err); 
    });
  };

  function sendMail (email) {
    var  deferred = Q.defer();
    email = email || {};

    transport.sendMail({
      from: email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments
    }, function (err, responseStatus) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(responseStatus);
      }
    });
    return deferred.promise;
  }

  function renderMail (template, content) {
    var deferred = Q.defer();

    if (template) {
      template.render(content, function (err, results) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(results);  
        }
      });
    } else {
      deferred.reject(new Error('Template missing'));
    }
    return deferred.promise;
  }

  function saveToOutbox (record) {
    record.attempts = record.attempts ? record.attempts++ : 1;
    record.error = typeof record.error === 'object' ? 
      JSON.stringify(record.error) : record.error;

    if (record.eid) {
      delete record.updatedAt;
      db.models.mailoutbox.update({eid: record.eid}, record).exec(function (err, resp) {
        if (err) {
          handleExcp(null, 'Error while updating outbox: '+err.message);
        }
      });
    } else {
      delete record.createdAt;
      delete record.updatedAt;
      db.models.mailoutbox.create(record).exec(function (err, resp) {
        if (err) {
          handleExcp(null, 'Error while saving to outbox: '+err.message);
        }
      });  
    }
    
  }
  function deleteFromOutbox (record) {
    db.models.mailoutbox.destroy({eid: record.eid}).exec(function (err, resp) {
      if (err) {
        handleExcp(null, 'Error deleting from outbox: '+err.message);
      }
    });
  }

  function saveToArchive(record) {
    /* Emails saved to archive have a new unique eid */
    delete record.eid;
    delete record.createdAt;
    delete record.updatedAt;
    db.models.mailarchive.create(record).exec(function (err, resp) {
      if (err) {
        handleExcp(null, 'Error while saving to archive: '+err.message);
      }
    });
  }

  function validateInitialization () {
    var deferred = Q.defer();

    if (!templatesDir || !config) {
      deferred.reject(new Error('Invalid arguments'));
    } else if (typeof templatesDir !== 'string' || typeof config !== 'object') {
      deferred.reject(new Error('Invalid arguments'));
    } else if (!fs.existsSync(templatesDir)) {
      deferred.reject(new Error('Directory does not exist: '+templatesDir));
    } else if (!fs.lstatSync(templatesDir).isDirectory()) {
      deferred.reject(new Error('Not a directory: '+templatesDir));
    } else if (!config.transport || !config.defaults) {
      deferred.reject(new Error('Config file incomplete')); 
    } else if (!config.transport.providers[config.transport.enabledProvider]) {
      deferred.reject(new Error('Transport information missing'));
    } else if (config.defaults.retry && typeof config.defaults.retry.interval !== 'number') {
      deferred.reject(new Error('Retry interval should be a number'));
    } else if (config.defaults.retry && !config.defaults.retry.max) {
      deferred.reject(new Error('Retry max configuration missing'));
    } else if (config.defaults.refresh && typeof config.defaults.refresh.interval !== 'number') {
      deferred.reject(new Error('Refresh interval should be a number'));
    } else {
      defaultFrom = (config && config.defaults && config.defaults.from) || defConfig.defaults.from;
      deferred.resolve();
    }
    return deferred.promise;
  }

  function loadTemplates () {
    var deferred = Q.defer();
    templates = {};

    fs.readdir(templatesDir, function (err, dirs) {
      if (err) {
        log('Error: ',err);
        deferred.reject(new Error('Cannot read directory: '+templatesDir));
      } else {
        for (var i = 0;i < dirs.length;i++) {
          var dirPath = path.join(templatesDir, dirs[i]);
          if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
            var template = new EmailTemplate(dirPath);
            templates[dirs[i]] = template;
            log('Loaded Template: '+dirPath);
          } else {
            logWarn('Ignoring: '+dirPath);
          }
        } 
   
        deferred.resolve();
      }
    });
    return deferred.promise;
  }

  function initializeModels () {
    var deferred = Q.defer();
    if (config.connections.enabledProvider !== 'postgres') {
      return deferred.resolve();
    }
    orm.config.connections.myPostgres = Object.assign({}, defConfig.connections.providers.postgres, config.connections.providers.postgres);
    orm.schemaConfig.settings = Object.assign({}, defConfig.defaults.schema, config.defaults.schema);
    orm.initialize();
    orm.waterline.initialize(orm.config, function (err, models) {
      if (err) {
        logErr(err);
        deferred.reject(new Error('Error initializing models'));
      } else {
        db.models = models.collections;
        db.connections = models.connections;
        log('Initialized postgres models');
        deferred.resolve();	
      }
    });
    return deferred.promise;
  }

  function intializeMailService () {
    transport = config.transport.providers[config.transport.enabledProvider];
    transport = nodemailer.createTransport(transport); 
    log('Initialized Mail service');
  }

  function initializeListeners () {
    var deferred = Q.defer(),
      enabledCount = 0, disabledCount = 0;
    db.models.mailrules.find({}).exec(function (err, data) {
      if (err) {
        logErr(err);
        deferred.reject(new Error('Error initializing listeners'));
      } else {
        ruleSettings = data || ruleSettings;
        for (var i = 0; i < ruleSettings.length; i++) {
          var event = ruleSettings[i] || {};
          if (ruleSettings[i].enabled) {
            if (instance.listenerCount(event.eventname) < 1) {
              instance.on(ruleSettings[i].eventname, handleIncomingEvent.bind(instance, event));
            }
          } else {
            disabledCount++;
            instance.removeAllListeners(event.eventname);
          }
        }
        
        enabledCount = instance.eventNames ? instance.eventNames().length : instance._eventsCount; 
        log('Enabled listeners: '+enabledCount+' Disabled listeners: '+disabledCount);
        refreshInterval = config.defaults && config.defaults.refresh && config.defaults.refresh.interval;
        if (refreshInterval) {
          setTimeout(initializeListeners, refreshInterval);
        }
        deferred.resolve(ruleSettings);
      } 
    });
    return deferred.promise;
  }

  function initializeRetryListener () {
    retryInterval = config.defaults && config.defaults.retry && config.defaults.retry.interval;

    if (retryInterval) {
      setTimeout(retryErrorMails, retryInterval);  
    }
  }

  function handleIncomingEvent () {
    log('Processing event: '+arguments[0].eventname);
    var argArr = [], argsCopy = {};
    
    // V8 performance optimization not supported
    // argArr = [].slice.call(arguments);
    // Use native for instead
    for (var i = 0;i < arguments.length; i++) {
      argArr[i] = arguments[i];
    }
    
    argsCopy = JSON.parse(JSON.stringify(argArr));
    var event = argArr[0] || {};
    
    if (rules && rules[event.eventname]) {
      var execute;
      try {
        execute = rules[event.eventname].apply(rules, argsCopy);
        execute ? log('Rule succeeded. Processing email.') : log('Rule failed');
        if (execute) {
          var content = argsCopy[1] || {};
          var options = Object.assign(event, argsCopy[2]);
          this.send(content, options);
        }
      } catch (err) {
        logErr('Error while executing rule for event: '+event.eventname);
        logErr(err);
        return handleExcp(null, 'Error while executing rule for event: '+event.eventname);
      }
    } else {
      log('No rules found. Processing email.');
      var content = argsCopy[1] || {};
      var options = Object.assign(event, argsCopy[2]);
      this.send(content, options);
    }
  }

  function retryErrorMails () {
    log('Retrying error emails');
    var condition = {attempts: {'<': config.defaults.retry.max}};

    db.models.mailoutbox.find(condition).exec(function (err, errorMails) {
      if (err) {
        return handleExcp(null, 'Error querying mails in outbox: '+err.stack);
      }
      log('Mail in outbox: '+errorMails.length);
      var promises = [];
      for (var i = 0;i < errorMails.length; i++) {
        promises.push(sendMail(errorMails[i]));
      }

      Q.allSettled(promises).spread(function () {
        var success = [], failure = [];
        for (var i = 0;i < arguments.length; i++) {
          var email = errorMails[i];
          var emailStatus = arguments[i];

          if (emailStatus.state && emailStatus.state === 'rejected') {
            email.attempts++;
            email.error = emailStatus.reason;
            saveToOutbox(email);
          }
          if (emailStatus.state && emailStatus.state === 'fulfilled') {
            var deletedEmail = Object.assign({}, email);
            saveToArchive(email);
            deleteFromOutbox(deletedEmail);
          }
        }
        setTimeout(retryErrorMails, retryInterval);
      });
    });
  }

  function handleExcp (cb, error) {
    if (typeof error === 'string') {
      error = new Error(error);
    }
    logErr(error.stack);
    instance.emit('error', error);
    if (cb) {
      return cb(error);
    }
  }

  function log () {
    for (var i = 0;i < arguments.length;i++) {
      console.log('[emailJS]',arguments[i]);	
    }
  }

  function logWarn () {
    for (var i = 0;i < arguments.length;i++) {
      console.error('[emailJS] Warning',arguments[i]);	
    }
  }

  function logErr () {
    for (var i = 0;i < arguments.length;i++) {
      console.error('[emailJS] Error',arguments[i]);	
    }
  }
};
emailJS.prototype.__proto__ = events.EventEmitter.prototype;

var client = null;

module.exports = {
  getClient: function () {
    if (!client) {
      client = new emailJS();
      return client;
    } else {
      return client;
    }
  }
};

