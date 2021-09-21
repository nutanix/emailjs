/* jshint node:true */
var postgresAdapter = require('sails-postgresql');
var Waterline = require('waterline');
var orm = new Waterline();

var config = {
  adapters: {
    'sails-postgresql': postgresAdapter
  },

  datastores: {
    myPostgres: { 
    }
  },
  defaults: {
    migrate: 'safe'
  }
};

var schemaConfig = {
  settings: {}
};

var fs = require('fs');
var path = require("path");

function initialize () {
  if (!schemaConfig || !schemaConfig.settings || !schemaConfig.settings.schema) {
    throw new Error('Model settings missing');
  }
  fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function (file) {
    var model = require(path.join(__dirname, file));
    model.meta.schemaName = schemaConfig.settings.schema;
    switch (model.tableName) {
      case 'mail_archive': model.tableName = schemaConfig.settings.archivetable; break;
      case 'mail_outbox': model.tableName = schemaConfig.settings.outboxtable; break; 
      case 'mail_rules': model.tableName = schemaConfig.settings.rulestable; break;
    }
    model = Waterline.Collection.extend(model);
    orm.registerModel(model);
  });
}

module.exports = {waterline: orm, config: config, schemaConfig: schemaConfig, initialize: initialize};
