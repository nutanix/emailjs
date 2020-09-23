/* jshint node:true, strict:false */

var exportable,
  nodemailer = require('nodemailer'),
  EmailTemplate = require('email-templates').EmailTemplate,
  EventEmitter = require('events').EventEmitter,
  fs = require('fs'),
  path = require('path'),
  Q = require('q'),
  _ = require('lodash'),
  orm = require('./orm'),
  defConfig = require('./config'),
  util = require('util');

exportable = (function () {
  var emailJS = {}, 
    db = {},
    initialized = false,
    templatesDir = null,
    config = null,
    transport = null,
    templates = null,
    ruleSettings = [],
    defaultFrom = null,
    retryInterval = null,
    refreshInterval = null,
    rules = null,
    instance;

  function email () {
    EventEmitter.call(this);
  }
  util.inherits(email, EventEmitter);
  
  instance = new email();

  function init (_templatesDir, _config, _rules, cb) {
    if (initialized) {
      return handleExcp(cb, new Error('Already initialized'));
    }
    templatesDir = _templatesDir;
    config = _config;
    rules = _rules;

    Q.fcall(validateInitialization)
    .then(loadTemplates)
    .then(intializeMailService)
    .then(initializeModels)
    .then(initializeListeners)
    .then(initializeRetryListener)
    .then(function () {    
      initialized = true;
      log('Ready');
      instance.emit('ready');
      // Success
      if (cb) {
        cb(null, {});
      }
    })
    .catch(function (err) {
      handleExcp(cb, err);
    });
  }
  
  function validateInitialization () {

    if (!templatesDir || !config) {
      throw new Error('Invalid arguments');
    } else if (typeof templatesDir !== 'string' || typeof config !== 'object') {
      throw new Error('Invalid arguments');
    } else if (!fs.existsSync(templatesDir)) {
      throw new Error('Directory does not exist: '+templatesDir);
    } else if (!fs.lstatSync(templatesDir).isDirectory()) {
      throw new Error('Not a directory: '+templatesDir);
    }  
    validateConfig();
    validateDefaults();
    return;
  }

  function validateConfig () {
    if (!config.transport || !config.defaults) {
      throw new Error('Config file incomplete'); 
    } else if (!config.transport.enabledProvider || 
        !config.transport.providers || 
        !config.transport.providers[config.transport.enabledProvider]) {
      throw new Error('Transport information missing');
    }
  }

  function validateDefaults () {
    var defaults = config && config.defaults;

    if (defaults.retry && 
      typeof defaults.retry.interval !== 'number') {
      throw new Error('Retry interval should be a number');
    } else if (defaults.retry && !defaults.retry.max) {
      throw new Error('Retry max configuration missing');
    } else if (defaults.refresh && 
      typeof defaults.refresh.interval !== 'number') {
      throw new Error('Refresh interval should be a number');
    } else {
      defaultFrom = (defaults && defaults.from) || 
        defConfig.defaults.from;
    }
  }

  function loadTemplates () {
    var deferred = Q.defer();
    templates = {};

    fs.readdir(templatesDir, function (err, dirs) {
      if (err) {
        log('Error: ',err);
        deferred.reject(new Error('Cannot read directory: '+templatesDir));
      } else {
        var dirPath;
        _.each(dirs, function (dir) {
          dirPath = path.join(templatesDir, dir);
          if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
            var template = new EmailTemplate(dirPath);
            templates[dir] = template;
            log('Loaded Template: '+dirPath);
          } else {
            logWarn('Ignoring: '+dirPath);
          }  
        });
   
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
    orm.config.connections.myPostgres = Object.assign({}, 
      defConfig.connections.providers.postgres, 
      config.connections.providers.postgres);
    orm.schemaConfig.settings = Object.assign({}, 
      defConfig.defaults.schema, config.defaults.schema);
    orm.initialize();
    orm.waterline.initialize(orm.config, function (err, models) {
      if (err) {
        logErr(err);
        deferred.reject(err);
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
        _.each(ruleSettings, function (rule) {
          var event = rule || {};
          if (event.enabled) {
            if (instance.listenerCount(event.eventname) < 1) {
              instance.on(event.eventname, 
                handleIncomingEvent.bind(instance, event));
            }
          } else {
            disabledCount++;
            instance.removeAllListeners(event.eventname);
          }
        });
        
        enabledCount = instance.eventNames ? 
          instance.eventNames().length : instance._eventsCount; 
        log('Enabled listeners: '+
          enabledCount+' Disabled listeners: '+disabledCount);
        refreshInterval = config.defaults && 
          config.defaults.refresh && config.defaults.refresh.interval;
        if (refreshInterval) {
          setTimeout(initializeListeners, refreshInterval);
        }
        deferred.resolve(ruleSettings);
      } 
    });
    return deferred.promise;
  }

  function initializeRetryListener () {
    retryInterval = config.defaults && 
      config.defaults.retry && config.defaults.retry.interval;

    if (retryInterval) {
      setTimeout(retryErrorMails, retryInterval);  
    }
  }
  
  function emitWrapper (eventName, content, options, cb) {
    if (!cb){
      cb = null;
    }
    if (eventName) {
      if (instance.eventNames().includes(eventName)) {
        instance.emit(eventName, content, options, cb);
      } else {
        return handleExcp(cb, `No rule found for event: ${eventName}`);
      }
    } else {
      return handleExcp(cb, 'No event specified');
    }
  }

  function handleIncomingEvent () {
    log('Processing event: '+arguments[0].eventname);
    var argArr = [], argsCopy = {}, content, options;
    
    // V8 performance optimization not supported
    // argArr = [].slice.call(arguments);
    // Use native for instead
    for (var i = 0;i < arguments.length; i++) {
      argArr[i] = arguments[i];
    }
    
    argsCopy = JSON.parse(JSON.stringify(argArr));
    var event = argArr[0] || {},
      cb = argArr.length > 3 ? argArr[3] : null;
    
    if (rules && rules[event.eventname]) {
      var execute;
      try {
        execute = rules[event.eventname].apply(rules, argsCopy);
        if (execute)  {
          log('Rule succeeded. Processing email.'); 
          content = Object.assign({}, argsCopy[1]);
          options = Object.assign({}, event, argsCopy[2]);
          send(content, options, cb);
        } else {
          log('Rule failed');
          return handleExcp(cb, 'Rule failed for event: '+
          event.eventname);
        }
      } catch (err) {
        logErr('Error while executing rule for event: '+event.eventname);
        logErr(err);
        return handleExcp(cb, 'Error while executing rule for event: '+
          event.eventname);
      }
    } else {
      log('No rules found. Processing email.');
      content = Object.assign({}, argsCopy[1]);
      options = Object.assign({}, event, argsCopy[2]);
      send(content, options, cb);
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
      _.each(errorMails, function (mail) {
        promises.push(sendMail(mail));
      });

      Q.allSettled(promises).spread(function () {
        for (var i = 0;i < arguments.length; i++) {
          var email = errorMails[i],
            emailStatus = arguments[i];

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

  function send (content, options, cb) {
    content = content || {};
    options = options || {};

    var template = templates[options.template];

    if (!template) { 
      return handleExcp(cb, 'Template not found: '+options.template);
    }
    if (!options.to || !options.subject) {
      return handleExcp(cb, 
        'Email fields \'to\' and \'subject\' are mandatory'); 
    }

    options.from = options.from || defaultFrom;
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
        return Q.reject(new Error('Failed for some recipients:'+
          status.rejected.toString()));
      }
      // Success
      if (cb) {
        cb(null, {});
      }
    })
    .catch(function (err) {
      logErr('Sending mail: ',err.stack);
      options.content = content;
      options.error = err.stack;
      saveToOutbox(options);
      return handleExcp(cb, err); 
    });
  }

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
      db.models.mailoutbox.update({eid: record.eid}, record)
      .exec(function (err) {
        if (err) {
          handleExcp(null, 'Error while updating outbox: '+err.message);
        }
      });
    } else {
      delete record.createdAt;
      delete record.updatedAt;
      db.models.mailoutbox.create(record).exec(function (err) {
        if (err) {
          handleExcp(null, 'Error while saving to outbox: '+err.message);
        }
      });  
    }
    
  }
  function deleteFromOutbox (record) {
    db.models.mailoutbox.destroy({eid: record.eid}).exec(function (err) {
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
    db.models.mailarchive.create(record).exec(function (err) {
      if (err) {
        handleExcp(null, 'Error while saving to archive: '+err.message);
      }
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
    _.each(arguments, function (arg) {
      console.log('[emailJS]', arg);  
    });
  }

  function logWarn () {
    _.each(arguments, function (arg) {
      console.error('[emailJS] Warning', arg);  
    });
  }

  function logErr () {
    _.each(arguments, function (arg) {
      console.error('[emailJS] Error', arg);  
    });
  }

  emailJS.on = instance.on.bind(instance);
  emailJS.connect = init;
  emailJS.send = send;
  emailJS.fire = emitWrapper;
  return emailJS;    
})();

module.exports = exports = exportable;
