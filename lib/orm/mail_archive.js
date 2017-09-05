/* jshint node:true */

var Archive = {
  connection: 'myPostgres',
  tableName: 'mail_archive',
  identity: 'MailArchive',
  meta: {
    schemaName: 'public'
  },
  autoPK: false,
  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    eid: {type: 'integer', columnName: 'eid', 
      primaryKey: true, autoIncrement: true},
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
    attempts: {type: 'integer', columnName: 'attempts'}
  }
};

module.exports = Archive;
