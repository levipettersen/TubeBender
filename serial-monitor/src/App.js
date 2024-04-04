import './App.css';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import JSON5 from 'json5';

import Plot from 'react-plotly.js';

import ExportButtonCSV from './ExportButtonCSV';

import HoverInfo from './Components/HoverInfo';

import { Gauge } from '@mui/x-charts/Gauge'
// https://mui.com/x/react-charts/gauge/

// Comment out for local testing
// let socket = io('http://localhost:3001', { transports : ['websocket'] }); // Update with your server URL
function connectToSocket() {
  // Comment out for local testing
  // socket = io('http://localhost:3001', { transports : ['websocket'] });
}

// Ctrl+k Ctrl+, to create manual folding range
// Ctrl+k Ctrl+. to remove manual folding range

// TODO: knapper for å velge hvilken data som skal plottes

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

  const [menuState, setMenuState] = useState('main');

  const [emergencyStop, setEmergencyStop] = useState(false);

  const [controlMode, setControlMode] = useState('manual');

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
        sensor: Math.round(Math.sin(1*serialData.timestamp/10000)*512 + 512),
        lcdButton: Math.round(Math.sin(2*serialData.timestamp/10000)*512 + 512),
        encoderPos: Math.round(Math.sin(3*serialData.timestamp/10000)*512 + 512),
        strainGauge: Math.round(Math.sin(4*serialData.timestamp/10000)*512 + 512),
        pressureTransmitter: Math.round(Math.sin(5*serialData.timestamp/10000)*512 + 512),
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

  //function toggleMotor() {
  //  setArduinoData({ ...arduinoData, motorOn: !arduinoData.motorOn});
  //}


    return (
    <div className="App">
      <div style={{position: "absolute", left: "10px", top: "10px", width: "450px", height: "30px", display: "flex", justifyContent: "space-around", alignItems: "center"}}>
        {/* Comment out for local testing */}
        {/*socket.connected*/ true ? (<p>Connected to socket</p>)  : (<p>Not connected to socket</p>)}
        <button onClick={() => setMenuState('main')}>Main</button>
        <button onClick={() => setMenuState('plot')}>Plot</button>
        <button onClick={() => setMenuState('dev')}>Dev</button>
        <div>Current page is {menuState}</div>
      </div>
      <h1>Serial Data Monitor</h1>
        {
          menuState === 'main' ? // MAIN MENU
          <div className='mainContainer'>
            <div>
              <p>Set control mode (manual, automatic)</p>
              <button onClick={() => setControlMode('manual')}
              disabled={emergencyStop}
              >Manual control</button>
              <button onClick={() => {
                setArduinoData({...arduinoData, motorOn: false, valvePWM: 127});
                setControlMode('automatic');
                }}
                disabled={emergencyStop}
                >Automatic control</button>
              <p>Current control mode is {controlMode}</p>
            </div>
            <div>
              <p>Manual motor control</p>
              <button 
              disabled={controlMode === 'automatic' || emergencyStop}
              onClick={() => setArduinoData({...arduinoData, motorOn: !arduinoData.motorOn})}>{arduinoData.motorOn ? "Motor is on" : "Motor is off"}</button>
            </div>
            <div>
              <p>Manual valve PWM control</p>
              <input type="number" 
              disabled={arduinoData.motorOn || controlMode === 'automatic' || emergencyStop} 
              defaultValue={127} 
              onChange={(e) => setArduinoData({ ...arduinoData, valvePWM: e.target.value})} 
              value={arduinoData.valvePWM}
              />
              {/* <p>Note: valve can only be adjusted when motor is off. 127 is neutral. &lt;127 is CCW/CW. &gt;127 is CCW/CW </p> */}
              <div style={{
                position: "relative", 
                // top: "30px", 
                top: "2vh",
                // right: "150px",
                right: "8vw",
                }}>
                <HoverInfo>Operator Note: valve can only be adjusted when motor is off. 127 is neutral. &lt;127 is CCW/CW. &gt;127 is CCW/CW</HoverInfo>
              </div>
            </div>
            <div> 
              <p>Automatic bending. Enter desired bend angle and springback value </p>
              <p style={{margin:"0"}}>Desired bend angle <input type="number" /> </p>
              <p style={{margin:"0"}}>Springback angle <input type="number" /> </p>
              <button>Start automatic bending</button>
            </div>
            <div> 
              <p>Motor state (idle, motor running, emergency stop)</p>
              <p>
              {
                  emergencyStop ? "Emergency stop" :
                  arduinoData.motorOn ? "Motor is running" : "Motor is idle"
              }
              </p>
            </div>
            <div> 
              <p>Current bend angle: {serialData.encoderPos} </p>
              <div>
                <Gauge 
                width={75} 
                height={75} 
                value={serialData.encoderPos} 
                valueMin={0}
                valueMax={1023}
                />
              </div>
            </div>
            <div> 
              <p>Temperature </p>

              <div>
                <Gauge 
                width={75} 
                height={75} 
                value={23} 
                valueMin={0}
                valueMax={40}
                />
              </div>

              </div>
            <div> <p
              style={{
                margin: "0 0 0.5em 0"
              }}
            >Raw data</p>
              {
                Object.entries(serialData).map((entry, index) => {
                  return (
                    <p 
                    style={{
                      margin: "0",
                      fontSize: "12px",
                    }}
                    key={index}>{entry[0]}: {String(entry[1])}</p>
                  );
                })
              }
            </div>
            <div> 
              <p>Emergency stop button </p>
              <button
              style={{
                height: "90%",
                width: "90%",
                backgroundColor: "red",
                marginBottom: "10px",
                borderRadius: "15px",
                fontSize: "1.5em",
              }}
              onClick={() => {
                setEmergencyStop(true)
                setArduinoData({...arduinoData, motorOn: false, valvePWM: 127})
              }}
              >EMERGENCY STOP</button>
              
              {
                emergencyStop ? 
                <button
                style={{
                  margin: "0"
                }}
                onClick={() => setEmergencyStop(false)}
                >reset</button>
                :
                <></>
              }
              
            </div>
            <div> 
              <p>Hydraulic Pressure: {Math.round(serialData.pressureTransmitter*400/1023)} Bar </p>
              
              <div>
                <Gauge 
                width={75} 
                height={75} 
                value={Math.round(serialData.pressureTransmitter*400/1023)} 
                valueMin={0}
                valueMax={400}
                />
              </div>
            
            </div>
            <div
              style={{
                // go from line 3 to 5 on both row and column
                gridRow: '3 / 5',
                gridColumn: '3 / 5',
                // backgroundColor: 'lightblue',
                display: 'flex',
                justifyContent: 'center',
                height: '84%',
              }}
            > Picture </div>
            {/* <div> other data </div> */}
            <div
              style={{
              gridRow: '1/3',
              gridColumn: '4/5',
              display: 'flex',
              justifyContent: 'center',
              height: "84%"
              }}
            > bending list </div>
            {/* <div> bending list </div> */}
            {/* <div> bending list </div> */}
            {/* <div> bending list </div> */}

          </div> :
          menuState === 'plot' ? // PLOT MENU
          <>
            {/* <PlotComponent /> */}
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
          </> : // DEV MENU

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
        }
    </div>
  );



}


// function to round to x decimal places
function roundToX(num, x) {
  return +(Math.round(num + "e+" + x)  + "e-" + x);
}

export default App;
