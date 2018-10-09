module.exports = function (RED) {
  'use strict'
  var nodeads = require('node-ads-api')
  var adsHelpers = require('./ads-helpers')
  var util = require('util')

  function AdsConnectionNode(config) {
    RED.nodes.createNode(this, config)
    var node = this
    node.host = config.host
    node.amsNetIdTarget = config.amsNetIdTarget
    node.amsNetIdSource = config.amsNetIdSource
    node.port = parseInt(config.port)
    adsHelpers.checkPort(node,node.port,48898)
    node.amsPortSource = parseInt(config.amsPortSource)
    adsHelpers.checkPort(node,node.port,801)
    node.amsPortTarget = parseInt(config.amsPortTarget)
    adsHelpers.checkPort(node,node.port,32905)

    node.system = {}
    internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
    internalSetAdsState(nodeads.ADSSTATE.INVALID)

    node.adsNotificationNodes = []
    node.systemNodes = []

    /* connect to PLC */
    function connect() {
      internalSetConnectState(adsHelpers.connectState.CONNECTIG)
      var adsoptions = {
        "host": node.host,
        "amsNetIdTarget": node.amsNetIdTarget,
        "amsNetIdSource": node.amsNetIdSource,
        "port": node.port,
        "amsPortSource": node.amsPortSource,
        "amsPortTarget": node.amsPortTarget
      }
      startTimer(45000)
      node.adsClient = nodeads.connect(adsoptions,
        function (){
          node.adsClient.readDeviceInfo(function (err,handel) {
            if (err) {
              node.error('Error on connect: check target NetId or routing')
              internalSetConnectState(adsHelpers.connectState.ERROR)
              delete(node.adsClient)
              startTimer(20000)
            } else {
              node.system.majorVersion = handel.majorVersion
              node.system.minorVersion = handel.minorVersion
              node.system.versionBuild = handel.versionBuild
              node.system.version = handel.majorVersion+'.'+handel.minorVersion+'.'+handel.versionBuild
              node.system.deviceName = handel.deviceName
              internalSystemUpdate()
              internalSubscribeLiveTick()
              startTimer()
              internalSubscribeSymTab()
              node.adsNotificationNodes.forEach(internalSubscribe)
              internalSetConnectState(adsHelpers.connectState.CONNECTED)
            }
          })
        }
      )

      node.adsClient.on('notification', function (handle){
          if (handle.indexGroup == nodeads.ADSIGRP.DEVICE_DATA &&
              handle.indexOffset == nodeads.ADSIOFFS_DEVDATA.ADSSTATE) {
            if (node.system.connectState == adsHelpers.connectState.CONNECTED) {     
              startTimer()
            }
            internalSetAdsState(handle.value)
          } else if (handle.indexGroup == nodeads.ADSIGRP.SYM_VERSION &&
                     handle.indexOffset == 0) {
            if (node.system.symTab != handle.value) {
              node.system.symTab = handle.value
              internalSystemUpdate()
            }
            if (handle.start) {
              handle.start = false
            } else {
              node.log(util.format('new sym Version - restart'))
              internalRestart(connect)
            }
          }
          if (handle.node) {
            if (handle.node.onAdsData) {
              handle.node.onAdsData(handle)
            }
          }
        }
      )


      node.adsClient.on('error', function (error) {
          if (error){
            node.error(util.format('Error ADS: %s', error))
            if (node.system.connectState == adsHelpers.connectState.CONNECTIG) {
              internalSetConnectState(adsHelpers.connectState.ERROR)
            }
            delete(node.adsClient)
            startTimer(20000)
          }
        }
      )

    }
    /* end connect to PLC */

    /* check connection to PLC */
    var conncetTimer

    function startTimer(time){
      clearTimeout(conncetTimer)
      if (node.system.connectState != adsHelpers.connectState.DISCONNECTING) {
        conncetTimer = setInterval(function () {
          if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
            internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
          }
          internalRestart(connect)
        },time||2000)
      }
    }
    /* needs internalSubscribeLiveTick */
    /* end check connection to PLC */

    /* for ads-notification */
    node.subscribe = function (n) {
      if (node.adsNotificationNodes.indexOf(n) < 0) {
        node.adsNotificationNodes.push(n)
      }
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        internalSubscribe(n)
      }
    }

    node.unsubscribe = function (n) {
      var index = node.adsNotificationNodes.indexOf(n)
      if (index >= 0) {
        node.adsNotificationNodes.splice(index,1)
      }
    }
    /* end for ads-notification */

    /* subscribe on PLC */
    function internalSubscribe(n){
      var handle =  {
        symname: n.symname,
        transmissionMode: nodeads.NOTIFY[n.transmissionMode],
        maxDelay: n.maxDelay,
        cycleTime: n.cycleTime,
        node: n
        }
      if (adsHelpers.isRawType(n.adstype)) {
        handle.bytelength = parseInt(n.bytelength)
      } else {
        if (adsHelpers.isStringType(n.adstype) && n.bytelength) {
          handle.bytelength = nodeads.string(parseInt(n.bytelength))
        } else {
          handle.bytelength = nodeads[n.adstype]
        }
      }
      if (adsHelpers.isTimezoneType(n.adstype)) {
        handle.useLocalTimezone = (val === "TO_LOCAL")
      }
      if (node.adsClient) {
        node.adsClient.notify(handle, function(err){
          if (err){
            node.error(util.format('Ads Register Notification %s', err))
          }
        })
      }
    }

    function internalSubscribeLiveTick(){
      var handle =  {
        indexGroup: nodeads.ADSIGRP.DEVICE_DATA,
        indexOffset: nodeads.ADSIOFFS_DEVDATA.ADSSTATE,
        transmissionMode: nodeads.NOTIFY.CYCLIC,
        cycleTime: 1000,
        bytelength: nodeads.WORD
      }
      if (node.adsClient) {
        node.adsClient.notify(handle, function(err){
          if (err){
            node.error(util.format('Ads Register Notification live tick %s', err))
          }
        })
      }
    }

    function internalSubscribeSymTab(){
      var handle =  {
        indexGroup: nodeads.ADSIGRP.SYM_VERSION,
        indexOffset: 0,
        transmissionMode: nodeads.NOTIFY.ONCHANGE,
        bytelength: nodeads.BYTE,
        start: true
      }

      if (node.adsClient) {
        node.adsClient.notify(handle, function(err){
          if (err){
            node.error(util.format('Ads Register Notification Sym Tab %s', err))
          }
        })
      }
    }
    /* end subscribe on PLC */

    /* write to PLC */
    node.write = function (n, value) {
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        var handle =  {
          symname: n.symname,
          propname: 'value',
          value: value
        }
        if (adsHelpers.isRawType(n.adstype)) {
          handle.bytelength = parseInt(n.bytelength)
        } else {
          if (adsHelpers.isStringType(n.adstype) && n.bytelength) {
            handle.bytelength = nodeads.string(parseInt(n.bytelength))
          } else {
            handle.bytelength = nodeads[n.adstype]
          }
        }
        if (adsHelpers.isTimezoneType(n.adstype)) {
          handle.useLocalTimezone = (n.timezone === "TO_LOCAL")
        }
        if (node.adsClient) {
          node.adsClient.write(handle,
            function (err){
              if (err) {
                node.error(util.format('Ads write %s', err))
              }
            } )
        }
      }
    }
    /* end write to PLC */

    /* read from PLC */
    node.read = function (n, cb) {
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        var handle =  {
          symname: n.symname,
          propname: 'value'
        }
        if (adsHelpers.isRawType(n.adstype)) {
          handle.bytelength = parseInt(n.bytelength)
        } else {
          if (adsHelpers.isStringType(n.adstype) && n.bytelength) {
            handle.bytelength = nodeads.string(parseInt(n.bytelength))
          } else {
            handle.bytelength = nodeads[n.adstype]
          }
        }
        if (adsHelpers.isTimezoneType(n.adstype)) {
          handle.useLocalTimezone = (n.timezone === "TO_LOCAL")
        }
        if (node.adsClient) {
          node.adsClient.read(handle, function(err, handle){
            if (err) {
              node.error(util.format('Ads read %s', err))
            } else {
              cb(handle)
            }
          })
        }
      }
    }
    /* end read from PLC */

    /* node RIP */
    node.on('close', function (done) {
      node.adsNotificationNodes = []
      node.systemNodes = []
      internalRestart(done)
    })

    function internalRestart(done) {
      internalSetConnectState(adsHelpers.connectState.DISCONNECTING)
      clearTimeout(conncetTimer)
      if (node.adsClient) {
        node.adsClient.end(function (){
          internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
          delete (node.adsClient)
          var sleep = setInterval(function () {
            clearTimeout(sleep)
            done()
          },1000)
        })
      } else {
        internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
        done()
      }
    }
    /* end node RIP */

    /* set Note State */
    function internalSetConnectState (cState) {
      if ((!node.system.connectState) || node.system.connectState != cState) {
        node.system.connectState = cState
        node.system.connectStateText = adsHelpers.connectState.fromId(cState)
        if (node.system.connectState != adsHelpers.connectState.CONNECTED) {
          internalSetAdsState(nodeads.ADSSTATE.INVALID)
        }
        internalSystemUpdate()
      }
    }
    /* end write to PLC */

    /* symbols from PLC */
    node.getSymbols = function (cb) {
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        if (node.adsClient) {
          node.adsClient.getSymbols( function (err, symbols){
              if (err) {
                n.error(util.format('Ads write %s', err))
              } else {
                cb(symbols)
              }
            }, true )
        }
      }
    }

    node.getDatatyps = function (cb) {
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        if (node.adsClient) {
          node.adsClient.getDatatyps( function (err, datatyps){
              if (err) {
                n.error(util.format('Ads write %s', err))
              } else {
                cb(datatyps)
              }
            }, true )
        }
      }
    }
    /* end symbols from PLC */

    /* system Nodes */
    node.systemRegister = function (n){
      if (node.systemNodes.indexOf(n) < 0) {
        node.systemNodes.push(n)
        node.systemUpdate(n)
        setSystemStatus(n)
      }
    }

    node.systemUnregister = function (n){
      var index = node.systemNodes.indexOf(n)
      if (index >= 0) {
        node.systemNodes.splice(index,1)
      }
    }
    
    function internalSystemUpdate () {
      if (!(node.timerSU)) {
        node.timerSU = setInterval(function () {
          clearTimeout(node.timerSU)
          delete(node.timerSU)
          if (node.systemNodes) {
            node.systemNodes.forEach(function(n){
                node.systemUpdate(n)
                setSystemStatus(n)
              })
          }
        },50)
      }
    }

    node.systemUpdate = function (n) {
      if (n) {
        n.onData(node.system)
      }
    }

    function setSystemStatus (n) {
      var fillSystem = "grey"
      var shapeSystem = "ring"
      var textSystem = node.system.connectStateText
      switch (node.system.connectState) {
        case adsHelpers.connectState.ERROR:
          fillSystem = "red"
          break
        case adsHelpers.connectState.DISCONNECTED:
          fillSystem = "grey"
          break
        case adsHelpers.connectState.CONNECTIG:
        case adsHelpers.connectState.DISCONNECTING:
          fillSystem = "yellow"
          break
        case adsHelpers.connectState.CONNECTED:
          fillSystem = "green"
          shapeSystem = "dot"
          textSystem = node.system.adsStateText
          switch (node.system.adsState) {
            case nodeads.ADSSTATE.INVALID:
                  fillSystem = "grey"
                  break
            case nodeads.ADSSTATE.IDLE:
            case nodeads.ADSSTATE.RESET:
            case nodeads.ADSSTATE.INIT:
            case nodeads.ADSSTATE.POWERGOOD:
            case nodeads.ADSSTATE.SHUTDOWN:
            case nodeads.ADSSTATE.SUSPEND:
            case nodeads.ADSSTATE.RESUME:
            case nodeads.ADSSTATE.RECONFIG:
                  fillSystem = "blue"
                  break
            case nodeads.ADSSTATE.CONFIG:
            case nodeads.ADSSTATE.START:
            case nodeads.ADSSTATE.STOPPING:
            case nodeads.ADSSTATE.SAVECFG:
            case nodeads.ADSSTATE.LOADCFG:
                  fillSystem = "yellow"
                  break
            case nodeads.ADSSTATE.RUN:
                  fillSystem = "green"
                  break
            case nodeads.ADSSTATE.ERROR:
            case nodeads.ADSSTATE.STOP:
            case nodeads.ADSSTATE.POWERFAILURE:
                  fillSystem = "red"
                  break
          }
          break
      }
      n.status({fill:fillSystem,shape:shapeSystem,text:textSystem})
    }

    function internalSetAdsState(adsState) {
      if ((!node.system.adsState) || node.system.adsState != adsState) {
        node.system.adsState = adsState
        node.system.adsStateText = nodeads.ADSSTATE.fromId(adsState)
        internalSystemUpdate()
      }

    }
    /* end system Nodes*/
    connect()
  }
  RED.nodes.registerType('ads-connection', AdsConnectionNode)

}
