/**
 * @fileoverview Утилита для определения среды выполнения
 * 
 * @module bot-generator/utils/is-browser
 */

/**
 * Проверяет выполняется ли код в браузере
 * 
 * @returns true если выполняется в браузере
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Проверяет выполняется ли код в Node.js
 * 
 * @returns true если выполняется в Node.js
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions?.node;
}
