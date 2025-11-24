import React from 'react';
import { Language, TooltipContent, TRANSLATIONS } from '../../types';
import { FourierCanvas } from '../FourierCanvas';
import { ControlPanel } from '../ControlPanel';
import { InteractiveOverlay } from '../InteractiveOverlay';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface BuildWavesSectionProps {
  lang: Language;
  n: number;
  setN: (val: number) => void;
  externalTooltip: TooltipContent | null;
  onHoverLabel: (isHovering: boolean) => void;
  showControls: boolean;
  reducedMotion?: boolean;
}

export const BuildWavesSection = React.forwardRef<HTMLDivElement, BuildWavesSectionProps>(
  ({ lang, n, setN, externalTooltip, onHoverLabel, showControls, reducedMotion }, ref) => {
    const t = TRANSLATIONS[lang];
    const motionClass = reducedMotion ? '' : 'fade-up delay-1';

    return (
      <section ref={ref} className={`w-full relative px-6 ${motionClass}`}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 text-left">
            <Eyebrow label={t.buildTitle} color="#5E6AD2" />
            <h2 className="text-4xl md:text-5xl font-bold">
              <GradientText>{t.buildTitle}</GradientText>
            </h2>
            <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.buildLead}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-10 items-start">
            <div className="relative w-full h-[70vh] min-h-[520px] rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <FourierCanvas nVal={n} lang={lang} />
              <div
                className={`transition-opacity duration-700 ease-in-out ${
                  showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ControlPanel n={n} setN={setN} lang={lang} onHoverLabel={onHoverLabel} />
                <InteractiveOverlay lang={lang} externalTooltip={externalTooltip} />
              </div>
            </div>

            <TiltCard glowColor="rgba(71,156,255,0.5)">
              <div className="p-8 space-y-5">
                <h3 className="text-2xl font-semibold text-white">{t.howToTitle}</h3>
                <ul className="space-y-3 text-sm text-[#D0D6E0]">
                  {t.buildBullets.map((line, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-[#5E6AD2] mt-0.5">•</span>
                      <span className="flex-1">{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-[#8A8F98] border-t border-white/5 pt-3">
                  {t.learningTakeawayBuild}
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    );
  }
);

BuildWavesSection.displayName = 'BuildWavesSection';
