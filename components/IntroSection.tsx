
import React from 'react';
import { Language, TRANSLATIONS, COLORS } from '../types';
import { TiltCard } from './TiltCard';

interface IntroSectionProps {
  lang: Language;
}

// Helper for Linear-style gradient text
const GradientText = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

// New Helper: Tech Zoom Effect
// Added text-center to ensure wrapping text inside the inline-block remains centered
const HoverMagnify = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`inline-block w-full transition-all duration-300 ease-out cursor-default hover:scale-105 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] origin-center text-center ${className}`}>
    {children}
  </span>
);

export const IntroSection: React.FC<IntroSectionProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <>
      {/* Slide 1: Hero & Definition */}
      <section className="w-full h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden perspective-[1000px]">
        {/* Background ambient light */}
        <div className="absolute top-[30%] left-[50%] transform -translate-x-1/2 w-[800px] h-[400px] bg-[#5E6AD2]/20 rounded-full blur-[150px] -z-10" />
        
        <div className="max-w-4xl w-full text-center z-10 space-y-12 flex flex-col items-center">
          
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter drop-shadow-sm select-none">
            <HoverMagnify><GradientText>{t.introTitle}</GradientText></HoverMagnify>
          </h1>
          <p className="w-full text-2xl md:text-3xl font-medium text-[#8A8F98] tracking-tight text-center">
            <HoverMagnify>{t.introSubtitle}</HoverMagnify>
          </p>
          
          <div className="mt-16 max-w-2xl mx-auto w-full">
             <TiltCard glowColor="rgba(71, 156, 255, 0.6)">
                 <div className="flex flex-col items-center justify-center gap-8 text-center w-full min-h-[300px] py-20 px-10">
                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#5E6AD2] to-transparent opacity-60" />
                    <h3 className="text-xs font-semibold text-[#5E6AD2] uppercase tracking-[0.3em] text-center w-full">
                        <HoverMagnify>{t.defTitle}</HoverMagnify>
                    </h3>
                    <p className="text-xl md:text-2xl text-[#D0D6E0] leading-relaxed font-light max-w-lg mx-auto w-full text-center">
                        <HoverMagnify>{t.defBody}</HoverMagnify>
                    </p>
                 </div>
             </TiltCard>
          </div>
        </div>

        <div className="absolute bottom-10 flex flex-col items-center opacity-40 animate-pulse hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-semibold tracking-widest text-[#8A8F98] uppercase mb-3">{t.scrollPrompt}</span>
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#8A8F98] to-transparent"></div>
        </div>
      </section>

      {/* Slide 2: History */}
      <section className="w-full h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden">
         <div className="max-w-5xl w-full z-10 flex flex-col md:flex-row gap-12 items-center">
            
            <div className="flex-1 w-full">
                <TiltCard glowColor="rgba(255, 255, 255, 0.4)">
                    <div className="p-12 flex flex-col justify-center items-center text-center w-full">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 text-center w-full">
                            <GradientText>{t.histTitle}</GradientText>
                        </h2>
                        <p className="text-xl text-[#8A8F98] leading-relaxed font-light w-full text-center">
                            <HoverMagnify>{t.histBody}</HoverMagnify>
                        </p>
                    </div>
                </TiltCard>
            </div>

            <div className="flex-shrink-0">
                <TiltCard className="rounded-full border-none" glowColor="rgba(94, 106, 210, 0.8)">
                    <div className="w-80 h-80 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#5E6AD2]/20 to-transparent rounded-full" />
                        <span className="text-7xl font-serif italic text-white/90 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                            <HoverMagnify>1822</HoverMagnify>
                        </span>
                    </div>
                </TiltCard>
            </div>

         </div>
      </section>

      {/* Slide 3: The Role */}
      <section className="w-full h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden">
         <div className="max-w-5xl w-full z-10">
            <TiltCard glowColor="rgba(94, 106, 210, 0.5)">
                <div className="p-16 text-center flex flex-col items-center w-full">
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-12 text-center w-full">
                        <GradientText>{t.roleTitle}</GradientText>
                    </h2>
                    <p className="text-2xl md:text-4xl text-[#D0D6E0] leading-snug font-normal max-w-3xl mx-auto w-full text-center">
                        {t.roleBody.split(' ').map((word, i) => (
                            <span key={i} className="inline-block hover:text-white hover:scale-110 transition-transform duration-200 cursor-default mr-3">
                                {word}
                            </span>
                        ))}
                    </p>
                    
                    <div className="flex justify-center gap-16 mt-16 opacity-60 hover:opacity-100 transition-opacity duration-500 w-full">
                        <div className="text-center group">
                            <div className="text-xs uppercase tracking-widest text-[#8A8F98] mb-2">{t.lblTime}</div>
                            <div className="w-16 h-1 bg-[#8A8F98] mx-auto rounded-full group-hover:w-24 group-hover:bg-white transition-all" />
                        </div>
                        <div className="text-center group">
                            <div className="text-xs uppercase tracking-widest text-[#5E6AD2] mb-2">{t.lblFrequency}</div>
                            <div className="w-16 h-1 bg-[#5E6AD2] mx-auto rounded-full group-hover:w-24 group-hover:bg-[#7E8AF0] group-hover:shadow-[0_0_15px_#5E6AD2] transition-all" />
                        </div>
                    </div>
                </div>
            </TiltCard>
         </div>
      </section>

      {/* Slide 4: Applications */}
      <section className="w-full h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden">
        {/* Changed items-stretch to items-center to prevent card stretching */}
        <div className="max-w-6xl w-full z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           
           <TiltCard glowColor="rgba(255,255,255,0.3)">
              <div className="p-8 flex flex-col justify-center items-center text-center w-full min-h-[300px]">
                  <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 text-center w-full">
                    <GradientText>{t.appsTitle}</GradientText>
                  </h2>
                  <p className="text-xl text-[#8A8F98] leading-relaxed w-full text-center">
                    <HoverMagnify>{t.appsBody}</HoverMagnify>
                  </p>
              </div>
           </TiltCard>
           
           {/* Switch to grid-cols-3 to reduce height (2 rows instead of 3) */}
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
              {['JPEG', 'MP3', 'MRI', '5G', 'WIFI', 'EQ'].map((item, i) => (
                <TiltCard key={i} glowColor="rgba(94, 106, 210, 0.6)">
                   <div className="aspect-square flex flex-col items-center justify-center bg-white/[0.01] p-4">
                       <HoverMagnify className="text-xl text-[#8A8F98] font-medium tracking-widest group-hover:text-white z-10 relative text-center w-full h-full flex items-center justify-center">
                         {item}
                       </HoverMagnify>
                   </div>
                </TiltCard>
              ))}
           </div>
        </div>
      </section>
    </>
  );
};
