module.exports = function (RED) {
  'use strict';
  var util = require('util');
  
  function adsSystemNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.adsDatasource = RED.nodes.getNode(config.datasource);
    if (node.adsDatasource) {
      var adscfg = {
        symname: config.varName,
        adstype: config.varTyp
      }; 
      

      node.onData = function (data){
        const msg = {
          payload: data
        };
        node.send(msg);
      }
      
      node.adsDatasource.systemRegister(node);
      
      this.on("input", function(msg) { 
        node.adsDatasource.systemUpdate(node);
      });
      
      node.on('close', function () {
        node.adsDatasource.systemUnregister(node);
      });
    }
  }
  RED.nodes.registerType('ADS System', adsSystemNode);
}
