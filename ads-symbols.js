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
        symname: config.varName,
        adstype: config.varTyp,
        data: config.data,
        force: config.force || false
      }
      debug('config:',node)


      node.onData = function (data){
        debug('onData:','node.id',node.id,'node.type',node.type,'data',data)
        const msg = {
          payload: data
        }
        node.send(msg)
      }

      this.on("input", function(msg) {
        
        debug('input:','node.id',node.id,'node.type',node.type,'data',msg)
        var call = node.adsDatasource.getDatatyps
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
          node.onData(out)
        })

      })

      node.on('close', function () {
        debug('close:','node.id',node.id,'node.type',node.type)
      })
    }
  }
  RED.nodes.registerType('ADS Symbols', adsSymbolsNode)
}
