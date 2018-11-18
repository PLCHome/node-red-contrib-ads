module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsInNode')

  function adsInNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      debug('config:',config)

      //node.onAdsData = function (handle){
      //  debug('onAdsData:','node.id',node.id,'node.symname',node.symname,'handle.value',handle.value)
      //  var msg = {}
      //  RED.util.setMessageProperty(msg, node.inValue, handle.value)
      //  node.send(msg)
      //  debug('onAdsData:','node.id',node.id,'node.symname',node.symname,'msg',msg)
      //}

      this.on("input", function(msg) {
        debug('input:',msg)
        var cfg = {
         symname: config.varName,
         adstype: config.varTyp,
         bytelength: config.varSize,
         timezone: config.timezone,
         inValue: (config.inValue||'payload'),
         useInputMsg: (config.useInputMsg||false),
         topic: (config.topic||'')
        }

        if (msg.config) {
          if (typeof msg.config.varName !== 'undefined') {
            cfg.symname = msg.config.varName
          }
          if (typeof msg.config.varTyp !== 'undefined') {
            cfg.adstype = msg.config.varType
          }
          if (typeof msg.config.varSize !== 'undefined') {
            cfg.bytelength = msg.config.varSize
          }
          if (typeof msg.config.timezone !== 'undefined') {
            cfg.timezone = msg.config.timezone
          }
          if (typeof msg.config.inProperty !== 'undefined') {
            cfg.inValue = msg.config.inProperty
          }
          if (typeof msg.config.useInputMsg !== 'undefined') {
            cfg.useInputMsg = msg.config.useInputMsg
          }
          if (typeof msg.config.topic !== 'undefined') {
            cfg.topic = msg.config.topic||''
          }
        }

        cfg.hasTopic = cfg.topic.length > 0
        var outMsg = {}
        if (node.useInputMsg) {
          outMsg = Object.assign({},msg)
        }

        node.adsDatasource.read(node,cfg,function (handle){
          RED.util.setMessageProperty(outMsg, node.inValue, handle.value)
          if (node.hasTopic) {
            outMsg.topic = node.topic
          }
          node.send(outMsg)
          debug('input:','node.id',node.id,'node.symname',node.symname,'outMsg',outMsg)
        })
      })

      node.on('close', function () {
      })
    }
  }
  RED.nodes.registerType('ADS In', adsInNode)
}
