/**
 * Design System Color Tokens
 * 
 * Centralized color palette for consistent theming across the application.
 * These tokens are integrated with CSS custom properties for theme switching.
 */

export const colors = {
  // Primary brand colors
  primary: {
    50: 'hsl(210, 100%, 98%)',
    100: 'hsl(210, 100%, 95%)',
    200: 'hsl(210, 100%, 90%)',
    300: 'hsl(210, 100%, 82%)',
    400: 'hsl(210, 100%, 70%)',
    500: 'hsl(207, 90%, 54%)', // Main primary color
    600: 'hsl(207, 90%, 48%)',
    700: 'hsl(207, 90%, 42%)',
    800: 'hsl(207, 90%, 36%)',
    900: 'hsl(207, 90%, 30%)',
    950: 'hsl(207, 90%, 20%)',
  },

  // Neutral colors for backgrounds, text, and borders
  neutral: {
    50: 'hsl(240, 30%, 97%)',
    100: 'hsl(240, 20%, 91%)',
    200: 'hsl(240, 15%, 88%)',
    300: 'hsl(240, 12%, 75%)',
    400: 'hsl(240, 12%, 60%)',
    500: 'hsl(240, 12%, 45%)',
    600: 'hsl(240, 10%, 35%)',
    700: 'hsl(240, 10%, 25%)',
    800: 'hsl(240, 10%, 20%)',
    900: 'hsl(240, 10%, 15%)',
    950: 'hsl(240, 10%, 3.9%)',
  },

  // Semantic colors for status and feedback
  semantic: {
    success: {
      light: 'hsl(142, 76%, 43%)',
      dark: 'hsl(142, 76%, 45%)',
      foreground: 'hsl(355, 7%, 97%)',
    },
    warning: {
      light: 'hsl(38, 92%, 55%)',
      dark: 'hsl(38, 92%, 55%)',
      foreground: 'hsl(48, 96%, 89%)',
    },
    error: {
      light: 'hsl(0, 75%, 63%)',
      dark: 'hsl(0, 75%, 60%)',
      foreground: 'hsl(60, 9.1%, 97.8%)',
    },
    info: {
      light: 'hsl(199, 89%, 52%)',
      dark: 'hsl(199, 89%, 55%)',
      foreground: 'hsl(210, 20%, 98%)',
    },
  },

  // CSS Custom Property mappings for theme integration
  cssVars: {
    light: {
      background: 'hsl(240, 30%, 97%)',
      foreground: 'hsl(240, 10%, 20%)',
      muted: 'hsl(240, 20%, 91%)',
      mutedForeground: 'hsl(240, 12%, 45%)',
      popover: 'hsl(0, 0%, 100%)',
      popoverForeground: 'hsl(240, 10%, 20%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(240, 10%, 20%)',
      border: 'hsl(240, 15%, 88%)',
      input: 'hsl(240, 20%, 92%)',
      primary: 'hsl(207, 90%, 54%)',
      primaryForeground: 'hsl(211, 100%, 99%)',
      secondary: 'hsl(240, 20%, 91%)',
      secondaryForeground: 'hsl(240, 10%, 25%)',
      accent: 'hsl(240, 20%, 91%)',
      accentForeground: 'hsl(240, 10%, 25%)',
      destructive: 'hsl(0, 75%, 63%)',
      destructiveForeground: 'hsl(60, 9.1%, 97.8%)',
      ring: 'hsl(240, 10%, 20%)',
    },
    dark: {
      background: 'hsl(240, 10%, 3.9%)',
      foreground: 'hsl(0, 0%, 98%)',
      muted: 'hsl(240, 3.7%, 15.9%)',
      mutedForeground: 'hsl(240, 5%, 64.9%)',
      popover: 'hsl(240, 10%, 3.9%)',
      popoverForeground: 'hsl(0, 0%, 98%)',
      card: 'hsl(240, 10%, 7%)',
      cardForeground: 'hsl(0, 0%, 98%)',
      border: 'hsl(240, 3.7%, 18%)',
      input: 'hsl(240, 3.7%, 15.9%)',
      primary: 'hsl(207, 90%, 60%)',
      primaryForeground: 'hsl(211, 100%, 99%)',
      secondary: 'hsl(240, 3.7%, 20%)',
      secondaryForeground: 'hsl(0, 0%, 98%)',
      accent: 'hsl(240, 3.7%, 20%)',
      accentForeground: 'hsl(0, 0%, 98%)',
      destructive: 'hsl(0, 75%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 98%)',
      ring: 'hsl(240, 4.9%, 83.9%)',
    },
  },
} as const;

export type ColorToken = keyof typeof colors.primary;
export type SemanticColor = keyof typeof colors.semantic;
export type CSSVarColor = keyof typeof colors.cssVars.light;