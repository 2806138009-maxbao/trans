import React, { useEffect, useRef, useState, useCallback } from "react";
import { WaveBackground } from "./components/WaveBackground";
import { CustomCursor } from "./components/CustomCursor";
import { SectionNavigation } from "./components/SectionNavigation";
import { Language, TooltipContent, TRANSLATIONS, WaveformType } from "./types";
import { BuildWavesSection } from "./components/sections/BuildWavesSection";
import { IntroNarrativeSection } from "./components/sections/IntroNarrativeSection";
import { SignalAsDrawingSection } from "./components/sections/SignalAsDrawingSection";
import { SineAsLegoSection } from "./components/sections/SineAsLegoSection";
import { SeriesFormulaSection } from "./components/sections/SeriesFormulaSection";
import { TimeFrequencySection } from "./components/sections/TimeFrequencySection";
import { EpicycleSection } from "./components/sections/EpicycleSection";
import { EngineeringAppsSection } from "./components/sections/EngineeringAppsSection";
import { RecapAndCTASection } from "./components/sections/RecapAndCTASection";
import { HeroSection } from "./components/sections/HeroSection";
import { NextSection } from "./components/sections/NextSection";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

const App: React.FC = () => {
  const [n, setN] = useState<number>(3);
  const [lang, setLang] = useState<Language>("zh");
  const [waveformType, setWaveformType] = useState<WaveformType>("square");
  const [externalTooltip, setExternalTooltip] = useState<TooltipContent | null>(null);
  const [buildInView, setBuildInView] = useState(false);
  const [epicycleInView, setEpicycleInView] = useState(false);
  const [userMotionPref, setUserMotionPref] = useState<boolean | null>(null); // null = follow system

  const buildRef = useRef<HTMLDivElement>(null);
  const epicycleRef = useRef<HTMLDivElement>(null);
  const engineeringRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const systemPrefersReducedMotion = usePrefersReducedMotion();
  
  // 用户可以覆盖系统偏好
  const reducedMotion = userMotionPref !== null ? userMotionPref : systemPrefersReducedMotion;

  const toggleMotion = useCallback(() => {
    setUserMotionPref(prev => {
      if (prev === null) return true; // first toggle: disable motion
      return !prev;
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === buildRef.current) setBuildInView(entry.isIntersecting);
          if (entry.target === epicycleRef.current) setEpicycleInView(entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );
    if (buildRef.current) observer.observe(buildRef.current);
    if (epicycleRef.current) observer.observe(epicycleRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleLang = () => setLang((prev) => (prev === "en" ? "zh" : "en"));

  const handleLabelHover = (isHovering: boolean) => {
    if (isHovering) {
      setExternalTooltip({
        title: t.tooltipHarmonicsTitle,
        body: t.tooltipHarmonicsBody,
      });
    } else {
      setExternalTooltip(null);
    }
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 交互模式：在实验区时减弱背景
  const isInteractiveMode = buildInView || epicycleInView;
  const showCustomCursor = !reducedMotion;

  return (
    <div className="relative w-full min-h-screen text-white bg-[#0B0C0E]">
      {showCustomCursor && <CustomCursor />}
      <WaveBackground
        dimmed={isInteractiveMode}
        reducedMotion={reducedMotion}
      />
      
      {/* Section Navigation with Motion Toggle */}
      <SectionNavigation 
        lang={lang} 
        reducedMotion={reducedMotion}
        onToggleMotion={toggleMotion}
      />

      {/* Global Grain/Noise Texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[2] opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[3]"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(5, 6, 8, 0.5) 100%)",
        }}
      />

      {/* Language toggle */}
      <div className="fixed top-5 right-6 z-[60]">
        <button
          onClick={toggleLang}
          className="text-[11px] font-bold tracking-wider px-4 py-2.5 md:px-3 md:py-1.5 rounded text-[#8A8F98] hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5 font-sans backdrop-blur-md bg-[#16171A]/30 cursor-none min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {lang === "en" ? "CN" : "EN"}
        </button>
      </div>

      <main className="relative z-10 flex flex-col pb-32">
        {/* Hero */}
        <HeroSection
          lang={lang}
          onStart={() => scrollToRef(buildRef)}
          onWhy={() => scrollToRef(engineeringRef)}
          reducedMotion={reducedMotion}
        />

        {/* 第一章：直觉 - 长文式叙事区 */}
        <IntroNarrativeSection id="intuition" lang={lang} reducedMotion={reducedMotion} />

        {/* 第二章：实验 */}
        <div id="experiment" className="space-y-28 md:space-y-32 mt-16">
          {/* 信号绘制 */}
          <SignalAsDrawingSection
            lang={lang}
            reducedMotion={reducedMotion}
            id="signal-drawing"
            nextId="sine-lego"
          />
          
          {/* 正弦积木 */}
          <SineAsLegoSection lang={lang} reducedMotion={reducedMotion} />
          
          {/* 核心实验区 */}
          <BuildWavesSection
            ref={buildRef}
            lang={lang}
            n={n}
            setN={setN}
            waveformType={waveformType}
            setWaveformType={setWaveformType}
            externalTooltip={externalTooltip}
            onHoverLabel={handleLabelHover}
            showControls={buildInView}
            reducedMotion={reducedMotion}
          />
          
          {/* 公式解释 */}
          <SeriesFormulaSection
            lang={lang}
            n={n}
            waveformType={waveformType}
            reducedMotion={reducedMotion}
          />
          
          {/* 时频对照 - 现在接收波形类型 */}
          <TimeFrequencySection
            lang={lang}
            n={n}
            waveformType={waveformType}
            reducedMotion={reducedMotion}
          />
          
          {/* 本轮绘制 */}
          <EpicycleSection ref={epicycleRef} lang={lang} reducedMotion={reducedMotion} />
        </div>

        {/* 第三章：应用与总结 */}
        <div className="space-y-28 md:space-y-32 mt-28">
          <EngineeringAppsSection id="application" ref={engineeringRef} lang={lang} reducedMotion={reducedMotion} />
          
          {/* 合并后的总结与 CTA */}
          <RecapAndCTASection id="recap" lang={lang} reducedMotion={reducedMotion} />
          
          {/* 系列预告 */}
          <NextSection lang={lang} reducedMotion={reducedMotion} />
        </div>
      </main>
    </div>
  );
};

export default App;
