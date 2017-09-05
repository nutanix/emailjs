/* jshint node:true, strict:false */

/**
 * Replace your email address at <your_email@domain.com>
 */

var email = require('../index'),
  path = require('path'),
  templates = path.resolve('views/templates'),
  config = require('./config'),
  rules = require('./rules');

email.on('error', function (err) {
  console.log('[Client] Error: ',err);
});

email.connect(templates, config, rules, function (err) {
  console.log('called');
  console.log('[Client] Error initializing module: ', err);
});

email.on('ready', function () {
  /* This email will be sent */
  email.fire('SUCCEED_RULE', {}, {
    attachments: {
      path: 'http://www.pdf995.com/samples/pdf.pdf'
    }
  }, function (err, data) {
  	// OPTIONAL callback
    console.log('err >>> ', err);
    console.log('data >>> ', data);
  });
  
  /* This email will NOT be sent */
  //client.emit('FAILED_RULE', {}, {});
  
  /* Rules not configured are not processed */
  //client.emit('NON_EXISTENT_RULE', {}, {});
  
  /* Send an email without any preconfigured config or rules*/
  //sendEmailWithoutConfiguration();
});

function sendEmailWithoutConfiguration () {
  email.send(
  {
    name: 'John Doe'
  }, 
  {
    to: '<your_email@domain.com>', // Replace your email address here
    subject: 'Test Email',
    template: 'welcomeemail',
    attachments: [
      {
        filename: 'something.txt',
        content: 'hello world!'
      }
    ] 
  }, function (err) {
    // Optional callback
    // IF passed, called on error/success while sending mail
    console.log('err >>> ',err);
  });
}
