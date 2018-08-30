module.exports = function (RED) {
  'use strict'
   var util = require('util')

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

      node.onAdsData = function (handle){
        var msg = {}
        RED.util.setMessageProperty(msg, node.inValue, handle.value)
        node.send(msg)
      }

      this.on("input", function(msg) {
        node.adsDatasource.read(node,node.onAdsData)
      })

      node.on('close', function () {
      })
    }
  }
  RED.nodes.registerType('ADS In', adsInNode)
}
