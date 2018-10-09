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
- [Node.js under heavy load when connection down #6](https://github.com/ChrisHanuta/node-red-contrib-ads/issues/6)
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