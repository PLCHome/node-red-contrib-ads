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
          useIndex: config.useIndex,
          symname: config.varName,
          indexGroup: config.indexGroup,
          indexOffset: config.indexOffset,
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
          if (typeof msg.config.indexGroup !== 'undefined') {
            cfg.indexGroup = msg.config.indexGroup
          }
          if (typeof msg.config.indexOffset !== 'undefined') {
            cfg.indexOffset = msg.config.indexOffset
          }
          if (typeof msg.config.useIndex !== 'undefined') {
            cfg.useIndex = msg.config.useIndex
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

        if (cfg.useIndex) {
          delete(cfg.symname)
          cfg.indexGroup = parseInt(cfg.indexGroup.toString())
          if (isNaN(cfg.indexGroup)) {
            cfg.indexGroup = 0
          }
          cfg.indexOffset = parseInt(cfg.indexOffset.toString())
          if (isNaN(cfg.indexOffset)) {
            cfg.indexOffset = 0
          }
        } else {
          delete(cfg.indexGroup)
          delete(cfg.indexOffset)
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
