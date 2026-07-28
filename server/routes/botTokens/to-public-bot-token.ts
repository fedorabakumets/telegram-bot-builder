/**
 * @fileoverview Публичный DTO токена бота без секретов
 * @description Вырезает token / webhookSecretToken / userbot* из ответов API.
 * Вместо сырого token отдаёт маску (botId:••••) — UI может показывать и редактировать
 * через ввод нового значения; полный секрет остаётся только в БД.
 * @module server/routes/botTokens/to-public-bot-token
 */

import type { BotToken } from '@shared/schema';

/**
 * Маскирует Telegram bot token для ответа клиенту
 * @param raw - Сырой токен `123456:ABC...`
 * @returns Строка вида `123456:••••••••` или пустая
 */
export function maskBotToken(raw: string | null | undefined): string {
  if (!raw) return '';
  const botId = raw.split(':')[0] || '';
  return botId ? `${botId}:••••••••` : '••••••••';
}

/**
 * Проверяет, что строка — маска/placeholder, а не реальный Telegram token
 * @param value - Значение из клиента
 * @returns true, если нельзя сохранять как token
 */
export function isMaskedOrPlaceholderToken(value: string | null | undefined): boolean {
  if (!value) return true;
  if (value.includes('•') || value.includes('*') || value.includes('…')) return true;
  // Реальный токен: digits:alphanumeric
  return !/^\d+:[A-Za-z0-9_-]+$/.test(value);
}

/**
 * Преобразует запись токена в безопасный объект для JSON-ответа
 * @param token - Запись из хранилища
 * @returns Копия без сырых секретов (token заменён маской)
 */
export function toPublicBotToken(token: BotToken): BotToken {
  return {
    ...token,
    token: maskBotToken(token.token),
    webhookSecretToken: null,
    userbotApiHash: null,
    userbotSessionString: null,
  };
}

/**
 * Безопасный снимок bot_instance без поля token
 * @param instance - Экземпляр из БД (может содержать token)
 * @returns Объект без секрета token
 */
export function toPublicBotInstance<T extends { token?: string | null }>(
  instance: T,
): Omit<T, 'token'> & { token?: undefined } {
  const { token: _secret, ...rest } = instance;
  return rest;
}
