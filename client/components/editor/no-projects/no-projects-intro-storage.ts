/**
 * @fileoverview localStorage: уже показывали диалог на экране «нет проектов»
 * @module components/editor/no-projects/no-projects-intro-storage
 */

const STORAGE_PREFIX = 'botcraft:no-projects-intro-seen:';

/**
 * Ключ хранилища для пользователя
 * @param userId - id пользователя или anon
 * @returns ключ localStorage
 */
function storageKey(userId: string | number): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * Видел ли пользователь intro-диалог
 * @param userId - id пользователя
 * @returns true если анимацию можно пропустить
 */
export function isNoProjectsIntroSeen(userId: string | number): boolean {
  try {
    return localStorage.getItem(storageKey(userId)) === '1';
  } catch {
    return false;
  }
}

/**
 * Помечает intro как уже показанный
 * @param userId - id пользователя
 */
export function markNoProjectsIntroSeen(userId: string | number): void {
  try {
    localStorage.setItem(storageKey(userId), '1');
  } catch {
    /* ignore */
  }
}
