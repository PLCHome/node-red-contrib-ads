module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var adsHelpers = require('./ads-helpers')
  var debug = require('debug')('node-red-contrib-ads:adsSymbolsNode')

  function adsSymbolsNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.adscfg = {
        data: config.data,
        force: config.force || false 
      }
      debug('config:',node)


      node.onData = function (data,topic){
        debug('onData:','node.id',node.id,'node.type',node.type,'data',data)
        const msg = {
          payload: data
        }
        if (topic.length > 0) {
          msg.topic = topic
        }
        node.send(msg)
      }

      this.on("input", function(msg) {     
        debug('input:','node.id',node.id,'node.type',node.type,'data',msg)
        var call = node.adsDatasource.getDatatyps
        
        var topic = msg.topic
        // overwrite default msg.topic by value in msg.config.topic (if existing)
        if (typeof (msg.config && msg.config.topic) !== 'undefined' ) {
          topic = msg.config.topic
        // overwrite default msg.topic by value in topic property (if used) 
        } else if (config.topic.length > 0 ){       
          topic = config.topic
        // else -> keep original msg.topic
        }
        if (node.adscfg.data == 'SYMBOLES') {
          call = node.adsDatasource.getSymbols
        }

        var ask = []
        if (typeof msg.payload === 'string') {
          ask.push(adsHelpers.wildcardToRegExp(msg.payload.toUpperCase()))
        } else if (Array.isArray(msg.payload)) {
          msg.payload.map(function(p){
            if (typeof p === 'string') {
              ask.push(adsHelpers.wildcardToRegExp(p.toUpperCase()))
            }
          })
        }
        call(node.adscfg.force, function (data) {
          
          
          var out = []
          if (ask.length > 0){
            ask.map(function(m){
              data.map(function(d){
                if (d.name.match(m)) {
                  out.push(d)
                }
              })
            })
          } else {
            out = data
          }
          node.onData(out,topic)
        })

      })

      node.on('close', function () {
        debug('close:','node.id',node.id,'node.type',node.type)
      })
    }
  }
  RED.nodes.registerType('ADS Symbols', adsSymbolsNode)
}
