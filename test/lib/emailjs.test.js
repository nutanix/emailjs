/*jshint node:true */
/*jshint strict:false, expr:true */
/*global require, describe, it, beforeEach, afterEach */

var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  Q = require('q'),
  fs = require('fs'),
  nodemailer = require('nodemailer'),
  mock = require('sails-mock-models'),
  modelPath = '../../lib/orm/',
  MailArchive = require(modelPath+'mail_archive'),
  MailOutbox = require(modelPath+'mail_outbox'),
  MailRules = require(modelPath+'mail_rules');

/* Initializing global services and config */
/* Initializing libraries */
global.Q = Q;

/* Initializing models */
global.MailArchive = initializeModel(MailArchive);
global.MailOutbox = initializeModel(MailOutbox);
global.MailRules = initializeModel(MailRules);

var emailjs = require('../../lib/emailjs'),
  indexjs = require('../../lib/orm/index'),
  rules = [
    { 
      ruleid: '1',
      eventname: 'SUCCEED_RULE',
      enabled: true,
      template: 'welcomeemail',
      from: null,
      to: 'mariovinay@gmail.com',
      cc: null,
      bcc: null,
      subject: 'My Subject',
      createdAt: '2017-09-05T01:15:17.758Z',
      updatedAt: '2017-09-05T01:15:17.758Z' 
    },
    { 
      ruleid: '2',
      eventname: 'FAILED_RULE',
      enabled: true,
      template: 'welcomeemail',
      from: null,
      to: 'mariovinay@gmail.com',
      cc: null,
      bcc: null,
      subject: 'My Subject',
      createdAt: '2017-09-05T01:15:17.845Z',
      updatedAt: '2017-09-05T01:15:17.845Z' 
    },
    { 
      ruleid: '3',
      eventname: 'GENERIC_RULE',
      enabled: true,
      template: 'welcomeemail',
      from: null,
      to: 'mariovinay@gmail.com',
      cc: null,
      bcc: null,
      subject: 'My Subject',
      createdAt: '2017-09-05T01:15:17.845Z',
      updatedAt: '2017-09-05T01:15:17.845Z' 
    },
    { 
      ruleid: '4',
      eventname: 'DISABLED_RULE',
      enabled: false,
      template: 'welcomeemail',
      from: null,
      to: 'mariovinay@gmail.com',
      cc: null,
      bcc: null,
      subject: 'My Subject',
      createdAt: '2017-09-05T01:15:17.845Z',
      updatedAt: '2017-09-05T01:15:17.845Z' 
    },
    { 
      ruleid: '5',
      eventname: 'EXCEPTION_RULE',
      enabled: true,
      template: 'welcomeemail',
      from: null,
      to: 'mariovinay@gmail.com',
      cc: null,
      bcc: null,
      subject: 'My Subject',
      createdAt: '2017-09-05T01:15:17.845Z',
      updatedAt: '2017-09-05T01:15:17.845Z' 
    }  
  ],
  inputmodel = {collections: {
      mailrules: {
        find: function () {}
      },
      mailarchive: {
        create: function () {}
      },
      mailoutbox: {
        create: function () {},
        update: function () {},
        find: function () {}
      }
    }, 
    connections: {}
  },
  mailermockerr = null,
  mailermockdata = {
    accepted: [],
    rejected: []
  },
  outboxData = [{
    eid: 1,
    eventname: 'SUCCEED_RULE',
    template: 'welcomeemail',
    content:
    {
      name: 'Mark Anthony'
    },
    subject: 'This subject changed',
    from: 'emailJS NPM <noreply@emailjs.com>',
    to: 'mariovinay@gmail.com',
    cc: null,
    bcc: null,
    html: '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="UTF-8">\n    <title>My Sample email</title>\n  <style type="text/css">\n   \n  </style>\n  </head>\n  <body>\n    <h2>Welcome to emailJS</h2>\n    <p>This email was sent to Mark Anthony</p>\n  </body>\n</html>\n',
    text: 'Welcome to emailJS\nThis email was sent to ',
    attachments:
    {
      href: 'http://www.pdf995.com/samples/pdf.pdf'
    },
    error: 'Error: getaddrinfo ENOTFOUND mailrelay.corp.nutanix.com mailrelay.corp.nutanix.com:25\n    at errnoException (dns.js:27:10)\n    at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:78:26)',
    attempts: 1,
    createdAt: '2017-09-05T01:16:06.000Z',
    updatedAt: '2017-09-05T01:16:06.000Z'
  },
  {
    eid: 2,
    eventname: 'SUCCEED_RULE',
    template: 'welcomeemail',
    content:
    {
      name: 'Mark Anthony'
    },
    subject: 'This subject changed',
    from: 'emailJS NPM <noreply@emailjs.com>',
    to: 'mariovinay@gmail.com',
    cc: null,
    bcc: null,
    html: '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="UTF-8">\n    <title>My Sample email</title>\n  <style type="text/css">\n   \n  </style>\n  </head>\n  <body>\n    <h2>Welcome to emailJS</h2>\n    <p>This email was sent to Mark Anthony</p>\n  </body>\n</html>\n',
    text: 'Welcome to emailJS\nThis email was sent to ',
    attachments:
    {
      href: 'http://www.pdf995.com/samples/pdf.pd'
    },
    error: 'Error: Invalid status code 404\n    at ClientRequest.<anonymous> (/Users/mario.vina/Workspaces/js/work/ntnx-emailjs-module/node_modules/nodemailer/node_modules/mailcomposer/node_modules/buildmail/node_modules/nodemailer-fetch/lib/fetch.js:177:36)\n    at emitOne (events.js:77:13)\n    at ClientRequest.emit (events.js:169:7)\n    at HTTPParser.parserOnIncomingClient [as onIncoming] (_http_client.js:433:21)\n    at HTTPParser.parserOnHeadersComplete (_http_common.js:103:23)\n    at Socket.socketOnData (_http_client.js:322:20)\n    at emitOne (events.js:77:13)\n    at Socket.emit (events.js:169:7)\n    at readableAddChunk (_stream_readable.js:153:18)\n    at Socket.Readable.push (_stream_readable.js:111:10)\n    at TCP.onread (net.js:536:20)',
    attempts: 1,
    createdAt: '2017-09-05T01:45:50.000Z',
    updatedAt: '2017-09-05T01:45:50.000Z'
  }],
  nodemailermock = {
    sendMail: function (options, cb) {
      cb(mailermockerr, mailermockdata);
    }
  },
  rulesConfig = {
    SUCCEED_RULE: function () {
      return true;
    },
    FAILED_RULE: function () {
      return false;
    },
    EXCEPTION_RULE: function () {
      throw new Error('Rule exception');
    }
  },
  callbackFunc = function () {},
  errorCallbackFunc = function () {};
