import React, { useState } from 'react';
import Plot from 'react-plotly.js';

function Dataplot(props) {
    const { historizedData } = props;
    const [plotState, setPlotState] = useState({data: [], layout: {}, frames: [], config: {}});

    const plotLayout = {title: 'A Fancy Plot'}
    const plotData = [
      {
        x: historizedData.map((data, index) => {
          return Number(data.timestamp / 1000);
        }),
        y: historizedData.map((data, index) => {
          return Number(data.sensor);
        }),
        type: 'scatter',
        mode: 'markers',
        marker: {color: 'red'},
      }
    ]

    return (
        <div>
            <Plot
                data={plotState.data.length > 0 ? plotState.data : plotData}
                layout={plotState.layout.title ? plotState.layout : plotLayout}
                // scrollZoom={true}
                // editable={true}
                onInitialized={(figure) => setPlotState(figure)}
                onUpdate={(figure) => setPlotState(figure)}
            />
        </div>
    )
}

export default Dataplot;