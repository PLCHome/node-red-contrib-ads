module.exports = function (RED) {
  'use strict';
  var util = require('util');
  
  function adsInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.adsDatasource = RED.nodes.getNode(config.datasource);
    if (node.adsDatasource) {
      var adscfg = {
        symname: config.varName,
        adstype: config.varTyp
      }; 
      var outValue = config.outValue||'payload';
      
      this.on("input", function(msg) { 
        node.log(util.format('Ads Out %s', ''+msg[outValue]));
        node.adsDatasource.write(adscfg,msg[outValue]);
      });
      
      node.on('close', function () {
      });
    }
  }
  RED.nodes.registerType('ads-out', adsInNode);
}
