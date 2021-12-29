/* jshint node:true */

var Rules = {
  datastore: 'myPostgres',
  tableName: 'mail_rules',
  identity: 'MailRules',
  meta: {
    schemaName: 'public'
  },
  primaryKey: 'eventname',
  attributes: {
    createdAt: { type: 'string', autoCreatedAt: true },
    updatedAt: { type: 'string', autoUpdatedAt: true, },
    ruleid: {type: 'string', columnName: 'ruleid', allowNull: true },
    eventname: {type: 'string', columnName: 'eventname', required: true},
    enabled: {type: 'boolean', columnName: 'enabled'},
    template: {type: 'string', columnName: 'template'},
    from: {type: 'string', columnName: 'from', allowNull: true},
    to: {type: 'string', columnName: 'to', allowNull: true},
    cc: {type: 'string', columnName: 'cc', allowNull: true},
    bcc: {type: 'string', columnName: 'bcc', allowNull: true},
    subject: {type: 'string', columnName: 'subject', allowNull: true}
  }
};

module.exports = Rules;
