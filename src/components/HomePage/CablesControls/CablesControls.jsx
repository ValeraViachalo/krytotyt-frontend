"use client";

import { useState, useCallback } from "react";
import "./CablesControls.scss";

const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 0.4;

export default function CablesControls() {
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  const applyZoom = useCallback((value) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    setZoom(clamped);
    window.CABLES?.patch?.setVariable("ZoomLevelInput", clamped);
  }, []);

  const isAtMax = zoom >= MAX_ZOOM;
  const isAtMin = zoom <= MIN_ZOOM;
  const isAtDefault = zoom === INITIAL_ZOOM;

  return (
    <div className="cables-controls">
      <button
        className={`cables-controls__button${isAtMax ? " cables-controls__button--inactive" : ""}`}
        onClick={() => applyZoom(zoom + ZOOM_STEP)}
        disabled={isAtMax}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cables-controls__button-icon"
        >
          <path
            d="M0.25 6.25008C0.25 5.97393 0.473858 5.75007 0.75 5.75008L11.75 5.75008C12.0261 5.75008 12.25 5.97393 12.25 6.25008C12.25 6.52622 12.0261 6.75008 11.75 6.75008L0.750001 6.75007C0.473859 6.75007 0.25 6.52622 0.25 6.25008Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M6.24992 0.25C6.52607 0.25 6.74993 0.473858 6.74992 0.75L6.74992 11.75C6.74992 12.0261 6.52607 12.25 6.24992 12.25C5.97378 12.25 5.74992 12.0261 5.74992 11.75L5.74993 0.750001C5.74993 0.473859 5.97378 0.25 6.24992 0.25Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </button>
      <button
        className={`cables-controls__button${isAtMin ? " cables-controls__button--inactive" : ""}`}
        onClick={() => applyZoom(zoom - ZOOM_STEP)}
        disabled={isAtMin}
      >
        <svg
          width="13"
          height="2"
          viewBox="0 0 13 2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cables-controls__button-icon"
        >
          <path
            d="M0.25 0.750076C0.25 0.473933 0.473858 0.250075 0.75 0.250075L11.75 0.250075C12.0261 0.250076 12.25 0.473933 12.25 0.750075C12.25 1.02622 12.0261 1.25008 11.75 1.25008L0.750001 1.25007C0.473859 1.25007 0.25 1.02622 0.25 0.750076Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </button>
      <button
        className={`cables-controls__button cables-controls__button-reset${isAtDefault ? " cables-controls__button-reset--inactive" : ""}`}
        onClick={() => applyZoom(INITIAL_ZOOM)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cables-controls__button-icon"
        >
          <path
            d="M18 0V1.5H14.999L15.6006 1.9502C16.8117 2.85771 17.7948 4.03505 18.4717 5.38867C19.1064 6.65812 19.4556 8.05036 19.4961 9.4668L19.5 9.75C19.5 15.1349 15.1349 19.5 9.75 19.5C4.36507 19.5 0 15.1349 0 9.75C0 4.44868 4.23065 0.138505 9.5 0.00585938V1.50586C7.61408 1.56322 5.80183 2.2637 4.36816 3.49805C2.87123 4.78689 1.88646 6.57007 1.59277 8.52344C1.29909 10.4768 1.71587 12.4706 2.76758 14.1426C3.81934 15.8146 5.43629 17.0537 7.32422 17.6348C9.21207 18.2158 11.2458 18.1008 13.0557 17.3096C14.8656 16.5183 16.332 15.1037 17.1875 13.3232C18.043 11.5428 18.2309 9.51395 17.7178 7.60645C17.2046 5.69913 16.0238 4.03956 14.3906 2.92871L14 2.66309V5.5H12.5V0H18Z"
            fill="white"
          />
        </svg>
      </button>
    </div>
  );
}
