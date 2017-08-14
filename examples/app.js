'use strict';
/* jshint node:true */

/**
 * Replace your email address at <your_email@domain.com>
 */

var path = require('path');
var emailJS = require('../index');
var templates = path.resolve('views/templates');
var config = require('./config');
var rules = require('./rules');

var client = emailJS.getClient();

client.on('error', function (err) {
  console.log('[Client] Error received: ', err);
});

client.init(templates, config, rules, function (err) {
  console.log('[Client] Error initializing module: ', err);
});

client.on('ready', function () {

  /* This email will be sent */
  //client.emit('SUCCEED_RULE', {}, {});
  
  /* This email will NOT be sent */
  //client.emit('FAILED_RULE', {}, {});
  
  /* Rules not configured are not processed */
  //client.emit('NON_EXISTENT_RULE', {}, {});
  
  /* Send an email without any config or rule checking */
  // sendEmailDirectly();
});

function sendEmailDirectly () {
  client.send(
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
    // IF passed, called on error while sending mail
    console.log('Error occured: ',err);
  });
}
