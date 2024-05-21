import './App.css';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import JSON5 from 'json5';

import Plot from 'react-plotly.js';

import ExportButtonCSV from './ExportButtonCSV';

import HoverInfo from './Components/HoverInfo';

import useWindowDimensions from './Components/useWindowDimensions';

import { Gauge } from '@mui/x-charts/Gauge'
// https://mui.com/x/react-charts/gauge/

import Warning from '@mui/icons-material/Warning';
// https://fonts.google.com/icons?icon.set=Material+Icons

// Comment out for local testing
let socket = io('http://localhost:3001', { transports : ['websocket'] }); // Update with your server URL
function connectToSocket() {
  // Comment out for local testing
  socket = io('http://localhost:3001', { transports : ['websocket'] });
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

  const [HMIcontrolMode, setHMIControlMode] = useState('manual');

  const [serialData, setSerialData] = useState(
    {
      timestamp: 0,
      // sensor: 0,
      // lcdButton: 0,
      encoderPos: 180,
      strainGauge: 0,
      pressureTransmitter: 0,
      stopButton: 0,
      startButton: 0,
      dial: 0,
      emergencyButton: 0,
      deserializationError: false,
      controlMode: 0,
    }
  );
  const [arduinoData, setArduinoData] = useState(
    {
      valvePWM: 127, 
      motorOn: 0, 
      angleReset: false,
    });

  const [autoData, setAutoData] = useState(
    {
      desiredBendAngle: 0,
      desiredSpringbackAngle: 0,
      initAB: false,
      reset: false,
    }
  );

  const [bendingPower, setBendingPower] = useState(100);

  useEffect(() => {
    if (serialData.encoderPos < Number(autoData.desiredBendAngle) + Number(autoData.desiredSpringbackAngle) && 
    autoData.initAB === true && 
    !emergencyStop) {
      setArduinoData({...arduinoData, motorOn: true, valvePWM: 139 + bendingPower*51/100});
    } 

    if (serialData.encoderPos > Number(autoData.desiredBendAngle) + Number(autoData.desiredSpringbackAngle) && 
    autoData.initAB === true && 
    !emergencyStop) {
      setArduinoData({...arduinoData, motorOn: false, valvePWM: 127});
    }

    if (autoData.reset && !emergencyStop) {
      setArduinoData({...arduinoData, motorOn: true, valvePWM: 106 - bendingPower*43/100});
    }

  }, [autoData, serialData])

  useEffect(() => {
    if (
      autoData.initAB && 
      serialData.encoderPos > Number(autoData.desiredBendAngle) + Number(autoData.desiredSpringbackAngle)
      && !emergencyStop
    ) {
      setAutoData({...autoData, initAB: false});
    }

    if (
      autoData.reset &&
      serialData.encoderPos < 1
    ) {
      setAutoData({...autoData, reset: false});
      setArduinoData({...arduinoData, motorOn: false, valvePWM: 127});
    }

  }, [serialData])


  console.log(arduinoData);

console.log(arduinoData);

  const [historizedData, setHistorizedData] = useState([]);
  const [isHistorizing, setIsHistorizing] = useState(false);
    
  const [plotState, setPlotState] = useState({data: [], layout: {plotLayout}, frames: [], config: {plotConfig}});

  const [checkboxState, setCheckboxState] = useState(Object.entries(serialData).map((entry, index) => {
    // give each entry a unique color
    return {name: entry[0], checked: false, color: `rgb(${Math.floor(Math.random()*256)}, ${Math.floor(Math.random()*256)}, ${Math.floor(Math.random()*256)})`};
  }));

  const { height, width } = useWindowDimensions();
  // console.log(`Height: ${height}, Width: ${width}`);

  // Comment out for local testing
  socket.emit('arduinoData', JSON5.stringify(arduinoData));

  useEffect(() => {
    let UIDebounceInterval;
    let tempSerialData;

    // Connect to websocket if not already connected
    // Comment out for local testing
    if (!socket || socket.disconnected) {
      connectToSocket();
    }
    
    // Handles closing the websocket
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      // Comment out for local testing
      socket.disconnect();
      const confirmationMessage = 'Disconnect from websocket?';
      event.returnValue = confirmationMessage; // Standard for most browsers
      return confirmationMessage; // For some older browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    

    // Receive and parse data from serial port
    // Comment out for local testing
    socket.on('serialData', (data) => {
      try {
        tempSerialData = JSON5.parse(data);
        setSerialData(tempSerialData);
        lastTime = thisTime;
        thisTime = Number(tempSerialData.timestamp);
        deltaTime = thisTime - lastTime;

        

      } catch (error) {
        // something went wrong with parsing the data
      }
    });

    // update state with parsed data every 50ms
    UIDebounceInterval = setInterval(() => {
      // Comment out for live testing
      // setSerialData(tempSerialData);

      // tempSerialData = {
      //   timestamp: serialData.timestamp + 100,
      //   sensor: Math.round(Math.sin(1*serialData.timestamp/10000)*512 + 512),
      //   lcdButton: Math.round(Math.sin(2*serialData.timestamp/10000)*512 + 512),
      //   encoderPos: Math.round(Math.sin(3*serialData.timestamp/10000)*512 + 512),
      //   strainGauge: Math.round(Math.sin(4*serialData.timestamp/10000)*512 + 512),
      //   pressureTransmitter: Math.round(Math.sin(5*serialData.timestamp/10000)*512 + 512),
      //   deserializationError: false
      // }

      // setSerialData(tempSerialData);
      //   lastTime = thisTime;
      //   thisTime = Number(tempSerialData.timestamp);
      //   deltaTime = thisTime - lastTime;

    }, 100);

    // Cleanup
    return () => {
      // Comment out for local testing
      socket.disconnect();
      clearInterval(UIDebounceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // Comment out for live testing
  // }, [serialData]);
    // Comment out for local testing
  }, []);


  // Send data to arduino upon change
  useEffect(() => {
    // Comment out for local testing
    socket.emit('arduinoData', JSON5.stringify(arduinoData));
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

  const stopButtonStyle = {
    border: "2px solid red",
    backgroundColor: "transparent",
  }

  const startButtonStyle = {
    border: "2px solid green",
    backgroundColor: "transparent",
  }

  const emergencyButtonStyle = {
    border: "2px solid red",
    backgroundColor: "transparent",
  }

  const dialStyle = {
    height: "100%",
    width: "3px",
    backgroundColor: "black",
    margin: "auto",
    rotate: "45deg",
    transition: "rotate 0.25s",
  }

  // if stopbutton is 1, set background color to red. else keep it transparent
  if (serialData.stopButton) {
    stopButtonStyle.backgroundColor = "red";
  } else {
    stopButtonStyle.backgroundColor = "transparent";
  }

  // if startbutton is 1, set background color to green. else keep it transparent
  if (serialData.startButton) {
    startButtonStyle.backgroundColor = "green";
  } else {
    startButtonStyle.backgroundColor = "transparent";
  }

  // if dial is 1, rotate the dial 45 degrees. else rotate -45 degrees
  if (serialData.dial) {
    dialStyle.rotate = "45deg";
  }
  else {
    dialStyle.rotate = "-45deg";
  }

  if (serialData.emergencyButton) {
    emergencyButtonStyle.backgroundColor = "red";
  }
  else {
    emergencyButtonStyle.backgroundColor = "transparent";
  }

    return (
    <div className="App">
      <div style={
        {
          position: "absolute", 
          left: "10px", 
          top: "10px", 
          width: "450px", 
          // height: "30px", 
          width: "20vw",
          display: "flex", 
          flexDirection: "column",
          // justifyContent: "space-around", 
          // alignItems: "center"
          }}>
        {/* Comment out for local testing */}
        {socket.connected ? (<p style={{margin: "0"}}>Connected to socket</p>)  : (<p style={{margin: "0"}}>Not connected to socket</p>)}
        <button style={{width: "5vw"}} onClick={() => setMenuState('main')}>Main</button>
        <button style={{width: "5vw"}} onClick={() => setMenuState('plot')}>Plot</button>
        <button style={{width: "5vw"}} onClick={() => setMenuState('dev')}>Dev</button>
        <div>Current page is {menuState}</div>
      </div>
      <div style={{
        position: "absolute",
        right: "1vw",
        top: "1vh"
        }}>
          Bending speed 0 - 100 % <input style={{width: "5vw"}} type="number" max={100} min={0} value={bendingPower} onChange={
            (e) => {
              let percentage = e.target.valueAsNumber
              if (percentage > 100) {
                percentage = 100
              }
              setBendingPower(percentage)
            }
            }></input>
        </div>
      <h1>Tube Bender 2024</h1>
        {
          menuState === 'main' ? // MAIN MENU
          <div className='mainContainer'>

            {/* main buttons container */}
            <div
              style={{
                display: "flex",
                // border: "1px solid black",
                height: "20vh",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div style={{position: "relative"}}> {/* motor toggle */}
                {/* <p>Manual motor control</p> */}
                {/* <p>Toggle motor on/off</p> */}
                <div style={{
                    position: "absolute", height: "25vh", width: "1vw", backgroundColor: "red", opacity: "75%", left: "7vw", top: "-7vh", rotate: "45deg", borderRadius: "1em",
                    display: HMIcontrolMode === 'automatic' || emergencyStop ? "inline" : "none"
                  }}> </div>
                  <div style={{
                    position: "absolute", height: "25vh", width: "1vw", backgroundColor: "red", opacity: "75%", left: "7vw", top: "-7vh", rotate: "-45deg", borderRadius: "1em",
                    display: HMIcontrolMode === 'automatic' || emergencyStop ? "inline" : "none"
                  }}> </div>
                <button
                style = {{
                  backgroundColor: arduinoData.motorOn ? "red" : "green",
                  borderRadius: "15px",
                  fontSize: "2vw",
                  // marginLeft: "30vw",
                  // marginTop: "10vh",
                  padding: "1vw",
                }}
                disabled={HMIcontrolMode === 'automatic' || emergencyStop}
                onClick={() => setArduinoData({...arduinoData, motorOn: !arduinoData.motorOn})}
                className = 'controlButton'
                >{arduinoData.motorOn ? "Turn motor off" : "Turn motor on"}
                </button>
              </div>

              {/* spacer    */}
              <div style={{
                // backgroundColor: "grey",
                height: "1vh",
                width: "10vw",
                marginTop: "10vh",
              }} > 
              </div>

              <div> {/* Emergency stop */}
                {/* <p>Emergency stop button </p> */}
                <button
                style={{
                  // height: "90%",
                  // width: "90%",
                  backgroundColor: "red",
                  marginBottom: "10px",
                  borderRadius: "15px",
                  fontSize: "2vw",
                  // marginRight: "0vw",
                  marginTop: "2vh",
                  padding: "1vw"
                }}
                onClick={() => {
                  setEmergencyStop(true)
                  setArduinoData({...arduinoData, motorOn: false, valvePWM: 127})
                  setAutoData({...autoData, initAB: false});
                }}
                className='controlButton'
                >EMERGENCY STOP 
                <Warning
                style={{
                  position: "relative",
                  left: "0.3em",
                  top: "0.1em",
                }}
                />
                </button>

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
            </div>

            {/* row 2 container */}
            <div
              style={{
                width: "100%",
                height: "30vh",
                // backgroundColor: "grey",
                border: "1px solid black",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center"
              }}
            >
                <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}> {/* set control mode */}
                  <p>Set control mode (manual, automatic)</p>
                  <div style={{display: "flex", alignItems: "center"}}>
                    <div style={{display: "flex", flexDirection: "column"}}>
                      <button 
                      style={{fontSize: "1.5vw"}}
                      onClick={() => {
                        setHMIControlMode('manual')
                        setArduinoData({...arduinoData, motorOn: false, valvePWM: 127});
                        setAutoData({...autoData, initAB: false});
                      }}
                      disabled={emergencyStop}
                      >Manual control {/*👷‍♂️👷‍♀️*/} </button>
                      <button 
                      style={{fontSize: "1.5vw"}}
                      onClick={() => {
                        setArduinoData({...arduinoData, motorOn: false, valvePWM: 127});
                        setAutoData({...autoData, initAB: false});
                        setHMIControlMode('automatic');
                        }}
                        disabled={emergencyStop}
                        >Automatic control {/*🤖*/} </button>
                    </div>
                    <button
                    style={{
                      borderRadius: "100%",
                      width: "2em",
                      height: "2em",
                      border: "none",
                      marginLeft: "1em"
                    }}
                    onClick={() => alert(
                      "Manual control: turn motor on with on/off button, and manually set the valve position \n \nAutomatic control: Set desired bend and springback angle to initiate bending")}
                    >i</button>
                  </div>
                  <p style={{margin: "0"}}>Local/HMI control? {serialData.controlMode === 1 ? 'local' : 'HMI'}
                    <button
                    style={{
                      borderRadius: "100%",
                      width: "1.5em",
                      height: "1.5em",
                      border: "none",
                      marginLeft: "1em"
                    }}
                    onClick={() => alert(
                      "")}
                    >i</button>
                  </p>
                  <p style={{margin: "0"}}>Current HMI control mode is {HMIcontrolMode}
                    <button
                    style={{
                      borderRadius: "100%",
                      width: "1.5em",
                      height: "1.5em",
                      border: "none",
                      marginLeft: "1em"
                    }}
                    onClick={() => alert(
                      "")}
                    >i</button>
                  </p>
                </div>

                <div
                  style={{display: "flex", flexDirection: "column", position: "relative"}}
                > {/* valve pwm */}
                  <div style={{
                    position: "absolute", height: "25vh", width: "1vw", backgroundColor: "red", opacity: "75%", left: "3vw", top: "-2vh", rotate: "45deg", borderRadius: "1em",
                    display: arduinoData.motorOn || HMIcontrolMode === 'automatic' || emergencyStop ? "inline" : "none"
                  }}> </div>
                  <div style={{
                    position: "absolute", height: "25vh", width: "1vw", backgroundColor: "red", opacity: "75%", left: "3vw", top: "-2vh", rotate: "-45deg", borderRadius: "1em",
                    display: arduinoData.motorOn || HMIcontrolMode === 'automatic' || emergencyStop ? "inline" : "none"
                  }}> </div>
                  <p>Manual Valve {/* PWM */} Control</p>
                  <input type="number" 
                  // disabled={arduinoData.motorOn || HMIcontrolMode === 'automatic' || emergencyStop} 
                  disabled = {true}
                  defaultValue={127} 
                  onChange={(e) => setArduinoData({ ...arduinoData, valvePWM: e.target.value})} 
                  value={arduinoData.valvePWM}
                  style={{
                    width: "6vw",
                    height: "2vh"
                  }}
                  />
                  <button
                    onClick={() => setArduinoData({ ...arduinoData, valvePWM: 139 + bendingPower*51/100})}
                    disabled={arduinoData.motorOn || HMIcontrolMode === 'automatic' || emergencyStop}
                  >
                    Bend forward
                  </button>
                  <button
                    onClick={() => setArduinoData({ ...arduinoData, valvePWM: 106 - bendingPower*43/100})}
                    disabled={arduinoData.motorOn || HMIcontrolMode === 'automatic' || emergencyStop}
                  >
                    Bend back
                  </button>
                  <button
                    onClick={() => setArduinoData({ ...arduinoData, valvePWM: 127})}
                    disabled={arduinoData.motorOn || HMIcontrolMode === 'automatic' || emergencyStop}
                  >
                    Neutral valve position
                  </button>
                  {/* <button onClick={() => alert("din dumming")}>Hjelp, jeg skjønner ikke hva manual valve pwm control betyr</button> */}
                  {/* <p>Note: valve can only be adjusted when motor is off. 127 is neutral. &lt;127 is CCW/CW. &gt;127 is CCW/CW </p> */}
                  <div style={{
                    // position: "relative", 
                    // top: "30px", 
                    // top: "0vh",
                    // right: "150px",
                    // right: "9vw",
                    // fontSize: "1.5vh",
                    }}>
                    {/* <HoverInfo><p style={{width: "17.5vw", fontSize: "1.5vh"}} >Operator Note: valve can only be adjusted when motor is off. 127 is neutral. &lt;127 is CCW/CW. &gt;127 is CCW/CW </p></HoverInfo> */}
                  </div>
                </div>

                <div style={{position: "relative"}}> {/* automatic bending */}
                  <div style={{
                    position: "absolute", height: "25vh", width: "1vw", backgroundColor: "red", opacity: "75%", left: "7vw", top: "-4vh", rotate: "45deg", borderRadius: "1em",
                    display: HMIcontrolMode === 'manual' || emergencyStop ? "inline" : "none"
                  }}> </div>
                  <div style={{
                    position: "absolute", height: "25vh", width: "1vw", backgroundColor: "red", opacity: "75%", left: "7vw", top: "-4vh", rotate: "-45deg", borderRadius: "1em",
                    display: HMIcontrolMode === 'manual' || emergencyStop ? "inline" : "none"
                  }}> </div>
                  <p>Automatic bending. Enter desired bend angle and springback value </p>
                  <p style={{margin:"0"}}>Desired bend angle 
                    <input 
                      value={autoData.desiredBendAngle} 
                      onChange={(e) => setAutoData({...autoData, desiredBendAngle:e.target.valueAsNumber})} 
                      disabled={HMIcontrolMode === 'manual'} style={{width: "6vw", height: "2vh"}} type="number" /> </p>
                  <p style={{margin:"0"}}>Springback angle 
                    <input 
                      value={autoData.desiredSpringbackAngle} 
                      onChange={(e) => setAutoData({...autoData, desiredSpringbackAngle:e.target.valueAsNumber})} 
                      disabled={HMIcontrolMode === 'manual'} style={{width: "6vw", height: "2vh"}} type="number" /> </p>
                  <button 
                  disabled={HMIcontrolMode === 'manual'}
                  onClick={() => setAutoData({ ...autoData, initAB: true})}
                  >Start automatic bending</button>
                  <button 
                  disabled={HMIcontrolMode === 'manual'}
                  onClick={() => {
                    setAutoData({ ...autoData, initAB: false})
                    setArduinoData({...arduinoData, motorOn: false, valvePWM: 127})
                  }}
                  >Stop automatic bending</button>
                  state : {autoData.initAB? 'true':'false'}, {autoData.desiredBendAngle + autoData.desiredSpringbackAngle}
                  <p style={{margin: "0"}}>
                    <button
                    disabled={HMIcontrolMode === 'manual'}
                      onClick={() => setAutoData({...autoData, initAB: false, reset: true})}
                    >Back to 0</button>
                  </p>
                </div>

                {/* <p>test1</p> */}
                {/* <p>test2</p> */}
            </div>  
            
            {/* Row 3 container */}
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "39vh",
                justifyContent: "space-around",
                // border: "1px solid black",
                alignItems: "center",
              }}
            >

            <div style={{
              width: "33vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}> {/* bend angle gauge */}
              <p style={{position: "relative"}}>Current bend angle: <span style={{position: "absolute", right: "-3em"}}>{serialData.encoderPos}</span>
                
              </p>
              <button
                  onClick={() => {
                    setArduinoData({...arduinoData, angleReset: true});
                    setTimeout(() => {
                      setArduinoData({...arduinoData, angleReset: false});
                    }, 200)
                  }
                  }
                  style={{
                    position: "absolute",
                    right: "0vw",
                    top: "15vh",
                    fontSize: "1.5vw",
                    width: "8vw"
                  }}
                  // onMouseUp={() => setArduinoData({...arduinoData, angleReset: false})}
                >Reset Angle</button>
              <div
                style={{
                  fontSize: "5vh"
                }}
              >
                <Gauge 
                width={height/4} 
                height={height/4} 
                value={Math.round(serialData.encoderPos)} 
                valueMin={0}
                valueMax={360}
                startAngle={-90}
                endAngle={270}
                />
              </div>
            </div>

            <div style={{
              width: "33vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              }}> {/* Hydraulic pressure gauge */}
              <p>Hydraulic Pressure: {Math.round(serialData.pressureTransmitter*400/1023)} Bar </p>
              
              <div
                style={{
                  fontSize: "5vh"
                }}
              >
                <Gauge 
                width={height/4} 
                height={height/4} 
                value={Math.round(serialData.pressureTransmitter*400/1023)} 
                valueMin={0}
                valueMax={400}
                />
              </div>
            
            </div>

            {/* extra gauge */}
            {/* <div> 
              <p>extra gauge </p>
              <div>
                <Gauge 
                width={height/10} 
                height={height/10} 
                value={23} 
                valueMin={0}
                valueMax={40}
                />
              </div>
            </div> */}


            

            
            
            <div
              style={{
                width: "33vw",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            > {/* motor state */}
              <p>Motor state (idle, motor running, emergency stop)</p>
              <p>
              {
                  emergencyStop ? "Emergency stop" :
                  arduinoData.motorOn ? "Motor is running" : "Motor is idle"
              }
              </p>
            </div>
            
            
            
            {/* raw data display */} 
            {/* <div 
            style={{ 
              display: "flex",
              flexDirection: "column",
              // alignItems: "flex-start",
              flexWrap: "wrap",
            }} > <p
              style={{
                // margin: "0 0 0.5em 0"
              }}
            >Raw data</p>
              {
                Object.entries(serialData).map((entry, index) => {
                  return (
                    <p 
                    style={{
                      margin: "0",
                      fontSize: "1.75vh",
                    }}
                    key={index}>{entry[0]}: {String(entry[1])}</p>
                  );
                })
              }
            </div> */}


            

            {/* picture */}
            {/* <div 
              style={{
                // go from line 3 to 5 on both row and column
                // gridRow: '3 / 5',
                // gridColumn: '3 / 5',
                // backgroundColor: 'lightblue',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                // height: '84%',
              }}
            > 
            <div
              className='buttonIndicator'
              style={stopButtonStyle}
            > </div>
            <div
              className='buttonIndicator'
              style={startButtonStyle}
            > </div>

            <div
              style={{
                height: "5vh",
                width: "5vh",
                border: "2px solid black",
                borderRadius: "50%",
              }}
            >
              <div
                style={dialStyle}
              > </div>
            </div>

            <div
              className='buttonIndicator'
              style={emergencyButtonStyle}
            > 
            </div>

            Picture 
            
          </div> */}
            {/* <div> other data </div> */}

            {/* bending list */}
            {/* <div 
              style={{
              // gridRow: '1/3',
              // gridColumn: '4/5',
              display: 'flex',
              justifyContent: 'center',
              // height: "84%"
              }}
            > bending list 
            </div> */}
            {/* <div> bending list </div> */}
            {/* <div> bending list </div> */}
            {/* <div> bending list </div> */}
            </div>

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
