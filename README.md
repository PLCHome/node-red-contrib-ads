##
The component is not working properly.
Since I don't feel like node-red and have no time, the project will be closed.


# node-red-contrib-ads

> A Node-RED implementation for the Twincat ADS protocol.
> (Twincat and ADS provided by Beckhoff &copy;. I'm not affiliated.)

Beckhoff TwinCat ADS support for Node-Red. Provides nodes to talk to TwinCat PLC variables over ADS.

Uses the NODE-ADS library for Node.JS (https://www.npmjs.com/package/node-ads).

It's tested with TwinCat 2 but its also works with TwinCat 3. Look at the Port.

For the latest updates see the [CHANGELOG.md](https://github.com/PLCHome/node-red-contrib-ads/blob/master/CHANGELOG.md)

## issue

If you have problems do not be afraid to open an issue.

If you open a new issue please remember that I do not know your hardware, software, PLC and programming.

Therefore it would be nice if you answer the following questions:

```
node-red-contrib-ads version:
nodered version:
on which operating system is the Node-RED running:
on which hardware system is the Nodered running: (PC/Raspberry)
PLC type:
Twincat version of the PLC:
Twincat version of the development environment:
```

## Installation

```sh
cd ~/.node-red
npm install node-red-contrib-ads
```

## Requirements
* Beckhoff PLC that has an ethernet connection and is connected to your LAN
    * Make your you give the PLC a fixed IP address
    * Make sure you can ping the PLC from another computer

## Configuration

1. Enable ADS on your PLC project. To do this click on your task and then enable the checkbox before `Create symbols` (if he is not disabled).
In addition, you can still, under I/O Devices click on Image and go to the ADS tab. Check the `Enable ADS Server` and also `Create symbols`.
Download the new configuration and make sure you reboot your PLC. The reboot is only needed when you are using TwinCat 2.

2. Now add a static route to our Beckhoff PLC. The route should point to your server that will run the proxy application.
It's also a good idea to add an extra static route that points to your local development device. This way you can test out the proxy from your development device too.

### Attention

1. TwinCAT AMS Router doesn't allow multiple TCP connections from the same host. So when you use two AdsLib instances on the same host to connect to the same TwinCAT router, you will see that TwinCAT will close the first TCP connection and only respond to the newest. If you start the TwinCat System Manager and Node-Red ADS on the same PC at the same time, Node-Red will not run anymore. You can set up a second IPv4 on the PC and assign to this a ADS NET ID under Twincat

2. As ADS is transmitted over a TCP connection, there is no real time guarantee.


## Global variables
Global variables must start with a dot: ```.engine```
```
VAR_GLOBAL
	engine		AT %QX0.0:	BOOL;
	deviceUp	AT %QX0.1:	BOOL;
	deviceDown	AT %QX0.2:	BOOL;
	timerUp:					TON;
	timerDown:				TON;
	steps:					BYTE;
	count:					UINT := 0;
	devSpeed:				TIME := t#10ms;
	devTimer:				TON;
	switch: BOOL;
END_VAR
```

Program variables must start with the programname: ```MAIN.UpTyp.timerUp.PT```



## Nodes added by this package

#### - ads-connection

A node that represents a TwinCat ADS device.
Be sure to create one for an PLC.

```
Host: IP address of the PLC
Client: IP address of the client if there is more than one. If it is empty, it will be determined automatically.
Target NetId: ADS NET ID of the PLC in the format 192.168.2.5.1.1
Source NetId: ADS NET ID for node red in the format 192.168.2.10.1.1 the same as the one added to the static route in the Beckhoff PLC.
Port: Normally 48898 for TwinCat 2/3
Source Port: Normally 801 for TwinCat 2 Runtime 1 or 851 for TwinCat 3 Runtime 1
Target Port: Normally 32905 for TwinCat 2/3
Timeout ms: The timeout in milliseconds, by default 500
```

#### - ADS System

Twincat ADS node that give you information about the PLC and PLC state.

##### input
You can write anything on the input, then the system state is pushed to the output.

##### output
```
msg.payload : Object
{ "connectState":2,
  "connectStateText":"CONNECTED",
  "adsState":5,
  "adsStateText":"RUN",
  "majorVersion":2,
  "minorVersion":11,
  "versionBuild":2605,
  "version":"2.11.2605",
  "deviceName":"TCatPlcCtrl",
  "symTab":138
}
```
###### Connect state (text)
The following connect state values are possible:
```
ERROR:                     -1
DISCONNECTED:               0
CONNECTING:                 1
CONNECTED:                  2
DISCONNECTING:              3
```

###### ADS state (text)
The following ADS state values are possible:
```
INVALID:      0
IDLE:         1
RESET:        2
INIT:         3
START:        4
RUN:          5
STOP:         6
SAVECFG:      7
LOADCFG:      8
POWERFAILURE: 9
POWERGOOD:    10
ERROR:        11
SHUTDOWN:     12
SUSPEND:      13
RESUME:       14
CONFIG:       15
RECONFIG:     16
STOPPING:     17
```

###### Version
This is the version of the PLC runtime. Either in single parts ("majorVersion", "minorVersion", "versionBuild") or assembled ("version")

###### Devicename
The Name of the PLC-Device

###### symTab
The PLC internal version number of the variable Händel assignment


#### - ADS Out

Twincat ADS output node that can send values to the PLC.

Enter the name of the variable, the type and the property name. If ads is connected the value is written to the PLC

If a topic is entered, the value is only sent if the topic is the same.

There is an possible to override the node configuration. You can add an property config to the message object. Not all configuration properties need to be overridden.
- `config.varName`: (string) override the variable name
- `config.varType`: (string) override the variable type
- `config.varSize`: (integer) the length on RAW and STRING type
- `config.timezone`: (string) only on date and time type 'TO_LOCAL' or 'UNCHANGED'
- `config.outProperty`: (string) the property for the outvalue
- `config.topic`: (string) the topic being checked against the message topic. It can be '' to delete an topic.


#### - ADS In

Twincat ADS input node that can recive values from the PLC.

This note is not for the transmission of cyclic data. Do not use it in conjunction with a timer. There is a notification node for this.

Enter the name of the variable, the type and the property name for the output.
You can still decide whether a new output with the property for the value will be created or the property will be inserted into the inputvalue and output at the output.

There is an possible to override the node configuration. You can add an property config to the message object. Not all configuration properties need to be overridden.
- `config.varName`: (string) override the variable name
- `config.varType`: (string) override the variable type
- `config.varSize`: (integer) the length on RAW and STRING type
- `config.isarray`: (bool) is an ARRAY type, varLowIndex and varHighIndex must set
- `config.varLowIndex`: (integer) the Low index on ARRAY type
- `config.varHighIndex`: (integer) the High index on ARRAY type
- `config.timezone`: (string) only on date and time type 'TO_LOCAL' or 'UNCHANGED'
- `config.inProperty`: (string) the property for the outvalue
- `config.useInputMsg`: (bool) the input message will be used to build the out message or an new message will be build.
- `config.topic`: (string) the topic being checked against the message topic. It can be '' to delete an topic.

#### - ADS Notification

Twincat ADS input node that can automatically recive values from the PLC, if they change.
Beckhoff says you should not have more than 510 variables monitored.
Each time the ADS-Node is connected to the PLC, the PLC automatically sends the value once.

Note, if you have multiple Notification with the same variable name then only one of the nodes will be registered in the PLC. Which is coincidence. therefore, the same variable may not be "cyclic" and "onchange" at the same time. Or number and bool at the same time. Please use the link node from the node red base nodes.

- Transmission Mode: With "cyclic", the variable is polled cyclically by the PLC and transmitted, with "onchange" the PLC monitors.
- Max Delay:  At the latest after this time, the ADS Device Notification is called. The unit is 1ms.
- Cycle Time:  The ADS server checks if the value changes in this time slice. The unit is 1ms


#### - ADS Symbols

This note loads a list of all symbols or types from the PLC when written to the input. If a string or string array is written, the output is filtered by name. Wildcards [?=char;*=chars] are possible.

This example makes an web ui for inspecting the PLC. The ADS Connection still needs to be set.
```json
[{"id":"b0a9c705.017d08","type":"ADS Symbols","z":"524f011a.f0bce8","name":"","datasource":"","data":"SYMBOLES","x":370,"y":940,"wires":[["f9278f67.b8ba2"]]},{"id":"f9278f67.b8ba2","type":"ui_template","z":"524f011a.f0bce8","group":"aa9409af.67136","name":"","order":0,"width":"26","height":"6","format":"<style>\ntable {\n    color: #333;\n    font-family: Helvetica, Arial, sans-serif;\n    width: 100%;\n    border-collapse: collapse;\n    border-spacing: 0;\n}\ntd, th {\n    border: 1px solid transparent;\n    height: 30px;\n    transition: all 0.3s;\n}\nth {\n    background: #DFDFDF;\n    /* Darken header a bit */\n    font-weight: bold;\n    text-align: left;\n}\ntd {\n    background: #FAFAFA;\n    text-align: left;\n}\ntr:nth-child(even) td {\n    background: #F1F1F1;\n}\ntr:nth-child(odd) td {\n    background: #FEFEFE;\n}\ntr td:hover {\n    background: #666;\n    color: #FFF;\n}\n</style>\n\n<div>\n<table>\n  <tr>\n    <th>Index Group</th>\n    <th>Index Offset</th>\n    <th>Name</th>\n    <th>Type</th>\n    <th>Comment</th>\n  </tr>\n  <tr ng-repeat=\"obj in msg.payload\">\n    <td>{{ obj.indexGroup }}</td>\n    <td>{{ obj.indexOffset }}</td>\n    <td>{{ obj.name }}</td>\n    <td>{{ obj.type }}</td>\n    <td>{{ obj.comment }}</td>\n  </tr>\n</table>\n</div>","storeOutMessages":false,"fwdInMessages":false,"templateScope":"local","x":600,"y":940,"wires":[[]]},{"id":"cf2f5485.8f3268","type":"ADS Symbols","z":"524f011a.f0bce8","name":"","datasource":"","data":"TYPES","x":360,"y":1020,"wires":[["803b7b42.ce51b"]]},{"id":"803b7b42.ce51b","type":"ui_template","z":"524f011a.f0bce8","group":"f880e964.b5012","name":"","order":2,"width":"26","height":"10","format":"<style>\ntable {\n    color: #333;\n    font-family: Helvetica, Arial, sans-serif;\n    width: 100%;\n    border-collapse: collapse;\n    border-spacing: 0;\n}\ntd, th {\n    border: 1px solid transparent;\n    height: 30px;\n    transition: all 0.3s;\n}\nth {\n    background: #DFDFDF;\n    font-weight: bold;\n    text-align: left;\n}\ntd {\n    background: #FAFAFA;\n    text-align: left;\n}\ntr:nth-child(even) td {\n    background: #F1F1F1;\n}\ntr:nth-child(odd) td {\n    background: #FEFEFE;\n}\ntr td:hover {\n    background: #666;\n    color: #FFF;\n}\n</style>\n\n<div>\n<table>\n  <tr>\n    <th>Version</th>\n    <th>Size</th>\n    <th>Data Type</th>\n    <th>Name</th>\n    <th>Type</th>\n    <th>Comment</th>\n    <th>Array Dim</th>\n    <th>Sub Types</th>\n  </tr>\n  <tr ng-repeat=\"obj in msg.payload\">\n    <td>{{ obj.version }}</td>\n    <td>{{ obj.size }}</td>\n    <td>{{ obj.dataType }}</td>\n    <td>{{ obj.name }}</td>\n    <td>{{ obj.type }}</td>\n    <td>{{ obj.comment }}</td>\n    <td>\n       <table ng-show=\"obj.array\">\n          <tr>\n            <th>Low Bound</th>\n            <th>Elements</th>\n          </tr>\n          <tr ng-repeat=\"sobj in obj.array\">\n            <td>{{ sobj.lBound }}</td>\n            <td>{{ sobj.elements }}</td>\n          </tr>\n       </table>\n     </td>       \n    <td>\n       <table ng-show=\"obj.datatyps\">\n          <tr>\n            <th>Index</th>\n            <th>Version</th>\n            <th>Size</th>\n            <th>Data Type</th>\n            <th>Offset</th>\n            <th>Name</th>\n            <th>Type</th>\n            <th>Comment</th>\n          </tr>\n          <tr ng-repeat=\"sobj in obj.datatyps\">\n            <td>{{ sobj.index }}</td>\n            <td>{{ sobj.version }}</td>\n            <td>{{ sobj.size }}</td>\n            <td>{{ sobj.dataType }}</td>\n            <td>{{ sobj.offs }}</td>\n            <td>{{ sobj.name }}</td>\n            <td>{{ sobj.type }}</td>\n            <td>{{ sobj.comment }}</td>\n          </tr>\n       </table>\n     </td>       \n  </tr>\n</table>\n</div>","storeOutMessages":false,"fwdInMessages":false,"templateScope":"local","x":600,"y":1020,"wires":[[]]},{"id":"6dadd36d.9d2334","type":"ui_text_input","z":"524f011a.f0bce8","name":"","label":"Search","group":"f880e964.b5012","order":1,"width":0,"height":0,"passthru":false,"mode":"text","delay":"0","topic":"","x":140,"y":1020,"wires":[["cf2f5485.8f3268"]]},{"id":"8dfe926d.20cbb","type":"ui_text_input","z":"524f011a.f0bce8","name":"","label":"Search","group":"aa9409af.67136","order":1,"width":"0","height":"0","passthru":false,"mode":"text","delay":"0","topic":"","x":140,"y":940,"wires":[["b0a9c705.017d08"]]},{"id":"aa9409af.67136","type":"ui_group","z":"","name":"Symboles","tab":"65f5295f.68b3c","order":1,"disp":true,"width":"26","collapse":true},{"id":"f880e964.b5012","type":"ui_group","z":"","name":"Types","tab":"65f5295f.68b3c","order":2,"disp":true,"width":"26","collapse":true},{"id":"65f5295f.68b3c","type":"ui_tab","z":"","name":"inspect PLC","icon":"fingerprint","order":2}]
```


This example makes an file for excel. The ADS Connection still needs to be set.
```json
[{"id":"2cf4e73.bcb4f98","type":"ADS Symbols","z":"524f011a.f0bce8","name":"","datasource":"","data":"SYMBOLES","x":300,"y":740,"wires":[["9fd1a1c7.a10a6"]]},{"id":"9fd1a1c7.a10a6","type":"csv","z":"524f011a.f0bce8","name":"","sep":"\\t","hdrin":false,"hdrout":true,"multi":"one","ret":"\\r\\n","temp":"indexGroup,indexOffset,size,name,type,comment","skip":"0","x":470,"y":740,"wires":[["3f33ed7f.08d41a"]]},{"id":"3f33ed7f.08d41a","type":"file","z":"524f011a.f0bce8","name":"","filename":"symboles.xls","appendNewline":false,"createDir":false,"overwriteFile":"true","x":690,"y":740,"wires":[[]]},{"id":"cf639909.782c38","type":"inject","z":"524f011a.f0bce8","name":"all","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":740,"wires":[["2cf4e73.bcb4f98"]]},{"id":"bb6e0397.998ca8","type":"ADS Symbols","z":"524f011a.f0bce8","name":"","datasource":"","data":"TYPES","x":300,"y":800,"wires":[["df532662.17485"]]},{"id":"afa626ac.36da48","type":"csv","z":"524f011a.f0bce8","name":"","sep":"\\t","hdrin":false,"hdrout":true,"multi":"one","ret":"\\r\\n","temp":"version,size,dataType,subItems,name,type,lBound,elements,entryIndex,entryVersion,entrySize,entryOffs,entryDataType,entryName,entryType","skip":"0","x":670,"y":800,"wires":[["ace69011.4a4f18"]]},{"id":"ace69011.4a4f18","type":"file","z":"524f011a.f0bce8","name":"","filename":"types.xls","appendNewline":false,"createDir":false,"overwriteFile":"true","x":840,"y":800,"wires":[[]]},{"id":"12d3e5af.381b3a","type":"inject","z":"524f011a.f0bce8","name":"search","topic":"","payload":"[\"typeName1*\",\"type?ame2*\"]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":800,"wires":[["bb6e0397.998ca8"]]},{"id":"df532662.17485","type":"function","z":"524f011a.f0bce8","name":"format for csv","func":"var outmsg = {payload:[]}\nif (Array.isArray(msg.payload)) {\n    msg.payload.map(function (data){\n        out = {\n            version: data.version,\n            hashValue: data.hashValue,\n            typeHashValue: data.typeHashValue,\n            size: data.size,\n            dataType: data.dataType,\n            subItems: data.subItems,\n            name: data.name,\n            type: data.type,\n            arrayDim: data.arrayDim,\n            comment: data.comment\n        }\n        outmsg.payload.push(out)\n        \n        if (data.array) {\n            data.array.map(function(adata) {\n                adata.name= data.name\n                outmsg.payload.push(adata)\n            })    \n        }\n\n        if (data.datatyps) {\n            data.datatyps.map(function(sdata) {\n                out = {\n                    name: data.name,\n                    entryIndex: sdata.index,\n                    entryVersion: sdata.version,\n                    entryHashValue: sdata.hashValue,\n                    entryTypeHashValue: sdata.typeHashValue,\n                    entrySize: sdata.size,\n                    entryOffs: sdata.offs,\n                    entryDataType: sdata.dataType,\n                    entryName: sdata.name,\n                    entryType: sdata.type,\n                    entryArrayDim: data.arrayDim,\n                    entryComment: sdata.comment,\n                    array: sdata.array\n                }\n                outmsg.payload.push(out)\n                \n            })    \n        }\n    })\n}\nreturn outmsg","outputs":1,"noerr":0,"x":500,"y":800,"wires":[["afa626ac.36da48"]]},{"id":"fa01d720.55c0e8","type":"inject","z":"524f011a.f0bce8","name":"all","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":840,"wires":[["bb6e0397.998ca8"]]},{"id":"b16a18f7.e0ece8","type":"inject","z":"524f011a.f0bce8","name":"search","topic":"","payload":"[\".var1*\",\".?ar2*\"]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":700,"wires":[["2cf4e73.bcb4f98"]]}]
```

License (MIT)
-------------
Copyright (c) 2018 Chris Traeger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
