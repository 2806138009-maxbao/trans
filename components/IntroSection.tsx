/**
 * @deprecated This component is no longer used in the main App.
 * It has been replaced by separate section components in components/sections/:
 * - HeroSection
 * - ContextSection
 * - SignalAsDrawingSection
 * - SineAsLegoSection
 * - BuildWavesSection
 * - SeriesFormulaSection
 * - TimeFrequencySection
 * - EpicycleSection
 * - EngineeringAppsSection
 * - RecapAndCTASection
 * - TeacherGuideTeaserSection
 * - NextSection
 *
 * This file is kept for reference and can be safely deleted.
 */

import React from "react";
import { Language, TRANSLATIONS } from "../types";
import { TiltCard } from "./TiltCard";

interface IntroSectionProps {
  lang: Language;
}

// Helper for Linear-style gradient text
const GradientText = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent ${className}`}
  >
    {children}
  </span>
);

// New Helper: Tech Zoom Effect
// Added text-center to ensure wrapping text inside the inline-block remains centered
const HoverMagnify = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-block w-full transition-all duration-300 ease-out cursor-default hover:scale-105 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] origin-center text-center ${className}`}
  >
    {children}
  </span>
);

export const IntroSection: React.FC<IntroSectionProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <>
      {/* Hero */}
      <section className="w-full min-h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden perspective-[1000px]">
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[820px] h-[420px] bg-[#5E6AD2]/25 rounded-full blur-[180px] -z-10" />

        <div className="max-w-5xl w-full text-center z-10 space-y-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] uppercase tracking-[0.3em] text-[#8A8F98]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_10px_rgba(94,106,210,0.6)]" />
            <span>{t.heroBadge}</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter drop-shadow-sm select-none leading-[0.95]">
            <HoverMagnify>
              <GradientText>{t.heroTitle}</GradientText>
            </HoverMagnify>
          </h1>
          <p className="w-full text-2xl md:text-3xl font-medium text-[#8A8F98] tracking-tight text-center max-w-4xl">
            <HoverMagnify>{t.heroSubtitle}</HoverMagnify>
          </p>

          <div className="flex items-center gap-4 mt-6 text-[11px] uppercase tracking-widest text-[#8A8F98]">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {t.lblTime}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#5E6AD2]">
              {t.lblFrequency}
            </span>
          </div>
        </div>

        <div className="absolute bottom-10 flex flex-col items-center opacity-40 animate-pulse hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-semibold tracking-widest text-[#8A8F98] uppercase mb-3">
            {t.scrollPrompt}
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#8A8F98] to-transparent"></div>
        </div>
      </section>

      {/* Guidance */}
      <section className="w-full min-h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden">
        <div className="max-w-6xl w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <TiltCard glowColor="rgba(71, 156, 255, 0.6)">
            <div className="p-10 flex flex-col gap-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#479CFF] shadow-[0_0_10px_rgba(71,156,255,0.7)]" />
                <span>{t.howToTitle}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-left">
                <GradientText>{t.howToTitle}</GradientText>
              </h2>
              <ol className="flex flex-col gap-4 text-left">
                {t.howToItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 items-start text-lg text-[#D0D6E0] leading-relaxed"
                  >
                    <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-center text-sm font-semibold text-white flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </TiltCard>

          <TiltCard glowColor="rgba(94, 106, 210, 0.6)">
            <div className="p-10 flex flex-col gap-6 text-left">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_10px_rgba(94,106,210,0.7)]" />
                <span>{t.seeingTitle}</span>
              </div>
              <div className="space-y-4 text-lg text-[#D0D6E0] leading-relaxed">
                {t.seeingParagraphs.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="transition-all duration-300 hover:text-white"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* About, CTA, Next */}
      <section className="w-full min-h-screen snap-start relative flex flex-col justify-center items-center p-8 overflow-hidden">
        <div className="max-w-6xl w-full z-10 grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
          <TiltCard glowColor="rgba(255, 255, 255, 0.35)">
            <div className="p-10 space-y-6 text-left">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8A8F98]">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
                <span>{t.aboutTitle}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                <GradientText>{t.aboutTitle}</GradientText>
              </h2>
              <div className="space-y-4 text-lg text-[#D0D6E0] leading-relaxed">
                {t.aboutParagraphs.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="transition-all duration-300 hover:text-white"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </TiltCard>

          <div className="grid grid-cols-1 gap-10">
            <TiltCard glowColor="rgba(71, 156, 255, 0.55)">
              <div className="p-8 space-y-6 text-left">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#479CFF] shadow-[0_0_10px_rgba(71,156,255,0.7)]" />
                  <span>
                    {t.ctaStudentsTitle} / {t.ctaTeachersTitle}
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {t.ctaStudentsTitle}
                    </h3>
                    <p className="text-sm text-[#D0D6E0]">
                      {t.ctaStudentsLead}
                    </p>
                    <ul className="space-y-2 text-sm text-[#D0D6E0]">
                      {t.ctaStudentsActions.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-[#5E6AD2] mt-0.5">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {t.ctaTeachersTitle}
                    </h3>
                    <p className="text-sm text-[#D0D6E0] leading-relaxed">
                      {t.ctaTeachersBody}
                    </p>
                    <div className="text-xs uppercase tracking-[0.25em] text-[#8A8F98] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      <span>
                        {t.ctaEmailLabel}: {t.ctaEmailPlaceholder}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>

            <TiltCard glowColor="rgba(94, 106, 210, 0.55)">
              <div className="p-8 space-y-5 text-left">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]" />
                  <span>{t.nextTitle}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold">
                  <GradientText>{t.nextTitle}</GradientText>
                </h3>
                <p className="text-sm text-[#D0D6E0]">{t.nextSubtitle}</p>
                <ul className="space-y-2 text-sm text-[#D0D6E0]">
                  {t.nextItems.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-[#5E6AD2] mt-0.5">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[#D0D6E0] border-t border-white/5 pt-4">
                  {t.nextPrompt}
                </p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </>
  );
};
