module.exports = function (RED) {
  'use strict';

  function adsInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.adsDatasource = RED.nodes.getNode(config.datasource);
    if (node.adsDatasource) {
      node.varName= config.varName;
      node.varTyp= config.varTyp;
      node.transmissionMode = config.transmissionMode;
      node.maxDelay = config.maxDelay;
      node.cycleTime = config.cycleTime;
      
      function onAdsData(handle){
        const msg = {
          payload: handle.value
        };
        node.send(msg);
      }

      node.adsDatasource.subscribe(node.varName, node.varTyp, onAdsData);
      
      node.on('close', function () {
        node.adsDatasource.unsubscribe(node.varName);
      });
    }
  }
  RED.nodes.registerType('ads-in', adsInNode);
}