/**
 * Design System - Main Export
 * 
 * Centralized export of the complete design system including tokens,
 * themes, utilities, and hooks for consistent usage across the application.
 */

// Tokens
export * from './tokens';

// Themes
export * from './themes';

// Utilities
export * from './utils';

// Hooks
export * from './hooks/use-theme';

// Re-export commonly used items for convenience
export { colors, typography, spacing, shadows } from './tokens';
export { themes, lightTheme, darkTheme, applyTheme, getSystemTheme, resolveTheme } from './themes';
export { cn, buttonVariants, inputVariants, cardVariants } from './utils';