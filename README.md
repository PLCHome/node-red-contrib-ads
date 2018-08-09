## node-red-contrib-ads

Beckhoff TwinCat ADS support for Node-Red. Provides nodes to talk to TwinCat PLC variables over ADS.

Uses the NODE-ADS library for Node.JS (https://www.npmjs.com/package/node-ads).

It's tested with TwinCat 2 but its also works with TwinCat 3. Look at the Port.

### Installation

```sh
cd ~/.node-red
npm install node-red-contrib-ads
```

### Requirements
* Beckhoff PLC that has an ethernet connection and is connected to your LAN
    * Make your you give the PLC a fixed IP address
    * Make sure you can ping the PLC from another computer

### Configuration

1. Enable ADS on your PLC project. To do this click on your task and then enable the checkbox before `Create symbols`.
Now under I/O Devices click on Image and go to the ADS tab. Check the `Enable ADS Server` and also `Create symbols`.
Download the new configuration and make sure you reboot your PLC. The reboot is only needed when you are using TwinCat 2.

2. Now add a static route to our Beckhoff PLC. The route should point to your server that will run the proxy application.
It's also a good idea to add an extra static route that points to your local development device. This way you can test out the proxy from your development device too.



### Global variables
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



### Nodes added by this package

#### - ads-connection

A node that represents a TwinCat ADS device. 
Be sure to create one for port and ADS NET ID.

```
Host: IP address of the PLC
Target NetId: ADS NET ID of the PLC in the format 192.168.2.5.1.1
Source NetId: ADS NET ID for node red in the format 192.168.2.10.1.1 the same as the one added to the static route in the Beckhoff PLC.
Port: Normally 48898 for TwinCat 2
Source Port: Normally 801 for TwinCat 2 Runtime 1
Target Port: Normally 32905 for TwinCat 2
```


#### - ads-out

Twincat ADS output node that can send values to the PLC.

#### - ads-in

Twincat ADS input node that can recive values from the PLC.


License (MIT)
-------------
Copyright (c) 2012 Inando

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
