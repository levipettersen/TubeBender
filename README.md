# Prerequesites
[Node.js](https://nodejs.org/en) - Download the LTS version and follow the installer

# Downloading and setup
Download using the green button at the top labelled "Code". This opens a drop down menu where you can click "Download ZIP". Unzip this file.

# Starting the server
Open a terminal in the "TubeBender-main" folder (In Windows, right click and select "open in terminal"). Run `npm install`. When that is finished, run `npm start`. If you see "Server is running on port 3001" printed on the terminal, the server is running properly.

### I am getting an error

The error is likely because the server cannot connect to the serial port that the arduino is using. Check that the arduino is connected to the pc. If the error persists, check which serial port the arduino is using (this can be done using for example the Arduino IDE, or VSCode). If it is using a port that isnt "COM5", you have to edit the "server.js" file. The "serialPort" variable defines which serial port the server is accessing. It looks like this:

`
const serialPort = new SerialPort({
  path: 'COM5',
  baudRate: 9600
})
`

Edit the path (Where it says "COM5") so that it corresponds to the serialport of the arduino



1. In one terminal, run "node server.js" to start the node.js server. For the development, node.js version 20.11.0 was used. Other versions are untested.
2. Open another termianl, run ''cd serial-monitor'', then ''npm start'' to run the development sever.

