import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Language } from "../types";
import { SmithChartCanvas } from "./SmithChartCanvas";
import { HackerText } from "./HackerText";

interface SmithOdysseyProps {
  lang: Language;
  onComplete?: () => void;
  reducedMotion?: boolean;
}

interface InteractiveTermProps {
  children: React.ReactNode;
  onHover?: (isHovering: boolean) => void;
  onClick?: () => void;
  highlightColor?: string;
}

type VisualMode = "void" | "genesis" | "impedance" | "reflection" | "lab";

interface RFStats {
  gammaMag: number;
  gammaPhase: number;
  vswr: number;
}

const InteractiveTerm: React.FC<InteractiveTermProps> = ({
  children,
  onHover,
  onClick,
  highlightColor = "#FFC700",
}) => (
  <span
    className="relative inline-block cursor-pointer group"
    onMouseEnter={() => onHover?.(true)}
    onMouseLeave={() => onHover?.(false)}
    onClick={onClick}
  >
    <span
      className="relative z-10 transition-colors duration-300 group-hover:text-black font-semibold"
      style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}
    >
      {children}
    </span>
    <span
      className="absolute inset-0 -inset-x-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-0 rounded-sm"
      style={{ backgroundColor: highlightColor }}
    />
  </span>
);

const ScrollHint: React.FC<{ text: string; visible: boolean }> = ({
  text,
  visible,
}) => (
  <div
    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500"
    style={{ opacity: visible ? 1 : 0 }}
  >
    <span
      className="text-[10px] uppercase tracking-[0.2em]"
      style={{
        color: "rgba(255, 255, 255, 0.4)",
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      {text}
    </span>
    <div className="w-5 h-8 rounded-full border border-white/30 flex justify-center pt-2">
      <div
        className="w-1 h-2 rounded-full bg-white/50"
        style={{ animation: "scrollPulse 2s ease-in-out infinite" }}
      />
    </div>
  </div>
);

interface SectionTextProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  instruction?: React.ReactNode;
  visible: boolean;
  position?: "center" | "bottom-left";
  children?: React.ReactNode;
}

const SectionText: React.FC<SectionTextProps> = ({
  eyebrow,
  title,
  subtitle,
  instruction,
  visible,
  position = "center",
  children,
}) => {
  const isBottomLeft = position === "bottom-left";
  const positionClasses =
    position === "center"
      ? "items-center justify-center text-center"
      : "items-start justify-end pb-24 pl-12";

  return (
    <div
      className={`absolute inset-0 flex flex-col ${positionClasses} pointer-events-none transition-all duration-700`}
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 30}px)`,
      }}
    >
      <div
        className={`flex flex-col ${
          isBottomLeft ? "items-start text-left" : "items-center text-center"
        }`}
      >
        {eyebrow && (
          <div
            className="mb-4 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255, 199, 0, 0.1)",
              border: "1px solid rgba(255, 199, 0, 0.3)",
            }}
          >
            <span
              className="text-[11px] tracking-[0.15em]"
              style={{
                color: "#FFC700",
                fontFamily: '"Space Grotesk", "Noto Sans SC", sans-serif',
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <h2
          className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-4 ${
            isBottomLeft ? "text-left" : ""
          }`}
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className={`text-lg md:text-xl mb-6 ${
              isBottomLeft ? "text-left" : ""
            }`}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {subtitle}
          </p>
        )}

        {instruction && (
          <p
            className={`text-sm md:text-base px-4 py-2 rounded-lg ${
              isBottomLeft ? "text-left" : ""
            }`}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Noto Sans SC", sans-serif',
              color: "rgba(255, 215, 0, 0.8)",
              backgroundColor: "rgba(255, 215, 0, 0.1)",
              border: "1px solid rgba(255, 215, 0, 0.2)",
            }}
          >
            {instruction}
          </p>
        )}

        {children}
      </div>
    </div>
  );
};

interface DataDisplayProps {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  visible: boolean;
}

