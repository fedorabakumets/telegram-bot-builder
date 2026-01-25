/**
 * Atomic Components - Design System
 * 
 * Collection of atomic (indivisible) UI components that serve as the building blocks
 * for more complex components. Each component is performance-optimized with React.memo
 * and follows the design system tokens for consistency.
 */

// Core UI atoms
export * from './Button';
export * from './Input';
export * from './Label';
export * from './Icon';
export * from './Typography';

// Re-export commonly used types for convenience
export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { LabelProps } from './Label';
export type { IconProps } from './Icon';
export type { TypographyProps } from './Typography';