module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsOutNode')

  function adsOutNode(config) {
    RED.nodes.createNode(this, config)
    var node = this
    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.symname = config.varName
      node.adstype = config.varTyp
      node.bytelength = config.varSize
      node.timezone = config.timezone
      node.outValue = config.outValue||'payload'
      debug('config:',node)

      this.on("input", function(msg) {
        debug('adsNotificationNode:','onAdsData:','node.id',node.id,'node.symname',node.symname,'msg',msg)
        var value = RED.util.getMessageProperty(msg,node.outValue)
        if (value !== undefined) {
          node.adsDatasource.write(node,value)
        }
      })

      node.on('close', function () {
      })
    }
  }
  RED.nodes.registerType('ADS Output', adsOutNode)
}
