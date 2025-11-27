import React, { useEffect, useRef } from 'react';
import { Language, TRANSLATIONS, WaveformType } from '../../types';
import { useHarmonicSeries, getWaveformDescription } from '../../hooks/useHarmonicSeries';
import { TiltCard } from '../TiltCard';
import { GlowDot, GradientText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';

interface TimeFrequencySectionProps {
  lang: Language;
  n: number;
  waveformType: WaveformType;
  reducedMotion?: boolean;
  id?: string;
  nextId?: string;
}

export const TimeFrequencySection: React.FC<TimeFrequencySectionProps> = ({ 
  lang, 
  n, 
  waveformType,
  reducedMotion,
  id = "spectrum-section",
  nextId = "epicycle-section",
}) => {
  const t = TRANSLATIONS[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionClass = reducedMotion ? '' : 'fade-up delay-2';
  
  // 使用共享的谐波数据
  const harmonics = useHarmonicSeries(waveformType, Math.min(n, 15));
  const waveformInfo = getWaveformDescription(waveformType, lang);

  useEffect(() => {
    const drawSpectrum = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (harmonics.length === 0) return;

      const maxAmplitude = Math.max(...harmonics.map(h => h.amplitude));
      const barWidth = canvas.width / harmonics.length;

      harmonics.forEach((harmonic, idx) => {
        const height = (harmonic.amplitude / maxAmplitude) * (canvas.height - 50);
        const x = idx * barWidth + barWidth * 0.15;
        const y = canvas.height - height - 30;
        
        // 渐变色条
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height - 30);
        grad.addColorStop(0, 'rgba(94,106,210,0.9)');
        grad.addColorStop(1, 'rgba(94,106,210,0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth * 0.7, height);

        // 顶部高亮
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(x, y, barWidth * 0.7, 2);

        // 标签
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`n=${harmonic.order}`, x + barWidth * 0.35, canvas.height - 10);
      });

      // 基线
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 30);
      ctx.lineTo(canvas.width, canvas.height - 30);
      ctx.stroke();

      // 频率轴标签
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(lang === 'zh' ? '频率 →' : 'Frequency →', canvas.width - 10, canvas.height - 35);
    };

    drawSpectrum();
    window.addEventListener('resize', drawSpectrum);
    return () => window.removeEventListener('resize', drawSpectrum);
  }, [harmonics, lang]);

  if (reducedMotion) {
    return (
      <section id={id} className="w-full relative px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
          <TiltCard glowColor="rgba(255,255,255,0.3)">
            <div className="p-8 space-y-4 text-left">
              <div className="flex items-center gap-3"><GlowDot color="#ffffff" /><h2 className="text-4xl md:text-5xl font-bold"><GradientText>{t.timeFreqTitle}</GradientText></h2></div>
              <p className="text-lg text-[#D0D6E0] leading-relaxed">{t.timeFreqLead}</p>
            </div>
          </TiltCard>
          <TiltCard glowColor="rgba(71,156,255,0.4)">
            <div className="p-6 space-y-4"><canvas ref={canvasRef} className="w-full rounded-xl bg-[#0B0C0E]" /></div>
          </TiltCard>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="w-full relative px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
        <AnimateOnScroll animation="slide-left">
          <TiltCard glowColor="rgba(255,255,255,0.3)">
            <div className="p-8 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <GlowDot color="#ffffff" />
                <h2 className="text-4xl md:text-5xl font-bold">
                  <GradientText>{t.timeFreqTitle}</GradientText>
                </h2>
              </div>
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
        </AnimateOnScroll>

        <AnimateOnScroll animation="slide-right" delay={150}>
          <TiltCard glowColor="rgba(71,156,255,0.4)">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.2em] text-[#8A8F98]">
                  {lang === 'en' ? 'Spectrum Preview' : '频谱预览'}
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]" />
                  <span className="text-[10px] font-medium text-[#5E6AD2]">{waveformInfo.name}</span>
                </div>
              </div>
              <canvas ref={canvasRef} className="w-full rounded-xl bg-[#0B0C0E]" />
              <div className="space-y-2">
                <div className="text-xs text-[#C7CBD4] leading-relaxed"><span className="text-[#5E6AD2] font-medium">{waveformInfo.harmonics}</span></div>
                <div className="text-xs text-[#8A8F98] leading-relaxed">{waveformInfo.note}</div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="text-xs text-[#8A8F98] leading-relaxed">{t.learningTakeawaySpectrum}</div>
              </div>
            </div>
          </TiltCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
};
