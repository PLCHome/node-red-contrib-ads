module.exports = function (RED) {
  'use strict'
//  var util = require('util')

  function adsNotificationNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.symname = config.varName
      node.adstype = config.varTyp
      node.bytelength = config.varSize
      node.timezone = config.timezone
      node.transmissionMode = config.transmissionMode
      node.maxDelay = config.maxDelay
      node.cycleTime = config.cycleTime
      node.property = config.property||'payload'

      node.onAdsData = function (handle){
        var msg = {}
        RED.util.setMessageProperty(msg, node.property, handle.value)
        node.send(msg)
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
        node.adsDatasource.unsubscribe(node)
      })

    }
  }
  RED.nodes.registerType('ADS Notification', adsNotificationNode)
}
