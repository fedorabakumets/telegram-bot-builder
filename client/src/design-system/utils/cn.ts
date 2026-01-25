/**
 * Class Name Utility
 * 
 * Utility for combining and merging CSS classes with Tailwind CSS.
 * Re-exported from the main utils for design system consistency.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine and merge CSS classes with Tailwind CSS conflict resolution
 * @param inputs - Class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}