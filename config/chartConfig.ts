/**
 * SMITH CHART CONFIGURATION
 * 
 * All magic numbers extracted and documented.
 * This file should be readable like a specification document.
 * 
 * "The details are not the details. They make the design." — Charles Eames
 */

export const CHART_CONFIG = {
  // ========================================
  // GEOMETRY
  // ========================================
  
  /** Chart radius as percentage of container's smaller dimension */
  RADIUS_RATIO: 0.4,
  
  /** Standard resistance circle values to draw */
  RESISTANCE_CIRCLES: [0, 0.2, 0.5, 1, 2, 5] as const,
  
  /** Standard reactance arc values to draw */
  REACTANCE_ARCS: [0.2, 0.5, 1, 2, 5] as const,
  
  /** VSWR circle values when enabled */
  VSWR_CIRCLES: [1.5, 2, 3, 5] as const,
  
  /** Admittance conductance values when overlay enabled */
  CONDUCTANCE_CIRCLES: [0.2, 0.5, 1, 2] as const,

  // ========================================
  // ACTIVE POINT STYLING
  // ========================================
  
  /** Outer glow ring radius (px) */
  POINT_GLOW_OUTER: 12,
  
  /** Middle glow ring radius (px) */
  POINT_GLOW_MIDDLE: 8,
  
  /** Core point radius (px) */
  POINT_CORE: 5,
  
  /** White center dot radius (px) */
  POINT_CENTER: 2,
  
  /** Shadow blur for glow effect (px) */
  POINT_SHADOW_BLUR: 20,

  // ========================================
  // MATCH POINT MARKER
  // ========================================
  
  /** Outer ring radius at chart center */
  MATCH_RING_RADIUS: 10,
  
  /** Inner dot radius at chart center */
  MATCH_DOT_RADIUS: 3,

  // ========================================
  // LABELS & TEXT
  // ========================================
  
  /** Offset from point to data label (px) */
  LABEL_OFFSET: 20,
  
  /** Minimum distance from edge for labels to show (px) */
  LABEL_EDGE_MARGIN: 80,
  
  /** Font for technical text */
  FONT_TECH: "'Space Grotesk', monospace",

  // ========================================
  // LINE WIDTHS
  // ========================================
  
  /** Unit circle (|Γ|=1) stroke width */
  STROKE_UNIT_CIRCLE: 2,
  
  /** Real axis stroke width */
  STROKE_REAL_AXIS: 1.5,
  
  /** Standard grid line stroke width */
  STROKE_GRID: 1,
  
  /** Γ vector line stroke width */
  STROKE_GAMMA_VECTOR: 2,

  // ========================================
  // COLORS (semantic, referencing theme)
  // ========================================
  
  /** Grid line color */
  COLOR_GRID: 'rgba(255, 215, 0, 0.15)',
  
  /** r=1 circle highlight color */
  COLOR_R1_CIRCLE: 'rgba(255, 199, 0, 0.35)',
  
  /** Unit circle color */
  COLOR_UNIT_CIRCLE: 'rgba(255, 199, 0, 0.3)',
  
  /** Real axis color */
  COLOR_REAL_AXIS: 'rgba(255, 255, 255, 0.2)',
  
  /** VSWR circle color */
  COLOR_VSWR: 'rgba(255, 199, 0, 0.12)',
  
  /** Admittance overlay color */
  COLOR_ADMITTANCE: 'rgba(100, 200, 150, 0.15)',
  
  /** Crosshair line color */
  COLOR_CROSSHAIR: 'rgba(255, 199, 0, 0.1)',
  
  /** Γ vector line color */
  COLOR_GAMMA_VECTOR: 'rgba(255, 199, 0, 0.4)',
  
  /** Active |Γ| circle color */
  COLOR_GAMMA_CIRCLE: 'rgba(255, 199, 0, 0.2)',

  // ========================================
  // PHYSICS / ANIMATION
  // ========================================
  
  /** Lerp factor for smooth point movement (0-1) */
  LERP_FACTOR: 0.15,
  
  /** Lerp factor when reduced motion is enabled */
  LERP_FACTOR_REDUCED: 1,

  // ========================================
  // THRESHOLDS
  // ========================================
  
  /** Minimum |Γ| to draw |Γ| circle */
  GAMMA_MIN_DRAW: 0.01,
  
  /** Maximum |Γ| to draw |Γ| circle */
  GAMMA_MAX_DRAW: 0.99,
  
  /** Tolerance for point inside unit circle */
  UNIT_CIRCLE_TOLERANCE: 1.01,

  // ========================================
  // FONT SIZES (px)
  // ========================================
  
  FONT_SIZE_LABEL_LARGE: 10,
  FONT_SIZE_LABEL_MEDIUM: 9,
  FONT_SIZE_LABEL_SMALL: 8,
  FONT_SIZE_LABEL_TINY: 7,
} as const;

// Type for the config (useful for TypeScript)
export type ChartConfig = typeof CHART_CONFIG;


