import React, { createContext, useContext, useCallback, useState, useRef } from 'react';

export type HudEvent = 'sliderDrag' | 'pointerHover' | 'modeToggle' | 'nearPerfectMatch';

interface ExperimentHUDContextType {
  triggerHudEvent: (type: HudEvent) => void;
  lastEvent: HudEvent | null;
  eventTimestamp: number;
  hasRecentActivity: boolean;
}

const ExperimentHUDContext = createContext<ExperimentHUDContextType | undefined>(undefined);

export const ExperimentHUDProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastEvent, setLastEvent] = useState<HudEvent | null>(null);
  const [eventTimestamp, setEventTimestamp] = useState(0);
  const [hasRecentActivity, setHasRecentActivity] = useState(false);
  const timeoutRef = useRef<number>(0);

  const triggerHudEvent = useCallback((type: HudEvent) => {
    setLastEvent(type);
    setEventTimestamp(Date.now());
    setHasRecentActivity(true);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset activity after 2 seconds
    timeoutRef.current = window.setTimeout(() => {
      setHasRecentActivity(false);
    }, 2000);
  }, []);

  return (
    <ExperimentHUDContext.Provider value={{ 
      triggerHudEvent, 
      lastEvent, 
      eventTimestamp,
      hasRecentActivity 
    }}>
      {children}
    </ExperimentHUDContext.Provider>
  );
};

export const useExperimentHUD = () => {
  const context = useContext(ExperimentHUDContext);
  if (!context) {
    // Fallback for components used outside provider
    return { 
      triggerHudEvent: () => {}, 
      lastEvent: null as HudEvent | null, 
      eventTimestamp: 0,
      hasRecentActivity: false 
    };
  }
  return context;
};
