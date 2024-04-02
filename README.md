# Prerequesites
[Node.js](https://nodejs.org/en) - Download the LTS version and follow the installer. Version 20.11.0 of Node.js and version 10.2.4 of npm was used during development

# Downloading and setup
Download using the green button at the top labelled "Code". This opens a drop down menu where you can click "Download ZIP". Unzip this file.

# Starting the server
Open a terminal in the "TubeBender-main" folder (In Windows, right click and select "open in terminal"). Run `npm install` to install all dependencies. This should not take very long. When that is finished, plug in the arduino USB cable and run `npm start` in the terminal. If you see "Server is running on port 3001" printed on the terminal, the server is running properly.

### I am getting an error

The error is likely because the server cannot connect to the serial port that the arduino is using. Check that the arduino is connected to the pc. If the error persists, check which serial port the arduino is using (this can be done using for example the Arduino IDE, or VSCode). If it is using a port that isnt "COM5", you have to edit the "server.js" file in the "TubeBender-main" folder. The "serialPort" variable defines which serial port the server is accessing. It looks like this:

```
const serialPort = new SerialPort({
  path: 'COM5',
  baudRate: 9600
})
```

Edit the path (Where it says "COM5") so that it corresponds to the serialport of the arduino

### I do not see "open in terminal"
If the option to "open in terminal" in windows does not appear, right click in the folder, click "vis flere alternativer/view more options", then "egenskaper/properties". Copy the location of the folder ("plassering"). Open a terminal (In windows, search for "cmd" and push enter), then do `cd filelocationhere`. Then run `cd TubeBender-main`. Now you can proceed with the `npm install` step.

# Starting the HMI

Open another terminal (A different one from the one used for starting the server) in the "TubeBender-main" folder. Run `cd serial-monitor`, and then `npm install` to install all dependencies. This can take several minutes, and when it is finished several errors may appear in the terminal. This is normal and a sign that everything is running as it should. After it is done, run `npm start`. This should open your web browser automatically, and eventually the HMI should appear. If everything is working as intended, "Connected to socket" should be displayed on the top-left corner of the HMI, and data can be seen coming in.

# Debugging
- If "Connected to socket" is displayed in the top left corner of the HMI, but no data is coming in (the values are not changing/staying at 0), the connection to the server is good, but something may be wrong with the arduino. Try console logging the data in the server, and seeing if anything is coming in at all. Check the arduino code (tubebender.ino) and see that everything looks good. Try reuploading the code to the arduino.

- If "Not connected to socket" is displayed in the top left corner, the problem is the connection between the HMI and the server. This can occur from a variety of reasons. It is likely that a restart of everything will fix it, but if that does not work, more extensive troubleshooting needs to be done. From experience, this error rarely occurs, and when it does it is usually because code in the server or HMI that should not be touched having been touched.