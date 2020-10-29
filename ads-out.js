module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsOutNode')

  function adsOutNode(config) {
    RED.nodes.createNode(this, config)
    var node = this
    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      debug('config:',config)

      this.on("input", function(msg) {
        debug('adsNotificationNode:','onAdsData:','node.id',node.id,'msg',msg)
        var cfg = {
          symname: config.varName,
          adstype: config.varTyp,
          bytelength: config.varSize,
          timezone: config.timezone,
          outValue: config.outValue,
          topic: (config.topic||'')
        }

        if (typeof msg.config  !== 'undefined') {
          if (typeof msg.config.varName !== 'undefined') {
            cfg.symname = msg.config.varName
          }
          if (typeof msg.config.varType !== 'undefined') {
            cfg.adstype = msg.config.varType
          }
          if (typeof msg.config.varSize !== 'undefined') {
            cfg.bytelength = msg.config.varSize
          }
          if (typeof msg.config.timezone !== 'undefined') {
            cfg.timezone = msg.config.timezone
          }
          if (typeof msg.config.outProperty !== 'undefined') {
            cfg.outValue = msg.config.outProperty
          }
          if (typeof msg.config.topic !== 'undefined') {
            cfg.topic = msg.config.topic||''
          }
        }
        cfg.hasTopic = String(cfg.topic).length > 0
        debug('adsNotificationNode:','onAdsData:','node.id',node.id,'cfg',cfg)
        var value = RED.util.getMessageProperty(msg,(cfg.outValue||'payload'))
        if (value !== undefined && (!cfg.hasTopic || cfg.topic == msg.topic)) {
          node.adsDatasource.write(node,cfg,value)
        }
      })

      node.on('close', function () {
      })
    }
  }
  RED.nodes.registerType('ADS Output', adsOutNode)
}
