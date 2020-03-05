'use strict'

exports.isTimezoneType = function (adsType) {
  return (adsType === "TIME" ||
          adsType === "TIME_OF_DAY" ||
          adsType === "TOD" ||
          adsType === "DATE" ||
          adsType === "DATE_AND_TIME" ||
          adsType === "DT")
}

exports.isRawType = function (adsType) {
  return (adsType === "RAW")
}

exports.isStringType = function (adsType) {
  return (adsType === "STRING")
}

exports.checkPort = function (node,port,def) {
  if (port < 0x0000 || port > 0xFFFF) {
    port = def
    node.error("wrong port:",port)
  }
}

const connectState = {
  ERROR:                     -1,
  DISCONNECTED:               0,
  CONNECTING:                 1,
  CONNECTED:                  2,
  DISCONNECTING:              3,
  fromId: function(id) {
    var states = this
    var state
    Object.keys(states).map(function(key){if (states[key]==id) state=key})
    return state
  }
}
exports.connectState = connectState

exports.wildcardToRegExp =  function (s) {
  return new RegExp('^' + s.replace(/[|\\{}()[\]^$+.]/g, '\\$&').replace(/[?]/g, ".").replace(/[*]/g, ".*") + '$')
  
}
