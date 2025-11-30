import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Smith Chart Mode System
 * 
 * Four typical engineering application scenarios:
 * - antenna: Antenna matching (50Ω ↔ 75Ω impedance transformation)
 * - power: Power amplifier (maximum power transfer)
 * - filter: Filter design (LC networks, stub matching)
 * - line: Transmission line (impedance transformation along the line)
 */
export type SmithMode = 'antenna' | 'power' | 'filter' | 'line';

/**
 * Preset configuration for each mode
 */
export interface SmithModePreset {
  r: number;           // Normalized resistance
  x: number;           // Normalized reactance
  showAdmittance?: boolean;
  lineLength?: number; // In wavelengths (0-0.5)
  label: string;
  description: string;
}

/**
 * Scientific presets for each engineering scenario
 */
export const SMITH_MODE_PRESETS: Record<SmithMode, SmithModePreset> = {
  antenna: {
    r: 1.5,
    x: 0.8,
    showAdmittance: false,
    lineLength: 0,
    label: 'Antenna Match',
    description: '50Ω source to 75Ω load - typical antenna impedance transformation',
  },
  power: {
    r: 0.5,
    x: -0.5,
    showAdmittance: false,
    lineLength: 0,
    label: 'Power Amplifier',
    description: 'Conjugate matching for maximum power transfer (Rs = RL*)',
  },
  filter: {
    r: 1,
    x: 2,
    showAdmittance: true,
    lineLength: 0,
    label: 'Filter Design',
    description: 'LC network design - path through upper/lower half-planes',
  },
  line: {
    r: 2,
    x: 1,
    showAdmittance: false,
    lineLength: 0.125,
    label: 'Transmission Line',
    description: 'Impedance transformation along λ/8 line section',
  },
};

/**
 * Context value interface
 */
export interface SmithModeContextValue {
  mode: SmithMode | null;
  setMode: (mode: SmithMode | null) => void;
  preset: SmithModePreset | null;
}

/**
 * Context for sharing mode state between Swiss Army Knife section and Smith Chart
 */
export const SmithModeContext = createContext<SmithModeContextValue | null>(null);

/**
 * Hook to access Smith Mode context
 * @throws Error if used outside of SmithModeProvider
 */
export function useSmithMode(): SmithModeContextValue {
  const context = useContext(SmithModeContext);
  
  if (!context) {
    throw new Error(
      'useSmithMode must be used within a SmithModeProvider. ' +
      'Wrap your component tree with <SmithModeProvider>.'
    );
  }
  
  return context;
}

/**
 * Optional hook that returns null instead of throwing if outside provider
 * Useful for components that may or may not be inside a provider
 */
export function useSmithModeOptional(): SmithModeContextValue | null {
  return useContext(SmithModeContext);
}

/**
 * Provider component props
 */
interface SmithModeProviderProps {
  children: ReactNode;
  defaultMode?: SmithMode | null;
}

/**
 * Provider component for Smith Mode context
 */
export const SmithModeProvider: React.FC<SmithModeProviderProps> = ({ 
  children, 
  defaultMode = null 
}) => {
  const [mode, setModeState] = useState<SmithMode | null>(defaultMode);

  const setMode = useCallback((newMode: SmithMode | null) => {
    setModeState(newMode);
  }, []);

  const preset = mode ? SMITH_MODE_PRESETS[mode] : null;

  const value: SmithModeContextValue = {
    mode,
    setMode,
    preset,
  };

  return React.createElement(
    SmithModeContext.Provider,
    { value },
    children
  );
};

export default {
  SmithModeContext,
  SmithModeProvider,
  useSmithMode,
  useSmithModeOptional,
  SMITH_MODE_PRESETS,
};

