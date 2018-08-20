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

const connectState = {
  ERROR:                     -1,
  DISCONNECTED:               0,
  CONNECTIG:                  1,
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