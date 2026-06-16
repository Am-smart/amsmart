"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TimerContextType {
  currentTime: number; // Unix timestamp
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        // Sync time immediately when coming back and restart
        setCurrentTime(Date.now());
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <TimerContext.Provider value={{ currentTime }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
