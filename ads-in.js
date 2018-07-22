module.exports = function (RED) {
  'use strict';
//  var util = require('util');

  function adsInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.adsDatasource = RED.nodes.getNode(config.datasource);
    if (node.adsDatasource) {
      var adscfg = {
        symname: config.varName,
        adstype: config.varTyp,
        transmissionMode: config.transmissionMode,
        maxDelay: config.maxDelay,
        cycleTime: config.cycleTime
      };

      function onAdsData(handle){
        const msg = {
          payload: handle.value
        };
        node.send(msg);
      }

      node.adsDatasource.subscribe(adscfg, onAdsData);

      node.on('close', function () {
        node.adsDatasource.unsubscribe(adscfg.symname);
      });
    }
  }
  RED.nodes.registerType('ads-in', adsInNode);
}