emailjs.on('ready', callbackFunc);
emailjs.on('error', errorCallbackFunc);

var timeoutfns = [],
initSetTimeout = function (fn, interval) {
  timeoutfns.push(fn);
};

function initializeModel(model) {
  model.find = function () {};
  model.findOne = function () {};
  model.create = function () {};
  model.update = function () {};
  model.delete = function () {};
  return model;
}

describe('emailjs', function () {

  describe('#connect', function () {
    beforeEach(function () {
      emailjs = require('../../lib/emailjs');
      sinon.stub(nodemailer, 'createTransport').returns(nodemailermock);
    });
    afterEach(function () {
      nodemailer.createTransport.restore();
    });

    it('Should return error if arguments not passed', function (done) {
      emailjs.connect(null, null, null, function (err, data) {
        try {
          expect(err.message).to.equal('Invalid arguments');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if arguments are invalid', function (done) {
      emailjs.connect('some/path', 'invalid config', null, 
        function (err, data) {
        try { 
          expect(err.message).to.equal('Invalid arguments');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if directory not present', function (done) {
      emailjs.connect('invalid/path', {}, null, function (err, data) {
        try {
          expect(err.message).to
            .equal('Directory does not exist: invalid/path');
          expect(data).to.equal(undefined);
          done();  
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if not a directory', function (done) {
      var cwd = process.cwd();
      cwd += '/test/lib/emailjs.test.js';
      emailjs.connect(cwd, {}, null, function (err, data) {
        try {
          expect(err.message).to.equal('Not a directory: '+cwd);
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if config file incomplete', function (done) {
      var cwd = process.cwd();
      cwd += '/test/lib/';
      emailjs.connect(cwd, {transport: {}}, null, function (err, data) {
        try {
          expect(err.message).to.equal('Config file incomplete');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if config file incomplete', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        transport: {
          providers: {}
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Config file incomplete');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if transport config missing', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {},
        transport: {
          providers: {}
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Transport information missing');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if transport config missing', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {},
        transport: {
          enabledProvider: ''
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Transport information missing');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if transport config missing', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {},
        transport: {
          providers: {},
          enabledProvider: 'invalid'
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Transport information missing');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if retry interval not number', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {
          retry: {}
        },
        transport: {
          providers: {
            postgres: {}
          },
          enabledProvider: 'postgres'
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Retry interval should be a number');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if max retry missing', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {
          retry: {
            interval: 500
          }
        },
        transport: {
          providers: {
            postgres: {}
          },
          enabledProvider: 'postgres'
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Retry max configuration missing');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if refresh interval not number', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {
          retry: {
            interval: 500,
            max: 5
          },
          refresh: {}
        },
        transport: {
          providers: {
            postgres: {}
          },
          enabledProvider: 'postgres'
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Refresh interval should be a number');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if refresh interval not number', function (done) {
      var cwd = process.cwd(), config;
      cwd += '/test/lib/';
      config = {
        defaults: {
          retry: {
            interval: 500,
            max: 5
          },
          refresh: {
            interval: 'abc'
          }
        },
        transport: {
          providers: {
            postgres: {}
          },
          enabledProvider: 'postgres'
        }
      };
      emailjs.connect(cwd, config, null, function (err, data) {
        try {
          expect(err.message).to.equal('Refresh interval should be a number');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    describe('', function () {
      beforeEach(function () {
      });
      afterEach(function () {
        fs.readdir.restore();
      });
      it('Should return error if issue with directory', function (done) {
        var cwd = process.cwd(), config;
        cwd += '/test/lib/';
        config = {
          defaults: {
            retry: {
              interval: 500,
              max: 5
            },
            refresh: {
              interval: 10000
            }
          },
          transport: {
            providers: {
              office365: {}
            },
            enabledProvider: 'office365'
          }
        };
        sinon.stub(fs, 'readdir').yields(new Error('error reading dir'));
        emailjs.connect(cwd, config, null, function (err, data) {
          try {
            expect(err.message).to.equal('Cannot read directory: '+cwd);
            expect(data).to.equal(undefined);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });

    describe('', function () {
      beforeEach(function () {

      });
      afterEach(function () {
        indexjs.waterline.initialize.restore();
      });

      it('Should return error if issue with models', function (done) {
        var cwd = process.cwd(), config;
        cwd += '/examples/views/templates';
        config = {
          defaults: {
            retry: {
              interval: 500,
              max: 5
            },
            refresh: {
              interval: 10000
            }
          },
          transport: {
            providers: {
              office365: {}
            },
            enabledProvider: 'office365'
          },
          connections: {
            providers: {
              postgres: {}
            },
            enabledProvider: 'postgres'
          }
        };
        sinon.stub(indexjs.waterline, 'initialize')
          .yields(new Error('waterline error'));
        emailjs.connect(cwd, config, null, function (err, data) {
          try {
            expect(err.message).to.equal('waterline error');
            expect(data).to.equal(undefined);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });

    describe('', function () {
      beforeEach(function () {

      });
      afterEach(function () {
        indexjs.waterline.initialize.restore();
      });
      it('Should return error if issue reading rules', function (done) {
        var cwd = process.cwd(), config, model;
        cwd += '/examples/views/templates';
        config = {
          defaults: {
            retry: {
              interval: 500,
              max: 5
            },
            refresh: {
              interval: 10000
            }
          },
          transport: {
            providers: {
              office365: {}
            },
            enabledProvider: 'office365'
          },
          connections: {
            providers: {
              postgres: {}
            },
            enabledProvider: 'postgres'
          }
        };
        model = {collections: {
            mailrules: {
              find: function () {}
            }
          }, 
          connections: {}
        };
        mock.mockModel(model.collections.mailrules, 'find', null, 'error');
        sinon.stub(indexjs.waterline, 'initialize')
          .yields(null, model);
        emailjs.connect(cwd, config, null, function (err, data) {
          try {
            expect(err.message).to.equal('Error initializing listeners');
            expect(data).to.equal(undefined);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
    
    describe('', function () {
      var model;
      beforeEach(function () {
        global.setTimeout = initSetTimeout;
      });
      afterEach(function () {
        indexjs.waterline.initialize.restore();
        inputmodel.collections.mailrules.find.restore();
        inputmodel.collections.mailarchive.create.restore();
        inputmodel.collections.mailoutbox.create.restore();
        inputmodel.collections.mailoutbox.update.restore();
      });
      it('should initialize the module', function (done) {
        var cwd = process.cwd(), config;
        cwd += '/examples/views/templates';
        config = {
          defaults: {
            retry: {
              interval: 900000, // Every 15 mins
              max: 5
            },
            refresh: {
              interval: 900000
            }
          },
          transport: {
            providers: {
              office365: {}
            },
            enabledProvider: 'office365'
          },
          connections: {
            providers: {
              postgres: {}
            },
            enabledProvider: 'postgres'
          }
        };
        model = {collections: {
            mailrules: {
              find: function () {}
            }
          }, 
          connections: {}
        };
        mock.mockModel(inputmodel.collections.mailrules, 'find', rules);
        mock.mockModel(inputmodel.collections.mailarchive, 'create', {});
        mock.mockModel(inputmodel.collections.mailoutbox, 'create', {});
        mock.mockModel(inputmodel.collections.mailoutbox, 'update', {});
        sinon.stub(indexjs.waterline, 'initialize')
          .yields(null, inputmodel);
        emailjs.connect(cwd, config, rulesConfig, function (err, data) {
          try {
            expect(err).to.equal(null);
            expect(data).to.exist;
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      it('should return error module already initialized', function (done) {
        var cwd = process.cwd(), config;
        cwd += '/examples/views/templates';
        config = {
          defaults: {
            retry: {
              interval: 900000, // Every 15 mins
              max: 5
            }
          },
          transport: {
            providers: {
              office365: {}
            },
            enabledProvider: 'office365'
          },
          connections: {
            providers: {
              postgres: {}
            },
            enabledProvider: 'postgres'
          }
        };
        model = {collections: {
            mailrules: {
              find: function () {}
            }
          }, 
          connections: {}
        };
        mock.mockModel(inputmodel.collections.mailrules, 'find', rules);
        mock.mockModel(inputmodel.collections.mailarchive, 'create', {});
        mock.mockModel(inputmodel.collections.mailoutbox, 'create', {});
        mock.mockModel(inputmodel.collections.mailoutbox, 'update', {});
        sinon.stub(indexjs.waterline, 'initialize')
          .yields(null, inputmodel);
        emailjs.connect(cwd, config, rulesConfig, function (err, data) {
          try {
            expect(err.message).to.equal('Already initialized');
            expect(data).to.equal(undefined);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });

  describe('#send', function () {
    var origMailerMockData;

    beforeEach(function (done) {
      origMailerMockData = mailermockdata;
      mock.mockModel(inputmodel.collections.mailrules, 'find', rules);
      mock.mockModel(inputmodel.collections.mailarchive, 'create', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'create', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'update', {});
      done();
    });
    afterEach(function () {
      inputmodel.collections.mailrules.find.restore();
      inputmodel.collections.mailarchive.create.restore();
      inputmodel.collections.mailoutbox.create.restore();
      inputmodel.collections.mailoutbox.update.restore();
      mailermockdata = origMailerMockData;
    });
    it('Should return error if template not found', function (done) {
      emailjs.send(null, {
        template: 'invalid'
      }, function (err, data) {
        try {
          expect(err.message).to.equal('Template not found: invalid');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if \'to\' field missing', function (done) {
      emailjs.send(null, {
        template: 'welcomeemail',
        subject: 'sample subject'
      }, function (err, data) {
        try {
          expect(err.message).to
            .equal('Email fields \'to\' and \'subject\' are mandatory');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if \'subject\' field missing', function (done) {
      emailjs.send(null, {
        template: 'welcomeemail',
        to: 'name@domain.com'
      }, function (err, data) {
        try {
          expect(err.message).to
            .equal('Email fields \'to\' and \'subject\' are mandatory');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should send mail successfully', function (done) {
      mailermockdata = {
        accepted: ['name@domain.com'],
        rejected: []
      };
      emailjs.send(null, {
        template: 'welcomeemail',
        to: 'name@domain.com',
        subject: 'sample subject'
      }, function (err, data) {
        try {
          expect(err).to.equal(null);
          expect(data).to.exist;
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error if mail send failed', function (done) {
      mailermockdata = {
        accepted: [],
        rejected: ['name@domain.com']
      };
      emailjs.send(null, {
        template: 'welcomeemail',
        to: 'name@domain.com',
        subject: 'sample subject'
      }, function (err, data) {
        try {
          expect(err.message).to.equal('Failed for some recipients:name@domain.com');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('#fire', function () {
    var origMailerMockData;

    beforeEach(function (done) {
      origMailerMockData = mailermockdata;
      mock.mockModel(inputmodel.collections.mailrules, 'find', rules);
      mock.mockModel(inputmodel.collections.mailarchive, 'create', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'create', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'update', {});
      done();
    });
    afterEach(function () {
      inputmodel.collections.mailrules.find.restore();
      inputmodel.collections.mailarchive.create.restore();
      inputmodel.collections.mailoutbox.create.restore();
      inputmodel.collections.mailoutbox.update.restore();
      mailermockdata = origMailerMockData;
    });

    it('Should process event with no rules', function (done) {
      emailjs.fire('GENERIC_RULE', {}, {}, function (err, data) {
        try {
          expect(err).to.equal(null);
          expect(data).to.exist;
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should not process event when rule fails', function (done) {
      emailjs.fire('FAILED_RULE', {}, {}, function (err, data) {
        try {
          expect(err.message).to.equal('Rule failed for event: FAILED_RULE');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should process event when rule succeeds', function (done) {
      emailjs.fire('SUCCEED_RULE', {}, {}, function (err, data) {
        try {
          expect(err).to.equal(null);
          expect(data).to.exist;
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('Should return error when rule throws exception', function (done) {
      emailjs.fire('EXCEPTION_RULE', {}, {}, function (err, data) {
        try {
          expect(err.message).to
            .equal('Error while executing rule for event: EXCEPTION_RULE');
          expect(data).to.equal(undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('#retryErrorMails()', function () {
    var origMailerMockData;

    beforeEach(function (done) {
      origMailerMockData = mailermockdata;
      mock.mockModel(inputmodel.collections.mailrules, 'find', rules);
      mock.mockModel(inputmodel.collections.mailarchive, 'create', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'create', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'update', {});
      mock.mockModel(inputmodel.collections.mailoutbox, 'find', outboxData);
      done();
    });
    afterEach(function () {
      mailermockerr = null;
      inputmodel.collections.mailrules.find.restore();
      inputmodel.collections.mailarchive.create.restore();
      inputmodel.collections.mailoutbox.create.restore();
      inputmodel.collections.mailoutbox.update.restore();
      inputmodel.collections.mailoutbox.find.restore();
      mailermockdata = origMailerMockData;
    });

    it('Should successfully reprocess error emails', function (done) {
      var retryFn;

      for (var i = 0;i < timeoutfns.length;i++) {
        if (timeoutfns[i].name === 'retryErrorMails') {
          retryFn = timeoutfns[i];  
        }  
      }
      if (retryFn) {
        retryFn();
      }
      done();
    });

    it('Should fail to reprocess error mails', function (done) {
      var retryFn;
      mailermockerr = 'Error sending mail';
      for (var i = 0;i < timeoutfns.length;i++) {
        if (timeoutfns[i].name === 'retryErrorMails') {
          retryFn = timeoutfns[i];  
        }  
      }
      if (retryFn) {
        retryFn();
      }
      done();
    });

    it('Should handle error when exception checking outbox', function (done) {
      var retryFn;
      mailermockerr = 'Error sending mail';
      inputmodel.collections.mailoutbox.find.restore();
      mock.mockModel(inputmodel.collections.mailoutbox, 'find', null, 
        new Error('error'));
      for (var i = 0;i < timeoutfns.length;i++) {
        if (timeoutfns[i].name === 'retryErrorMails') {
          retryFn = timeoutfns[i];  
        }  
      }
      if (retryFn) {
        retryFn();
      }
      done();
    });
  });
});
