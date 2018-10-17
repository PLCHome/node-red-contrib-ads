module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsSystemNode')

  function adsSystemNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.topic = config.topic||''
      node.hasTopic = node.topic.length > 0
      debug('config:',node)


      node.onData = function (data){
        const msg = {
          payload: data
        }
        if (node.hasTopic) {
          msg.topic = node.topic
        }
        node.send(msg)
        debug('onData:','node.id',node.id,'node.type',node.type,'msg',msg)
      }

      node.adsDatasource.systemRegister(node)

      this.on("input", function(msg) {
        debug('input:','node.id',node.id,'node.type',node.type,'msg',msg)
        node.adsDatasource.systemUpdate(node)
      })

      node.on('close', function () {
        debug('close:','node.id',node.id,'node.type',node.type,'enter')
        node.adsDatasource.systemUnregister(node)
      })
    }
  }
  RED.nodes.registerType('ADS System', adsSystemNode)
}
