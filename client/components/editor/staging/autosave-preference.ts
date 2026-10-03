/**
 * @fileoverview Флаг автосохранения редактора в localStorage
 */

/** Ключ настройки автосохранения */
const AUTOSAVE_KEY = 'editor-autosave';

/**
 * Читает, включено ли автосохранение
 * @returns true, если пользователь включил автосохранение
 */
export function readAutosaveEnabled(): boolean {
  try {
    return localStorage.getItem(AUTOSAVE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Записывает флаг автосохранения
 * @param enabled - Включено ли автосохранение
 */
export function writeAutosaveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, enabled ? '1' : '0');
  } catch {
    /* приватный режим браузера */
  }
}
