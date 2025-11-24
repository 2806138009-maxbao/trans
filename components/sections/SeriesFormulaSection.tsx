import React, { useMemo } from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface SeriesFormulaSectionProps {
  lang: Language;
  n: number;
  reducedMotion?: boolean;
}

export const SeriesFormulaSection: React.FC<SeriesFormulaSectionProps> = ({ lang, n, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up delay-2';

  const terms = useMemo(() => {
    const maxTerms = Math.min(Math.max(3, n), 9);
    const list = [];
    for (let i = 0; i < maxTerms; i++) {
      const harmonic = i * 2 + 1;
      const coeff = +(4 / (harmonic * Math.PI)).toFixed(3);
      list.push({ harmonic, coeff });
    }
    return list;
  }, [n]);

  return (
    <section className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
        <TiltCard glowColor="rgba(94,106,210,0.4)">
          <div className="p-8 space-y-4 text-left">
            <Eyebrow label={t.seriesFormulaTitle} />
            <h2 className="text-4xl md:text-5xl font-bold">
              <GradientText>{t.seriesFormulaTitle}</GradientText>
            </h2>
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

        <TiltCard glowColor="rgba(71,156,255,0.5)">
          <div className="p-8 space-y-5">
            <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98]">{t.harmonics}</div>
            <div className="text-2xl font-semibold text-white flex items-center gap-2">
              f(x) ≈ a₀ + Σ aₙ sin(n·x)
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#C7CBD4]">
              {terms.map((term, idx) => (
                <span
                  key={term.harmonic}
                  className={`px-3 py-2 rounded-lg border border-white/10 bg-white/5 ${
                    idx === 0 ? 'shadow-[0_0_12px_rgba(94,106,210,0.6)]' : ''
                  }`}
                >
                  a{term.harmonic} = {term.coeff}
                </span>
              ))}
            </div>
            <div className="text-sm text-[#8A8F98]">
              {lang === 'en'
                ? `Showing the first ${terms.length} odd harmonics based on N = ${n}.`
                : `当前 N = ${n}，展示前 ${terms.length} 个奇次谐波系数。`}
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
};
