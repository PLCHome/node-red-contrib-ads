module.exports = function (RED) {
  'use strict'
  var util = require('util')
  var adsHelpers = require('./ads-helpers')

  function adsSymbolsNode(config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.adsDatasource = RED.nodes.getNode(config.datasource)
    if (node.adsDatasource) {
      node.adscfg = {
        symname: config.varName,
        adstype: config.varTyp,
        data: config.data
      }


      node.onData = function (data){
        const msg = {
          payload: data
        }
        node.send(msg)
      }

      this.on("input", function(msg) {
        
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
        call(function (data) {
          
          
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
      })
    }
  }
  RED.nodes.registerType('ADS Symbols', adsSymbolsNode)
}
