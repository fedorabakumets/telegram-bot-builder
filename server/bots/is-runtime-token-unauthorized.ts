/** @fileoverview Отличает отказ авторизации Telegram от ошибок сторонних сервисов воркера. */
/**
 * Принимает только явный тип исключения aiogram, соответствующий ответу Telegram 401.
 * @param error - Последняя ошибка воркера
 * @returns Подтверждён ли отказ авторизации Telegram
 */
export function isRuntimeTokenUnauthorized(error?: string): boolean {
  return /\bTelegramUnauthorizedError\b/.test(error ?? '');
}
