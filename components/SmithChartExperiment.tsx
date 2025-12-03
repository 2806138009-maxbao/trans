import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { SmithChartCanvas } from './SmithChartCanvas';

import { THEME } from '../theme';
import { GridIcon, CrosshairIcon, CableIcon } from './Icons';

import { MatchingNetworkCalculator } from './MatchingNetworkCalculator';
import { TRANSLATIONS } from '../types';

import { useExperimentHUD } from '../hooks/useExperimentHUD';
import { useSmithModeOptional, SMITH_MODE_PRESETS } from '../state/smithModes';
import { EquivalentCircuit } from './EquivalentCircuit';
import { 
  ScrubbableInput, 
} from './ControlPanel';
// MatchIndicator removed - cleaner UI without victory visuals
import { ToastManager } from './Toast';
import { useKeyboardShortcuts, ShortcutAction } from '../hooks/useKeyboardShortcuts';
// Audio removed for cleaner experience
import { StudioExport } from './StudioExport';


export interface ExperimentPreset {
  r: number;
  x: number;
  showAdmittance?: boolean;
  lineLength?: number;
  label?: string;
}

interface SmithChartExperimentProps {
  reducedMotion?: boolean;
  lang: 'zh' | 'en';
  /** @deprecated Use SmithModeProvider context instead */
  externalPreset?: ExperimentPreset | null;
}

// Preset impedance values - Unified colors: Gold + White/Gray
// Use geometric symbols instead of emojis
const PRESETS = [
  { id: 'match', r: 1, x: 0, label: { en: 'Match', zh: '\u5339\u914d' }, symbol: 'M' },
  { id: 'short', r: 0, x: 0, label: { en: 'Short', zh: '\u77ed\u8def' }, symbol: 'S' },
  { id: 'open', r: 5, x: 0, label: { en: 'Open', zh: '\u5f00\u8def' }, symbol: 'O' },
  { id: 'inductive', r: 1, x: 1, label: { en: '+jX', zh: '\u611f\u6027' }, symbol: 'L' },
  { id: 'capacitive', r: 1, x: -1, label: { en: '-jX', zh: '\u5bb9\u6027' }, symbol: 'C' },
];




