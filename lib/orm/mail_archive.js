/* jshint node:true */

var Archive = {
  datastore: 'myPostgres',
  tableName: 'mail_archive',
  identity: 'MailArchive',
  meta: {
    schemaName: 'public'
  },
  primaryKey: 'eid',
  attributes: {
    createdAt: { type: 'string', autoCreatedAt: true, },
    updatedAt: { type: 'string', autoUpdatedAt: true, },
    eid: {type: 'number', columnName: 'eid', autoMigrations: {autoIncrement: true}},
    eventname: {type: 'string', columnName: 'eventname'},
    template: {type: 'string', columnName: 'template'},
    content: {type: 'json', columnName: 'content'},
    subject: {type: 'string', columnName: 'subject'},
    from: {type: 'string', columnName: 'from'},
    to: {type: 'string', columnName: 'to'},
    cc: {type: 'string', columnName: 'cc'},
    bcc: {type: 'string', columnName: 'bcc'},
    html: {type: 'string', columnName: 'html'},
    text: {type: 'string', columnName: 'text'},
    attachments: {type: 'json', columnName: 'attachments'},
    error: {type: 'string', columnName: 'error'},
    attempts: {type: 'number', columnName: 'attempts'}
  }
};

module.exports = Archive;
