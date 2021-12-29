/* jshint node:true */
module.exports = {
  defaults: {
    from: 'emailJS NPM <noreply@emailjs.com>',
    schema: {
      schema: 'mail_schema',
      outboxtable: 'mail_outbox',
      archivetable: 'mail_archive',
      rulestable: 'mail_rules'
    }
  },
  datastores: {
    enabledProvider: 'postgres',
    providers: {
      postgres: {
        adapter: 'sails-postgresql',
        schemaName: 'sloop_one',
        url: 'postgres://localhost/test',
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
        wlNext: {
          caseSensitive: true
        }
      }
    }
  }
};
