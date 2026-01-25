/**
 * Design System Spacing Tokens
 * 
 * Centralized spacing system based on a 4px grid for consistent layout and spacing.
 * Includes padding, margin, gap, and sizing utilities.
 */

export const spacing = {
  // Base spacing scale (4px grid system)
  0: '0px',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Semantic spacing for specific use cases
export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },

  // Layout spacing
  layout: {
    xs: spacing[4],    // 16px
    sm: spacing[6],    // 24px
    md: spacing[8],    // 32px
    lg: spacing[12],   // 48px
    xl: spacing[16],   // 64px
    '2xl': spacing[24], // 96px
  },

  // Container spacing
  container: {
    xs: spacing[4],    // 16px
    sm: spacing[6],    // 24px
    md: spacing[8],    // 32px
    lg: spacing[12],   // 48px
    xl: spacing[16],   // 64px
  },

  // Section spacing
  section: {
    xs: spacing[8],    // 32px
    sm: spacing[12],   // 48px
    md: spacing[16],   // 64px
    lg: spacing[24],   // 96px
    xl: spacing[32],   // 128px
  },
} as const;

// Border radius values
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Size presets for common UI elements
export const sizes = {
  // Icon sizes
  icon: {
    xs: spacing[3],    // 12px
    sm: spacing[4],    // 16px
    md: spacing[5],    // 20px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
    '2xl': spacing[12], // 48px
  },

  // Button heights
  button: {
    sm: spacing[8],    // 32px
    md: spacing[10],   // 40px
    lg: spacing[11],   // 44px
    xl: spacing[12],   // 48px
  },

  // Input heights
  input: {
    sm: spacing[8],    // 32px
    md: spacing[10],   // 40px
    lg: spacing[12],   // 48px
  },

  // Avatar sizes
  avatar: {
    xs: spacing[6],    // 24px
    sm: spacing[8],    // 32px
    md: spacing[10],   // 40px
    lg: spacing[12],   // 48px
    xl: spacing[16],   // 64px
    '2xl': spacing[20], // 80px
  },
} as const;

export type SpacingToken = keyof typeof spacing;
export type SemanticSpacing = keyof typeof semanticSpacing;
export type BorderRadius = keyof typeof borderRadius;
export type SizeToken = keyof typeof sizes;