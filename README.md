# emailJS NPM Module

### Description

This module is developed by the tools engineering team for their Node JS based projects at Nutanix. The module simplifies and accelerates email feature integration in Node JS based projects by providing a package that encapsulates most of the functionality and provides a simple interface that only needs to be configured and used.

The goals of this module include -
* Accelerate email feature integration by providing a plug and play style module
* Decouple the email functionality from core services
* Provide a structure and process to easily add new email notifications or disable them
* Provide a simple fire and forget/publish mechanism to send emails from core services

### Prequisites

* [Node.js](http://nodejs.org/) installed

### Design

The module can be installed by running
```sh
npm install https://github.com/nutanix/emailJS.git
```
The module provides 4 methods
1. connect()
    * Initializes the module with settings you provide
2. on()
    * Used to listen to events such as 'ready' and 'error'
3. fire()
    * Used to send a email by passing the event name for a preconfigured event notification
4. send()
    * Used to send a email without any preconfigured event notification

#### connect
This method allows you to initialize the module with settings you provide.

```sh
var email = require('emailjs');

var templateDir = './view/emailtemplates';
var config = require('./myConfig');
var rules = require('./myRules');

email.connect(templateDir, config, rules, function (err, data) {
  console.log('Error: ',err);
});
```

* templateDir is the path to the folder that contains the email templates.
* config is the settings configuration file. An example can be found under the 'examples' folder.
* rules is an optional argument. If supplied it should contain rules with the same name as the event notification configured. An example can be found under the 'examples' folder.
* The last argument is an optional callback. Whether the callback is supplied or not, any errors are indicated with the 'error' event and once the module is ready, a 'ready' event is emitted.

#### on
This method allows you to subscribe to module events including 'ready' and 'error'. 'ready' indicates that the module is initialized and is ready to be used. 'error' indicates that there is a problem during module initialization or there after while it is used.

```sh
var email = require('emailjs');

email.on('ready', function () {
  // Can start sending notifications
});

email.on('error', function (err) {
  // Error occured in the module during initialization or later
  console.log(err);
});
```

#### fire
This method allows you to send email notifications (that are preconfigured) by passing the event name.

```sh
// Generally used for static content email notifications
email.fire('event_name');

// Used when email content is rendered dynamically and if any options need to be changed from the preconfigured settings.
email.fire('event_name', content, options);

// An optional callback is also supported
email.fire('event_name', content, options, function (err, data) {
  if (err) console.log('Error: ', err);
});
```

* content is an object that contains the data the email template needs to be rendered.
* options contains the email settings that you want to override and can contain following optional fields:

```sh
{
  to: 'email1@domain.com,email2@domain.com',
  from: 'noreply@domain.com',
  cc: '',
  bcc: '',
  subject: 'Email from emailJS',
  template: 'email-template-name',
  attachments: [] 
  // Refer https://community.nodemailer.com/using-attachments/ for attachment support and examples 
  
}
```
More examples can be found in the 'examples' folder.

#### send
This method is similar to the 'fire' method above. 
The difference is that it can be used to send email notifications without any preconfigured event notification configuration.
Also, no rules are checked when this method is used to send email notifications.
Perfect for situations where you need to quickly get started.

```sh
// content and options are required arguments
email.send('event_name', content, options);

// An optional callback is also supported
email.send('event_name', content, options, function (err, data) {
  if (err) console.log('Error: ', err);
});
```
More examples can be found in the 'examples' folder.

#### Note:
* Currently the module requires a postgres db for saving emails in case of success and error scenarios. 
* It is also leveraged to retry sending emails in case of failure without re-rendering the email.
* Event notification configured is also stored in the db which allows it to be changed at run time. This configuration is cached in the module and refreshed regularly. (configurable)
* The next version of this module will support using a config-only approach which does not need a postgres db.

### Feature Requests
Please create an issue in this github project or email devops-us@nutanix.com 

