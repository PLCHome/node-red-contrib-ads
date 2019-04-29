### 1.1.23: Maintenance Release

**Enhancements**

- something about issue
- read/write/notification: on error debug points to the correct node and varame in debug message

### 1.1.22: Maintenance Release

**Fixes**

- String output: The "size" argument must be of type number. Received type string #19

### 1.1.21: Maintenance Release

**Fixes**

- ADS notification not working after PLC has been offline (same as #14) #18

### 1.1.20: Maintenance Release

**Enhancements**

- ads-connection: adjustable timeout

**Fixes**

- node-ads-api: version 1.4.13 used
- ads-out: check for undefined

### 1.1.19: Maintenance Release

**Fixes**

- node-ads-api: version 1.4.11 used

### 1.1.18: Maintenance Release

**Fixes**

- node-ads-api: version 1.4.10 used

### 1.1.17: Maintenance Release

**Fixes**

- node-ads-api: version 1.4.9 used


### 1.1.16: Maintenance Release

**Fixes**

- ads out, ads in: override intern config with msg.config: corrected varType and timezone


### 1.1.15: Maintenance Release

**Enhancements**

- issue #11 multiple notifications with the same variable
- ads out, ads in: override intern config with msg.config

**Fixes**

- Release ADS-NOTIFICATION on deploy modified Node / modified Flows
- PLC relieved, live sign increased to 10 sec.


### 1.1.14: Maintenance Release

**Enhancements**

- Cache datatyps and symbols
- Topic added for all nodes.
- If a topic is entered at ADS-OUT, the value is only sent if the topic is the same.


**Fixes**

- Exception when use Time or Date on ADS-NOTIFICATION


### 1.1.13: Maintenance Release

**Enhancements**

- debug added
```
  debug=node-red-contrib-ads:*
  debug=node-red-contrib-ads:*,-node-red-contrib-ads:adsConnectionNode:Cyclic
  debug=node-red-contrib-ads:adsConnectionNode
  debug=node-red-contrib-ads:adsConnectionNode:Cyclic
  debug=node-red-contrib-ads:adsNotificationNode
  debug=node-red-contrib-ads:adsInNode
  debug=node-red-contrib-ads:adsOutNode
  debug=node-red-contrib-ads:adsSystemNode
  debug=node-red-contrib-ads:adsSymbolsNode
```


**Fixes**

- ADS ads-symbols on TC3
- [Node.js under heavy load when connection down #6](https://github.com/PLCHome/node-red-contrib-ads/issues/6)
- node-ads-api 1.4.7: Notification result may be empty when the connection is closed


### 1.1.12: Maintenance Release

**Enhancements**

- Example for web ui with Node for get symbols and types from ADS.


**Fixes**

- ADS Notification Note wont work


### 1.1.11: Maintenance Release

**Enhancements**

- Node for get symbols and types from ADS
- Nodes show Varname instead of Node-name
- revision README.md
- Use input msg for output in ADS In


**Fixes**

- README.md wrong link CHANGELOG.md


### 1.1.10: Maintenance Release

**Enhancements**

- Revision README.md
- Message property for ADS-OUT/ADS-NOTIFICATION


**Fixes**

- Node red does not start if the port number is too large
- System-state on timer 50 ms decoupled so that it sends less frequently
- Set system-state to INVALID, when connect-state not RUN
- Exception by get a message property on ADS-IN
