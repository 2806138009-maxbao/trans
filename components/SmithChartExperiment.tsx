import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { SmithChartCanvas } from './SmithChartCanvas';
import { TiltCard } from './TiltCard';
import { THEME } from '../theme';
import { GridIcon, CircleIcon, RotateCcwIcon, CrosshairIcon, CableIcon } from './Icons';
import { InstrumentSlider } from './InstrumentSlider';
import { MatchingNetworkCalculator } from './MatchingNetworkCalculator';
import { TRANSLATIONS } from '../types';
import { OperationGuideCard } from './OperationGuideCard';
import { LiveFormulaCards } from './LiveFormulaCards';
import { useExperimentHUD } from '../hooks/useExperimentHUD';
import { useSmithModeOptional, SMITH_MODE_PRESETS } from '../state/smithModes';
import { 
  ScrubbableInput, 
  PanelChassis, 
  SectionHeader, 
  TactileButton, 
  SegmentedControl,
  PanelDivider,
  ValueDisplay 
} from './ControlPanel';
// MatchIndicator removed - cleaner UI without victory visuals
import { ToastManager } from './Toast';
import { useKeyboardShortcuts, ShortcutAction } from '../hooks/useKeyboardShortcuts';
// Audio removed for cleaner experience
import { StudioExport } from './StudioExport';
import { CountUp } from './CountUp';

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


