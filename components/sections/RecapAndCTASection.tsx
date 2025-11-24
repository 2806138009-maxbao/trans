import React from "react";
import { Language, TRANSLATIONS } from "../../types";
import { TiltCard } from "../TiltCard";
import { Eyebrow, GradientText } from "./SectionHelpers";

interface RecapAndCTASectionProps {
  lang: Language;
  reducedMotion?: boolean;
}

export const RecapAndCTASection: React.FC<RecapAndCTASectionProps> = ({
  lang,
  reducedMotion,
}) => {
  const t = TRANSLATIONS[lang];
  const motionClass = reducedMotion ? "" : "fade-up delay-1";

  return (
    <section className={`w-full relative px-6 ${motionClass}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <Eyebrow label={t.recapTitle} color="#ffffff" />
        <h2 className="text-4xl md:text-5xl font-bold">
          <GradientText>{t.recapTitle}</GradientText>
        </h2>

        {/* Core Ideas Card */}
        <TiltCard glowColor="rgba(94,106,210,0.4)">
          <div className="p-8 space-y-4">
            <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98]">
              {lang === "en" ? "Core ideas" : "核心要点"}
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#D0D6E0] text-sm">
              {t.recapBullets.map((line, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/5"
                >
                  <span className="text-[#5E6AD2] mt-0.5">•</span>
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </TiltCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Students Card */}
          <TiltCard glowColor="rgba(71,156,255,0.4)">
            <div className="p-8 space-y-4">
              <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98]">
                {t.recapStudentsTitle}
              </div>
              <p className="text-sm text-[#C7CBD4] leading-relaxed">
                {t.recapStudentsLead}
              </p>
              <ul className="space-y-2 text-sm text-[#D0D6E0]">
                {t.recapStudentsBullets.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-[#479CFF] mt-0.5">{idx + 1}.</span>
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>

          {/* For Teachers Card */}
          <TiltCard glowColor="rgba(94,106,210,0.4)">
            <div className="p-8 space-y-4">
              <div className="text-sm uppercase tracking-[0.2em] text-[#8A8F98]">
                {t.recapTeachersTitle}
              </div>
              <p className="text-sm text-[#C7CBD4] leading-relaxed">
                {t.recapTeachersLead}
              </p>
              <ul className="space-y-2 text-sm text-[#D0D6E0]">
                {t.recapTeachersBullets.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-[#5E6AD2] mt-0.5">{idx + 1}.</span>
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/5 pt-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#8A8F98]">
                  {t.recapContact}
                </div>
                <div className="text-sm text-[#D0D6E0] mt-1">
                  {t.ctaEmailLabel}: {t.ctaEmailPlaceholder}
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};
