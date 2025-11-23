
import React from 'react';
import { Language, TRANSLATIONS, COLORS, WaveType } from '../types';
import { TiltCard } from './TiltCard';

interface ControlPanelProps {
  n: number;
  setN: (val: number) => void;
  waveType: WaveType;
  setWaveType: (t: WaveType) => void;
  lang: Language;
  onHoverLabel: (isHovering: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ n, setN, waveType, setWaveType, lang, onHoverLabel }) => {
  const t = TRANSLATIONS[lang];
  
  // Calculate progress percentage for the gradient track
  // Min 1, Max 50
  const progress = ((n - 1) / (50 - 1)) * 100;

  const btnClass = (isActive: boolean) => 
    `p-2 rounded-md transition-all duration-300 flex items-center justify-center border ${
      isActive 
        ? 'bg-[#5E6AD2]/20 border-[#5E6AD2] text-white shadow-[0_0_10px_rgba(94,106,210,0.4)]' 
        : 'bg-white/5 border-transparent text-[#8A8F98] hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div 
      id="control-panel-container"
      className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[360px] p-0 z-20"
    >
      <TiltCard className="p-0 overflow-hidden" glowColor="rgba(255, 255, 255, 0.3)">
        <div className="p-5 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <label 
                className="text-[#D0D6E0] text-xs font-medium uppercase tracking-wider cursor-help transition-all duration-300 ease-out origin-left inline-block hover:scale-110 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                onMouseEnter={() => onHoverLabel(true)}
                onMouseLeave={() => onHoverLabel(false)}
              >
                {t.harmonics}
              </label>
              <span 
                className="text-sm font-mono text-[#8A8F98] bg-white/5 px-2 py-0.5 rounded border border-white/5 transition-colors hover:text-white hover:border-white/20"
              >
                N = {n}
              </span>
            </div>
            
            <div className="relative w-full flex items-center py-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={n}
                  onChange={(e) => setN(parseInt(e.target.value))}
                  className="w-full z-10 cursor-pointer h-[2px] appearance-none"
                  style={{ 
                    // Dynamic gradient: Filled part is Purple (#5E6AD2), Empty part is faint white
                    background: `linear-gradient(to right, #5E6AD2 0%, #5E6AD2 ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%, rgba(255, 255, 255, 0.1) 100%)` 
                  }}
                />
            </div>
            
            {/* Waveform Selectors */}
            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                <button 
                    className={btnClass(waveType === 'square')}
                    onClick={() => setWaveType('square')}
                    title={t.waveSquare}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12h4v-8h8v16h8" />
                    </svg>
                </button>
                <button 
                    className={btnClass(waveType === 'sawtooth')}
                    onClick={() => setWaveType('sawtooth')}
                    title={t.waveSawtooth}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 20 20 4 20 20" />
                    </svg>
                </button>
                <button 
                    className={btnClass(waveType === 'triangle')}
                    onClick={() => setWaveType('triangle')}
                    title={t.waveTriangle}
                >
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20 L12 4 L20 20" />
                    </svg>
                </button>
            </div>
            
            <div className="pt-2">
                <p className="text-center text-[10px] text-[#8A8F98] font-medium tracking-wide">
                  {t.dragInstruction}
                </p>
            </div>
        </div>
      </TiltCard>
    </div>
  );
};