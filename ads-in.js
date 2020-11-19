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
          useIndex: config.useIndex,
          symname: config.varName,
          indexGroup: config.indexGroup,
          indexOffset: config.indexOffset,
          adstype: config.varTyp,
          bytelength: config.varSize,
          array:config.isArray,
          lowindex:config.varLowIndex,
          highindex:config.varHighIndex,
          timezone: config.timezone,
          inValue: (config.inValue||'payload'),
          useInputMsg: (config.useInputMsg||false),
          //set topic by default to msg.topic
          topic: (msg.topic||'')
        }
        // overwrite default msg.topic by value in topic property (if used) 
        if (String(config.topic).length > 0) {
          cfg.topic = config.topic
        }
        
        if (msg.config) {
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
          if (typeof msg.config.isarray !== 'undefined') {
            cfg.array = msg.config.isarray
          }
          if (typeof msg.config.varLowIndex !== 'undefined') {
            cfg.lowindex = msg.config.varLowIndex
          }
          if (typeof msg.config.varHighIndex !== 'undefined') {
            cfg.highindex = msg.config.varHighIndex
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
          // overwrite default msg.topic by value in msg.config.topic (if existing)
          if (typeof msg.config.topic !== 'undefined') {
            if (String(msg.config.topic).length > 0) {
              cfg.topic = msg.config.topic
            } 
          }
        }

        if (cfg.useIndex) {
          delete(cfg.symname)
          cfg.indexGroup = parseInt(cfg.indexGroup.toString())
          if (isNaA(cfg.indexGroup)) {
            cfg.indexGroup = 0
          }
          cfg.indexOffset = parseInt(cfg.indexOffset.toString())
          if (isNaA(cfg.indexOffset)) {
            cfg.indexOffset = 0
          }
        } else {
          delete(cfg.indexGroup)
          delete(cfg.indexOffset)
        }

        cfg.hasTopic = String(cfg.topic).length > 0
        var outMsg = {}
        if (cfg.useInputMsg) {
          outMsg = Object.assign({},msg)
        }

        node.adsDatasource.read(node, cfg, function (handle){
          RED.util.setMessageProperty(outMsg, cfg.inValue, handle.value)
          if (cfg.hasTopic) {
            outMsg.topic = cfg.topic
          }
          node.send(outMsg)
          debug('input:','node.id',node.id,'cfg.symname',cfg.symname,'outMsg',outMsg)
        })
      })

      node.on('close', function () {
      })
    }
  }
  RED.nodes.registerType('ADS In', adsInNode)
}
