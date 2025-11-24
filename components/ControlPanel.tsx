import React from "react";
import { Language, TRANSLATIONS, COLORS } from "../types";
import { TiltCard } from "./TiltCard";

interface ControlPanelProps {
  n: number;
  setN: (val: number) => void;
  lang: Language;
  onHoverLabel: (isHovering: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  n,
  setN,
  lang,
  onHoverLabel,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div
      id="control-panel-container"
      className="fixed left-0 right-0 bottom-0 md:bottom-10 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 w-full md:w-[90%] max-w-none md:max-w-[360px] p-0 z-20 px-4 pb-4 md:px-0 md:pb-0"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <TiltCard
        className="p-0 overflow-hidden"
        glowColor="rgba(255, 255, 255, 0.3)"
      >
        <div className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label
              className="text-[#D0D6E0] text-xs font-medium uppercase tracking-wider cursor-help transition-all duration-300 ease-out origin-left inline-block hover:scale-110 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              onMouseEnter={() => onHoverLabel(true)}
              onMouseLeave={() => onHoverLabel(false)}
            >
              {t.harmonics}
            </label>
            <span className="text-sm font-mono text-[#8A8F98] bg-white/5 px-2 py-0.5 rounded border border-white/5 transition-colors hover:text-white hover:border-white/20">
              N = {n}
            </span>
          </div>

          <div className="relative w-full flex items-center py-2">
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              className="w-full z-10 cursor-pointer"
              style={{ opacity: 0.8 }}
            />
          </div>

          <div className="border-t border-white/5 pt-3">
            <p className="text-center text-[10px] text-[#8A8F98] font-medium tracking-wide">
              {t.dragInstruction}
            </p>
          </div>
        </div>
      </TiltCard>
    </div>
  );
};
