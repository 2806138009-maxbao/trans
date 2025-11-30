/**
 * THEME SYSTEM - "Warm Charcoal" Edition
 * 
 * Design Philosophy:
 * 1. Banish Pure Grey → Use Colored Greys (warm undertone)
 * 2. Hierarchy via Weight & Contrast
 * 3. Let it Breathe → Generous spacing
 * 
 * "The interface should feel like high-end avionics equipment."
 */

export const THEME = {
  colors: {
    // ========================================
    // BACKGROUNDS - Warm Charcoal (Not Pure Black)
    // 关键: 提高亮度让区别更明显
    // ========================================
    
    /** Main page background - Deep warm charcoal */
    background: "#0A0A08",                // 微微偏暖的深黑
    
    /** Card/Panel background - 明显更亮，带暖色调 */
    surface: "#16140F",                   // 更亮的暖棕色
    
    /** Elevated surface - Glass panels, 更明显的对比 */
    surfaceElevated: "#1E1B15",           // 明显更亮的暖灰
    
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
  // TYPOGRAPHY
  // ========================================
  fonts: {
    tech: "'Space Grotesk', -apple-system, sans-serif",
    body: "'Noto Sans SC', -apple-system, sans-serif",
    mono: "'Space Grotesk', 'SF Mono', monospace",
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
  // ANIMATION - L3 Unified Physics Kernel
  // ========================================
  animation: {
    /** 
     * Snappy Apple curve - Expo Out
     * The ONLY curve allowed for UI transitions
     */
    curve: "cubic-bezier(0.16, 1, 0.3, 1)",
    curveVar: "var(--ease-out-expo)",
    
    /**
     * Physics-based springs (JS use)
     * stiffness, damping, mass
     */
    spring: {
      stiffness: 170,
      damping: 26,
      mass: 1
    },

    /** Durations - Unified Heartbeat */
    fast: "0.2s",
    normal: "0.4s", 
    slow: "0.6s",
    slower: "0.8s",
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
