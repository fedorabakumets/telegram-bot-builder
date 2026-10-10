/**
 * @fileoverview Шаги авторизации Telethon Userbot через существующий API.
 * @module lib/bot-tools/userbot-auth-db
 */
import type { ReadDbOptions } from './node-query-db.ts';
import { requestUserbotInDb } from './userbot-request-db.ts';

/** Параметры отправки кода */
export interface UserbotSendCode {
  /** API ID приложения Telegram */
  api_id: string;
  /** Телефон аккаунта */
  phone: string;
  /** API Hash; при отсутствии используется сохранённый */
  api_hash?: string;
}

/**
 * Запрашивает код входа для аккаунта.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param input - Реквизиты приложения и телефон
 * @param options - Параметры API
 * @returns Статус отправки без хеша кода
 */
export function sendUserbotCodeInDb(
  projectId: number, tokenId: number, input: UserbotSendCode, options?: ReadDbOptions,
) {
  return requestUserbotInDb(projectId, tokenId, '/send-code', {
    apiId: input.api_id, phone: input.phone,
    ...(input.api_hash !== undefined ? { apiHash: input.api_hash } : {}),
  }, options);
}

/**
 * Выполняет вход по коду и сообщает о необходимости второго фактора.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param phone - Телефон из шага отправки кода
 * @param code - Код Telegram
 * @param options - Параметры API
 * @returns Безопасный статус входа
 */
export function signInUserbotInDb(
  projectId: number, tokenId: number, phone: string, code: string, options?: ReadDbOptions,
) {
  return requestUserbotInDb(projectId, tokenId, '/sign-in', { phone, code }, options);
}

/**
 * Завершает авторизацию с паролем второго фактора.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param password - Пароль второго фактора без изменения пробелов
 * @param options - Параметры API
 * @returns Безопасный статус входа
 */
export function signInUserbot2faInDb(
  projectId: number, tokenId: number, password: string, options?: ReadDbOptions,
) {
  return requestUserbotInDb(projectId, tokenId, '/sign-in-2fa', { password }, options);
}
