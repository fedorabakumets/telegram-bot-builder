/**
 * Design System Typography Tokens
 * 
 * Centralized typography system for consistent text styling across the application.
 * Includes font families, sizes, weights, and line heights.
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ],
    display: [
      'Inter',
      'system-ui',
      'sans-serif',
    ],
  },

  // Font sizes with corresponding line heights
  fontSize: {
    xs: {
      size: '0.75rem',    // 12px
      lineHeight: '1rem', // 16px
    },
    sm: {
      size: '0.875rem',     // 14px
      lineHeight: '1.25rem', // 20px
    },
    base: {
      size: '1rem',         // 16px
      lineHeight: '1.5rem', // 24px
    },
    lg: {
      size: '1.125rem',     // 18px
      lineHeight: '1.75rem', // 28px
    },
    xl: {
      size: '1.25rem',      // 20px
      lineHeight: '1.75rem', // 28px
    },
    '2xl': {
      size: '1.5rem',       // 24px
      lineHeight: '2rem',   // 32px
    },
    '3xl': {
      size: '1.875rem',     // 30px
      lineHeight: '2.25rem', // 36px
    },
    '4xl': {
      size: '2.25rem',      // 36px
      lineHeight: '2.5rem', // 40px
    },
    '5xl': {
      size: '3rem',         // 48px
      lineHeight: '1',      // 48px
    },
    '6xl': {
      size: '3.75rem',      // 60px
      lineHeight: '1',      // 60px
    },
    '7xl': {
      size: '4.5rem',       // 72px
      lineHeight: '1',      // 72px
    },
    '8xl': {
      size: '6rem',         // 96px
      lineHeight: '1',      // 96px
    },
    '9xl': {
      size: '8rem',         // 128px
      lineHeight: '1',      // 128px
    },
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Semantic typography scales for different use cases
  scale: {
    // Headings
    heading: {
      h1: {
        fontSize: '2.25rem',      // 36px
        lineHeight: '2.5rem',     // 40px
        fontWeight: '700',
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '1.875rem',     // 30px
        lineHeight: '2.25rem',    // 36px
        fontWeight: '600',
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: '1.5rem',       // 24px
        lineHeight: '2rem',       // 32px
        fontWeight: '600',
        letterSpacing: '0em',
      },
      h4: {
        fontSize: '1.25rem',      // 20px
        lineHeight: '1.75rem',    // 28px
        fontWeight: '600',
        letterSpacing: '0em',
      },
      h5: {
        fontSize: '1.125rem',     // 18px
        lineHeight: '1.75rem',    // 28px
        fontWeight: '600',
        letterSpacing: '0em',
      },
      h6: {
        fontSize: '1rem',         // 16px
        lineHeight: '1.5rem',     // 24px
        fontWeight: '600',
        letterSpacing: '0em',
      },
    },

    // Body text
    body: {
      large: {
        fontSize: '1.125rem',     // 18px
        lineHeight: '1.75rem',    // 28px
        fontWeight: '400',
      },
      base: {
        fontSize: '1rem',         // 16px
        lineHeight: '1.5rem',     // 24px
        fontWeight: '400',
      },
      small: {
        fontSize: '0.875rem',     // 14px
        lineHeight: '1.25rem',    // 20px
        fontWeight: '400',
      },
    },

    // UI elements
    ui: {
      button: {
        fontSize: '0.875rem',     // 14px
        lineHeight: '1.25rem',    // 20px
        fontWeight: '500',
        letterSpacing: '0em',
      },
      label: {
        fontSize: '0.875rem',     // 14px
        lineHeight: '1.25rem',    // 20px
        fontWeight: '500',
        letterSpacing: '0em',
      },
      caption: {
        fontSize: '0.75rem',      // 12px
        lineHeight: '1rem',       // 16px
        fontWeight: '400',
        letterSpacing: '0.025em',
      },
      overline: {
        fontSize: '0.75rem',      // 12px
        lineHeight: '1rem',       // 16px
        fontWeight: '600',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
      },
    },

    // Code and monospace
    code: {
      inline: {
        fontSize: '0.875rem',     // 14px
        lineHeight: '1.25rem',    // 20px
        fontWeight: '400',
        fontFamily: 'mono',
      },
      block: {
        fontSize: '0.875rem',     // 14px
        lineHeight: '1.5rem',     // 24px
        fontWeight: '400',
        fontFamily: 'mono',
      },
    },
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type FontFamily = keyof typeof typography.fontFamily;
export type TypographyScale = keyof typeof typography.scale;