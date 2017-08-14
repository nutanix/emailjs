'use strict';
/* jshint node:true */

var rules = {
  SUCCEED_RULE: function (rule, content, options) {
    /**
     * 1st argument gives you access to rule information configured
     * 
     * Changes made to the rule object have no effect
     */
       
    rule.enabled = false;
    rule.eventname = 'RANDOM_NAME';

    /*
     * 2nd argument gives you access to the content passed
     * using the send() method or emit() method
     *
     * Changes made to the content reflect in the email
     */
    
    content.name = 'Mark Anthony';

    /*
     * 3rd argument gives you access to the options passed
     * using the send() method or emit() method
     *
     * Changes made to the options reflect in the email
     * and override default rule settings
     */
    options.subject = 'This subject changed';

    /*
     * Any additional arguments passed as part of the emit()
     * and send() methods are also available here by using
     * the 'arguments' object or defining the argument in 
     * the method signature 
     *
     * Returning true indicates rule succeded and
     * email will be sent
     */
    
    return true;
  },
  FAILED_RULE: function (rule, content, options) {
    /**
     * Returning false indicates rule did not succeed
     * and email is not sent
     */
    return false;
  }
};

module.exports = rules;
