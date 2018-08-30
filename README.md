# node-red-contrib-ads

Beckhoff TwinCat ADS support for Node-Red. Provides nodes to talk to TwinCat PLC variables over ADS.

Uses the NODE-ADS library for Node.JS (https://www.npmjs.com/package/node-ads).

It's tested with TwinCat 2 but its also works with TwinCat 3. Look at the Port.

For the latest updates see the [CHANGELOG.md](https://github.com/umasudhan/node-red-contrib-mdashboard/blob/master/CHANGELOG.md)

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
Target NetId: ADS NET ID of the PLC in the format 192.168.2.5.1.1
Source NetId: ADS NET ID for node red in the format 192.168.2.10.1.1 the same as the one added to the static route in the Beckhoff PLC.
Port: Normally 48898 for TwinCat 2/3
Source Port: Normally 801 for TwinCat 2 Runtime 1 or 851 for TwinCat 3 Runtime 1
Target Port: Normally 32905 for TwinCat 2/3
```

#### - ads-system

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
CONNECTIG:                  1
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

#### - ads-out

Twincat ADS output node that can send values to the PLC.

#### - ads-in

Twincat ADS input node that can recive values from the PLC.

#### - ads-notification

Twincat ADS input node that can automatically recive values from the PLC, if they change.



License (MIT)
-------------
Copyright (c) 2018 Chris Traeger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
