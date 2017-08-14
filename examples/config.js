/* jshint node:true */

/**
 * Replace with your postgres instance at postgres://localhost/test
 */

module.exports = {
  defaults: {
    from: 'emailJS NPM <noreply@emailjs.com>',
    /**
     * Schema description
     * If present overrides default settings
     *
     * schema: {
     *   schema: 'public',
     *   outboxtable: 'mail_outbox',
     *   archivetable: 'mail_archive',
     *   rulestable: 'mail_rules'
     * },
     */

    /**
     * Mail Error retry 
     * If present enables retry functionality
     *
     * retry: {
     *   interval: 900000, // Every 15 mins
     *   max: 5
     * },
     */
    
    /**
     * Listener refresh settings
     * If present refreshes listener settings from mail_rules table
     *
     * refresh: {
     *  interval: 15000,
     * }
     */  
  },
  /**
   * SMTP Transport settings are mandatory
   */
  transport: {
    enabledProvider: 'office365',
    providers: {
      office365: {
        // This host works inside the Nutanix network
        host: 'mailrelay.corp.nutanix.com'
      }
    }
  },
  /**
   * POSTGRES settings are mandatory
   * Mail retry functionality depends on POSTGRES
   *
   * Below are the default settings
   */
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
