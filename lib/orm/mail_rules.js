/* jshint node:true */

var Rules = {
  connection: 'myPostgres',
  tableName: 'mail_rules',
  identity: 'MailRules',
  meta: {
    schemaName: 'public'
  },
  autoPK: false,
  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    ruleid: {type: 'int', columnName: 'ruleid'},
    eventname: {type: 'string', columnName: 'eventname'},
    enabled: {type: 'boolean', columnName: 'enabled'},
    template: {type: 'string', columnName: 'template'},
    from: {type: 'string', columnName: 'from'},
    to: {type: 'string', columnName: 'to'},
    cc: {type: 'string', columnName: 'cc'},
    bcc: {type: 'string', columnName: 'bcc'},
    subject: {type: 'string', columnName: 'subject'}
  }
};

module.exports = Rules;
