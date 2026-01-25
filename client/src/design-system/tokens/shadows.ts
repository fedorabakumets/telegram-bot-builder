/**
 * Design System Shadow Tokens
 * 
 * Centralized shadow system for consistent depth and elevation across the application.
 * Includes both light and dark theme variants.
 */

export const shadows = {
  // Base shadow scale
  none: 'none',
  
  // Light theme shadows
  light: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Dark theme shadows (more pronounced)
  dark: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.2)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.4)',
    '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.5)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.15)',
  },

  // Colored shadows for interactive elements
  colored: {
    primary: {
      light: '0 4px 14px 0 hsl(207 90% 54% / 0.2)',
      dark: '0 4px 14px 0 hsl(207 90% 60% / 0.3)',
    },
    success: {
      light: '0 4px 14px 0 hsl(142 76% 43% / 0.2)',
      dark: '0 4px 14px 0 hsl(142 76% 45% / 0.3)',
    },
    warning: {
      light: '0 4px 14px 0 hsl(38 92% 55% / 0.2)',
      dark: '0 4px 14px 0 hsl(38 92% 55% / 0.3)',
    },
    error: {
      light: '0 4px 14px 0 hsl(0 75% 63% / 0.2)',
      dark: '0 4px 14px 0 hsl(0 75% 60% / 0.3)',
    },
  },

  // Glow effects for focus states
  glow: {
    primary: {
      light: '0 0 0 3px hsl(207 90% 54% / 0.3)',
      dark: '0 0 0 3px hsl(207 90% 60% / 0.4)',
    },
    success: {
      light: '0 0 0 3px hsl(142 76% 43% / 0.3)',
      dark: '0 0 0 3px hsl(142 76% 45% / 0.4)',
    },
    warning: {
      light: '0 0 0 3px hsl(38 92% 55% / 0.3)',
      dark: '0 0 0 3px hsl(38 92% 55% / 0.4)',
    },
    error: {
      light: '0 0 0 3px hsl(0 75% 63% / 0.3)',
      dark: '0 0 0 3px hsl(0 75% 60% / 0.4)',
    },
  },
} as const;

// Semantic shadow mappings for different UI elements
export const semanticShadows = {
  // Card elevations
  card: {
    flat: shadows.none,
    raised: shadows.light.sm,
    elevated: shadows.light.md,
    floating: shadows.light.lg,
  },

  // Button states
  button: {
    default: shadows.light.xs,
    hover: shadows.light.sm,
    active: shadows.light.inner,
    focus: shadows.glow.primary.light,
  },

  // Modal and overlay shadows
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    modal: shadows.light.xl,
    popover: shadows.light.md,
    tooltip: shadows.light.sm,
  },

  // Input field shadows
  input: {
    default: shadows.light.inner,
    focus: shadows.glow.primary.light,
    error: shadows.glow.error.light,
  },
} as const;

export type ShadowToken = keyof typeof shadows.light;
export type ColoredShadow = keyof typeof shadows.colored;
export type SemanticShadow = keyof typeof semanticShadows;