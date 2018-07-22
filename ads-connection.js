module.exports = function (RED) {
  'use strict';
  var nodeads = require('node-ads');
  var util = require('util');

  function AdsConnectionNode(config) {
    console.log(config);
    RED.nodes.createNode(this, config);
    var node = this;
    node.host = config.host;
    node.amsNetIdTarget = config.amsNetIdTarget;
    node.amsNetIdSource = config.amsNetIdSource;
    node.port = parseInt(config.port);
    node.amsPortSource = parseInt(config.amsPortSource);
    node.amsPortTarget = parseInt(config.amsPortTarget);
    var adsoptions = {
      "host": node.host,
      "amsNetIdTarget": node.amsNetIdTarget,
      "amsNetIdSource": node.amsNetIdSource,
      "port": node.port,
      "amsPortSource": node.amsPortSource,
      "amsPortTarget": node.amsPortTarget
    };
    node.adsCalls = {};
    node.adsClient = nodeads.connect(adsoptions, initAds);
    node.adsClient.on('notification', receiveAdsNotification);
    node.adsClient.on('error', adsError);
    function initAds (){
      node.log(util.format('AdsClientConnected %s:%s', node.amsNetIdTarget, node.amsNetIdSource));
    };
    function receiveAdsNotification(handle){
      if (node.adsCalls[handle.symname]) {
        node.adsCalls[handle.symname](handle)
      }
      node.log(util.format('Ads Notification %s:%s', handle.symname, ''+handle.value));
    };
    function adsError(error) {
      if (error) node.log(util.format('Error ADS: %s', error));
    };
    node.subscribe = function (nodecfg,cb) {
      node.adsCalls[nodecfg.symname] = cb;
      node.adsClient.notify({
          symname: nodecfg.symname,
          bytelength: nodeads[nodecfg.adstype],
          transmissionMode: nodeads.NOTIFY[nodecfg.transmissionMode],
          maxDelay: nodecfg.maxDelay,
          cycleTime: nodecfg.cycleTime});
    };
    node.write = function (nodecfg, value) {
      node.adsClient.write({
          symname: nodecfg.symname,
          bytelength: nodeads[nodecfg.adstype],
          propname: 'value',
          value: value}, 
          adsError);
    };
    node.unsubscribe = function (symname) {
      delete node.adsCalls[symname];
    };
    node.on('close', function () {
      node.log('close');
      node.adsClient.end();
    });
  }
  RED.nodes.registerType('ads-connection', AdsConnectionNode);

}