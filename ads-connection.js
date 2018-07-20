module.exports = function (RED) {
  'use strict';
  var nodeads = require('node-ads');
  var util = require('util'); 

  function AdsConnectionNode(n) {
    console.log(n);
    RED.nodes.createNode(this, n);
    var node = this;
    node.host = n.host;
    node.amsNetIdTarget = n.amsNetIdTarget;
    node.amsNetIdSource = n.amsNetIdSource;
    node.port = parseInt(n.port);
    node.amsPortSource = parseInt(n.amsPortSource);
    node.amsPortTarget = parseInt(n.amsPortTarget);
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
      node.log(util.format('Error ADS: %s', error));
    };
    node.subscribe = function (symname,adstype,cb) {
      node.adsCalls[symname] = cb;
      node.adsClient.notify({
          symname: symname,
          bytelength: nodeads[adstype]});
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