/**
 * Light Theme Configuration
 * 
 * Light theme color mappings and CSS custom properties.
 * Integrates with existing CSS variables for seamless theme switching.
 */

import { colors } from '../tokens/colors';

export const lightTheme = {
  // Base colors
  background: colors.cssVars.light.background,
  foreground: colors.cssVars.light.foreground,
  
  // Muted colors for secondary content
  muted: colors.cssVars.light.muted,
  mutedForeground: colors.cssVars.light.mutedForeground,
  
  // Popover colors
  popover: colors.cssVars.light.popover,
  popoverForeground: colors.cssVars.light.popoverForeground,
  
  // Card colors
  card: colors.cssVars.light.card,
  cardForeground: colors.cssVars.light.cardForeground,
  
  // Border and input colors
  border: colors.cssVars.light.border,
  input: colors.cssVars.light.input,
  
  // Primary brand colors
  primary: colors.cssVars.light.primary,
  primaryForeground: colors.cssVars.light.primaryForeground,
  
  // Secondary colors
  secondary: colors.cssVars.light.secondary,
  secondaryForeground: colors.cssVars.light.secondaryForeground,
  
  // Accent colors
  accent: colors.cssVars.light.accent,
  accentForeground: colors.cssVars.light.accentForeground,
  
  // Destructive colors
  destructive: colors.cssVars.light.destructive,
  destructiveForeground: colors.cssVars.light.destructiveForeground,
  
  // Ring color for focus states
  ring: colors.cssVars.light.ring,
  
  // Semantic colors
  success: colors.semantic.success.light,
  successForeground: colors.semantic.success.foreground,
  warning: colors.semantic.warning.light,
  warningForeground: colors.semantic.warning.foreground,
  error: colors.semantic.error.light,
  errorForeground: colors.semantic.error.foreground,
  info: colors.semantic.info.light,
  infoForeground: colors.semantic.info.foreground,
  
  // Enhanced theme variables for better visual hierarchy
  gradient: {
    primaryStart: 'hsl(207, 90%, 54%)',
    primaryEnd: 'hsl(217, 100%, 64%)',
    secondaryStart: 'hsl(240, 20%, 91%)',
    secondaryEnd: 'hsl(240, 20%, 85%)',
  },
  
  // Shadow colors
  shadow: {
    light: 'hsl(240, 10%, 50% / 0.08)',
    medium: 'hsl(240, 10%, 30% / 0.12)',
    heavy: 'hsl(240, 10%, 10% / 0.15)',
  },
  
  // Border radius
  radius: '0.5rem',
} as const;

// CSS custom properties mapping for the light theme
export const lightThemeCSSVars = {
  '--background': lightTheme.background,
  '--foreground': lightTheme.foreground,
  '--muted': lightTheme.muted,
  '--muted-foreground': lightTheme.mutedForeground,
  '--popover': lightTheme.popover,
  '--popover-foreground': lightTheme.popoverForeground,
  '--card': lightTheme.card,
  '--card-foreground': lightTheme.cardForeground,
  '--border': lightTheme.border,
  '--input': lightTheme.input,
  '--primary': lightTheme.primary,
  '--primary-foreground': lightTheme.primaryForeground,
  '--secondary': lightTheme.secondary,
  '--secondary-foreground': lightTheme.secondaryForeground,
  '--accent': lightTheme.accent,
  '--accent-foreground': lightTheme.accentForeground,
  '--destructive': lightTheme.destructive,
  '--destructive-foreground': lightTheme.destructiveForeground,
  '--ring': lightTheme.ring,
  '--radius': lightTheme.radius,
  '--success': lightTheme.success,
  '--success-foreground': lightTheme.successForeground,
  '--warning': lightTheme.warning,
  '--warning-foreground': lightTheme.warningForeground,
  '--info': lightTheme.info,
  '--info-foreground': lightTheme.infoForeground,
  '--gradient-primary-start': lightTheme.gradient.primaryStart,
  '--gradient-primary-end': lightTheme.gradient.primaryEnd,
  '--gradient-secondary-start': lightTheme.gradient.secondaryStart,
  '--gradient-secondary-end': lightTheme.gradient.secondaryEnd,
  '--shadow-light': lightTheme.shadow.light,
  '--shadow-medium': lightTheme.shadow.medium,
  '--shadow-heavy': lightTheme.shadow.heavy,
} as const;

export type LightTheme = typeof lightTheme;