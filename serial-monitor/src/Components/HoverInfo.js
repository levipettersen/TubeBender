import React, { useState } from "react";


function HoverInfo(props) {
    const [hover, setHover] = useState(false);
    const onHover = () => setHover(true);
    const onLeave = () => setHover(false);
    return (
        <div style={{
            position: "relative", 
            backgroundColor: "LightGrey", 
            width: "20px", 
            height: "20px", 
            display: "flex", 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "center",
            border: "3px solid grey",
            borderRadius: "20px",
            }} onMouseEnter={onHover} onMouseLeave={onLeave}>
            <p style={{color: "#2F4F4F"}}>?</p> {hover && <div style={{position: "absolute", left: "30px", color: "#2F4F4F", width: "300px"}}>{props.children}</div>}
        </div>
    );
}

export default HoverInfo;
