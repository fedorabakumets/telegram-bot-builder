/**
 * Dark Theme Configuration
 * 
 * Dark theme color mappings and CSS custom properties.
 * Integrates with existing CSS variables for seamless theme switching.
 */

import { colors } from '../tokens/colors';

export const darkTheme = {
  // Base colors
  background: colors.cssVars.dark.background,
  foreground: colors.cssVars.dark.foreground,
  
  // Muted colors for secondary content
  muted: colors.cssVars.dark.muted,
  mutedForeground: colors.cssVars.dark.mutedForeground,
  
  // Popover colors
  popover: colors.cssVars.dark.popover,
  popoverForeground: colors.cssVars.dark.popoverForeground,
  
  // Card colors
  card: colors.cssVars.dark.card,
  cardForeground: colors.cssVars.dark.cardForeground,
  
  // Border and input colors
  border: colors.cssVars.dark.border,
  input: colors.cssVars.dark.input,
  
  // Primary brand colors
  primary: colors.cssVars.dark.primary,
  primaryForeground: colors.cssVars.dark.primaryForeground,
  
  // Secondary colors
  secondary: colors.cssVars.dark.secondary,
  secondaryForeground: colors.cssVars.dark.secondaryForeground,
  
  // Accent colors
  accent: colors.cssVars.dark.accent,
  accentForeground: colors.cssVars.dark.accentForeground,
  
  // Destructive colors
  destructive: colors.cssVars.dark.destructive,
  destructiveForeground: colors.cssVars.dark.destructiveForeground,
  
  // Ring color for focus states
  ring: colors.cssVars.dark.ring,
  
  // Semantic colors
  success: colors.semantic.success.dark,
  successForeground: colors.semantic.success.foreground,
  warning: colors.semantic.warning.dark,
  warningForeground: colors.semantic.warning.foreground,
  error: colors.semantic.error.dark,
  errorForeground: colors.semantic.error.foreground,
  info: colors.semantic.info.dark,
  infoForeground: colors.semantic.info.foreground,
  
  // Enhanced dark theme variables for better visual hierarchy
  gradient: {
    primaryStart: 'hsl(207, 90%, 60%)',
    primaryEnd: 'hsl(217, 100%, 70%)',
    secondaryStart: 'hsl(240, 3.7%, 20%)',
    secondaryEnd: 'hsl(240, 3.7%, 30%)',
  },
  
  // Shadow colors (more pronounced for dark theme)
  shadow: {
    light: 'hsl(0, 0%, 0% / 0.2)',
    medium: 'hsl(0, 0%, 0% / 0.3)',
    heavy: 'hsl(0, 0%, 0% / 0.5)',
  },
  
  // Surface colors for better depth
  surface: {
    1: 'hsl(240, 8%, 8%)',
    2: 'hsl(240, 8%, 12%)',
    3: 'hsl(240, 8%, 16%)',
  },
  
  // Glass effect colors
  glass: {
    bg: 'hsl(240, 10%, 10% / 0.8)',
    border: 'hsl(240, 10%, 30% / 0.2)',
  },
  
  // Switch colors for better visibility
  switch: {
    uncheckedBg: 'hsl(240, 8%, 25%)',
    uncheckedBorder: 'hsl(240, 10%, 40%)',
    uncheckedThumb: 'hsl(240, 5%, 60%)',
  },
  
  // Border radius
  radius: '0.5rem',
} as const;

// CSS custom properties mapping for the dark theme
export const darkThemeCSSVars = {
  '--background': darkTheme.background,
  '--foreground': darkTheme.foreground,
  '--muted': darkTheme.muted,
  '--muted-foreground': darkTheme.mutedForeground,
  '--popover': darkTheme.popover,
  '--popover-foreground': darkTheme.popoverForeground,
  '--card': darkTheme.card,
  '--card-foreground': darkTheme.cardForeground,
  '--border': darkTheme.border,
  '--input': darkTheme.input,
  '--primary': darkTheme.primary,
  '--primary-foreground': darkTheme.primaryForeground,
  '--secondary': darkTheme.secondary,
  '--secondary-foreground': darkTheme.secondaryForeground,
  '--accent': darkTheme.accent,
  '--accent-foreground': darkTheme.accentForeground,
  '--destructive': darkTheme.destructive,
  '--destructive-foreground': darkTheme.destructiveForeground,
  '--ring': darkTheme.ring,
  '--radius': darkTheme.radius,
  '--success': darkTheme.success,
  '--success-foreground': darkTheme.successForeground,
  '--warning': darkTheme.warning,
  '--warning-foreground': darkTheme.warningForeground,
  '--info': darkTheme.info,
  '--info-foreground': darkTheme.infoForeground,
  '--gradient-primary-start': darkTheme.gradient.primaryStart,
  '--gradient-primary-end': darkTheme.gradient.primaryEnd,
  '--gradient-secondary-start': darkTheme.gradient.secondaryStart,
  '--gradient-secondary-end': darkTheme.gradient.secondaryEnd,
  '--shadow-light': darkTheme.shadow.light,
  '--shadow-medium': darkTheme.shadow.medium,
  '--shadow-heavy': darkTheme.shadow.heavy,
  '--surface-1': darkTheme.surface[1],
  '--surface-2': darkTheme.surface[2],
  '--surface-3': darkTheme.surface[3],
  '--glass-bg': darkTheme.glass.bg,
  '--glass-border': darkTheme.glass.border,
  '--switch-unchecked-bg': darkTheme.switch.uncheckedBg,
  '--switch-unchecked-border': darkTheme.switch.uncheckedBorder,
  '--switch-unchecked-thumb': darkTheme.switch.uncheckedThumb,
} as const;

export type DarkTheme = typeof darkTheme;