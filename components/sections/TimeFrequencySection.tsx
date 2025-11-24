import React, { useEffect, useRef } from 'react';
import { Language, TRANSLATIONS } from '../../types';
import { TiltCard } from '../TiltCard';
import { Eyebrow, GradientText } from './SectionHelpers';

interface TimeFrequencySectionProps {
  lang: Language;
  n: number;
  reducedMotion?: boolean;
}

export const TimeFrequencySection: React.FC<TimeFrequencySectionProps> = ({ lang, n, reducedMotion }) => {
  const t = TRANSLATIONS[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionClass = reducedMotion ? '' : 'fade-up delay-2';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bars = [];
    const count = Math.min(Math.max(3, n), 15);
    for (let i = 0; i < count; i++) {
      const harmonic = i * 2 + 1;
      const coeff = 4 / (harmonic * Math.PI);
      bars.push({ harmonic, coeff });
    }

    const maxCoeff = Math.max(...bars.map((b) => b.coeff));
    const barWidth = canvas.width / bars.length;

    bars.forEach((bar, idx) => {
      const height = (bar.coeff / maxCoeff) * (canvas.height - 40);
      const x = idx * barWidth + barWidth * 0.2;
      const y = canvas.height - height - 20;
      const grad = ctx.createLinearGradient(0, y, 0, canvas.height - 20);
      grad.addColorStop(0, 'rgba(94,106,210,0.9)');
      grad.addColorStop(1, 'rgba(94,106,210,0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth * 0.6, height);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`n=${bar.harmonic}`, x + barWidth * 0.3, canvas.height - 6);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
  }, [n]);

  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = 200;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
        <TiltCard glowColor="rgba(255,255,255,0.3)">
          <div className="p-8 space-y-4 text-left">
            <Eyebrow label={t.timeFreqTitle} color="#ffffff" />
            <h2 className="text-4xl md:text-5xl font-bold">
              <GradientText>{t.timeFreqTitle}</GradientText>
            </h2>
            <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.timeFreqLead}</p>
            <ul className="space-y-2 text-sm text-[#D0D6E0]">
              {t.timeFreqBullets.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[#5E6AD2] mt-0.5">•</span>
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </TiltCard>

        <TiltCard glowColor="rgba(71,156,255,0.4)">
          <div className="p-6 space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-[#8A8F98]">
              {lang === 'en' ? 'Mini spectrum preview' : '迷你频谱预览'}
            </div>
            <canvas ref={canvasRef} className="w-full rounded-xl bg-[#0B0C0E]" />
            <div className="text-xs text-[#8A8F98]">
              {lang === 'en'
                ? 'Higher N adds more spikes on the right — that’s the “edge sharpening” you see in time-domain.'
                : 'N 越大，右侧高频尖刺越多 —— 这就是时域里“磨边”的来源。'}
            </div>
            <div className="text-xs text-[#8A8F98]">
              {t.learningTakeawaySpectrum}
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
};
