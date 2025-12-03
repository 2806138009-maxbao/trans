import React, { useState } from "react";
import { Language, TRANSLATIONS } from "../../types";
import { TiltCard } from "../TiltCard";
import { AnimateOnScroll } from "../AnimateOnScroll";
import { THEME } from "../../theme";
import { InteractiveRecap } from "../InteractiveRecap";

interface RecapAndCTASectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
}

const GlowDot: React.FC<{ color: string }> = ({ color }) => (
  <span 
    className="w-2 h-2 rounded-full"
    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
  />
);

const GradientText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span 
    className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent select-text"
    style={{ WebkitBackgroundClip: 'text' }}
  >
    {children}
  </span>
);

export const RecapAndCTASection: React.FC<RecapAndCTASectionProps> = ({
  lang,
  reducedMotion,
  id,
}) => {
  const t = TRANSLATIONS[lang];
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitted(true);
      setIsLoading(false);
  };

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  const getWrapperProps = (animation: string, delay: number = 0) => 
    reducedMotion ? {} : { animation: animation as any, delay };

  return (
    <section id={id} className="w-full relative px-6 py-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFC700]/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto space-y-12">
        {/* Section Title */}
        <Wrapper {...getWrapperProps('fade-up')}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <GlowDot color={THEME.colors.primary} />
              <h2 className="text-4xl md:text-5xl font-bold">
                <GradientText>{t.recapTitle}</GradientText>
              </h2>
            </div>
          </div>
        </Wrapper>

        {/* Core Ideas - Interactive Dashboard */}
        <Wrapper {...getWrapperProps('scale', 100)}>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-6 text-center">
              {lang === "en" ? "Core Ideas" : "核心要点"}
            </div>
            <InteractiveRecap bullets={t.recapBullets} disableTilt={true} />
          </div>
        </Wrapper>



        {/* CTA - Void Style */}
        <Wrapper {...getWrapperProps('blur', 400)}>
          <div className="max-w-2xl mx-auto relative pl-6 py-8">
            {/* Left accent line */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-1"
              style={{ 
                backgroundColor: THEME.colors.primary,
                boxShadow: `0 0 20px ${THEME.colors.primary}40`
              }}
            />
            
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">{t.ctaTitle}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{t.ctaLead}</p>
              </div>
              
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.ctaPlaceholder}
                    required
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[var(--color-text-muted)] text-sm focus:outline-none focus:border-[#FFC700] transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 rounded-lg text-black text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: THEME.colors.primary }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {lang === "en" ? "Subscribing..." : "订阅中..."}
                      </>
                    ) : (
                      t.ctaButton
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2" style={{ color: THEME.colors.primary }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{t.ctaSuccess}</span>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t.ctaCollaborate}{" "}
                  <a href="mailto:luminous.lab@example.com" className="hover:underline" style={{ color: THEME.colors.primary }}>
                    {t.ctaEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Wrapper>

        {/* Next in Series */}
        <Wrapper {...getWrapperProps('fade-up', 500)}>
          <div className="text-center space-y-6">
            <h3 className="text-xl font-semibold text-white">{t.nextTitle}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{t.nextLead}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {t.nextItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="relative pl-4 py-1 text-sm text-[#D0D6E0] hover:text-white transition-all duration-300 group"
                >
                  {/* Left accent dot */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-125"
                    style={{ backgroundColor: THEME.colors.primary, opacity: 0.6 }}
                  />
                  {item}
                </div>
              ))}
            </div>
        </div>
        </Wrapper>
      </div>
    </section>
  );
};
