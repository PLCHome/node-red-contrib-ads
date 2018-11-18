module.exports = function (RED) {
  'use strict'
  var nodeads = require('node-ads-api')
  var adsHelpers = require('./ads-helpers')
  var util = require('util')
  var debug = require('debug')('node-red-contrib-ads:adsConnectionNode')
  var debugCyclic = require('debug')('node-red-contrib-ads:adsConnectionNode:Cyclic')

  function adsConnectionNode(config) {
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
    debug('config:',node)

    node.system = {}
    internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
    internalSetAdsState(nodeads.ADSSTATE.INVALID)

    node.notificationNodes = []
    node.notificationSubscribed = {}
    node.systemNodes = []

    function removeClient(){
      debug('removeClient:','Client:',!(!node.adsClient),'symbolsCache:',!(!node.symbolsCache),'datatypsCache:',!(!node.datatypsCache))
      delete(node.adsClient)
      delete(node.symbolsCache)
      delete(node.datatypsCache)
    }
    
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
      debug('connect:',adsoptions)
      removeClient()
      node.adsClient = nodeads.connect(adsoptions,
        function (){
          node.adsClient.readDeviceInfo(function (err,handel) {
            if (err) {
              removeClient()
              node.error('Error on connect: check target NetId or routing')
              internalSetConnectState(adsHelpers.connectState.ERROR)
              startTimer(20000)
              debug('connect:','readDeviceInfo:',err)
            } else {
              debug('connect:','readDeviceInfo:',handel)
              node.system.majorVersion = handel.majorVersion
              node.system.minorVersion = handel.minorVersion
              node.system.versionBuild = handel.versionBuild
              node.system.version = handel.majorVersion+'.'+handel.minorVersion+'.'+handel.versionBuild
              node.system.deviceName = handel.deviceName
              internalSystemUpdate()
              internalSubscribeLiveTick()
              startTimer()
              internalSubscribeSymTab()
              node.notificationNodes.forEach(internalSubscribe)
              internalSetConnectState(adsHelpers.connectState.CONNECTED)
            }
          })
        }
      )

      node.adsClient.on('notification', function (handle){
          if (handle.indexGroup == nodeads.ADSIGRP.DEVICE_DATA &&
              handle.indexOffset == nodeads.ADSIOFFS_DEVDATA.ADSSTATE) {
            debugCyclic('notification:','connectCheckADSSTATE:', handle.indexGroup, handle.indexGroup, 
                           'handle.indexOffset', handle.indexOffset, 'handle.value', handle.value)
            if (node.system.connectState == adsHelpers.connectState.CONNECTED) {     
              startTimer()
            }
            internalSetAdsState(handle.value)
          } else if (handle.indexGroup == nodeads.ADSIGRP.SYM_VERSION &&
                     handle.indexOffset == 0) {
            debug('notification:','CheckSYM_VERSION:', 'handle.indexGroup:', handle.indexGroup, 
                           'handle.indexOffset', handle.indexOffset, 'handle.value', handle.value)
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
          if (node.notificationSubscribed[handle.symname]) {
            debug('notification:',handle.symname, 'handle.notifyHandle', handle.notifyHandle,
                         'handle.totalByteLength', handle.totalByteLength, 'handle.symhandle', handle.symhandle, 'handle.value', handle.value, 
                         'handle.bytelength', handle.bytelength)
            node.notificationSubscribed[handle.symname].map((n)=> {
              if (n.onAdsData) {
                n.onAdsData(handle)
              }
            })
          }
        }
      )


      node.adsClient.on('error', function (error) {
          debug('onerror:',error)
          if (error){
            node.error(util.format('Error ADS: %s', error))
            if (node.system.connectState == adsHelpers.connectState.CONNECTIG) {
              internalSetConnectState(adsHelpers.connectState.ERROR)
            }
            removeClient()
            startTimer(20000)
          }
        }
      )

    }
    /* end connect to PLC */

    /* check connection to PLC */
    var conncetTimer

    function startTimer(time){
      debugCyclic('startTimer:','clearTimeout')
      clearTimeout(conncetTimer)
      if (node.system.connectState != adsHelpers.connectState.DISCONNECTING) {
        debugCyclic('startTimer:',time||10000)
        conncetTimer = setInterval(function () {
          debug('startTimer:','Timeout')
          if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
            internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
          }
          internalRestart(connect)
        },time||10000)
      }
    }
    /* needs internalSubscribeLiveTick */
    /* end check connection to PLC */

    /* for ads-notification */
    node.subscribe = function (n) {
      debug('subscribe:',n.id, n.type)
      if (node.notificationNodes.indexOf(n) < 0) {
        node.notificationNodes.push(n)
      }
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        internalSubscribe(n)
      }
    }

    node.unsubscribe = function (n,cb) {
      debug('unsubscribe:',n.id, n.type, n.notifyHandle)
      var index = node.notificationNodes.indexOf(n)
      if (index >= 0) {
        node.notificationNodes.splice(index,1)
      }
      if ((node.notificationSubscribed[n.symname])){
        var index = node.notificationSubscribed[n.symname].indexOf(n)
        if (index >= 0) {
          node.notificationSubscribed[n.symname].splice(index,1)
        }
        if (!node.notificationSubscribed[n.symname].length){
          delete node.notificationSubscribed[n.symname]
        }
      }
      if (n.notifyHandle !== undefined && (!node.notificationSubscribed[n.symname])) {
        var handle =  {
          notifyHandle: n.notifyHandle
        }
        if (node.adsClient) {
          node.adsClient.releaseNotificationHandle(handle, function() {
            delete(n.notifyHandle)
            debug('unsubscribe: done')
            if (cb){
              cb()
            }
          })
        }
      } else {
        debug('unsubscribe: wait')
      }
    }
    /* end for ads-notification */

    /* subscribe on PLC */
    function internalSubscribe(n){
      debug('internalSubscribe:',n.id, n.type)
      var handle =  {
        symname: n.symname,
        transmissionMode: nodeads.NOTIFY[n.transmissionMode],
        maxDelay: n.maxDelay,
        cycleTime: n.cycleTime,
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
      if (!(node.notificationSubscribed[n.symname])){
        if (node.adsClient) {
          debug('internalSubscribe:',handle)
          node.notificationSubscribed[n.symname]=[]
          node.notificationSubscribed[n.symname].push(n)
          node.adsClient.notify(handle, function(err){
            if (err){
              node.error(util.format('Ads Register Notification %s', err))
            } else {
              node.notificationSubscribed[n.symname].map((no)=>{
                no.notifyHandle = handle.notifyHandle
              })
            }
          })
        }
      } else {
        var index = node.notificationSubscribed[n.symname].push(n)
        if (node.notificationSubscribed[n.symname][0].notifyHandle) {
          node.notificationSubscribed[n.symname].map((n)=>{
            if (!n.notifyHandle) {
              n.notifyHandle = node.notificationSubscribed[n.symname][0].notifyHandle
            }
          })
        }
      }
    }

    function internalSubscribeLiveTick(){
      debug('internalSubscribeLiveTick:')
      var handle =  {
        indexGroup: nodeads.ADSIGRP.DEVICE_DATA,
        indexOffset: nodeads.ADSIOFFS_DEVDATA.ADSSTATE,
        transmissionMode: nodeads.NOTIFY.CYCLIC,
        cycleTime: 1000,
        bytelength: nodeads.WORD
      }
      if (node.adsClient) {
        debug('internalSubscribeLiveTick:',handle)
        node.adsClient.notify(handle, function(err){
          if (err){
            node.error(util.format('Ads Register Notification live tick %s', err))
          }
        })
      }
    }

    function internalSubscribeSymTab(){
      debug('internalSubscribeLiveTick:')
      var handle =  {
        indexGroup: nodeads.ADSIGRP.SYM_VERSION,
        indexOffset: 0,
        transmissionMode: nodeads.NOTIFY.ONCHANGE,
        bytelength: nodeads.BYTE,
        start: true
      }

      if (node.adsClient) {
        debug('internalSubscribeSymTab:',handle)
        node.adsClient.notify(handle, function(err){
          if (err){
            node.error(util.format('Ads Register Notification Sym Tab %s', err))
          }
        })
      }
    }
    /* end subscribe on PLC */

    /* write to PLC */
    node.write = function (n, config, value) {
      debug('write:',n.id, n.type)
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        var handle =  {
          symname: config.symname,
          propname: 'value',
          value: value
        }
        if (adsHelpers.isRawType(config.adstype)) {
          handle.bytelength = parseInt(config.bytelength)
        } else {
          if (adsHelpers.isStringType(config.adstype) && config.bytelength) {
            handle.bytelength = nodeads.string(parseInt(config.bytelength))
          } else {
            handle.bytelength = nodeads[config.adstype]
          }
        }
        if (adsHelpers.isTimezoneType(config.adstype)) {
          handle.useLocalTimezone = (config.timezone === "TO_LOCAL")
        }
        if (node.adsClient) {
          debug('write:',handle)
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
    node.read = function (n, config, cb) {
      debug('read:',n.id, n.type)
      if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
        var handle =  {
          symname: config.symname,
          propname: 'value'
        }
        if (adsHelpers.isRawType(config.adstype)) {
          handle.bytelength = parseInt(config.bytelength)
        } else {
          if (adsHelpers.isStringType(config.adstype) && config.bytelength) {
            handle.bytelength = nodeads.string(parseInt(config.bytelength))
          } else {
            handle.bytelength = nodeads[config.adstype]
          }
        }
        if (adsHelpers.isTimezoneType(config.adstype)) {
          handle.useLocalTimezone = (config.timezone === "TO_LOCAL")
        }
        if (node.adsClient) {
          debug('read:',handle)
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
      debug('close:')
      node.notificationNodes = []
      node.systemNodes = []
      internalRestart(done)
    })

    function internalRestart(done) {
      debug('internalRestart:','enter')
      internalSetConnectState(adsHelpers.connectState.DISCONNECTING)
      clearTimeout(conncetTimer)
      if (node.adsClient) {
        node.adsClient.end(function (){
          internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
          removeClient()
          var sleep = setInterval(function () {
            clearTimeout(sleep)
            debug('internalRestart:','done')
            done()
          },1000)
        })
      } else {
        debug('internalRestart:','done no adsClient')
        internalSetConnectState(adsHelpers.connectState.DISCONNECTED)
        done()
      }
    }
    /* end node RIP */

    /* set Note State */
    function internalSetConnectState (cState) {
      debug('internalSetConnectState:','new state:'+cState,'old state:'+node.system.connectState)
      if ((!node.system.connectState) || node.system.connectState != cState) {
        debug('internalSetConnectState:','set state:'+cState)
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
    node.getSymbols = function (force,cb) {
      debug('getSymbols:','enter')
      if (!force && (node.symbolsCache)) {
        debug('getSymbols by cache')
        cb(node.symbolsCache)
      } else {
        if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
          if (node.adsClient) {
            node.adsClient.getSymbols( function (err, symbols){
              debug('getSymbols:',err,symbols)
              if (err) {
                n.error(util.format('Ads Symbols %s', err))
              } else {
                node.symbolsCache = symbols
                cb(symbols)
              }
            }, true )
          }
        }
      }
    }

    node.getDatatyps = function (force,cb) {
      debug('getDatatyps:','enter')
      if (!force && (node.datatypsCache)) {
        debug('getDatatyps by cache')
        cb(node.datatypsCache)
      } else {
        if (node.system.connectState == adsHelpers.connectState.CONNECTED) {
          if (node.adsClient) {
            node.adsClient.getDatatyps( function (err, datatyps){
              debug('getDatatyps:',err,datatyps)
              if (err) {
                n.error(util.format('Ads Datatyps %s', err))
              } else {
                node.datatypsCache = datatyps
                cb(datatyps)
              }
            }, true )
          }
        }
      }
    }
    /* end symbols from PLC */

    /* system Nodes */
    node.systemRegister = function (n){
      debug('systemRegister:',n.id,n.type)
      if (node.systemNodes.indexOf(n) < 0) {
        node.systemNodes.push(n)
        node.systemUpdate(n)
        setSystemStatus(n)
      }
    }

    node.systemUnregister = function (n){
      debug('systemUnregister:',n.id,n.type)
      var index = node.systemNodes.indexOf(n)
      if (index >= 0) {
        node.systemNodes.splice(index,1)
      }
    }
    
    function internalSystemUpdate () {
      debug('internalSystemUpdate:','enter')
      if (!(node.timerSU)) {
        node.timerSU = setInterval(function () {
          clearTimeout(node.timerSU)
          delete(node.timerSU)
          if (node.systemNodes) {
            node.systemNodes.forEach(function(n){
                debug('internalSystemUpdate:','call',n.id,n.type)
                node.systemUpdate(n)
                setSystemStatus(n)
              })
          }
        },50)
      }
    }

    node.systemUpdate = function (n) {
      if (n) {
        debug('systemUpdate:','enter',n.id,n.type)
        n.onData(node.system)
      }
    }

    function setSystemStatus (n) {
      debug('setSystemStatus:','enter')
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
      debug('setSystemStatus:',n.id,n.type,{fill:fillSystem,shape:shapeSystem,text:textSystem})
      n.status({fill:fillSystem,shape:shapeSystem,text:textSystem})
    }

    function internalSetAdsState(adsState) {
      debugCyclic('internalSetAdsState:','new State:',adsState,'old State:',node.system.adsState)
      if ((!node.system.adsState) || node.system.adsState != adsState) {
        debug('internalSetAdsState:','set State:',adsState)
        node.system.adsState = adsState
        node.system.adsStateText = nodeads.ADSSTATE.fromId(adsState)
        internalSystemUpdate()
      }

    }
    /* end system Nodes*/
    connect()
  }
  RED.nodes.registerType('ads-connection', adsConnectionNode)

}
