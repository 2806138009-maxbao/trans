import React from 'react';
import { Language, TRANSLATIONS, WaveformType } from '../../types';
import { useHarmonicSeries, getWaveformDescription } from '../../hooks/useHarmonicSeries';
import { TiltCard } from '../TiltCard';
import { GlowDot, GradientText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface SeriesFormulaSectionProps {
  lang: Language;
  n: number;
  waveformType: WaveformType;
  reducedMotion?: boolean;
  id?: string;
  nextId?: string;
}

export const SeriesFormulaSection: React.FC<SeriesFormulaSectionProps> = ({
  lang,
  n,
  waveformType,
  reducedMotion,
  id = "formula-section",
  nextId = "spectrum-section",
}) => {
  const t = TRANSLATIONS[lang];
  const harmonics = useHarmonicSeries(waveformType, Math.min(Math.max(3, n), 9));
  const waveformInfo = getWaveformDescription(waveformType, lang);

  if (reducedMotion) {
    return (
      <section id={id} className="w-full relative px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
          <TiltCard glowColor="rgba(94,106,210,0.4)">
            <div className="p-8 space-y-4 text-left">
              <div className="flex items-center gap-3"><GlowDot color="#5E6AD2" /><h2 className="text-4xl md:text-5xl font-bold"><GradientText>{t.seriesFormulaTitle}</GradientText></h2></div>
              <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.seriesFormulaLead}</p>
            </div>
          </TiltCard>
          <TiltCard className="glass-card" glowColor="rgba(71,156,255,0.35)">
            <div className="p-8 space-y-6">
              <div className="label-style">{t.harmonics}</div>
              <div className="text-3xl md:text-4xl font-medium text-white flex items-center gap-3 tracking-tight h2-style"><span className="opacity-50 font-serif italic">f(x)</span><span className="opacity-50">≈</span><span>a₀ + Σ aₙ sin(n·x)</span></div>
              <div className="flex flex-wrap gap-2 text-xs text-[#C7CBD4]">{harmonics.map((term, idx) => (<span key={term.order} className={`value-mono px-3 py-2 rounded-lg border border-white/10 bg-white/5 ${idx === 0 ? 'shadow-[0_0_12px_rgba(94,106,210,0.4)] border-white/20' : ''}`}>a{term.order} = {term.coefficient.toFixed(3)}</span>))}</div>
            </div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="w-full relative px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
        <AnimateOnScroll animation="slide-left">
          <TiltCard glowColor="rgba(94,106,210,0.4)">
            <div className="p-8 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <GlowDot color="#5E6AD2" />
                <h2 className="text-4xl md:text-5xl font-bold">
                  <GradientText>{t.seriesFormulaTitle}</GradientText>
                </h2>
              </div>
              <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.seriesFormulaLead}</p>
              <ul className="space-y-2 text-sm text-[#D0D6E0]">
                {t.seriesFormulaPoints.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-[#5E6AD2] mt-0.5">•</span>
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
        </AnimateOnScroll>

        <AnimateOnScroll animation="slide-right" delay={150}>
          <TiltCard className="glass-card" glowColor="rgba(71,156,255,0.35)">
            <div className="p-8 space-y-6">
              <div className="label-style">{t.harmonics}</div>
              <div className="text-3xl md:text-4xl font-medium text-white flex items-center gap-3 tracking-tight h2-style">
                <span className="opacity-50 font-serif italic">f(x)</span>
                <span className="opacity-50">≈</span>
                <span>a₀ + Σ aₙ sin(n·x)</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#C7CBD4]">
                {harmonics.map((term, idx) => (
                  <span
                    key={term.order}
                    className={`value-mono px-3 py-2 rounded-lg border border-white/10 bg-white/5 ${
                      idx === 0 ? 'shadow-[0_0_12px_rgba(94,106,210,0.4)] border-white/20' : ''
                    }`}
                  >
                    a{term.order} = {term.coefficient.toFixed(3)}
                  </span>
                ))}
              </div>
              <div className="text-sm text-[#8A8F98] leading-relaxed opacity-80">
                {lang === 'en'
                  ? `Displaying the first ${harmonics.length} terms for the current ${waveformInfo.name}.`
                  : `当前波形 ${waveformInfo.name}，展示前 ${harmonics.length} 个系数。`}
              </div>
              <div className="text-xs text-[#C7CBD4] leading-relaxed border-t border-white/5 pt-4">
                <span className="text-[#5E6AD2] font-medium">{waveformInfo.harmonics}</span>
                <span className="block text-[#8A8F98] mt-1">{waveformInfo.note}</span>
              </div>
            </div>
          </TiltCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

