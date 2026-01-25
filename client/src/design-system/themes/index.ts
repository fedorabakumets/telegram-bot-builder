/**
 * Theme System - Main Export
 * 
 * Centralized theme management with utilities for theme switching
 * and CSS custom property application.
 */

export * from './light';
export * from './dark';

import { lightTheme, lightThemeCSSVars, type LightTheme } from './light';
import { darkTheme, darkThemeCSSVars, type DarkTheme } from './dark';

// Theme configuration
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export const themeCSSVars = {
  light: lightThemeCSSVars,
  dark: darkThemeCSSVars,
} as const;

export type Theme = 'light' | 'dark' | 'system';
export type ThemeConfig = LightTheme | DarkTheme;

/**
 * Apply theme CSS variables to the document root
 * @param theme - Theme name to apply
 */
export function applyTheme(theme: Exclude<Theme, 'system'>) {
  const root = document.documentElement;
  const cssVars = themeCSSVars[theme];
  
  Object.entries(cssVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Get the current system theme preference
 * @returns 'light' or 'dark' based on system preference
 */
export function getSystemTheme(): Exclude<Theme, 'system'> {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

/**
 * Resolve theme including system preference
 * @param theme - Theme to resolve
 * @returns Resolved theme ('light' or 'dark')
 */
export function resolveTheme(theme: Theme): Exclude<Theme, 'system'> {
  return theme === 'system' ? getSystemTheme() : theme;
}

/**
 * Create a theme-aware CSS class name
 * @param baseClass - Base CSS class
 * @param theme - Current theme
 * @returns Theme-aware class name
 */
export function createThemeClass(baseClass: string, theme: Exclude<Theme, 'system'>): string {
  return `${baseClass} ${theme}`;
}

// Re-export themes for convenience
export { lightTheme, darkTheme };