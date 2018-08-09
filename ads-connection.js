module.exports = function (RED) {
  'use strict';
  var nodeads = require('node-ads');
  var util = require('util');

  function AdsConnectionNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.host = config.host;
    node.amsNetIdTarget = config.amsNetIdTarget;
    node.amsNetIdSource = config.amsNetIdSource;
    node.port = parseInt(config.port);
    node.amsPortSource = parseInt(config.amsPortSource);
    node.amsPortTarget = parseInt(config.amsPortTarget);
    
    node.system = {};
    internalSetConnectState(connectState.DISCONNECTED);
    internalSetAdsState(nodeads.ADSSTATE.INVALID);
    
    node.adsNotificationNodes = [];
    node.systemNodes = [];

    /* connect to PLC */
    connect();
    function connect() {
      internalSetConnectState(connectState.CONNECTIG);
      var adsoptions = {
        "host": node.host,
        "amsNetIdTarget": node.amsNetIdTarget,
        "amsNetIdSource": node.amsNetIdSource,
        "port": node.port,
        "amsPortSource": node.amsPortSource,
        "amsPortTarget": node.amsPortTarget
      };
      node.adsClient = nodeads.connect(adsoptions, 
        function (err){
          if (err) {
            internalSetConnectState(connectState.DISCONNECTED);
            startTimer();
            node.error(util.format('Error Connecting ADS: %s', err));
          } else {
            internalSubscribeLiveTick();
            startTimer();
            internalSubscribeSymTab();
            node.adsClient.readDeviceInfo(function (err,handel) {
                if (err) {
                  node.error(util.format('Error readDeviceInfo: %s', err));
                } else {
                  node.system.majorVersion = handel.majorVersion;
                  node.system.minorVersion = handel.minorVersion;
                  node.system.versionBuild = handel.versionBuild;
                  node.system.version = handel.majorVersion+'.'+handel.minorVersion+'.'+handel.versionBuild;
                  node.system.deviceName = handel.deviceName;
                  internalSystemUpdate();
                }
              }
            );
            node.adsNotificationNodes.forEach(internalSubscribe);
            internalSetConnectState(connectState.CONNECTED);
          }
        }
      );

      node.adsClient.on('notification', function (handle){
          if (handle.indexGroup == nodeads.ADSIGRP.DEVICE_DATA &&
              handle.indexOffset == nodeads.ADSIOFFS_DEVDATA.ADSSTATE) {
            startTimer();
            internalSetAdsState(handle.value);
          } else if (handle.indexGroup == nodeads.ADSIGRP.SYM_VERSION &&
                     handle.indexOffset == 0) {
            if (node.system.symTab != handle.value) {
              node.system.symTab = handle.value;
              internalSystemUpdate();
            }
            if (handle.start) {
              handle.start = false;
            } else {
              node.log(util.format('new sym Version - restart'));
              internalSetConnectState(connectState.DISCONNECTING);
              node.adsClient.end(function (){
                internalSetConnectState(connectState.DISCONNECTED);
                connect();
              });
            } 
          }
          if (handle.node) {
            if (handle.node.onAdsData) {
              handle.node.onAdsData(handle)
            }
          }
        }
      );
      

      node.adsClient.on('error', function (error) {
          if (error){ 
            node.error(util.format('Error ADS: %s', error)); 
            node.log(util.format('Error ADS: %s', node.system.connectState))
            if (node.system.connectState == connectState.CONNECTIG) {
              internalSetConnectState(connectState.ERROR);
            };
            node.log(util.format('Error ADS: %s', node.system.connectState))
            startTimer(20000);
          }
        }
      );

    }
    /* end connect to PLC */
    
    /* check connection to PLC */
    var conncetTimer;
    
    function startTimer(time){
      clearTimeout(conncetTimer);
      conncetTimer = setInterval(function () {
        if (node.system.connectState != connectState.CONNECTIG) {
          if (node.system.connectState == connectState.CONNECTED) {
            internalSetConnectState(connectState.DISCONNECTED);
          }
          node.adsClient.end();
          connect();
        }
      },time||2000);
    }
    /* needs internalSubscribeLiveTick */
    /* end check connection to PLC */
    
    /* for ads-notification */
    node.subscribe = function (n) {
      if (node.adsNotificationNodes.indexOf(n) < 0) {
        node.adsNotificationNodes.push(n)
      }
      if (node.system.connectState == connectState.CONNECTED) {
        internalSubscribe(n);
      }
    };
    
    node.unsubscribe = function (n) {
      var index = node.adsNotificationNodes.indexOf(n);
      if (index >= 0) {
        node.adsNotificationNodes.splice(index,1);
      }
    };
    /* end for ads-notification */
    
    /* subscribe on PLC */
    function internalSubscribe(n){
      var handle =  {
        symname: n.symname,
        transmissionMode: nodeads.NOTIFY[n.transmissionMode],
        maxDelay: n.maxDelay,
        cycleTime: n.cycleTime,
        node: n
        };
      if (isRawType(n.adstype)) {
        handle.bytelength = parseInt(n.bytelength)
      } else {
        handle.bytelength = nodeads[n.adstype]
      };
      if (isTimezoneType(n.adstype)) {
        handle.useLocalTimezone = (val === "TO_LOCAL");
      }
      node.adsClient.notify(handle, function(err){
        if (err){
          node.error(util.format('Ads Register Notification %s', err));
        }
      });
      
    }

    function internalSubscribeLiveTick(){
      var handle =  {
        indexGroup: nodeads.ADSIGRP.DEVICE_DATA,
        indexOffset: nodeads.ADSIOFFS_DEVDATA.ADSSTATE,
        transmissionMode: nodeads.NOTIFY.CYCLIC,
        cycleTime: 1000,
        bytelength: nodeads.WORD
      };

      node.adsClient.notify(handle, function(err){
        if (err){
          node.error(util.format('Ads Register Notification %s', err));
        }
      });
      
    }

    function internalSubscribeSymTab(){
      var handle =  {
        indexGroup: nodeads.ADSIGRP.SYM_VERSION,
        indexOffset: 0,
        transmissionMode: nodeads.NOTIFY.ONCHANGE,
        bytelength: nodeads.BYTE,
        start: true
      };

      node.adsClient.notify(handle, function(err){
        if (err){
          node.error(util.format('Ads Register Notification %s', err));
        }
      });
      
    }
    /* end subscribe on PLC */
    
    /* write to PLC */
    node.write = function (n, value) {
      if (node.system.connectState == connectState.CONNECTED) {
        var handle =  {
          symname: n.symname,
          propname: 'value',
          value: value
        };
        if (isRawType(n.adstype)) {
          handle.bytelength = parseInt(n.bytelength)
        } else {
          handle.bytelength = nodeads[n.adstype]
        };
        if (isTimezoneType(n.adstype)) {
          handle.useLocalTimezone = (n.timezone === "TO_LOCAL");
        }
        node.adsClient.write(handle, 
            function (err){});
      };
    }
    /* end write to PLC */

    /* read from PLC */
    node.read = function (n, cb) {
      if (node.system.connectState == connectState.CONNECTED) {
        var handle =  {
          symname: n.symname,
          propname: 'value'
        };
        if (isRawType(n.adstype)) {
          handle.bytelength = parseInt(n.bytelength)
        } else {
          handle.bytelength = nodeads[n.adstype]
        };
        if (isTimezoneType(n.adstype)) {
          handle.useLocalTimezone = (n.timezone === "TO_LOCAL");
        }
        node.adsClient.read(handle, function(err, handle){
            if (err) {
              node.error(util.format('Ads read %s', err));
            } else {
              cb(handle);
            }
          });
      };
    }
    /* end read from PLC */
      
    /* node RIP */
    node.on('close', function (done) {
      clearTimeout(conncetTimer);
      internalSetConnectState(connectState.DISCONNECTING);
      node.adsClient.end(function (){
        internalSetConnectState(connectState.DISCONNECTED);
        done();
      });
    });
    /* end node RIP */

    /* set Note State */
    function internalSetConnectState (cState) {
      if ((!node.system.connectState) || node.system.connectState != cState) {
        var text = '?';
        switch (cState) {
          case connectState.ERROR:
                text = 'ERROR';
                break;
          case connectState.DISCONNECTED:
                text = 'DISCONNECTED';
                break;
          case connectState.CONNECTIG:
                text = 'CONNECTIG';
                break;
          case connectState.CONNECTED:
                text = 'CONNECTED';
                break;
          case connectState.DISCONNECTING:
                text = 'DISCONNECTING';
                break;
        }
        node.system.connectState = cState;
        node.system.connectStateText = text;
        internalSystemUpdate();
      }
    }
    /* end write to PLC */
    
    /* system Nodes */
    node.systemRegister = function (n){
      if (node.systemNodes.indexOf(n) < 0) {
        node.systemNodes.push(n);
        internalSystemUpdateData(n);
        setSystemStatus(n);
      }
    }
    
    node.systemUnregister = function (n){
      var index = node.systemNodes.indexOf(n);
      if (index >= 0) {
        node.systemNodes.splice(index,1);
      }
    }
    

    function internalSystemUpdate () {
      if (node.systemNodes) {
        node.systemNodes.forEach(function(n){
            internalSystemUpdateData(n);
            setSystemStatus(n);
          })
      }
    }

    function internalSystemUpdateData (n) {
      n.onData(node.system);
    }

    function internalSystemUpdate (n) {
      if (n) {
        n.onData(node.system);
      } else {
        if (node.systemNodes) {
          node.systemNodes.forEach(function(n){
              internalSystemUpdateData(n);
              setSystemStatus(n);
            })
        }
      }
    }

    function setSystemStatus (n) {
      var fillSystem = "grey";
      var shapeSystem = "ring";
      var textSystem = node.system.connectStateText;
      switch (node.system.connectState) {
        case connectState.ERROR:
          fillSystem = "red";
          break;
        case connectState.DISCONNECTED:
          fillSystem = "grey";
          break;
        case connectState.CONNECTIG:
        case connectState.DISCONNECTING:
          fillSystem = "yellow";
          break;
        case connectState.CONNECTED:
          fillSystem = "green";
          shapeSystem = "dot";
          textSystem = node.system.adsStateText;
          switch (node.system.adsState) {
            case nodeads.ADSSTATE.INVALID:
                  fillSystem = "grey";
                  break;
            case nodeads.ADSSTATE.IDLE:
            case nodeads.ADSSTATE.RESET:
            case nodeads.ADSSTATE.INIT:
            case nodeads.ADSSTATE.POWERGOOD:
            case nodeads.ADSSTATE.SHUTDOWN:
            case nodeads.ADSSTATE.SUSPEND:
            case nodeads.ADSSTATE.RESUME:
            case nodeads.ADSSTATE.RECONFIG:
                  fillSystem = "blue";
                  break;
            case nodeads.ADSSTATE.CONFIG:
            case nodeads.ADSSTATE.START:
            case nodeads.ADSSTATE.STOPPING:
            case nodeads.ADSSTATE.SAVECFG:
            case nodeads.ADSSTATE.LOADCFG:
                  fillSystem = "yellow";
                  break;
            case nodeads.ADSSTATE.RUN:
                  fillSystem = "green";
                  break;
            case nodeads.ADSSTATE.ERROR:
            case nodeads.ADSSTATE.STOP:
            case nodeads.ADSSTATE.POWERFAILURE:
                  fillSystem = "red";
                  break;
          }
          break;
      }
      n.status({fill:fillSystem,shape:shapeSystem,text:textSystem});
    }

    function setNoteState (n) {
      var externState={
        fill: "grey",
        shape: "ring"
      };
      switch (node.system.connectState) {
        case connectState.ERROR:
          externState.fill = "red";
          break;
        case connectState.DISCONNECTED:
        case connectState.CONNECTIG:
        case connectState.DISCONNECTING:
          externState.fill = "grey";
          break;
        case connectState.CONNECTED:
          externState.fill = "green";
          switch (adsState) {
            case nodeads.ADSSTATE.INVALID:
                  externState.fill = "grey";
                  break;
            case nodeads.ADSSTATE.IDLE:
            case nodeads.ADSSTATE.RESET:
            case nodeads.ADSSTATE.INIT:
            case nodeads.ADSSTATE.POWERGOOD:
            case nodeads.ADSSTATE.SHUTDOWN:
            case nodeads.ADSSTATE.SUSPEND:
            case nodeads.ADSSTATE.RESUME:
            case nodeads.ADSSTATE.RECONFIG:
                  externState.fill = "blue";
                  break;
            case nodeads.ADSSTATE.CONFIG:
            case nodeads.ADSSTATE.START:
            case nodeads.ADSSTATE.STOPPING:
            case nodeads.ADSSTATE.SAVECFG:
            case nodeads.ADSSTATE.LOADCFG:
                  externState.fill = "yellow";
                  break;
            case nodeads.ADSSTATE.RUN:
                  externState.fill = "green";
                  break;
            case nodeads.ADSSTATE.ERROR:
            case nodeads.ADSSTATE.STOP:
            case nodeads.ADSSTATE.POWERFAILURE:
                  externState.fill = "red";
                  break;
          }
          break;
      }
      RED.nodes.eachNode(function (n) {
        n.status(externState);
      })
    }
    
    function internalSetAdsState(adsState) {
      if ((!node.system.adsState) || node.system.adsState != adsState) {
        var text = '?';
        switch (adsState) {
          case nodeads.ADSSTATE.INVALID:
                text = 'INVALID';
                break;
          case nodeads.ADSSTATE.IDLE:
                text = 'IDLE';
                break;
          case nodeads.ADSSTATE.RESET:
                text = 'RESET';
                break;
          case nodeads.ADSSTATE.INIT:
                text = 'INIT';
                break;
          case nodeads.ADSSTATE.START:
                text = 'START';
                break;
          case nodeads.ADSSTATE.RUN:
                text = 'RUN';
                break;
          case nodeads.ADSSTATE.STOP:
                text = 'STOP';
                break;
          case nodeads.ADSSTATE.SAVECFG:
                text = 'SAVECFG';
                break;
          case nodeads.ADSSTATE.LOADCFG:
                text = 'LOADCFG';
                break;
          case nodeads.ADSSTATE.POWERFAILURE:
                text = 'POWERFAILURE';
                break;
          case nodeads.ADSSTATE.POWERGOOD:
                text = 'POWERGOOD';
                break;
          case nodeads.ADSSTATE.ERROR:
                text = 'ERROR';
                break;
          case nodeads.ADSSTATE.SHUTDOWN:
                text = 'SHUTDOWN';
                break;
          case nodeads.ADSSTATE.SUSPEND:
                text = 'SUSPEND';
                break;
          case nodeads.ADSSTATE.RESUME:
                text = 'RESUME';
                break;
          case nodeads.ADSSTATE.CONFIG:
                text = 'CONFIG';
                break;
          case nodeads.ADSSTATE.RECONFIG:
                text = 'RECONFIG';
                break;
          case nodeads.ADSSTATE.STOPPING:
                text = 'STOPPING';
                break;
        }
        node.system.adsState = adsState;
        node.system.adsStateText = text;
        internalSystemUpdate();
      }
      
    }
    /* end system Nodes*/
  }
  RED.nodes.registerType('ads-connection', AdsConnectionNode);

}

function isTimezoneType (adsType) {
  return (adsType === "TIME" || 
          adsType === "TIME_OF_DAY" ||
          adsType === "TOD" ||
          adsType === "DATE" ||
          adsType === "DATE_AND_TIME" ||
          adsType === "DT")
}

function isRawType (adsType) {
  return (adsType === "RAW")
}

const connectState = {
  ERROR:                     -1,
  DISCONNECTED:               0,
  CONNECTIG:                  1,
  CONNECTED:                  2,
  DISCONNECTING:              3
}
