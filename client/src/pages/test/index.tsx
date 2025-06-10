/* eslint-disable */
/* @ts-nocheck */
/* @cursor-disable-autocomplete */
/* @cursor-disable-inline-suggestions */
/* @cursor-disable-suggestions */

import { useEffect, useRef, useState } from "react";
const Test = () => {
  const [timer, setTimer] = useState(5);
  const [finished, setFinished] = useState(false);
  const interval = useRef(null);

const clearIntervalItem = () => {
    clearInterval(interval.current);
}
const tick = () => {
    if(interval.current) {
        setTimer((prev) => {
            if (prev - 1 <= 0) {
                clearIntervalItem();
                setFinished(true);
                return 0;
            }
            return prev -1;
        })
    }
}
useEffect(() => {
    interval.current = setInterval(tick, 1000);

    return () => {
        if (interval.current) {
            clearIntervalItem();
        }
    }
}, []);
  const onClick = () => {
    if(!finished && interval.current) {
        setTimer(5);
    }
  }
    return (
        <>
        <h1>{timer}</h1>
        <button onClick={onClick}>Click me</button>
        </>
    )
}

export default Test;