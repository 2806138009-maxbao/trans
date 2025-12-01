import React, { createContext, useContext, useState } from 'react';

export type ExperimentPreset = any;

export type SmithMode = 'experiment' | 'game' | 'design' | 'antenna' | 'power' | 'filter' | 'line';

export const SMITH_MODE_PRESETS: Record<SmithMode, { label: string }> = {
  experiment: { label: 'Experiment Mode' },
  game: { label: 'Challenge Mode' },
  design: { label: 'Design Mode' },
  antenna: { label: 'Antenna Matching' },
  power: { label: 'Power Amplifier' },
  filter: { label: 'Filter Design' },
  line: { label: 'Transmission Line' }
};

interface SmithModeContextType {
  mode: SmithMode;
  setMode: (mode: SmithMode) => void;
  preset: ExperimentPreset | null;
  setPreset: (preset: ExperimentPreset | null) => void;
}

const SmithModeContext = createContext<SmithModeContextType | undefined>(undefined);

export const SmithModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<SmithMode>('experiment');
  const [preset, setPreset] = useState<ExperimentPreset | null>(null);

  return (
    <SmithModeContext.Provider value={{ mode, setMode, preset, setPreset }}>
      {children}
    </SmithModeContext.Provider>
  );
};

export const useSmithMode = () => {
  const context = useContext(SmithModeContext);
  if (!context) {
    throw new Error('useSmithMode must be used within a SmithModeProvider');
  }
  return context;
};

export const useSmithModeOptional = () => {
  return useContext(SmithModeContext);
};
