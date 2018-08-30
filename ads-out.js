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
      node.outValue = config.outValue||'payload'

      this.on("input", function(msg) {
        var value = RED.util.getMessageProperty(msg,node.outValue)
        console.log(typeof value)
        if (value !== undefined) {
          node.adsDatasource.write(node,value)
        }
      })

      node.on('close', function () {
      })
    }
  }
  RED.nodes.registerType('ADS Output', adsInNode)
}
