import React, { useCallback, useEffect, useMemo, useRef, useState, MouseEvent, TouchEvent } from "react";
import { createPortal } from "react-dom";
import {
  PlayCircle,
  BookOpen,
  Activity,
  Settings,
  Layers,
  ChevronDown,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";
import { Language } from "../types";

// 检测是否为移动端
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const isNarrowScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrowScreen || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

interface SectionNavigationProps {
  lang: Language;
  reducedMotion?: boolean;
  onToggleMotion?: () => void;
}

interface Section {
  id: string;
  icon: React.ReactNode;
  label: { zh: string; en: string };
  subsections?: { id: string; label: { zh: string; en: string } }[];
}

const SECTIONS: Section[] = [
  {
    id: "hero",
    icon: <PlayCircle size={16} />,
    label: { zh: "开始", en: "Start" },
  },
  {
    id: "intuition",
    icon: <BookOpen size={16} />,
    label: { zh: "直觉", en: "Intuition" },
  },
  {
    id: "experiment",
    icon: <Activity size={16} />,
    label: { zh: "实验", en: "Lab" },
    subsections: [
      { id: "signal-drawing", label: { zh: "画信号", en: "Draw" } },
      { id: "sine-lego", label: { zh: "正弦积木", en: "Sine" } },
      { id: "build-waves", label: { zh: "拼波形", en: "Build" } },
      { id: "formula-section", label: { zh: "公式", en: "Formula" } },
      { id: "spectrum-section", label: { zh: "频谱", en: "Spectrum" } },
      { id: "epicycle-section", label: { zh: "本轮", en: "Epicycles" } },
    ],
  },
  {
    id: "application",
    icon: <Settings size={16} />,
    label: { zh: "应用", en: "Apps" },
  },
];

// 3D 效果子菜单组件
interface SubmenuDropdownProps {
  sectionId: string;
  lang: Language;
  subsections: { id: string; label: { zh: string; en: string } }[];
  activeAnchor: string;
  menuPosition: { x: number; y: number };
  onSelect: (id: string) => void;
}

const SubmenuDropdown: React.FC<SubmenuDropdownProps> = ({
  sectionId,
  lang,
  subsections,
  activeAnchor,
  menuPosition,
  onSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 轻微的 3D 倾斜
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      id={`submenu-${sectionId}`}
      className="fixed z-[9999]"
      role="menu"
      aria-label={`${lang === "zh" ? "实验子菜单" : "Lab submenu"}`}
      style={{ 
        left: menuPosition.x,
        top: menuPosition.y,
        transform: 'translateX(-50%) translateY(-100%)',
      }}
    >
      <div
        ref={menuRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative group transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dynamic Border Gradient */}
        <div 
          className="absolute inset-[-1px] rounded-xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(94, 106, 210, 0.5), transparent 60%)`
          }}
        />

        {/* Glass Surface & Spotlight */}
        <div 
          className="absolute inset-0 rounded-xl z-10 pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.08), transparent 40%)`,
            opacity: spotlight.opacity,
            transition: 'opacity 0.4s ease'
          }}
        />

        {/* Menu Content */}
        <div 
          className="relative z-20 bg-[#16171A]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 min-w-[220px] overflow-hidden"
          style={{ transform: 'translateZ(10px)' }}
        >
          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          <div className="relative p-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#8A8F98] px-3 py-2 border-b border-white/5 mb-1">
              {lang === "zh" ? "实验子章节" : "Lab Sections"}
            </div>
            {subsections.map((sub, idx) => {
              const isSubActive = activeAnchor === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelect(sub.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(sub.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 focus:outline-none focus:bg-white/10 ${
                    isSubActive
                      ? "bg-[#5E6AD2]/20 text-white border-l-2 border-[#5E6AD2]"
                      : "text-[#D0D6E0] hover:bg-white/10 hover:text-white"
                  }`}
                  role="menuitem"
                  aria-current={isSubActive ? "true" : undefined}
                  tabIndex={0}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center transition-all duration-200 ${
                    isSubActive 
                      ? "bg-[#5E6AD2] text-white shadow-[0_0_10px_rgba(94,106,210,0.5)]" 
                      : "bg-white/10 text-[#8A8F98]"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 whitespace-nowrap">{sub.label[lang]}</span>
                  {isSubActive && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#5E6AD2] shadow-[0_0_8px_#5E6AD2]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-tl" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-br" />
        </div>
      </div>
    </div>
  );
};

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  lang,
  reducedMotion,
  onToggleMotion,
}) => {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [activeAnchor, setActiveAnchor] = useState<string>("hero");
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastScrollY = useRef(0);
  const isMobile = useIsMobile();

  const anchorOrder = useMemo(
    () =>
      SECTIONS.flatMap((section) => [
        section.id,
        ...(section.subsections?.map((sub) => sub.id) || []),
      ]),
    []
  );

  // Observe sections to highlight the current anchor
  useEffect(() => {
    const allIds = anchorOrder;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const sorted = visibleEntries.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        const targetId = sorted[0].target.id;
        setActiveAnchor(targetId);

        const parent = SECTIONS.find((section) =>
          section.subsections?.some((sub) => sub.id === targetId)
        );
        if (parent) {
          setActiveSection(parent.id);
          setActiveSubsection(targetId);
        } else {
          setActiveSection(targetId);
          setActiveSubsection(null);
        }
      },
      { threshold: 0.35, rootMargin: "-20% 0px -55% 0px" }
    );

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [anchorOrder]);

  // Hide nav on fast downward scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrolledPastThreshold = currentScrollY > 200;

      setIsVisible(!scrollingDown || !scrolledPastThreshold);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setExpandedSection(null);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setExpandedSection(null);
  }, []);

  const scrollToPrevious = useCallback(() => {
    const currentIdx = anchorOrder.indexOf(activeAnchor);
    const prevId = currentIdx > 0 ? anchorOrder[currentIdx - 1] : "hero";
    scrollToSection(prevId);
  }, [activeAnchor, anchorOrder, scrollToSection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, sectionId: string, hasSubsections: boolean) => {
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (hasSubsections) {
            setExpandedSection((prev) =>
              prev === sectionId ? null : sectionId
            );
          } else {
            scrollToSection(sectionId);
          }
          break;
        case "Escape":
          setExpandedSection(null);
          break;
        case "ArrowRight":
          if (hasSubsections) {
            setExpandedSection(sectionId);
          }
          break;
        case "ArrowLeft":
          setExpandedSection(null);
          break;
      }
    },
    [scrollToSection]
  );

  // Collapse dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      const isInNav = navRef.current && navRef.current.contains(target);
      const isInSubmenu = (target as Element).closest?.('[id^="submenu-"]');
      
      if (!isInNav && !isInSubmenu) {
        setExpandedSection(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLabel = lang === "zh" ? "章节导航" : "Section Navigation";
  const brandText = lang === "zh" ? "Luminous Lab" : "Luminous Lab";

  // 3D Tilt effect state (仅桌面端)
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isTouched, setIsTouched] = useState(false); // 移动端触摸反馈

  const handleNavMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile || !navRef.current) return;

    const rect = navRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perX = (x / rect.width) * 100;
    const perY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({ x: perX, y: perY, opacity: 1 });
  };

  const handleNavMouseLeave = () => {
    if (isMobile) return;
    setRotation({ x: 0, y: 0 });
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  // 移动端触摸反馈
  const handleTouchStart = () => {
    if (isMobile) {
      setIsTouched(true);
    }
  };

  const handleTouchEnd = () => {
    if (isMobile) {
      setTimeout(() => setIsTouched(false), 150);
    }
  };

  return (
    <div
      ref={navRef}
      onMouseMove={handleNavMouseMove}
      onMouseLeave={handleNavMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300 group ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      } ${isTouched ? "scale-[0.98]" : ""}`}
      style={isMobile ? {
        // 移动端：简化样式，无3D变换
        transform: `translateX(-50%) ${isVisible ? "translateY(0)" : "translateY(5rem)"}`,
      } : {
        // 桌面端：完整3D效果
        transform: `translateX(-50%) perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${
          isVisible ? "translateY(0)" : "translateY(5rem)"
        }`,
        transformStyle: 'preserve-3d',
      }}
      role="navigation"
      aria-label={navLabel}
    >
      {/* Dynamic Border Gradient */}
      <div 
        className="absolute inset-[-1px] rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(94, 106, 210, 0.5), transparent 60%)`
        }}
      />

      {/* Glass Surface & Spotlight */}
      <div 
        className="absolute inset-0 rounded-full z-10 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.08), transparent 40%)`,
          opacity: spotlight.opacity,
          transition: 'opacity 0.4s ease'
        }}
      />

      <div
        className={`relative z-20 flex items-center p-1.5 rounded-full bg-[#16171A]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 ${
          isMobile ? 'gap-0.5' : 'gap-1'
        }`}
        style={isMobile ? {} : { transform: 'translateZ(15px)' }}
        role="menubar"
        aria-live="polite"
      >
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* 桌面端品牌标识 */}
        <button
          onClick={scrollToTop}
          className="hidden md:flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] text-[#8A8F98] hover:text-white hover:bg-white/5 transition-all"
          aria-label={lang === "zh" ? "返回顶部" : "Back to top"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]" />
          {brandText}
        </button>

        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const hasSubsections =
            section.subsections && section.subsections.length > 0;
          const isExpanded = expandedSection === section.id;
          const hasActiveChild =
            hasSubsections &&
            section.subsections?.some((sub) => sub.id === activeAnchor);

          return (
            <div key={section.id} className="relative">
              <button
                ref={(el) => {
                  if (el) buttonRefs.current.set(section.id, el);
                }}
                onClick={() => {
                  if (hasSubsections) {
                    const btn = buttonRefs.current.get(section.id);
                    if (btn) {
                      const rect = btn.getBoundingClientRect();
                      setMenuPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 12,
                      });
                    }
                    setExpandedSection((prev) =>
                      prev === section.id ? null : section.id
                    );
                  } else {
                    scrollToSection(section.id);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, section.id, !!hasSubsections)}
                className={`relative flex items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-1 focus:ring-offset-[#16171A] ${
                  isMobile 
                    ? 'gap-1 px-2.5 py-2' // 移动端：更紧凑
                    : 'gap-2 px-4 py-2'   // 桌面端：正常间距
                } ${
                  isActive || hasActiveChild
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "text-[#8A8F98] hover:text-white hover:bg-white/5"
                }`}
                role="menuitem"
                aria-current={isActive || hasActiveChild ? "true" : undefined}
                aria-expanded={hasSubsections ? isExpanded : undefined}
                aria-haspopup={hasSubsections ? "true" : undefined}
                aria-controls={hasSubsections ? `submenu-${section.id}` : undefined}
                tabIndex={0}
              >
                {section.icon}
                {/* 移动端只显示图标，桌面端显示文字 */}
                <span className={`font-medium tracking-wide ${isMobile ? 'hidden' : 'text-xs'}`}>
                  {section.label[lang]}
                </span>
                {hasSubsections && (
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isMobile ? 'hidden' : ''} ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                )}
                {(isActive || hasActiveChild) && (
                  <span
                    className="absolute inset-0 rounded-full ring-1 ring-white/20"
                    aria-hidden="true"
                  />
                )}
              </button>

              {hasSubsections && isExpanded && menuPosition && createPortal(
                <SubmenuDropdown
                  sectionId={section.id}
                  lang={lang}
                  subsections={section.subsections || []}
                  activeAnchor={activeAnchor}
                  menuPosition={menuPosition}
                  onSelect={scrollToSection}
                />,
                document.body
              )}
            </div>
          );
        })}

        {/* 桌面端额外控制按钮 */}
        {onToggleMotion && !isMobile && (
          <>
            <div className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />
            <div className="flex items-center gap-1">
              <button
                onClick={scrollToPrevious}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 text-[#8A8F98] hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                aria-label={lang === "zh" ? "上一节" : "Previous section"}
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 text-[#8A8F98] hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
                aria-label={lang === "zh" ? "返回顶部" : "Back to top"}
              >
                <ArrowUp size={14} />
              </button>
            </div>
            <div className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />
            <button
              onClick={onToggleMotion}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 text-[#8A8F98] hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50"
              aria-label={
                reducedMotion
                  ? lang === "zh"
                    ? "开启动画"
                    : "Enable animations"
                  : lang === "zh"
                  ? "关闭动画"
                  : "Disable animations"
              }
              aria-pressed={!reducedMotion}
              tabIndex={0}
            >
              <Layers size={14} className={reducedMotion ? "opacity-50" : ""} />
              <span className="text-[10px] font-medium tracking-wide">
                {reducedMotion
                  ? lang === "zh"
                    ? "动画已关"
                    : "Motion Off"
                  : lang === "zh"
                  ? "动画"
                  : "Motion"}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SectionNavigation;
