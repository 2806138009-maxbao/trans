import React, { useEffect, useRef, useState } from "react";
import { WaveBackground } from "./components/WaveBackground";
import { CustomCursor } from "./components/CustomCursor";
import { Language, TooltipContent, TRANSLATIONS } from "./types";
import { BuildWavesSection } from "./components/sections/BuildWavesSection";
import { SignalAsDrawingSection } from "./components/sections/SignalAsDrawingSection";
import { SineAsLegoSection } from "./components/sections/SineAsLegoSection";
import { SeriesFormulaSection } from "./components/sections/SeriesFormulaSection";
import { TimeFrequencySection } from "./components/sections/TimeFrequencySection";
import { EpicycleSection } from "./components/sections/EpicycleSection";
import { EngineeringAppsSection } from "./components/sections/EngineeringAppsSection";
import { RecapAndCTASection } from "./components/sections/RecapAndCTASection";
import { TeacherGuideTeaserSection } from "./components/sections/TeacherGuideTeaserSection";
import { HeroSection } from "./components/sections/HeroSection";
import { Eyebrow } from "./components/sections/SectionHelpers";
import { ContextSection } from "./components/sections/ContextSection";
import { NextSection } from "./components/sections/NextSection";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

const App: React.FC = () => {
  const [n, setN] = useState<number>(3);
  const [lang, setLang] = useState<Language>("zh");
  const [externalTooltip, setExternalTooltip] = useState<TooltipContent | null>(
    null
  );
  const [buildInView, setBuildInView] = useState(false);
  const [epicycleInView, setEpicycleInView] = useState(false);

  const buildRef = useRef<HTMLDivElement>(null);
  const epicycleRef = useRef<HTMLDivElement>(null);
  const engineeringRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === buildRef.current)
            setBuildInView(entry.isIntersecting);
          if (entry.target === epicycleRef.current)
            setEpicycleInView(entry.isIntersecting);
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

  const isInteractiveMode = buildInView || epicycleInView;

  return (
    <div className="relative w-full min-h-screen text-white bg-[#0B0C0E]">
      <CustomCursor />
      <WaveBackground
        dimmed={isInteractiveMode}
        reducedMotion={prefersReducedMotion}
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
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(5, 6, 8, 0.5) 100%)",
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

      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full py-5 px-8 z-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,12,14,0.9) 0%, rgba(11,12,14,0) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#5E6AD2] shadow-[0_0_12px_rgba(94,106,210,0.6)]" />
            <h1 className="text-sm font-sans font-medium tracking-tight text-white/90">
              {t.titleMain}{" "}
              <span className="text-[#5E6AD2] opacity-80">
                / {t.titleSuffix}
              </span>
            </h1>
          </div>
          <div className="pointer-events-auto hidden md:block">
            <Eyebrow label={t.heroBadge} />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col gap-28 md:gap-32 pb-32 pt-24">
        <HeroSection
          lang={lang}
          onStart={() => scrollToRef(buildRef)}
          onWhy={() => scrollToRef(engineeringRef)}
          reducedMotion={prefersReducedMotion}
        />
        <ContextSection lang={lang} reducedMotion={prefersReducedMotion} />
        <SignalAsDrawingSection
          lang={lang}
          reducedMotion={prefersReducedMotion}
        />
        <SineAsLegoSection lang={lang} reducedMotion={prefersReducedMotion} />
        <BuildWavesSection
          ref={buildRef}
          lang={lang}
          n={n}
          setN={setN}
          externalTooltip={externalTooltip}
          onHoverLabel={handleLabelHover}
          showControls={buildInView}
          reducedMotion={prefersReducedMotion}
        />
        <SeriesFormulaSection
          lang={lang}
          n={n}
          reducedMotion={prefersReducedMotion}
        />
        <TimeFrequencySection
          lang={lang}
          n={n}
          reducedMotion={prefersReducedMotion}
        />
        <EpicycleSection
          ref={epicycleRef}
          lang={lang}
          reducedMotion={prefersReducedMotion}
        />
        <EngineeringAppsSection
          ref={engineeringRef}
          lang={lang}
          reducedMotion={prefersReducedMotion}
        />
        <RecapAndCTASection lang={lang} reducedMotion={prefersReducedMotion} />
        <TeacherGuideTeaserSection
          lang={lang}
          reducedMotion={prefersReducedMotion}
        />
        <NextSection lang={lang} reducedMotion={prefersReducedMotion} />
      </main>
    </div>
  );
};

export default App;