const DataDisplay: React.FC<DataDisplayProps> = ({
  label,
  value,
  unit,
  highlight,
  visible,
}) => (
  <div
    className="flex flex-col items-center transition-all duration-500"
    style={{
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : 20}px)`,
    }}
  >
    <span
      className="text-[10px] uppercase tracking-[0.15em] mb-1"
      style={{ color: "rgba(255, 255, 255, 0.4)" }}
    >
      {label}
    </span>
    <span
      className="text-2xl md:text-3xl font-mono font-bold"
      style={{
        color: highlight ? "#FF5050" : "#FFC700",
      }}
    >
      {value}
      {unit && <span className="text-lg ml-1 opacity-60">{unit}</span>}
    </span>
  </div>
);

const calculateRF = (z: { r: number; x: number }): RFStats => {
  const denom = (z.r + 1) * (z.r + 1) + z.x * z.x;
  if (denom === 0) {
    return { gammaMag: 1, gammaPhase: 0, vswr: Infinity };
  }

  const gammaRe = (z.r * z.r + z.x * z.x - 1) / denom;
  const gammaIm = (2 * z.x) / denom;
  const gammaMag = Math.sqrt(gammaRe * gammaRe + gammaIm * gammaIm);
  const gammaPhase = (Math.atan2(gammaIm, gammaRe) * 180) / Math.PI;
  const vswr = gammaMag < 0.9999 ? (1 + gammaMag) / (1 - gammaMag) : Infinity;

  return { gammaMag, gammaPhase, vswr };
};

export const SmithOdyssey: React.FC<SmithOdysseyProps> = ({
  lang,
  onComplete,
  reducedMotion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [liveImpedance, setLiveImpedance] = useState({ r: 1, x: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const sectionHeight = window.innerHeight;
      const section = Math.round(scrollTop / sectionHeight);
      setCurrentSection(section);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const canvasDirectorProps = useMemo(() => {
    const config: {
      visualMode: VisualMode;
      overrideImpedance?: { r: number; x: number };
      allowDirectDrag?: boolean;
      showVector?: boolean;
    } = { visualMode: "void" };

    switch (currentSection) {
      case 0:
        config.visualMode = "void";
        break;
      case 1:
        config.visualMode = "genesis";
        break;
      case 2:
        config.visualMode = "impedance";
        config.overrideImpedance = { r: 1, x: 1 };
        config.allowDirectDrag = true;
        break;
      case 3:
        config.visualMode = "reflection";
        config.overrideImpedance = { r: 0.5, x: -0.5 };
        config.showVector = true;
        config.allowDirectDrag = true;
        break;
      case 4:
        config.visualMode = "lab";
        config.allowDirectDrag = true;
        break;
      default:
        config.visualMode = "void";
    }

    return config;
  }, [currentSection]);

  // When allowDirectDrag is true, use liveImpedance (from dragging)
  // Otherwise use overrideImpedance as the display value
  const displayedImpedance = canvasDirectorProps.allowDirectDrag
    ? liveImpedance
    : canvasDirectorProps.overrideImpedance ?? liveImpedance;
  const rf = useMemo(
    () => calculateRF(displayedImpedance),
    [displayedImpedance]
  );

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll"
      style={{
        scrollSnapType: "y mandatory",
        backgroundColor: "#050505",
        cursor: canvasDirectorProps.allowDirectDrag ? "crosshair" : "default",
      }}
    >
      <div
        className="fixed inset-0 z-0 transition-all duration-1000 ease-out pointer-events-none"
        style={{
          transform: currentSection === 4 ? "scale(0.6)" : "scale(1)",
          filter: currentSection === 4 ? "blur(12px)" : "blur(0px)",
        }}
      >
        <SmithChartCanvas
          lang={lang === "zh" ? "zh" : "en"}
          reducedMotion={reducedMotion}
          visualMode={canvasDirectorProps.visualMode}
          overrideImpedance={canvasDirectorProps.overrideImpedance ?? null}
          allowDirectDrag={!!canvasDirectorProps.allowDirectDrag}
          showVector={canvasDirectorProps.showVector}
          showVSWRCircles
          onDirectDrag={
            canvasDirectorProps.allowDirectDrag
              ? (z) => setLiveImpedance(z)
              : undefined
          }
        />
      </div>

      <div className="relative z-10 pointer-events-none">
        <section className="relative w-full h-screen flex items-center justify-center snap-start">
          <ScrollHint
            text={lang === "zh" ? "初始化系统" : "INITIALIZING SYSTEM"}
            visible={currentSection === 0}
          />
        </section>

        <section className="relative w-full h-screen flex items-center justify-center snap-start">
          <SectionText
            eyebrow={lang === "zh" ? "几何直觉" : "GEOMETRIC INTUITION"}
            title={
              <HackerText
                key={`title-void-${currentSection === 1}`}
                text={lang === "zh" ? "无限，折叠" : "Infinity, Folded"}
              />
            }
            subtitle={
              lang === "zh"
                ? "整个复平面，被引力捕获进一个圆。"
                : "The entire complex plane, captured by gravity into a circle."
            }
            visible={currentSection === 1}
          >
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto px-8 transition-all duration-700 delay-300 pointer-events-auto"
              style={{
                opacity: currentSection === 1 ? 1 : 0,
                transform: `translateY(${currentSection === 1 ? 0 : 40}px)`,
              }}
            >
              <div className="p-6 rounded-2xl border border-white/10 bg-[#16140F]/95 text-left hover:border-[#FFC700]/50 transition-colors">
                <h3 className="text-[#FFC700] font-mono text-xs uppercase tracking-widest mb-2">
                  1939
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {lang === "zh"
                    ? "在硅基芯片诞生前，工程师用纸笔计算宇宙。"
                    : "Before silicon, engineers calculated the universe with pen and paper."}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#16140F]/95 text-left hover:border-[#FFC700]/50 transition-colors">
                <h3 className="text-[#FFC700] font-mono text-xs uppercase tracking-widest mb-2">
                  {lang === "zh" ? "幽灵" : "GHOST"}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {lang === "zh"
                    ? "反射是信号的幽灵。它偷走能量，烧毁功放。必须消灭。"
                    : "Reflection is the ghost of the signal. It steals energy, burns amps. It must be destroyed."}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#16140F]/95 text-left hover:border-[#FFC700]/50 transition-colors">
                <h3 className="text-[#FFC700] font-mono text-xs uppercase tracking-widest mb-2">
                  {lang === "zh" ? "视角" : "PERSPECTIVE"}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {lang === "zh"
                    ? "Z 是串联的秩序，Y 是并联的自由。殊途同归。"
                    : "Z is the order of series. Y is the freedom of parallel. All roads lead home."}
                </p>
              </div>
            </div>
          </SectionText>
        </section>

        <section className="relative w-full h-screen snap-start">
          <SectionText
            eyebrow={lang === "zh" ? "相位 1.0" : "PHASE 1.0"}
            title={
              <HackerText
                key={`title-impedance-${currentSection === 2}`}
                text={lang === "zh" ? "阻抗" : "Impedance"}
              />
            }
            subtitle={
              lang === "zh" ? "电路的心跳。" : "The heartbeat of the circuit."
            }
            instruction={
              lang === "zh" ? (
                <span>
                  移动光点。 <InteractiveTerm>建立连接</InteractiveTerm>。
                </span>
              ) : (
                <span>
                  Move the point.{" "}
                  <InteractiveTerm>Establish connection</InteractiveTerm>.
                </span>
              )
            }
            visible={currentSection === 2}
            position="bottom-left"
          >
            <div className="mt-8 flex gap-8 pointer-events-none">
              <DataDisplay
                label="Resistance (R)"
                value={displayedImpedance.r.toFixed(1)}
                unit="Ω"
                visible={currentSection === 2}
              />
              <DataDisplay
                label="Reactance (X)"
                value={displayedImpedance.x.toFixed(1)}
                unit="jΩ"
                visible={currentSection === 2}
              />
            </div>
          </SectionText>
        </section>

        <section className="relative w-full h-screen snap-start">
          <SectionText
            eyebrow={lang === "zh" ? "相位 2.0" : "PHASE 2.0"}
            title={
              <HackerText
                key={`title-reflection-${currentSection === 3}`}
                text={lang === "zh" ? "驻波" : "Standing Wave"}
              />
            }
            subtitle={
              lang === "zh" ? (
                <span>
                  反射即敌人。 <InteractiveTerm>沉默是金</InteractiveTerm>。
                </span>
              ) : (
                <span>
                  Reflection is the enemy.{" "}
                  <InteractiveTerm>Silence is golden</InteractiveTerm>.
                </span>
              )
            }
            instruction={
              lang === "zh" ? (
                <span>
                  收缩红线。 <InteractiveTerm>归零</InteractiveTerm>。
                </span>
              ) : (
                <span>
                  Shrink the red line.{" "}
                  <InteractiveTerm>Return to zero</InteractiveTerm>.
                </span>
              )
            }
            visible={currentSection === 3}
            position="bottom-left"
          />

          <div className="absolute top-1/2 right-12 -translate-y-1/2 space-y-8 pointer-events-none">
            <DataDisplay
              label={lang === "zh" ? "驻波比" : "VSWR"}
              value={rf.vswr >= 100 ? "∞" : rf.vswr.toFixed(2)}
              highlight={rf.vswr > 1.5}
              visible={currentSection === 3}
            />
            <DataDisplay
              label={lang === "zh" ? "反射系数" : "Γ"}
              value={rf.gammaMag.toFixed(3)}
              highlight={rf.gammaMag > 0.2}
              visible={currentSection === 3}
            />
          </div>
        </section>

        <section className="relative w-full h-screen flex items-center justify-center snap-start">
          <div className="text-center">
            <SectionText
              eyebrow={lang === "zh" ? "终端" : "TERMINAL"}
              title={
                <HackerText
                  key={`title-lab-${currentSection === 4}`}
                  text={lang === "zh" ? "完全控制" : "Full Control"}
                />
              }
              subtitle={
                lang === "zh"
                  ? "Luminous 实验室准备就绪。"
                  : "Luminous Lab is ready."
              }
              instruction={
                lang === "zh" ? "仪器已校准" : "Instrument Calibrated"
              }
              visible={currentSection === 4}
            >
              <button
                onClick={handleComplete}
                className="mt-6 px-8 py-4 rounded-full bg-[#FFC700] text-black font-bold tracking-widest uppercase hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,199,0,0.4)]"
                style={{
                  opacity: currentSection === 4 ? 1 : 0,
                  pointerEvents: currentSection === 4 ? "auto" : "none",
                  transitionDelay: "500ms",
                }}
              >
                {lang === "zh" ? "进入实验室" : "ENTER LAB"}
              </button>
            </SectionText>
          </div>
        </section>
      </div>
    </div>
  );
};
