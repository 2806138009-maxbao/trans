/**
 * THEME SYSTEM - "Luminous OS" Edition
 * 
 * Design Philosophy (Silicon Valley Standard):
 * 1. Deep Dark Mode - NOT pure black (#050505)
 * 2. Reactive Glow - Light follows cursor
 * 3. Physics-based Motion - Spring, not ease-in-out
 * 4. Tabular Numbers - Prevent layout jitter
 * 
 * "Built with AI, Directed by Human."
 */

export const THEME = {
  colors: {
    // ========================================
    // BACKGROUNDS - Deep Dark (NOT Pure Black)
    // Pure black feels "dead", #050505 feels "alive"
    // ========================================
    
    /** Main page background - Deep Dark (Luminous OS) */
    background: "#050505",                // Deep Dark, NOT pure black
    
    /** Card/Panel background - Slightly elevated */
    surface: "#0A0A0A",                   // One step up
    
    /** Elevated surface - Glass panels */
    surfaceElevated: "#111111",           // Two steps up
    
    // ========================================
    // ACCENT COLORS
    // ========================================
    
    /** Primary - Electric Gold */
    primary: "#FFC700",
    primaryDim: "rgba(255, 199, 0, 0.5)",
    primaryFaint: "rgba(255, 199, 0, 0.15)",
    primaryGlow: "rgba(255, 199, 0, 0.3)",
    
    /** Secondary - Silver/Platinum */
    secondary: "#C9D1D9",
    secondaryDim: "rgba(201, 209, 217, 0.5)",
    
    // ========================================
    // TEXT - Hierarchy via Contrast
    // ========================================
    text: {
      /** Headings, important values - Bright */
      main: "#FFFFFF",
      
      /** Body text - Slightly dimmed for comfort */
      body: "rgba(255, 255, 255, 0.85)",
      
      /** Secondary text - Muted warm grey */
      muted: "hsl(40, 5%, 55%)",          // Was: #8A8F98 (cold grey)
      
      /** Labels - Low contrast, guides the eye */
      label: "rgba(255, 199, 0, 0.5)",    // Gold-tinted labels
      
      /** Disabled/Tertiary */
      disabled: "hsl(40, 3%, 35%)",
    },
    
    // ========================================
    // BORDERS - Warm undertones, MORE VISIBLE
    // ========================================
    border: {
      /** Default border - 更明显的暖色边框 */
      default: "rgba(255, 199, 0, 0.12)",   // 金色调边框
      
      /** Hover state */
      hover: "rgba(255, 199, 0, 0.25)",
      
      /** Focus/Active - Gold tint */
      active: "rgba(255, 199, 0, 0.4)",
      
      /** Dividers - 暖色分割线 */
      divider: "rgba(255, 199, 0, 0.08)",
    },
    
    // ========================================
    // OVERLAYS
    // ========================================
    overlay: {
      dark: "hsla(40, 10%, 3%, 0.7)",
      glass: "hsla(40, 6%, 8%, 0.85)",
      vignette: "hsla(40, 10%, 2%, 0.9)",
    },
    
    // ========================================
    // CHART SPECIFIC
    // ========================================
    chart: {
      grid: "rgba(255, 199, 0, 0.08)",           // Warm gold grid
      gridStrong: "rgba(255, 199, 0, 0.2)",
      gridBoundary: "rgba(255, 199, 0, 0.35)",
      matchPoint: "rgba(255, 199, 0, 0.5)",
      faintGold: "rgba(255, 199, 0, 0.12)",
      realAxis: "rgba(255, 255, 255, 0.15)",
    },
    
    // ========================================
    // STATUS COLORS - Using Warm Greys
    // ========================================
    status: {
      good: "#FFC700",                    // Gold = Good match
      warning: "hsl(40, 8%, 58%)",        // Warm grey = Acceptable (was #8A8F98)
      poor: "hsl(40, 5%, 35%)",           // Warm dark = Poor (was #555555)
    }
  },
  
  // ========================================
  // TYPOGRAPHY - Luminous OS Standard
  // English/Numbers: Space Grotesk (Tracking -0.03em)
  // Chinese: Noto Sans SC
  // Numbers: ALWAYS tabular-nums
  // ========================================
  fonts: {
    /** Technical/English - Tight tracking */
    tech: "'Space Grotesk', -apple-system, sans-serif",
    /** Body/Chinese - Natural tracking */
    body: "'Noto Sans SC', -apple-system, sans-serif",
    /** Monospace - Data display */
    mono: "'Space Mono', 'SF Mono', 'Menlo', monospace",
  },
  
  typography: {
    /** Tracking values */
    tracking: {
      tight: '-0.03em',      // Headings, English
      normal: '0',           // Chinese body
      wide: '0.1em',         // Labels, badges
      extraWide: '0.2em',    // Eyebrows
    },
    /** Font weights */
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // ========================================
  // SPACING - 8pt Grid System (Müller-Brockmann)
  // 
  // "网格系统是一种寻求秩序的方法。"
  // 所有尺寸必须是 8 的倍数（4px 仅用于微调）
  // 
  // 严禁: 13px, 19px, 21px 等"脏数字"
  // ========================================
  spacing: {
    /** Micro - 仅用于极小调整 */
    '1': '4px',     // 0.5 × 8
    
    /** Base unit = 8px */
    '2': '8px',     // 1 × 8
    '3': '12px',    // 1.5 × 8 (例外：用于紧凑场景)
    '4': '16px',    // 2 × 8
    '5': '20px',    // 2.5 × 8 (例外)
    '6': '24px',    // 3 × 8
    '8': '32px',    // 4 × 8
    '10': '40px',   // 5 × 8
    '12': '48px',   // 6 × 8
    '16': '64px',   // 8 × 8
    '20': '80px',   // 10 × 8
    '24': '96px',   // 12 × 8
    
    /** Semantic aliases */
    cardPadding: '24px',          // 3 × 8
    cardPaddingLg: '32px',        // 4 × 8
    sectionGap: '48px',           // 6 × 8
    containerMargin: '24px',      // 3 × 8
    
    /** Component gaps */
    elementGap: '8px',            // 1 × 8
    groupGap: '16px',             // 2 × 8
    sectionPadding: '64px',       // 8 × 8
  },
  
  // ========================================
  // LAYOUT - Modular Grid (12-column)
  // 
  // Smith Chart 布局比例:
  // - 主视窗: 8 列 (66.67%)
  // - 侧边栏: 4 列 (33.33%)
  // 或使用 3:2 / 2:1 工程比例
  // ========================================
  layout: {
    /** 最大内容宽度 */
    maxWidth: '1440px',
    
    /** 内容区域宽度 */
    contentWidth: '1200px',
    
    /** 阅读宽度 (45-75字符) */
    readingWidth: '720px',        // ~65 characters
    
    /** 比例 */
    ratio: {
      golden: 1.618,
      sqrt2: 1.414,
      threeTwo: 1.5,              // 3:2
      twoOne: 2,                  // 2:1
    },
    
    /** 网格列数 */
    columns: 12,
    
    /** 列间距 */
    gutter: '24px',               // 3 × 8
  },
  
  // ========================================
  // ANIMATION - Physics-based Motion (CRITICAL)
  // 
  // NEVER use ease-in-out or linear!
  // ALWAYS use Spring Physics
  // ========================================
  animation: {
    /** 
     * Primary curve - Expo Out (Apple-like)
     * Use for ALL UI transitions
     */
    curve: "cubic-bezier(0.16, 1, 0.3, 1)",
    curveVar: "var(--ease-out-expo)",
    
    /**
     * Alternative curves for specific cases
     */
    curveSnap: "cubic-bezier(0.34, 1.56, 0.64, 1)",  // Overshoot for snapping
    curveSmooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Subtle deceleration
    
    /**
     * Physics-based springs (for react-spring or JS)
     * These create "expensive-feeling" interactions
     */
    spring: {
      /** Default - Responsive but smooth */
      default: { stiffness: 170, damping: 26, mass: 1 },
      /** Snappy - Quick response */
      snappy: { stiffness: 300, damping: 30, mass: 0.8 },
      /** Gentle - Slow, luxurious */
      gentle: { stiffness: 120, damping: 20, mass: 1.2 },
      /** Bouncy - Playful overshoot */
      bouncy: { stiffness: 200, damping: 15, mass: 1 },
    },

    /** Durations - Unified Heartbeat */
    fast: "0.15s",      // Micro-interactions
    normal: "0.3s",     // Standard transitions
    slow: "0.5s",       // Reveals, modals
    slower: "0.8s",     // Page transitions
  },
  
  // ========================================
  // SHADOWS - Warm undertones
  // ========================================
  shadows: {
    /** Subtle elevation */
    sm: "0 2px 8px hsla(40, 20%, 0%, 0.3)",
    
    /** Card shadow */
    md: "0 4px 24px hsla(40, 20%, 0%, 0.4)",
    
    /** Modal/Elevated */
    lg: "0 8px 48px hsla(40, 20%, 0%, 0.5)",
    
    /** Gold glow */
    glow: "0 0 20px rgba(255, 199, 0, 0.3)",
    glowStrong: "0 0 40px rgba(255, 199, 0, 0.4)",
  },
  
  // ========================================
  // BORDER RADIUS
  // ========================================
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  }
} as const;

// Type export for TypeScript
export type Theme = typeof THEME;