// Reusable Formula Card - Void Style
const FormulaCard: React.FC<{ title: string, formula: string, description: string, color: string }> = ({ title, formula, description, color }) => (
  <div 
    className="relative pl-5 py-4 group"
  >
    {/* Left accent line */}
    <div 
      className="absolute top-0 left-0 w-0.5 h-full transition-all duration-300 group-hover:w-1" 
      style={{ backgroundColor: color }} 
    />
    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: THEME.colors.text.label }}>
      {title}
    </h4>
    <div className="font-mono text-lg mb-3 text-white font-medium">
      {formula}
    </div>
    <p className="text-xs leading-relaxed" style={{ color: THEME.colors.text.muted }}>
      {description}
    </p>
  </div>
);

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

  // Calculate derived values - 包含完整的 RF 物理参数
  const derivedValues = useMemo(() => {
    const z = { r: rValue, x: xValue };
    const denom = (z.r + 1) * (z.r + 1) + z.x * z.x;
    const gammaReal = (z.r * z.r + z.x * z.x - 1) / denom;
    const gammaImag = (2 * z.x) / denom;
    const gammaMag = Math.sqrt(gammaReal * gammaReal + gammaImag * gammaImag);
    const gammaAngle = Math.atan2(gammaImag, gammaReal); // 弧度
    const gammaAngleDeg = gammaAngle * (180 / Math.PI);
    
    // ========================================
    // 物理补充 1: 传输线长度影响
    // Γ_in = Γ_L * e^{-j2βl}
    // 在史密斯圆图上表现为顺时针旋转
    // ========================================
    const beta_l = 2 * Math.PI * lineLength; // 2βl = 2π * (l/λ)
    const rotatedAngle = gammaAngle - 2 * beta_l; // 顺时针旋转
    const gammaInReal = gammaMag * Math.cos(rotatedAngle);
    const gammaInImag = gammaMag * Math.sin(rotatedAngle);
    
    // 旋转后的阻抗
    const denomIn = (1 - gammaInReal) * (1 - gammaInReal) + gammaInImag * gammaInImag;
    const zInR = denomIn > 0.0001 ? (1 - gammaInReal * gammaInReal - gammaInImag * gammaInImag) / denomIn : 100;
    const zInX = denomIn > 0.0001 ? (2 * gammaInImag) / denomIn : 0;
    
    const vswr = gammaMag < 0.999 ? (1 + gammaMag) / (1 - gammaMag) : Infinity;
    const returnLoss = gammaMag > 0.0001 ? -20 * Math.log10(gammaMag) : Infinity;
    
    // ========================================
    // 物理补充 2: 功率传输效率
    // P_delivered / P_available = 1 - |Γ|²
    // ========================================
    const powerEfficiency = (1 - gammaMag * gammaMag) * 100; // 百分比
    const mismatchLoss = gammaMag < 0.999 ? -10 * Math.log10(1 - gammaMag * gammaMag) : Infinity;
    
    // Calculate actual impedance (assuming Z0 = 50Ω)
    const z0 = 50;
    const actualR = z.r * z0;
    const actualX = z.x * z0;
    const actualZInR = zInR * z0;
    const actualZInX = zInX * z0;
    
    // ========================================
    // 物理补充 3: Q 因子 (品质因数)
    // Q = |X| / R (对于串联电路)
    // Q 越高，带宽越窄
    // ========================================
    const qFactor = z.r > 0.01 ? Math.abs(z.x) / z.r : Infinity;
    
    return { 
      gammaMag, 
      gammaAngleDeg,
      gammaInReal,
      gammaInImag,
      zInR,
      zInX,
      actualZInR,
      actualZInX,
      vswr, 
      returnLoss, 
      actualR, 
      actualX,
      powerEfficiency,
      mismatchLoss,
      qFactor,
    };
  }, [rValue, xValue, lineLength]);

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

  return (
    <>
      {/* Toast Notifications */}
      <ToastManager toasts={toasts} onDismiss={dismissToast} />
      <div 
        className="w-full flex flex-col"
        style={{ gap: 'var(--space-12)' }}
      >
        {/* 48px = 6 x 8 */}
        {/* 
          Main Display Area - baseline layout
          Muller-Brockmann grid
        */}
        <div className="relative w-full">
        {/* Decorative corner accents - 使用 8pt 网格 */}
        <div 
          className="absolute w-8 h-8 border-l-2 border-t-2 border-[#FFC700]/30 rounded-tl-lg pointer-events-none z-20"
          style={{ top: '-8px', left: '-8px' }}
        />
        <div 
          className="absolute w-8 h-8 border-r-2 border-t-2 border-[#FFC700]/30 rounded-tr-lg pointer-events-none z-20"
          style={{ top: '-8px', right: '-8px' }}
        />
        <div 
          className="absolute w-8 h-8 border-l-2 border-b-2 border-[#FFC700]/30 rounded-bl-lg pointer-events-none z-20"
          style={{ bottom: '-8px', left: '-8px' }}
        />
        <div 
          className="absolute w-8 h-8 border-r-2 border-b-2 border-[#FFC700]/30 rounded-br-lg pointer-events-none z-20"
          style={{ bottom: '-8px', right: '-8px' }}
        />
        
        <TiltCard glowColor={THEME.colors.chart.faintGold} disabled>
          {/* 内边距使用 8pt 网格 */}
          <div className="relative" style={{ padding: 'var(--space-2)' }}>  {/* 8px */}
            {/* Top Bar - Presets & Mode */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              {/* 
                Preset Quick Access
                Don Norman: 即时反馈 - 点击时有"弹跳"动画
              */}
              <div className="flex items-center gap-1 pointer-events-auto">
                {PRESETS.map(preset => {
                  const isActive = rValue === preset.r && xValue === preset.x;
                  return (
                    <button
                      key={preset.id}
                      onClick={(e) => {
                        // Don Norman: 即时反馈 - 点击动画
                        const btn = e.currentTarget;
                        btn.style.transition = 'none';
                        btn.style.transform = 'scale(0.92)';
                        setTimeout(() => {
                          btn.style.transition = 'transform 0.1s var(--ease-out-expo)';
                          btn.style.transform = 'scale(1.05)';
                          setTimeout(() => {
                            btn.style.transform = 'scale(1)';
                          }, 100);
                        }, 80);
                        handlePreset(preset);
                      }}
                      className="group relative rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-200"
                      style={{ 
                        padding: 'var(--space-2) var(--space-3)',
                        transitionTimingFunction: 'var(--ease-out-expo)',
                        backgroundColor: isActive ? THEME.colors.primaryFaint : 'rgba(0,0,0,0.4)',
                        color: isActive ? THEME.colors.primary : THEME.colors.text.muted,
                        border: `1px solid ${isActive ? THEME.colors.primaryDim : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <span className="mr-1.5 font-mono text-[9px] opacity-70">{preset.symbol}</span>
                      {preset.label[lang]}
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FFC700] shadow-[0_0_6px_#FFC700]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mode Indicator */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* VSWR Circles Toggle */}
                <button
                  onClick={() => setShowVSWRCircles(!showVSWRCircles)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-300"
                  style={{ 
                    backgroundColor: showVSWRCircles ? THEME.colors.primaryFaint : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${showVSWRCircles ? THEME.colors.primaryDim : THEME.colors.border.default}`,
                    color: showVSWRCircles ? THEME.colors.primary : THEME.colors.text.muted,
                  }}
                >
                  <CircleIcon size={12} />
                  VSWR
                </button>

                {/* Admittance Toggle */}
                <button
                  onClick={() => {
                    setShowAdmittance(!showAdmittance);
                    triggerHudEvent('modeToggle');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-300"
                  style={{ 
                    backgroundColor: showAdmittance ? 'rgba(71, 156, 255, 0.15)' : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${showAdmittance ? 'rgba(71, 156, 255, 0.3)' : THEME.colors.border.default}`,
                    color: showAdmittance ? '#479CFF' : THEME.colors.text.muted,
                  }}
                >
                  <RotateCcwIcon size={12} className={showAdmittance ? 'rotate-180' : ''} />
                  Y-Chart
                </button>

                {/* Control Mode Toggle */}
                <div 
                  className="flex items-center gap-1 p-1 rounded-lg backdrop-blur-md"
                  style={{ 
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${THEME.colors.border.default}`
                  }}
                >
                  <button
                    onClick={() => setControlMode('slider')}
                    className={`p-1.5 rounded transition-all duration-300 ${controlMode === 'slider' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                    title="Slider Control"
                  >
                    <GridIcon size={14} />
                  </button>
                  <button
                    onClick={() => setControlMode('mouse')}
                    className={`p-1.5 rounded transition-all duration-300 ${controlMode === 'mouse' ? 'bg-[#FFC700]/20 text-[#FFC700] shadow-[0_0_10px_rgba(255,199,0,0.2)]' : 'text-white/30 hover:text-white/60'}`}
                    title="Mouse Control (Direct Manipulation)"
                  >
                    <CrosshairIcon size={14} />
                  </button>
                </div>
                
                {/* Studio Export Button */}
                <StudioExport 
                  targetRef={chartContainerRef}
                  filename="smith-chart"
                  size="sm"
                />
              </div>
            </div>

            {/* 
              Visual Core: The Smith Chart Canvas 
            */}
            <div 
              ref={chartContainerRef}
              className="relative w-full h-[500px] md:h-[600px] mb-8 flex items-center justify-center"
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
                  if (hovering) {
                    triggerHudEvent('pointerHover');
                  }
                }}
                onDragChange={(dragging) => {
                  if (dragging) {
                    triggerHudEvent('sliderDrag');
                  }
                }}
              />
            
              {/* Floating Mini HUD for Mouse Mode */}
              {controlMode === 'mouse' && (
                <div 
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-xl flex items-center gap-4 animate-fade-in-up pointer-events-none"
                  style={{ 
                    backgroundColor: THEME.colors.overlay.glass,
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

            {/* 
              S-TIER CONTROL PANEL
              Design: Teenage Engineering / Blender / Linear
              Features: Glassmorphism, Scrubbable Inputs, Tactile Buttons
            */}
            {/* BOOT SEQUENCE: Staggered sidebar entrance */}
            {controlMode === 'slider' && (
              <div 
                className="relative -mt-16 mx-4 md:mx-8 rounded-2xl overflow-hidden"
                style={{ 
                  backgroundColor: 'rgba(10, 10, 10, 0.85)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  // Staggered entrance animation
                  opacity: sidebarVisible ? 1 : 0,
                  transform: sidebarVisible ? 'translateX(0)' : 'translateX(20px)',
                  transition: `all 0.5s ${THEME.animation.curve}`,
                  transitionDelay: '100ms',
                }}
              >
                {/* Panel Content */}
                <div className="p-8">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          backgroundColor: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.2)',
                        }}
                      >
                        <GridIcon size={18} style={{ color: '#FFD700' }} />
                      </div>
                      <div>
                        <h3 
                          className="text-[10px] font-bold uppercase tracking-[0.15em]"
                          style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          Impedance Controller
                        </h3>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          Drag labels to scrub values
                        </p>
                      </div>
                    </div>
                    
                    {/* Z0 Badge with CountUp effect */}
                    <div 
                      className="font-mono text-xs px-4 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: '#030303',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                        color: '#FFD700',
                        border: '1px solid rgba(255, 215, 0, 0.15)',
                      }}
                    >
                      Z₀ = <CountUp end={50} duration={800} delay={200} />Ω
                    </div>
                  </div>
                  
                  {/* Scrubbable Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Resistance - Scrubbable */}
                    <ScrubbableInput
                      label={lang === 'zh' ? '电阻 R' : 'Resistance R'}
                      value={rValue}
                      onChange={(v) => {
                        setRValue(v);
                        triggerHudEvent('sliderDrag');
                      }}
                      min={0}
                      max={10}
                      step={0.01}
                      unit="Ω (norm)"
                      precision={3}
                      accentColor="#FFD700"
                    />

                    {/* Reactance - Scrubbable */}
                    <ScrubbableInput
                      label={lang === 'zh' ? '电抗 X' : 'Reactance X'}
                      value={xValue}
                      onChange={(v) => {
                        setXValue(v);
                        triggerHudEvent('sliderDrag');
                      }}
                      min={-10}
                      max={10}
                      step={0.01}
                      unit="jΩ (norm)"
                      precision={3}
                      accentColor="#FFFFFF"
                    />
                  </div>
                  
                  {/* Quick Presets - Tactile Buttons */}
                  <div className="mb-8">
                    <SectionHeader>
                      {lang === 'zh' ? '快速预设' : 'Quick Presets'}
                    </SectionHeader>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset) => (
                        <TactileButton
                          key={preset.id}
                          onClick={() => {
                            setRValue(preset.r);
                            setXValue(preset.x);
                          }}
                          active={Math.abs(rValue - preset.r) < 0.1 && Math.abs(xValue - preset.x) < 0.1}
                          size="sm"
                        >
                          <span className="font-mono mr-1">{preset.symbol}</span>
                          {preset.label[lang]}
                        </TactileButton>
                      ))}
                    </div>
                  </div>
                
                {/* ========================================
                    物理补充: 传输线长度控制
                    沿传输线移动时，阻抗点在圆图上顺时针旋转
                    Γ_in = Γ_L × e^{-j2βl}
                   ======================================== */}
                <div 
                  className="mt-6 pt-6"
                  style={{ borderTop: `1px solid ${THEME.colors.border.divider}` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CableIcon size={16} style={{ color: THEME.colors.primary }} />
                    <span className="text-sm font-medium text-white">
                      {t.sliders.transmissionLine}
                    </span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: THEME.colors.primaryFaint,
                        color: THEME.colors.primary 
                      }}
                    >
                      {(lineLength * 360).toFixed(0)}° = {lineLength.toFixed(3)}λ
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.001"
                      value={lineLength}
                      onChange={(e) => setLineLength(parseFloat(e.target.value))}
                      className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${THEME.colors.primary} ${lineLength * 200}%, rgba(255,255,255,0.1) ${lineLength * 200}%)`
                      }}
                    />
                    <button
                      onClick={() => setLineLength(0)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.5)'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* 传输线旋转后的阻抗 */}
                  {lineLength > 0.001 && (
                    <div 
                      className="mt-4 p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(255, 199, 0, 0.05)' }}
                    >
                      <div className="text-xs mb-2" style={{ color: THEME.colors.text.label }}>
                        {t.sliders.inputImpedance}
                      </div>
                      <div className="font-mono text-sm" style={{ color: THEME.colors.primary }}>
                        {derivedValues.actualZInR.toFixed(1)} {derivedValues.zInX >= 0 ? '+' : '-'} j{Math.abs(derivedValues.actualZInX).toFixed(1)} Ω
                      </div>
                      <div className="text-xs mt-2" style={{ color: THEME.colors.text.muted }}>
                        {t.sliders.rotationInfo.replace('{deg}', (lineLength * 720).toFixed(0))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ========================================
                    物理补充: L型匹配网络计算器
                    这是史密斯圆图最重要的实际应用
                   ======================================== */}
                <MatchingNetworkCalculator 
                  z={{ r: rValue, x: xValue }}
                  lang={lang}
                />
                </div>
              </div>
            )}
          </div>
        </TiltCard>
        </div>

        {/* 
          Live HUD - 操作指南变成实时状态灯
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Left: Live Operation Guide HUD */}
          <OperationGuideCard lang={lang} />

          {/* Right: Live Formula Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME.colors.primary, boxShadow: `0 0 8px ${THEME.colors.primary}` }}
              />
              <h3 className="text-sm font-semibold text-white">
                {lang === 'zh' ? '实时仪表' : 'Live Instruments'}
              </h3>
            </div>
            <LiveFormulaCards 
              values={{
                r: rValue,
                x: xValue,
                gammaMag: derivedValues.gammaMag,
                gammaPhase: derivedValues.gammaAngleDeg,
                vswr: derivedValues.vswr,
              }}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </>
  );
};



      {/* 
        Physics Formulas Reference - 8pt Grid
        gap: 16px (2 × 8) - 紧凑但有序
      */}
      {/* Removed static FormulaCards as they are now handled in App.tsx with progressive disclosure */}
    </div>
  );
};

                        <h3 
                          className="text-[10px] font-bold uppercase tracking-[0.15em]"
                          style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          Impedance Controller
                        </h3>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          Drag labels to scrub values
                        </p>
                      </div>
                    </div>
                    
                    {/* Z0 Badge with CountUp effect */}
                    <div 
                      className="font-mono text-xs px-4 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: '#030303',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                        color: '#FFD700',
                        border: '1px solid rgba(255, 215, 0, 0.15)',
                      }}
                    >
                      Z₀ = <CountUp end={50} duration={800} delay={200} />Ω
                    </div>
                  </div>
                  
                  {/* Scrubbable Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Resistance - Scrubbable */}
                    <ScrubbableInput
                      label={lang === 'zh' ? '电阻 R' : 'Resistance R'}
                      value={rValue}
                      onChange={(v) => {
                        setRValue(v);
                        triggerHudEvent('sliderDrag');
                      }}
                      min={0}
                      max={10}
                      step={0.01}
                      unit="Ω (norm)"
                      precision={3}
                      accentColor="#FFD700"
                    />

                    {/* Reactance - Scrubbable */}
                    <ScrubbableInput
                      label={lang === 'zh' ? '电抗 X' : 'Reactance X'}
                      value={xValue}
                      onChange={(v) => {
                        setXValue(v);
                        triggerHudEvent('sliderDrag');
                      }}
                      min={-10}
                      max={10}
                      step={0.01}
                      unit="jΩ (norm)"
                      precision={3}
                      accentColor="#FFFFFF"
                    />
                  </div>
                  
                  {/* Quick Presets - Tactile Buttons */}
                  <div className="mb-8">
                    <SectionHeader>
                      {lang === 'zh' ? '快速预设' : 'Quick Presets'}
                    </SectionHeader>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset) => (
                        <TactileButton
                          key={preset.id}
                          onClick={() => {
                            setRValue(preset.r);
                            setXValue(preset.x);
                          }}
                          active={Math.abs(rValue - preset.r) < 0.1 && Math.abs(xValue - preset.x) < 0.1}
                          size="sm"
                        >
                          <span className="font-mono mr-1">{preset.symbol}</span>
                          {preset.label[lang]}
                        </TactileButton>
                      ))}
                    </div>
                  </div>
                
                {/* ========================================
                    物理补充: 传输线长度控制
                    沿传输线移动时，阻抗点在圆图上顺时针旋转
                    Γ_in = Γ_L × e^{-j2βl}
                   ======================================== */}
                <div 
                  className="mt-6 pt-6"
                  style={{ borderTop: `1px solid ${THEME.colors.border.divider}` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CableIcon size={16} style={{ color: THEME.colors.primary }} />
                    <span className="text-sm font-medium text-white">
                      {t.sliders.transmissionLine}
                    </span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: THEME.colors.primaryFaint,
                        color: THEME.colors.primary 
                      }}
                    >
                      {(lineLength * 360).toFixed(0)}° = {lineLength.toFixed(3)}λ
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.001"
                      value={lineLength}
                      onChange={(e) => setLineLength(parseFloat(e.target.value))}
                      className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${THEME.colors.primary} ${lineLength * 200}%, rgba(255,255,255,0.1) ${lineLength * 200}%)`
                      }}
                    />
                    <button
                      onClick={() => setLineLength(0)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.5)'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* 传输线旋转后的阻抗 */}
                  {lineLength > 0.001 && (
                    <div 
                      className="mt-4 p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(255, 199, 0, 0.05)' }}
                    >
                      <div className="text-xs mb-2" style={{ color: THEME.colors.text.label }}>
                        {t.sliders.inputImpedance}
                      </div>
                      <div className="font-mono text-sm" style={{ color: THEME.colors.primary }}>
                        {derivedValues.actualZInR.toFixed(1)} {derivedValues.zInX >= 0 ? '+' : '-'} j{Math.abs(derivedValues.actualZInX).toFixed(1)} Ω
                      </div>
                      <div className="text-xs mt-2" style={{ color: THEME.colors.text.muted }}>
                        {t.sliders.rotationInfo.replace('{deg}', (lineLength * 720).toFixed(0))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ========================================
                    物理补充: L型匹配网络计算器
                    这是史密斯圆图最重要的实际应用
                   ======================================== */}
                <MatchingNetworkCalculator 
                  z={{ r: rValue, x: xValue }}
                  lang={lang}
                />
                </div>
              </div>
            )}
          </div>
        </TiltCard>
        </div>

        {/* 
          Live HUD - 操作指南变成实时状态灯
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Left: Live Operation Guide HUD */}
          <OperationGuideCard lang={lang} />

          {/* Right: Live Formula Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME.colors.primary, boxShadow: `0 0 8px ${THEME.colors.primary}` }}
              />
              <h3 className="text-sm font-semibold text-white">
                {lang === 'zh' ? '实时仪表' : 'Live Instruments'}
              </h3>
            </div>
            <LiveFormulaCards 
              values={{
                r: rValue,
                x: xValue,
                gammaMag: derivedValues.gammaMag,
                gammaPhase: derivedValues.gammaAngleDeg,
                vswr: derivedValues.vswr,
              }}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </>
  );
};