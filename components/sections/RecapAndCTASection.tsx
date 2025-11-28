import React, { useState } from "react";
import { Language, TRANSLATIONS } from "../../types";
import { TiltCard } from "../TiltCard";
import { GlowDot, GradientText } from "./SectionHelpers";
import { AnimateOnScroll } from "../AnimateOnScroll";

interface RecapAndCTASectionProps {
  lang: Language;
  reducedMotion?: boolean;
  id?: string;
}

/**
 * 合并后的总结与 CTA 区
 * 包含：核心要点 + 学生指南 + 教师指南 + 统一的行动号召
 */
export const RecapAndCTASection: React.FC<RecapAndCTASectionProps> = ({
  lang,
  reducedMotion,
  id,
}) => {
  const t = TRANSLATIONS[lang];
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 接入实际的邮件订阅服务
    console.log("Email submitted:", email);
    setSubmitted(true);
  };

  const Wrapper = reducedMotion ? React.Fragment : AnimateOnScroll;
  const wrapperProps = reducedMotion ? {} : { animation: 'fade-up' as const };

  return (
    <section id={id} className="w-full relative px-6 py-16">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#5E6AD2]/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto space-y-12">
        {/* 章节标题 */}
        <AnimateOnScroll animation="fade-up">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <GlowDot color="#5E6AD2" />
              <h2 className="text-4xl md:text-5xl font-bold">
                <GradientText>{t.recapTitle}</GradientText>
              </h2>
            </div>
          </div>
        </AnimateOnScroll>

        {/* 核心要点 */}
        <AnimateOnScroll animation="scale" delay={100}>
          <TiltCard glowColor="rgba(94,106,210,0.4)">
          <div className="p-8">
            <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98] mb-4 hover-text-subtle">
              {lang === "en" ? "Core Ideas" : "核心要点"}
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {t.recapBullets.map((line, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/5 transition-all duration-300 hover:border-[#5E6AD2]/30 hover:bg-white/[0.05]"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5E6AD2]/10 text-[#5E6AD2] text-xs font-medium flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-[#D0D6E0] text-sm leading-relaxed hover-text-subtle select-text selection:bg-[#5E6AD2]/50 selection:text-white">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </TiltCard>
        </AnimateOnScroll>

        {/* 学生 & 教师指南 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 学生卡片 */}
          <AnimateOnScroll animation="slide-left" delay={200}>
            <TiltCard glowColor="rgba(71,156,255,0.4)">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#479CFF]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#479CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-white">{t.recapStudentsTitle}</h3>
              </div>
              <p className="text-sm text-[#C7CBD4] leading-relaxed hover-text select-text selection:bg-[#5E6AD2]/50 selection:text-white">{t.recapStudentsLead}</p>
              <ul className="space-y-2">
                {t.recapStudentsBullets.slice(0, 3).map((line, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-[#D0D6E0] hover-text-subtle">
                    <span className="text-[#479CFF] flex-shrink-0">{idx + 1}.</span>
                    <span className="leading-relaxed select-text selection:bg-[#5E6AD2]/50 selection:text-white">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
          </AnimateOnScroll>

          {/* 教师卡片 */}
          <AnimateOnScroll animation="slide-right" delay={300}>
            <TiltCard glowColor="rgba(94,106,210,0.4)">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#5E6AD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-white">{t.recapTeachersTitle}</h3>
              </div>
              <p className="text-sm text-[#C7CBD4] leading-relaxed hover-text select-text selection:bg-[#5E6AD2]/50 selection:text-white">{t.recapTeachersLead}</p>
              <ul className="space-y-2">
                {t.recapTeachersBullets.slice(0, 3).map((line, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-[#D0D6E0] hover-text-subtle">
                    <span className="text-[#5E6AD2] flex-shrink-0">{idx + 1}.</span>
                    <span className="leading-relaxed select-text selection:bg-[#5E6AD2]/50 selection:text-white">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
          </AnimateOnScroll>
        </div>

        {/* 统一 CTA */}
        <AnimateOnScroll animation="blur" delay={400}>
          <div className="max-w-2xl mx-auto">
            <TiltCard glowColor="rgba(255,255,255,0.2)">
            <div className="p-8 text-center space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  {lang === "en" ? "Stay Updated" : "保持联系"}
                </h3>
                <p className="text-sm text-[#8A8F98] leading-relaxed hover-text-subtle">
                  {lang === "en" 
                    ? "Get notified when new experiments (Bode plots, filters, control systems) go live."
                    : "当新实验（Bode 图、滤波器、控制系统）上线时，第一时间收到通知。"}
                </p>
              </div>
              
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === "en" ? "your@email.com" : "你的邮箱"}
                    required
                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#8A8F98] text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-[#5E6AD2] text-white text-sm font-medium hover:bg-[#6B77E0] transition-colors whitespace-nowrap"
                  >
                    {lang === "en" ? "Notify Me" : "订阅通知"}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[#5E6AD2]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">
                    {lang === "en" ? "You're on the list!" : "已成功订阅！"}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-[#8A8F98] hover-text-subtle">
                  {lang === "en" 
                    ? "Want to collaborate or request a custom explorable? "
                    : "想合作或定制交互式页面？"}
                  <a 
                    href="mailto:luminous.lab@example.com" 
                    className="text-[#5E6AD2] hover:underline"
                  >
                    {lang === "en" ? "Email me" : "发邮件给我"}
                  </a>
                </p>
              </div>
            </div>
          </TiltCard>
        </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};
