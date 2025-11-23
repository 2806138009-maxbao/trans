
import React, { useState, useRef, useEffect } from 'react';
import { FourierCanvas } from './components/FourierCanvas';
import { ControlPanel } from './components/ControlPanel';
import { InteractiveOverlay } from './components/InteractiveOverlay';
import { IntroSection } from './components/IntroSection';
import { WaveBackground } from './components/WaveBackground';
import { EpicycleDrawing } from './components/EpicycleDrawing'; 
import { Language, TRANSLATIONS, TooltipContent, COLORS, WaveType } from './types';
import { CustomCursor } from './components/CustomCursor';

const App: React.FC = () => {
  const [n, setN] = useState<number>(3);
  const [waveType, setWaveType] = useState<WaveType>('square');
  const [lang, setLang] = useState<Language>('zh'); 
  const [externalTooltip, setExternalTooltip] = useState<TooltipContent | null>(null);
  const [showSimUI, setShowSimUI] = useState(false);
  const [hideHeader, setHideHeader] = useState(false); 

  const simSectionRef = useRef<HTMLDivElement>(null);
  const drawingSectionRef = useRef<HTMLElement>(null); 

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Observer for Simulation UI
    const simObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowSimUI(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );

    if (simSectionRef.current) {
      simObserver.observe(simSectionRef.current);
    }

    // Observer for Drawing Section
    const drawingObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                setHideHeader(entry.isIntersecting);
            });
        },
        { threshold: 0.1 }
    );

    if (drawingSectionRef.current) {
        drawingObserver.observe(drawingSectionRef.current);
    }

    return () => {
      if (simSectionRef.current) simObserver.unobserve(simSectionRef.current);
      if (drawingSectionRef.current) drawingObserver.unobserve(drawingSectionRef.current);
    };
  }, []);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleLabelHover = (isHovering: boolean) => {
    if (isHovering) {
      setExternalTooltip({
        title: t.tooltipHarmonicsTitle,
        body: t.tooltipHarmonicsBody
      });
    } else {
      setExternalTooltip(null);
    }
  };
  
  // Determine if we are in an interactive section (Simulation or Drawing) to dim the background
  const isInteractiveMode = showSimUI || hideHeader;

  return (
    <div 
        className="relative w-screen h-screen text-white overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory selection:bg-[#5E6AD2]/30 bg-[#0B0C0E] outline-none"
    >
      <CustomCursor />
      
      {/* 1. Underlying Colorful Nebula Layer - Dims when interactive */}
      <WaveBackground dimmed={isInteractiveMode} />
      
      {/* 2. Global Grain/Noise Texture (Base64 SVG for reliability) */}
      <div 
        className="fixed inset-0 pointer-events-none z-[2] opacity-[0.07] mix-blend-overlay"
        style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
        }}
      />
      
      {/* 3. Global Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[3]" 
           style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(5, 6, 8, 0.5) 100%)' }} 
      />

      {/* Global Fixed Language Toggle */}
      <div className="fixed top-5 right-8 z-[60]">
        <button 
           onClick={toggleLang}
           className="text-[11px] font-bold tracking-wider px-3 py-1.5 rounded text-[#8A8F98] hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5 font-sans backdrop-blur-md bg-[#16171A]/30 cursor-none"
         >
           {lang === 'en' ? 'CN' : 'EN'}
         </button>
      </div>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 w-full py-5 px-8 z-50 pointer-events-none transition-transform duration-500 ease-in-out ${hideHeader ? '-translate-y-full' : 'translate-y-0'}`}
        style={{
          background: 'linear-gradient(to bottom, rgba(11,12,14,0.9) 0%, rgba(11,12,14,0) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="pointer-events-auto flex items-center gap-3">
             <div className="w-4 h-4 rounded-full bg-[#5E6AD2] shadow-[0_0_12px_rgba(94,106,210,0.6)]"></div>
             <h1 className="text-sm font-sans font-medium tracking-tight text-white/90">
              {t.titleMain} <span className="text-[#5E6AD2] opacity-80">/ {t.titleSuffix}</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Intro Slides - Transparent background to show Nebula */}
      <IntroSection lang={lang} />

      {/* Simulation Section - Transparent bg, P5 handles semi-transparency */}
      <section ref={simSectionRef} className="w-full h-screen snap-start relative overflow-hidden bg-transparent focus:outline-none outline-none">
        <FourierCanvas nVal={n} waveType={waveType} lang={lang} />
        
        <div className={`transition-opacity duration-1000 ease-in-out ${showSimUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <ControlPanel 
                n={n} 
                setN={setN}
                waveType={waveType}
                setWaveType={setWaveType}
                lang={lang} 
                onHoverLabel={handleLabelHover}
            />
            <InteractiveOverlay lang={lang} externalTooltip={externalTooltip} />
        </div>
      </section>

      {/* High-Order Application - Transparent bg */}
      <section ref={drawingSectionRef} className="w-full h-screen snap-start relative overflow-hidden bg-transparent focus:outline-none outline-none">
        <EpicycleDrawing lang={lang} />
      </section>

    </div>
  );
};

export default App;