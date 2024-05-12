const express = require('express');
const http = require('http');
const serialport = require('serialport');
const SerialPort = serialport.SerialPort;
const { ReadlineParser } = require('@serialport/parser-readline');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3001;

const JSON5 = require('json5');

// Serialport
const serialPort = new SerialPort({
  path: 'COM5',
  baudRate: 9600
})

let dataToSerialPort;

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
parser.on('data', (data) => {
  // console.log(data);
  io.emit('serialData', data);
});


io.on('connection', (socket) => {
    console.log('A client connected');
    socket.on('arduinoData', (data) => {
      dataToSerialPort = data;
    });
    socket.on('disconnect', () => {
      console.log('A client disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// debounce sending data to serial port
setInterval(() => {
  if (dataToSerialPort) {
    serialPort.write(String(dataToSerialPort));
  }
}, 250); // sends data to serial port every 500ms