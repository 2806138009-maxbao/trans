import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import React from 'react';

/**
 * HUD Event Types
 * Each event corresponds to a specific user action in the Smith Chart experiment
 */
export type HudEvent =
  | 'pointerHover'      // 悬停光标在 Smith 图上
  | 'sliderDrag'        // 拖动 Smith 实验相关的滑块
  | 'modeToggle'        // 在 Z / Y 视角之间切换
  | 'nearPerfectMatch'; // 当前 |Γ| 足够小，接近完美匹配

export interface ExperimentHUDAPI {
  lastEvent: HudEvent | null;
  eventTimestamp: number;
  triggerHudEvent: (event: HudEvent) => void;
  hasRecentActivity: boolean; // True if any event in last 2 seconds
}

interface HUDState {
  lastEvent: HudEvent | null;
  eventTimestamp: number;
}

const ExperimentHUDContext = createContext<ExperimentHUDAPI | null>(null);

/**
 * Provider component for the HUD event system
 */
export const ExperimentHUDProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<HUDState>({
    lastEvent: null,
    eventTimestamp: 0,
  });
  
  // Throttle timers for each event type
  const throttleTimers = useRef<Record<HudEvent, number>>({
    pointerHover: 0,
    sliderDrag: 0,
    modeToggle: 0,
    nearPerfectMatch: 0,
  });
  
  // Cooldown periods (ms) for each event type
  const cooldowns: Record<HudEvent, number> = {
    pointerHover: 300,      // Hover events throttled to 300ms
    sliderDrag: 100,        // Slider drag can be more frequent
    modeToggle: 200,        // Toggle has short cooldown
    nearPerfectMatch: 2000, // Perfect match has 2s cooldown to avoid spam
  };

  const triggerHudEvent = useCallback((event: HudEvent) => {
    const now = Date.now();
    const lastTrigger = throttleTimers.current[event];
    const cooldown = cooldowns[event];
    
    // Check if we're still in cooldown
    if (now - lastTrigger < cooldown) {
      return;
    }
    
    // Update throttle timer
    throttleTimers.current[event] = now;
    
    // Update state
    setState({
      lastEvent: event,
      eventTimestamp: now,
    });
  }, []);

  // Check if there's been recent activity (within 2 seconds)
  const hasRecentActivity = Date.now() - state.eventTimestamp < 2000;

  const api: ExperimentHUDAPI = {
    lastEvent: state.lastEvent,
    eventTimestamp: state.eventTimestamp,
    triggerHudEvent,
    hasRecentActivity,
  };

  return React.createElement(
    ExperimentHUDContext.Provider,
    { value: api },
    children
  );
};

/**
 * Hook to access the HUD event system
 * Must be used within an ExperimentHUDProvider
 */
export function useExperimentHUD(): ExperimentHUDAPI {
  const context = useContext(ExperimentHUDContext);
  
  if (!context) {
    // Return a no-op API if used outside provider (graceful degradation)
    return {
      lastEvent: null,
      eventTimestamp: 0,
      triggerHudEvent: () => {},
      hasRecentActivity: false,
    };
  }
  
  return context;
}

export default useExperimentHUD;

