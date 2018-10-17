module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsInNode')

  function adsInNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.symname = config.varName
      node.adstype = config.varTyp
      node.bytelength = config.varSize
      node.timezone = config.timezone
      node.inValue = config.inValue||'payload'
      node.useInputMsg = config.useInputMsg||false
      node.topic = config.topic||''
      node.hasTopic = node.topic.length > 0
      debug('config:',node)

      //node.onAdsData = function (handle){
      //  debug('onAdsData:','node.id',node.id,'node.symname',node.symname,'handle.value',handle.value)
      //  var msg = {}
      //  RED.util.setMessageProperty(msg, node.inValue, handle.value)
      //  node.send(msg)
      //  debug('onAdsData:','node.id',node.id,'node.symname',node.symname,'msg',msg)
      //}

      this.on("input", function(msg) {
        debug('input:',msg)
        var outMsg = {}
        if (node.useInputMsg) {
          outMsg = Object.assign({},msg)
        }

        node.adsDatasource.read(node,function (handle){
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
