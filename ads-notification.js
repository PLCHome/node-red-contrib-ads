module.exports = function (RED) {
  'use strict'
//  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsNotificationNode')

  function adsNotificationNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.symname = config.varName
      node.adstype = config.varTyp
      node.bytelength = config.varSize
      node.array = config.isArray
      node.lowindex = config.varLowIndex
      node.highindex = config.varHighIndex
      node.timezone = config.timezone
      node.transmissionMode = config.transmissionMode
      node.maxDelay = config.maxDelay
      node.cycleTime = config.cycleTime
      node.property = config.property||'payload'
      node.topic = config.topic||''
      node.hasTopic = String(node.topic).length > 0
      debug('config:',node)

      node.onAdsData = function (handle){
        debug('onAdsData:','node.id',node.id,'node.symname',node.symname,'handle.value',handle.value)
        var msg = {}
        RED.util.setMessageProperty(msg, node.property, handle.value)
        if (node.hasTopic) {
          msg.topic = node.topic
        }
        node.send(msg)
        debug('onAdsData:','node.id',node.id,'node.symname',node.symname,'msg',msg)
//        node.setStatus()
      }

   //   node.setStatus = function (nodeState,txt){

      // node.setAdsState = function (nodeState,txt){
        // switch (nodeState)
          // case NOTCONNECTED:
                // break
          // case NOTCONNECTFEHLER:
                // break
          // case CONNECTEDOTHER:
                // break
          // case CONNECTEDRUN:
                // break
//red, green, yellow, blue or grey

     //   if (txt) {

     //     node.status({fill:"red",shape:"ring",text:node.status.txt})
     //   }
   //   }

      node.adsDatasource.subscribe(node)

      node.on('close', function () {
        debug('close:','enter')
        node.adsDatasource.unsubscribe(node)
      })

    }
  }
  RED.nodes.registerType('ADS Notification', adsNotificationNode)
}
