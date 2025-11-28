import React, { useMemo } from 'react';
import { Language, TooltipContent, TRANSLATIONS, WaveformType } from '../../types';
import { FourierCanvas } from '../FourierCanvas';
import { InteractiveOverlay } from '../InteractiveOverlay';
import { TiltCard } from '../TiltCard';
import { HudTiltContainer } from '../HudTiltContainer';
import { WaveformSelector } from '../WaveformSelector';
import { GlowDot, GradientText } from './SectionHelpers';
import { AnimateOnScroll } from '../AnimateOnScroll';
import { HarmonicsSlider } from '../SliderWithTooltip';
import { Info } from 'lucide-react';
import { getWaveformDescription } from '../../hooks/useHarmonicSeries';

interface BuildWavesSectionProps {
  lang: Language;
  n: number;
  setN: (val: number) => void;
  waveformType: WaveformType;
  setWaveformType: (type: WaveformType) => void;
  externalTooltip: TooltipContent | null;
  onHoverLabel: (isHovering: boolean) => void;
  showControls: boolean;
  reducedMotion?: boolean;
}

export const BuildWavesSection = React.forwardRef<HTMLDivElement, BuildWavesSectionProps>(
  ({ lang, n, setN, waveformType, setWaveformType, externalTooltip, onHoverLabel, showControls, reducedMotion }, ref) => {
    const t = TRANSLATIONS[lang];
    const motionClass = reducedMotion ? '' : 'fade-up delay-1';
    const waveformInfo = getWaveformDescription(waveformType, lang);

    // 动态生成基于当前状态的提示
    const dynamicHints = useMemo(() => {
      const hints: { text: string; highlight?: boolean }[] = [];
      
      if (lang === 'zh') {
        hints.push({ 
          text: `当前波形: ${waveformInfo.name}`,
          highlight: true 
        });
        hints.push({ 
          text: `使用 ${n} 个谐波`,
          highlight: true 
        });
        
        if (n <= 3) {
          hints.push({ text: '谐波数量较少，波形轮廓模糊。试着增加 N 看看边缘变化。' });
        } else if (n <= 9) {
          hints.push({ text: '开始看到波形特征了！继续增加 N 会让边缘更锐利。' });
        } else if (n <= 21) {
          hints.push({ text: '波形已经非常接近目标形状，棱角分明。' });
        } else {
          hints.push({ text: '高阶谐波主要在打磨极细的边缘细节。' });
        }

        if (waveformType === 'square') {
          hints.push({ text: '方波只用奇次谐波 (1, 3, 5...)，因为它具有半波对称性。' });
        } else if (waveformType === 'triangle') {
          hints.push({ text: '三角波也只用奇次谐波，但系数衰减更快 (1/n²)，所以更平滑。' });
        } else {
          hints.push({ text: '锯齿波需要所有谐波 (1, 2, 3...)，因为它不具有半波对称性。' });
        }
      } else {
        hints.push({ 
          text: `Current: ${waveformInfo.name}`,
          highlight: true 
        });
        hints.push({ 
          text: `Using ${n} harmonics`,
          highlight: true 
        });
        
        if (n <= 3) {
          hints.push({ text: 'Low harmonic count - the shape is still rough. Try increasing N.' });
        } else if (n <= 9) {
          hints.push({ text: 'Starting to see the waveform shape! More harmonics will sharpen edges.' });
        } else if (n <= 21) {
          hints.push({ text: 'Very close to the target shape with sharp corners.' });
        } else {
          hints.push({ text: 'Higher harmonics mainly refine the finest edge details.' });
        }

        if (waveformType === 'square') {
          hints.push({ text: 'Square waves use only odd harmonics (1, 3, 5...) due to half-wave symmetry.' });
        } else if (waveformType === 'triangle') {
          hints.push({ text: 'Triangle waves also use odd harmonics, but decay faster (1/n²), hence smoother.' });
        } else {
          hints.push({ text: 'Sawtooth needs all harmonics (1, 2, 3...) due to lack of half-wave symmetry.' });
        }
      }

      return hints;
    }, [lang, n, waveformType, waveformInfo.name]);

    const scrollToFormula = () => {
      const nextSection = document.getElementById('formula-section');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    };

    if (reducedMotion) {
      return (
        <section id="build-waves" ref={ref} className="w-full relative px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center gap-3"><GlowDot color="#5E6AD2" /><h2 className="text-4xl md:text-5xl font-bold"><GradientText>{t.buildTitle}</GradientText></h2></div>
              <p className="text-lg text-[#D0D6E0] leading-relaxed max-w-2xl hover-text">{t.buildLead}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-8 items-start">
              <div className="flex flex-col gap-5">
                <HudTiltContainer className="relative w-full h-[55vh] min-h-[400px]" glowColor="rgba(94, 106, 210, 0.5)">
                  <FourierCanvas nVal={n} waveformType={waveformType} lang={lang} />
                  <InteractiveOverlay lang={lang} externalTooltip={externalTooltip} />
                </HudTiltContainer>
                <div className={`transition-all duration-500 ease-out ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 rounded-2xl bg-[#121316]/60 backdrop-blur-xl border border-white/5">
                    <WaveformSelector selected={waveformType} onChange={setWaveformType} lang={lang} />
                    <div className="hidden sm:block w-px h-8 bg-white/10" /><div className="sm:hidden w-full h-px bg-white/10" />
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <label className="text-[11px] font-medium tracking-wider uppercase text-[#8A8F98] whitespace-nowrap" onMouseEnter={() => onHoverLabel(true)} onMouseLeave={() => onHoverLabel(false)}>{t.harmonics}</label>
                      <div className="flex items-center gap-3 flex-1 sm:flex-none">
                        <input type="range" min="1" max="50" step="1" value={n} onChange={(e) => setN(parseInt(e.target.value))} className="w-24 sm:w-32" />
                        <span className="font-mono text-sm text-white bg-white/5 px-2.5 py-1 rounded-md border border-white/10 min-w-[52px] text-center">N={n}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <TiltCard glowColor="rgba(71,156,255,0.5)">
                <div className="p-6 md:p-8 space-y-5">
                  <div className="flex items-center justify-between"><h3 className="text-xl md:text-2xl font-semibold text-white">{t.howToTitle}</h3></div>
                  <div className="space-y-3">{dynamicHints.map((hint, idx) => (<div key={idx} className={`flex gap-2.5 leading-relaxed text-sm hover-text-subtle ${hint.highlight ? 'p-3 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20' : ''}`}><span className={hint.highlight ? 'text-[#5E6AD2] mt-0.5 flex-shrink-0' : 'text-[#5E6AD2] mt-1 flex-shrink-0'}>{hint.highlight ? <Info size={14} /> : '•'}</span><span className={`select-text selection:bg-[#5E6AD2]/50 selection:text-white ${hint.highlight ? 'text-[#D0D6E0] font-medium' : 'text-[#D0D6E0]'}`}>{hint.text}</span></div>))}</div>
                  <div className="text-xs text-[#8A8F98] border-t border-white/5 pt-4 leading-relaxed hover-text-subtle select-text selection:bg-[#5E6AD2]/50 selection:text-white">{t.learningTakeawayBuild}</div>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section id="build-waves" ref={ref} className="w-full relative px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Section Header */}
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-col gap-3 sm:gap-4 text-left">
              <div className="flex items-center gap-2 sm:gap-3">
                <GlowDot color="#5E6AD2" />
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold">
                  <GradientText>{t.buildTitle}</GradientText>
                </h2>
              </div>
              <p className="text-base sm:text-lg text-[#D0D6E0] leading-relaxed max-w-2xl hover-text">{t.buildLead}</p>
              <p className="text-xs sm:text-sm text-[#8A8F98] max-w-2xl hover-text-subtle">
                {lang === 'zh'
                  ? `你正在构建 ${waveformInfo.name} 波形，使用 N=${n} 个谐波；往下会看到它的公式和频谱。`
                  : `You're building a ${waveformInfo.name} with N=${n} harmonics—next you'll see its formula and spectrum.`}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6 sm:gap-8 items-start">
            {/* Left: Canvas + Controls */}
            <AnimateOnScroll animation="scale" delay={100}>
              <div className="flex flex-col gap-4 sm:gap-5">
                {/* Canvas Container */}
                <HudTiltContainer className="relative w-full h-[45vh] sm:h-[55vh] min-h-[300px] sm:min-h-[400px]" glowColor="rgba(94, 106, 210, 0.5)">
                  <FourierCanvas nVal={n} waveformType={waveformType} lang={lang} />
                  <InteractiveOverlay lang={lang} externalTooltip={externalTooltip} />
                </HudTiltContainer>
              
              {/* Control Bar */}
              <div 
                className={`transition-all duration-500 ease-out ${
                  showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 rounded-2xl bg-[#121316]/60 backdrop-blur-xl border border-white/5">
                  {/* Waveform Type Selector */}
                  <WaveformSelector 
                    selected={waveformType} 
                    onChange={setWaveformType} 
                    lang={lang} 
                  />
                  
                  {/* Divider */}
                  <div className="hidden sm:block w-px h-8 bg-white/10" />
                  <div className="sm:hidden w-full h-px bg-white/10" />
                  
                  {/* Harmonics Slider with Tooltip */}
                  <div 
                    onMouseEnter={() => onHoverLabel(true)}
                    onMouseLeave={() => onHoverLabel(false)}
                  >
                    <HarmonicsSlider
                      value={n}
                      onChange={setN}
                      label={t.harmonics}
                      lang={lang}
                    />
                  </div>
                </div>
              </div>
            </div>
            </AnimateOnScroll>

            {/* Right: Dynamic Info Card */}
            <AnimateOnScroll animation="slide-right" delay={200}>
              <div className="flex flex-col gap-4">
                <TiltCard glowColor="rgba(71,156,255,0.5)">
                <div className="p-6 md:p-8 space-y-5">
                  {/* Current State Badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-semibold text-white">{t.howToTitle}</h3>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_6px_#5E6AD2]" />
                      <span className="text-[10px] font-medium text-[#5E6AD2] uppercase tracking-wider">
                        {lang === 'zh' ? '实时' : 'Live'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Hints based on current state */}
                  <div className="space-y-3">
                    {dynamicHints.map((hint, idx) => (
                      <div 
                        key={idx}
                        className={`flex gap-2.5 leading-relaxed text-sm hover-text-subtle ${
                          hint.highlight 
                            ? 'p-3 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20' 
                            : ''
                        }`}
                      >
                        {hint.highlight ? (
                          <Info size={14} className="text-[#5E6AD2] mt-0.5 flex-shrink-0" />
                        ) : (
                          <span className="text-[#5E6AD2] mt-1 flex-shrink-0">•</span>
                        )}
                        <span className={`select-text selection:bg-[#5E6AD2]/50 selection:text-white ${hint.highlight ? 'text-[#D0D6E0] font-medium' : 'text-[#D0D6E0]'}`}>
                          {hint.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Takeaway */}
                  <div className="text-xs text-[#8A8F98] border-t border-white/5 pt-4 leading-relaxed hover-text-subtle select-text selection:bg-[#5E6AD2]/50 selection:text-white">
                    {t.learningTakeawayBuild}
                  </div>
                </div>
              </TiltCard>
            </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    );
  }
);

BuildWavesSection.displayName = 'BuildWavesSection';


