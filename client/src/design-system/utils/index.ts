/**
 * Design System Utilities - Main Export
 * 
 * Centralized export of all design system utilities including
 * variant systems, class name utilities, and helper functions.
 */

export * from './cn';
export * from './variants';

// Re-export commonly used utilities
export { cn } from './cn';
export {
  buttonVariants,
  inputVariants,
  cardVariants,
  badgeVariants,
  alertVariants,
  avatarVariants,
  typographyVariants,
  iconVariants,
  spinnerVariants,
  combineVariants,
  createComponentVariants,
  type ButtonVariants,
  type InputVariants,
  type CardVariants,
  type BadgeVariants,
  type AlertVariants,
  type AvatarVariants,
  type TypographyVariants,
  type IconVariants,
  type SpinnerVariants,
} from './variants';