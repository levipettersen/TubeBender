import './App.css';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import JSON5 from 'json5';

import Plot from 'react-plotly.js';

import ExportButtonCSV from './ExportButtonCSV';

// Comment out for local testing
// let socket = io('http://localhost:3001', { transports : ['websocket'] }); // Update with your server URL
function connectToSocket() {
  // Comment out for local testing
  // socket = io('http://localhost:3001', { transports : ['websocket'] });
}

// Ctrl+k Ctrl+, to create manual folding range
// Ctrl+k Ctrl+. to remove manual folding range

// TODO: knapper for å velge hvilken data som skal plottes
let appStyle = {};

const plotConfig = {
  scrollZoom: true, 
  editable: true, 
  displayModeBar: true,
  showLink: true,
  plotlyServerURL: "https://chart-studio.plotly.com",
  linkText: "Edit chart on plotly",
};
const plotLayout = {title: 'A Fancy Plot', showlegend: true}

let thisTime;
let lastTime;
let deltaTime;

function App() {

  

  
  const [serialData, setSerialData] = useState({ timestamp: 0, sensor: 0, lcdButton: 0, encoderPos: 0, strainGauge: 0, pressureTransmitter: 0, deserializationError: false });
  const [arduinoData, setArduinoData] = useState({ counter: 0, textInput: '', valvePWM: 127, motorOn: 0 });
  
  const [historizedData, setHistorizedData] = useState([]);
  const [isHistorizing, setIsHistorizing] = useState(false);
    
  const [plotState, setPlotState] = useState({data: [], layout: {plotLayout}, frames: [], config: {plotConfig}});

  const [checkboxState, setCheckboxState] = useState(Object.entries(serialData).map((entry, index) => {
    // give each entry a unique color
    return {name: entry[0], checked: false, color: `rgb(${Math.floor(Math.random()*256)}, ${Math.floor(Math.random()*256)}, ${Math.floor(Math.random()*256)})`};
  }));

  // Comment out for local testing
  // socket.emit('arduinoData', JSON5.stringify(arduinoData));

  useEffect(() => {
    let UIDebounceInterval;
    let tempSerialData;

    // Connect to websocket if not already connected
    // Comment out for local testing
    // if (!socket || socket.disconnected) {
    //   connectToSocket();
    // }
    
    // Handles closing the websocket
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      // Comment out for local testing
      // socket.disconnect();
      const confirmationMessage = 'Disconnect from websocket?';
      event.returnValue = confirmationMessage; // Standard for most browsers
      return confirmationMessage; // For some older browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    

    // Receive and parse data from serial port
    // Comment out for local testing
    // socket.on('serialData', (data) => {
    //   try {
    //     tempSerialData = JSON5.parse(data);
    //     setSerialData(tempSerialData);
    //     lastTime = thisTime;
    //     thisTime = Number(tempSerialData.timestamp);
    //     deltaTime = thisTime - lastTime;
    //   } catch (error) {
    //     // something went wrong with parsing the data
    //   }
    // });

    // update state with parsed data every 50ms
    UIDebounceInterval = setInterval(() => {
      // Comment out for live testing
      setSerialData(tempSerialData);

      tempSerialData = {
        timestamp: serialData.timestamp + 100,
        sensor: Math.round(Math.sin(1*serialData.timestamp/1000)*512 + 512),
        lcdButton: Math.round(Math.sin(2*serialData.timestamp/1000)*512 + 512),
        encoderPos: Math.round(Math.sin(3*serialData.timestamp/1000)*512 + 512),
        strainGauge: Math.round(Math.sin(4*serialData.timestamp/1000)*512 + 512),
        pressureTransmitter: Math.round(Math.sin(5*serialData.timestamp/1000)*512 + 512),
        deserializationError: false
      }

      setSerialData(tempSerialData);
        lastTime = thisTime;
        thisTime = Number(tempSerialData.timestamp);
        deltaTime = thisTime - lastTime;

    }, 100);

    // Cleanup
    return () => {
      // Comment out for local testing
      // socket.disconnect();
      clearInterval(UIDebounceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // Comment out for live testing
  }, [serialData]);
    // Comment out for local testing
  // }, []);


  // Send data to arduino upon change
  useEffect(() => {
    // Comment out for local testing
    // socket.emit('arduinoData', JSON5.stringify(arduinoData));
  }, [arduinoData]);


  function changeArduinoDataCounter(change) {
    setArduinoData({ ...arduinoData, counter: arduinoData.counter + change });
  }

  // Historize data
  useEffect(() => {
    // add new data to historizedData
  if (isHistorizing) {
    setHistorizedData(h => [...h, serialData]);
    setPlotState({data: [
      // { // trace 1
      //   x: historizedData.map((data, index) => {
      //     return Number(data.timestamp / 1000);
      //   }),
      //   y: historizedData.map((data, index) => {
      //     return Number(data.strainGauge);
      //   }),
      //   type: 'scatter',
      //   mode: 'lines+markers',
      //   marker: {color: 'red'},
      //   name: 'Strain gauge'
      // }, 
      // { // trace 2
      //   x: historizedData.map((data, index) => {
      //     return Number(data.timestamp / 1000);
      //   }),
      //   y: historizedData.map((data, index) => {
      //     return Number(data.encoderPos);
      //   }),
      //   type: 'scatter',
      //   mode: 'lines+markers',
      //   marker: {color: 'blue'},
      //   name: 'Encoder'
      // },
      
      // add a trace for every checked data
      ...checkboxState.map((entry, index) => {
        if (entry.checked) {
          return {
            x: historizedData.map((data, index) => {
              return Number(data.timestamp / 1000);
            }),
            y: historizedData.map((data, index) => {
              return Number(data[entry.name]);
            }),
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: entry.color},
            name: entry.name
          };
        } else {
          return null;
        }
      }).filter((entry) => entry !== null)


    ], layout: {plotLayout}, frames: [], config: {plotConfig}});
    }
    // eslint-disable-next-line
  }, [serialData, isHistorizing]);


  const [catMode, setCatMode] = useState(false);

  useEffect(() => {
    if (catMode) {
      appStyle = {
        backgroundImage: "url(" + require("./catImage.jpg") + ")",
      };
    } else {
      appStyle = {
        backgroundImage: "",
      };
    }
  }, [catMode]);

  //function toggleMotor() {
  //  setArduinoData({ ...arduinoData, motorOn: !arduinoData.motorOn});
  //}
      
  return (
    <div className="App" style={appStyle}>
      <div style={{position: "absolute", left: "10px"}}>
        {/* Comment out for local testing */}
        {/*socket.connected*/ true ? (<p>Connected to socket</p>)  : (<p>Not connected to socket</p>)}
      </div>
      <div style={{position: "absolute", right: "10px", top: "10px"}}>
        <button onClick={() => setCatMode((e) => !e)}> toggle cat mode </button>
      </div>
      <h1>Serial Data Monitor</h1>
      
      {serialData ? (
        <div className='ContentContainer'>
          <div className='DataContainer'>
            <div className='ArduinoDataContainer'>
              <h2>Send data to arduino</h2>
              <p>Counter</p>
              <button onClick={() => changeArduinoDataCounter(-1)}>Decrement</button>
              <button onClick={() => changeArduinoDataCounter(1)}>Increment</button>
              <p>{arduinoData.counter}</p>
              <p>Text input for arduino lcd</p>
              <input type="text" onChange={(e) => setArduinoData({ ...arduinoData, textInput: e.target.value})} />
              <p>PWM input for valve</p>
              <input type="number" defaultValue={127} onChange={(e) => setArduinoData({ ...arduinoData, valvePWM: e.target.value})} />
              <button onClick={() => setArduinoData({...arduinoData, motorOn: !arduinoData.motorOn})}>{arduinoData.motorOn ? "Motor is on" : "Motor is off"}</button>
            </div>
            <div className='SerialDataContainer'>
              <h2>Data from serial port</h2>
              {/* <p>Potentiometer</p>
              <p>{serialData.sensor}</p>
              <p>Pushbutton under lcd</p>
              <p>{serialData.lcdButton}</p> */}
              {
                Object.entries(serialData).map((entry, index) => {
                  return (
                    <p key={index}>{entry[0]}: {String(entry[1])}</p>
                  );
                })
              }
              <p>Pressure: {serialData.pressureTransmitter*400/1024} bar</p>
              <p>Timestamp</p>
              <p>{serialData.timestamp} milliseconds since start of program</p>
              <p>{roundToX(serialData.timestamp/1000, 0)} seconds since start of program</p>
              <p>{roundToX(serialData.timestamp/(1000*60), 2)} minutes since start of program</p>
              <p>Delta time is {deltaTime} ms</p>
            </div>
          </div>
          <div className='DataVisualizeContainer'>
            <h2>Historized data</h2>
            <div className='ChartButtonContainer'>
              <button onClick={() => setIsHistorizing(!isHistorizing)}>{isHistorizing ? 'Stop historizing' : 'Start historizing'}</button>
              <button onClick={() => console.log(historizedData)}>Log historized data</button>
              <button onClick={() => setHistorizedData([])}>Clear historized data</button>
            </div>
            <div className='ChartContainer'>
              {isHistorizing ? (
                <p>Is historizing</p>
              ) : (
                <p>Not historizing</p>
              )}
              {historizedData.length > 0 ? <ExportButtonCSV data={historizedData} /> : <></> }

              <fieldset>
                <legend>Plotted data</legend>

                {/* Map serial data */}

                {checkboxState.map((entry, index) => {
                  return (
                    <div key={index}>
                      <input type="checkbox" id={entry.name} name={entry.name} checked={entry.checked} onChange={() => {
                        setCheckboxState((state) => {
                          return state.map((entry) => {
                            if (entry.name === checkboxState[index].name) {
                              return {name: entry.name, checked: !entry.checked, color: entry.color};
                            } else {
                              return entry;
                            }
                          });
                        });
                      }} />
                      <label htmlFor={entry.name}>{entry.name}</label>
                    </div>
                  );
                }
                )}
              </fieldset>
              <div>
                <Plot
                data={plotState.data}
                layout={plotLayout}
                config={plotConfig}
                onInitialized={(figure) => setPlotState(figure)}
                onUpdate={(figure) => setPlotState(figure)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p>No data </p>
        </div>
      )}

    </div>
  );
}


// function to round to x decimal places
function roundToX(num, x) {
  return +(Math.round(num + "e+" + x)  + "e-" + x);
}

export default App;
