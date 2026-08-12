/**
 * @fileoverview Общий кэш URL аватарок с ошибкой загрузки (sessionStorage)
 * Не даёт повторно бить /avatar после F5, пока вкладка жива.
 * @module lib/avatar-failed-cache
 */

/** Ключ sessionStorage со списком URL */
const STORAGE_KEY = "avatar-failed-urls";

/**
 * Читает список неудачных URL из sessionStorage
 * @returns Массив URL
 */
function readList(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Проверяет, был ли URL ранее с ошибкой загрузки
 * @param url - URL аватарки
 * @returns true если загрузка уже падала
 */
export function isAvatarUrlFailed(url: string): boolean {
  return readList().includes(url);
}

/**
 * Помечает URL как неудачный (не спамим сервер после F5)
 * @param url - URL аватарки
 */
export function markAvatarUrlFailed(url: string): void {
  try {
    const list = readList();
    if (list.includes(url)) return;
    list.push(url);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // sessionStorage недоступен — игнорируем
  }
}
