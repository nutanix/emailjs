/* jshint node:true */
module.exports = {
  defaults: {
    from: 'noreply@emailjsmodule.com',
    schema: {
      schema: 'public',
      outboxtable: 'mail_outbox',
      archivetable: 'mail_archive',
      rulestable: 'mail_rules'
    }
  },
  connections: {
    enabledProvider: 'postgres',
    providers: {
      postgres: {
        adapter: 'sails-postgresql',
        url: 'postgres://localhost/test',
        ssl: true,
        multipleStatements: true,
        wlNext: {
          caseSensitive: true
        }
      }
    }
  }
};
