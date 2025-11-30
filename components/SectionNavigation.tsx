import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  BookOpen,
  FlaskConical,
  Settings2,
  ChevronDown,
  ArrowUp,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { Language } from "../types";
import { THEME } from "../theme";

interface SectionNavigationProps {
  lang: Language;
  reducedMotion?: boolean;
  onToggleMotion?: () => void;
}

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: { zh: string; en: string };
  hasDropdown?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "hero",
    icon: <Play size={14} fill="currentColor" />,
    label: { zh: "开始", en: "Start" },
  },
  {
    id: "intuition",
    icon: <BookOpen size={14} />,
    label: { zh: "直觉", en: "Intuition" },
  },
  {
    id: "experiment",
    icon: <FlaskConical size={14} />,
    label: { zh: "实验", en: "Lab" },
    hasDropdown: true,
  },
  {
    id: "application",
    icon: <Settings2 size={14} />,
    label: { zh: "应用", en: "Apps" },
  },
];

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  lang,
  reducedMotion,
  onToggleMotion,
}) => {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isVisible, setIsVisible] = useState(true);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Observe sections
  useEffect(() => {
    const sectionIds = NAV_ITEMS.map(item => item.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const sorted = visibleEntries.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        setActiveSection(sorted[0].target.id);
      },
      { threshold: 0.3, rootMargin: "-20% 0px -50% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Hide on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrolledPastThreshold = currentScrollY > 300;

      setIsVisible(!scrollingDown || !scrolledPastThreshold);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setExpandedDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const targetPosition = element.getBoundingClientRect().top + window.scrollY;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      const duration = 1000;
      let startTime: number | null = null;

      function animation(currentTime: number) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const ease = (t: number) => 1 - Math.pow(1 - t, 4);
        const run = ease(Math.min(timeElapsed / duration, 1)) * distance + startPosition;
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      }
      requestAnimationFrame(animation);
    }
    setExpandedDropdown(null);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed bottom-6 left-1/2 z-50 transition-all ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
      }`}
      style={{
        transform: `translateX(-50%) ${isVisible ? "translateY(0)" : "translateY(6rem)"}`,
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="navigation"
      aria-label={lang === "zh" ? "章节导航" : "Section Navigation"}
    >
      <div 
        className="flex items-center gap-0.5 p-1.5 rounded-2xl backdrop-blur-xl border shadow-2xl"
        style={{
          backgroundColor: "rgba(18, 19, 22, 0.85)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        }}
      >
        {/* Brand / Home */}
        <button
          onClick={scrollToTop}
          className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/5 group"
          style={{ 
            color: "rgba(255, 255, 255, 0.5)",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <span 
            className="w-1.5 h-1.5 rounded-full group-hover:scale-125"
            style={{ 
              backgroundColor: THEME.colors.primary,
              boxShadow: `0 0 8px ${THEME.colors.primary}`,
              transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }} 
          />
          <span className="group-hover:text-white/70" style={{ transition: "color 0.3s ease" }}>
            LUMINOUS LAB
          </span>
        </button>

        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

        {/* Nav Items */}
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const isExpanded = expandedDropdown === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => {
                  if (item.hasDropdown) {
                    setExpandedDropdown(isExpanded ? null : item.id);
                  } else {
                    scrollToSection(item.id);
                  }
                }}
                className={`
                  relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium
                  ${isActive 
                    ? "text-white" 
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }
                `}
                style={{
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  transition: `all 0.4s ${THEME.animation.curve}`,
                }}
              >
                <span className={isActive ? "text-white" : "text-white/50"}>
                  {item.icon}
                </span>
                <span className="hidden sm:inline tracking-wide">
                  {item.label[lang]}
                </span>
                {item.hasDropdown && (
                  <ChevronDown
                    size={12}
                    className={`hidden sm:block transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    style={{ opacity: 0.5 }}
                  />
                )}
                
                {/* Active indicator line */}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ 
                      backgroundColor: THEME.colors.primary,
                      boxShadow: `0 0 8px ${THEME.colors.primary}`,
                    }}
                  />
                )}
              </button>

              {/* Dropdown */}
              {item.hasDropdown && isExpanded && (
                <div 
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 min-w-[180px] p-1.5 rounded-xl backdrop-blur-xl border"
                  style={{
                    backgroundColor: "rgba(18, 19, 22, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    animation: `fadeInUp 0.3s ${THEME.animation.curve}`,
                  }}
                >
                  {/* Dropdown items */}
                  {[
                    { id: "experiment", label: { zh: "交互圆图", en: "Interactive Chart" } },
                    { id: "application", label: { zh: "工程应用", en: "Applications" } },
                    { id: "recap", label: { zh: "总结回顾", en: "Recap" } },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => scrollToSection(sub.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-white/5"
                      style={{ 
                        color: activeSection === sub.id ? "white" : "rgba(255,255,255,0.5)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span 
                        className="w-1 h-1 rounded-full"
                        style={{ 
                          backgroundColor: activeSection === sub.id ? THEME.colors.primary : "rgba(255,255,255,0.3)",
                        }}
                      />
                      {sub.label[lang]}
                    </button>
                  ))}
                  
                  {/* Arrow pointer */}
                  <div 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                    style={{ 
                      backgroundColor: "rgba(18, 19, 22, 0.95)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

        {/* Navigation arrows */}
        <div className="hidden md:flex items-center gap-0.5">
              <button
            onClick={() => {
              const currentIdx = NAV_ITEMS.findIndex(item => item.id === activeSection);
              const prevId = currentIdx > 0 ? NAV_ITEMS[currentIdx - 1].id : NAV_ITEMS[NAV_ITEMS.length - 1].id;
              scrollToSection(prevId);
            }}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5"
            style={{ transition: "all 0.3s ease" }}
            aria-label={lang === "zh" ? "上一节" : "Previous"}
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={scrollToTop}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5"
            style={{ transition: "all 0.3s ease" }}
            aria-label={lang === "zh" ? "返回顶部" : "Top"}
              >
                <ArrowUp size={14} />
              </button>
            </div>

        {/* Divider */}
        {onToggleMotion && (
          <>
            <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />
            
            {/* Motion toggle */}
            <button
              onClick={onToggleMotion}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5"
              style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
              aria-label={reducedMotion ? "Enable motion" : "Disable motion"}
            >
              <Layers size={14} className={reducedMotion ? "opacity-40" : ""} />
              <span className="tracking-wide">
                {lang === "zh" ? "动画" : "Motion"}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default SectionNavigation;
