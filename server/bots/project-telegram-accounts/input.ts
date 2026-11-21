/** @fileoverview Безопасное чтение полей запросов авторизации Telegram. */

/** Ошибка, сообщение которой можно вернуть интерфейсу. */
export class ProjectTelegramInputError extends Error {}

/**
 * Проверяет, что тело запроса имеет форму объекта.
 * @param raw - Данные запроса.
 * @returns Поля запроса или пустой объект.
 */
export function telegramInput(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
}

/**
 * Проверяет пару API ID и API Hash без обращения к Telegram.
 * @param id - Идентификатор приложения.
 * @param hash - Ключ приложения.
 * @returns Нормализованные параметры приложения.
 */
export function telegramApiCredentials(id: unknown, hash: unknown) {
  const apiId = typeof id === 'number' ? String(id) : typeof id === 'string' ? id.trim() : '';
  const apiHash = typeof hash === 'string' ? hash.trim().toLowerCase() : '';
  if (!/^[1-9]\d{0,9}$/.test(apiId) || Number(apiId) > 2147483647 || !/^[0-9a-f]{32}$/.test(apiHash)) {
    throw new ProjectTelegramInputError('Укажите корректные API ID и API Hash.');
  }
  return { apiId, apiHash };
}