export const SmithChartExperiment: React.FC<SmithChartExperimentProps> = ({ 
  reducedMotion, 
  lang,
  externalPreset,
}) => {
  const [rValue, setRValue] = useState(1.0);
  const [xValue, setXValue] = useState(0.0);
  const [showAdmittance, setShowAdmittance] = useState(false);
  const [showVSWRCircles, setShowVSWRCircles] = useState(false);
  const [controlMode, setControlMode] = useState<'slider' | 'mouse'>('slider');
  
  // Track chart hover state (for potential future use)
  const [isHoveringChart, setIsHoveringChart] = useState(false);

  // 传输线长度 (以波长为单位)
  const [lineLength, setLineLength] = useState(0);
  
  // Ref for Studio Export (captures the chart container)
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Boot Sequence: Staggered sidebar animation state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Animation state for smooth transitions - use refs to avoid re-triggering effect
  const animationRef = useRef<number>(0);
  const currentValuesRef = useRef({ r: 1, x: 0, lineLength: 0 });
  
  // Boot Sequence: Trigger sidebar entrance after mount
  useEffect(() => {
    const timer = setTimeout(() => setSidebarVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Keep refs in sync with state (without triggering re-renders)
  currentValuesRef.current = { r: rValue, x: xValue, lineLength };
  
  // Get mode from context if available
  const smithModeContext = useSmithModeOptional();
  
  // Apply external preset when it changes (with smooth animation)
  // Dependencies are ONLY the mode/preset sources, NOT the animated values
  useEffect(() => {
    const preset = externalPreset || (smithModeContext?.preset ? {
      r: smithModeContext.preset.r,
      x: smithModeContext.preset.x,
      showAdmittance: smithModeContext.preset.showAdmittance,
      lineLength: smithModeContext.preset.lineLength,
    } : null);
    
    if (!preset) return;
    
    // Set non-animated values immediately
    if (preset.showAdmittance !== undefined) {
      setShowAdmittance(preset.showAdmittance);
    }
    
    // Cancel any existing animation
    cancelAnimationFrame(animationRef.current);
    
    // For reducedMotion, set values immediately without animation
    if (reducedMotion) {
      setRValue(preset.r);
      setXValue(preset.x);
      if (preset.lineLength !== undefined) {
        setLineLength(preset.lineLength);
      }
      return;
    }
    
    // Capture current values at animation start (from ref, not state)
    const startR = currentValuesRef.current.r;
    const startX = currentValuesRef.current.x;
    const startLine = currentValuesRef.current.lineLength;
    const targetR = preset.r;
    const targetX = preset.x;
    const targetLine = preset.lineLength ?? startLine;
    
    // Skip animation if already at target
    if (Math.abs(startR - targetR) < 0.001 && 
        Math.abs(startX - targetX) < 0.001 &&
        Math.abs(startLine - targetLine) < 0.001) {
      return;
    }
    
    const duration = 250; // ms
    const startTime = performance.now();
    
    // Expo out easing
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      
      const newR = startR + (targetR - startR) * eased;
      const newX = startX + (targetX - startX) * eased;
      const newLine = startLine + (targetLine - startLine) * eased;
      
      setRValue(newR);
      setXValue(newX);
      if (preset.lineLength !== undefined) {
        setLineLength(newLine);
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [externalPreset, smithModeContext?.mode, reducedMotion]);
  
  // HUD 事件系统
  const { triggerHudEvent } = useExperimentHUD();
  
  // Track previous match state to detect transitions
  const prevMatchedRef = useRef(false);
  
  const t = TRANSLATIONS[lang];
  
  // Detect perfect match state transition (|Γ| < 0.1)
  useEffect(() => {
    const isNearMatch = Math.sqrt(
      Math.pow((rValue - 1), 2) + Math.pow(xValue, 2)
    ) < 0.15; // Near z = 1 + j0
    
    if (isNearMatch && !prevMatchedRef.current) {
      triggerHudEvent('nearPerfectMatch');
    }
    prevMatchedRef.current = isNearMatch;
  }, [rValue, xValue, triggerHudEvent]);



  const handlePreset = (preset: typeof PRESETS[0]) => {
    setRValue(preset.r);
    setXValue(preset.x);
  };

  const handleReset = () => {
    setRValue(1.0);
    setXValue(0.0);
  };

  // Keyboard shortcuts handler
  const handleShortcutAction = useCallback((action: ShortcutAction) => {
    switch (action) {
      case 'reset':
        handleReset();
        break;
      case 'toggleAdmittance':
        setShowAdmittance(prev => !prev);
        triggerHudEvent('modeToggle');
        break;
      case 'toggleVSWR':
        setShowVSWRCircles(prev => !prev);
        break;
      case 'toggleMode':
        setControlMode(prev => prev === 'slider' ? 'mouse' : 'slider');
        break;
      // Add more actions as needed
      default:
        break;
    }
  }, [triggerHudEvent]);

  const { toasts, dismissToast } = useKeyboardShortcuts({
    onAction: handleShortcutAction,
    enabled: true,
  });

  // [L3 Parallax Logic]
  const chassisRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [sheenPos, setSheenPos] = useState(0);

  const handleChassisMouseMove = (e: React.MouseEvent) => {
    if (!chassisRef.current || reducedMotion) return;
    const rect = chassisRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate normalized coordinates (-1 to 1)
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    // Micro-tilt (Max 1.5 deg)
    setRotate({ x: normY * -1.5, y: normX * 1.5 });
    
    // Sheen position
    setSheenPos(normX * 100); 
  };

  const handleChassisMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };


  return (
    <>
      {/* Toast Notifications */}
      <ToastManager toasts={toasts} onDismiss={dismissToast} />
      
      {/* VNA CHASSIS CONTAINER - With Perspective */}
      <div className="relative w-full max-w-4xl mx-auto mt-8 mb-12 perspective-[2000px]">
        
        {/* THE CHASSIS - Floating Monolith */}
        <div 
          ref={chassisRef}
          onMouseMove={handleChassisMouseMove}
          onMouseLeave={handleChassisMouseLeave}
          className="rounded-3xl bg-[#111] border border-white/10 shadow-2xl overflow-hidden relative transition-transform duration-100 ease-out"
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* Dynamic Sheen Layer */}
          <div 
            className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay rounded-3xl"
            style={{
              background: 'linear-gradient(115deg, transparent, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)',
              backgroundSize: '200% 100%',
              backgroundPosition: `${50 + sheenPos / 5}% center`,
              opacity: 0.6,
              transition: 'background-position 0.1s ease-out'
            }}
          />
          
          {/* Chassis Texture */}
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
          
          {/* =====================================================================================
              1. SCREEN BAY (The Smith Chart)
             ===================================================================================== */}
          <div className="relative p-6 pb-0">
             {/* Bezel */}
             <div className="rounded-2xl border-4 border-[#1A1A1A] bg-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] overflow-hidden relative h-[500px] md:h-[600px]">
                
                {/* Screen Glare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-10" />
                
                {/* Model Number */}
                <div className="absolute top-4 right-4 z-0 font-mono text-[10px] text-white/20 tracking-widest pointer-events-none">
                   VNA-3000 // FIELD UNIT
                </div>

                {/* THE CANVAS */}
                <div 
                  ref={chartContainerRef}
                  className="relative w-full h-full flex items-center justify-center"
                  onMouseEnter={() => setIsHoveringChart(true)}
                  onMouseLeave={() => setIsHoveringChart(false)}
                >
                  <SmithChartCanvas 
                    reducedMotion={reducedMotion} 
                    overrideImpedance={controlMode === 'slider' ? { r: rValue, x: xValue } : null}
                    showAdmittance={showAdmittance}
                    showVSWRCircles={showVSWRCircles}
                    lang={lang}
                    allowDirectDrag={controlMode === 'mouse'}
                    onDirectDrag={(z) => {
                      setRValue(z.r);
                      setXValue(z.x);
                    }}
                    onHoverChange={(hovering) => {
                      if (hovering) triggerHudEvent('pointerHover');
                    }}
                    onDragChange={(dragging) => {
                      if (dragging) triggerHudEvent('sliderDrag');
                    }}
                  />
                  
                  {/* Floating Mini HUD (Inside Screen) */}
                  {controlMode === 'mouse' && (
                    <div 
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-xl flex items-center gap-4 animate-fade-in-up pointer-events-none z-20"
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        border: `1px solid ${THEME.colors.primaryDim}`,
                        boxShadow: THEME.shadows.glow,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.colors.primary }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: THEME.colors.primary }}>
                          DIRECT CONTROL
                        </span>
                      </div>
                      <div className="w-px h-3 bg-white/20" />
                      <div className="font-mono text-xs text-white/90">
                        <span className="opacity-50 mr-1">z:</span>
                        {rValue.toFixed(2)} {xValue >= 0 ? '+' : '-'} j{Math.abs(xValue).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* =====================================================================================
              2. CONTROL DECK (The Physical Interface)
             ===================================================================================== */}
          <div className="relative p-8 bg-gradient-to-b from-[#161616] to-[#111] border-t border-white/5">
             
             {/* Deck Header & Toggles */}
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                
                {/* Left: Signal Source / Presets */}
                <div className="flex flex-col gap-3">
                   <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500/50 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                      Signal Source
                   </h3>
                   <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset) => {
                        const isActive = rValue === preset.r && xValue === preset.x;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handlePreset(preset)}
                            className={`
                              relative px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200
                              ${isActive 
                                ? 'bg-[#222] text-[#FFD700] border border-[#FFD700]/30 shadow-[0_0_10px_rgba(255,215,0,0.1)]' 
                                : 'bg-[#1A1A1A] text-white/40 border border-white/5 hover:bg-[#222] hover:text-white/70'}
                            `}
                          >
                            {preset.symbol}
                          </button>
                        );
                      })}
                   </div>
                </div>

                {/* Right: View Modes & Tools */}
                <div className="flex flex-col gap-3 items-end">
                   <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      Display Mode
                   </h3>
                   <div className="flex items-center gap-2">
                      {/* VSWR Toggle */}
                      <button
                        onClick={() => setShowVSWRCircles(!showVSWRCircles)}
                        className={`
                          px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all
                          ${showVSWRCircles ? 'bg-[#222] text-[#FFD700] border border-[#FFD700]/30' : 'bg-[#1A1A1A] text-white/40 border border-white/5'}
                        `}
                      >
                        VSWR
                      </button>
                      
                      {/* Admittance Toggle */}
                      <button
                        onClick={() => {
                          setShowAdmittance(!showAdmittance);
                          triggerHudEvent('modeToggle');
                        }}
                        className={`
                          px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all
                          ${showAdmittance ? 'bg-[#1A2230] text-[#479CFF] border border-[#479CFF]/30' : 'bg-[#1A1A1A] text-white/40 border border-white/5'}
                        `}
                      >
                        Y-CHART
                      </button>

                      <div className="w-px h-4 bg-white/10 mx-1" />

                      {/* Input Mode Toggle */}
                      <div className="flex bg-[#0A0A0A] rounded-lg p-1 border border-white/5">
                        <button
                          onClick={() => setControlMode('slider')}
                          className={`p-1.5 rounded transition-all ${controlMode === 'slider' ? 'bg-[#222] text-white shadow-sm' : 'text-white/20 hover:text-white/50'}`}
                        >
                          <GridIcon size={12} />
                        </button>
                        <button
                          onClick={() => setControlMode('mouse')}
                          className={`p-1.5 rounded transition-all ${controlMode === 'mouse' ? 'bg-[#222] text-[#FFD700] shadow-sm' : 'text-white/20 hover:text-white/50'}`}
                        >
                          <CrosshairIcon size={12} />
                        </button>
                      </div>
                      
                      {/* Export */}
                      <StudioExport targetRef={chartContainerRef} filename="vna-capture" size="sm" />
                   </div>
                </div>
             </div>
             
             {/* Equivalent Circuit Display */}
             <div className="mb-8">
                <EquivalentCircuit r={rValue} x={xValue} />
             </div>
             
             {/* Main Sliders */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <ScrubbableInput
                  label={lang === 'zh' ? '电阻 R' : 'Resistance R'}
                  value={rValue}
                  onChange={(v) => { setRValue(v); triggerHudEvent('sliderDrag'); }}
                  min={0} max={10} step={0.01} unit="Ω" precision={3} accentColor="#FFD700"
                />
                <ScrubbableInput
                  label={lang === 'zh' ? '电抗 X' : 'Reactance X'}
                  value={xValue}
                  onChange={(v) => { setXValue(v); triggerHudEvent('sliderDrag'); }}
                  min={-10} max={10} step={0.01} unit="jΩ" precision={3} accentColor="#FFFFFF"
                />
             </div>

             {/* Transmission Line & Matching */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                {/* Transmission Line */}
                <div>
                   <div className="flex items-center gap-2 mb-4 text-white/40">
                      <CableIcon size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Transmission Line</span>
                   </div>
                   <div className="flex items-center gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                      <input
                        type="range" min="0" max="0.5" step="0.001"
                        value={lineLength}
                        onChange={(e) => setLineLength(parseFloat(e.target.value))}
                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-[#222]"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${THEME.colors.primary} ${lineLength * 200}%, #222 ${lineLength * 200}%)`
                        }}
                      />
                      <div className="font-mono text-xs text-[#FFD700] w-16 text-right">
                        {lineLength.toFixed(3)}λ
                      </div>
                   </div>
                </div>

                {/* Matching Network */}
                <div>
                   <div className="flex items-center gap-2 mb-4 text-white/40">
                      <span className="text-[10px] font-bold uppercase tracking-widest">L-Match Solution</span>
                   </div>
                   <MatchingNetworkCalculator z={{ r: rValue, x: xValue }} lang={lang} />
                </div>
             </div>
             
             {/* Bottom Ports Decoration */}
             <div className="mt-12 pt-6 border-t border-white/5 flex justify-center gap-12 opacity-40">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#050505] border-2 border-[#333] shadow-[inset_0_1px_4px_rgba(0,0,0,1)]" />
                   <span className="text-[8px] font-mono tracking-widest text-white/30">PORT 1</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#050505] border-2 border-[#333] shadow-[inset_0_1px_4px_rgba(0,0,0,1)]" />
                   <span className="text-[8px] font-mono tracking-widest text-white/30">PORT 2</span>
                </div>
             </div>

          </div>
        </div>
      </div>
    </>
  );
};