"use client";
import React, { createContext, useContext, useState } from "react";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [isMuted, setIsMuted] = useState(true);
  return (
    <AudioContext.Provider value={{ isMuted, setIsMuted }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
