import React, { useEffect, useRef, useState } from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { GlowDot, GradientText, HoverText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface SineAsLegoSectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const SineAsLegoSection: React.FC<SineAsLegoSectionProps> = ({ lang, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? '' : 'fade-up delay-1';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amp, setAmp] = useState(1);
  const [freq, setFreq] = useState(2);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const amplitudePx = (height / 3) * amp;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5E6AD2';
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const y = height / 2 + Math.sin((x / width) * Math.PI * 2 * freq) * amplitudePx;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2 - amplitudePx);
    ctx.lineTo(20, height / 2 - amplitudePx);
    ctx.moveTo(0, height / 2 + amplitudePx);
    ctx.lineTo(20, height / 2 + amplitudePx);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.clientWidth;
      canvas.height = 240;
    }
    draw();
    const onResize = () => {
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = 240;
        draw();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    draw();
  }, [amp, freq]);

  if (reducedMotion) {
    return (
      <section id="sine-lego" className="w-full relative px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr,1.1fr] gap-6 sm:gap-10 items-center">
          <TiltCard glowColor="rgba(255,255,255,0.3)">
            <div className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4 text-left">
              <div className="flex items-center gap-2 sm:gap-3">
                <GlowDot color="#ffffff" />
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold"><GradientText>{t.sineLegoTitle}</GradientText></h2>
              </div>
              <p className="text-base sm:text-lg text-[#D0D6E0] leading-relaxed hover-text">{t.sineLegoLead}</p>
            </div>
          </TiltCard>
          <TiltCard glowColor="rgba(94,106,210,0.5)">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <canvas ref={canvasRef} className="w-full rounded-xl bg-[#0B0C0E]" style={{ touchAction: 'pan-y pinch-zoom' }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8A8F98] hover-text-subtle">{t.sineLegoAmp}</label>
                  <input type="range" min={0.2} max={2} step={0.1} value={amp} onChange={(e) => setAmp(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8A8F98] hover-text-subtle">{t.sineLegoFreq}</label>
                  <input type="range" min={0.5} max={8} step={0.5} value={freq} onChange={(e) => setFreq(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <section id="sine-lego" className="w-full relative px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr,1.1fr] gap-6 sm:gap-10 items-center">
        <AnimateOnScroll animation="slide-left">
          <TiltCard glowColor="rgba(255,255,255,0.3)">
            <div className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4 text-left">
              <div className="flex items-center gap-2 sm:gap-3">
                <GlowDot color="#ffffff" />
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold">
                  <GradientText>{t.sineLegoTitle}</GradientText>
                </h2>
              </div>
              <HoverText as="p" className="text-base sm:text-lg text-[#D0D6E0] leading-relaxed">
                {t.sineLegoLead}
              </HoverText>
            </div>
          </TiltCard>
        </AnimateOnScroll>

        <AnimateOnScroll animation="slide-right" delay={150}>
          <TiltCard glowColor="rgba(94,106,210,0.5)">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <canvas ref={canvasRef} className="w-full rounded-xl bg-[#0B0C0E]" style={{ touchAction: 'pan-y pinch-zoom' }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8A8F98] hover-text-subtle inline-block origin-left">
                    {t.sineLegoAmp}
                  </label>
                  <input type="range" min={0.2} max={2} step={0.1} value={amp} onChange={(e) => setAmp(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8A8F98] hover-text-subtle inline-block origin-left">
                    {t.sineLegoFreq}
                  </label>
                  <input type="range" min={0.5} max={8} step={0.5} value={freq} onChange={(e) => setFreq(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </TiltCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
};
