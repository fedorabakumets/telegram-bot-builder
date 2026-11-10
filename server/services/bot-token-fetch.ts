/**
 * @fileoverview Прекращает запросы Telegram для подтверждённо недействительных токенов.
 */
import { getTelegramApiBaseUrl } from '../utils/telegram-api-url';
import type { BotToken } from '@shared/schema';
import { markBotTokenUnauthorized } from '../bots/mark-bot-token-unauthorized';
import { fetchWithProxy } from '../utils/telegram-proxy';

/** Создаёт безопасный ответ без обращения к Telegram. */
function unauthorizedResponse(status: number): Response {
  return Response.json({ ok: false, error_code: status, description: status === 401 ? 'Unauthorized' : 'Bot disabled' }, { status });
}

/**
 * Ограничивает запросы известными токенами и запоминает подтверждённый HTTP 401.
 * @param tokens - Свежие записи токенов текущего проекта
 * @returns Обёртка транспорта, сохраняющая ответы и исключения сети
 */
export function createBotTokenFetch(tokens: BotToken[]): typeof fetchWithProxy {
  const denied = new Set(tokens.filter(token => token.isActive === 0 || token.authorizationError === 'unauthorized').map(token => token.token));
  return async (url, options) => {
    const record = tokens.find(token => [`${getTelegramApiBaseUrl()}/bot${token.token}/`, `${getTelegramApiBaseUrl()}/file/bot${token.token}/`].some(prefix => String(url).startsWith(prefix)));
    if (record && denied.has(record.token)) return unauthorizedResponse(record.authorizationError === 'unauthorized' || record.isActive !== 0 ? 401 : 403);
    const response = await fetchWithProxy(url, options);
    if (record && response.status === 401 && String(url).startsWith(`${getTelegramApiBaseUrl()}/bot${record.token}/`)) {
      denied.add(record.token);
      await markBotTokenUnauthorized(record.projectId, record.id, record.token);
    }
    return response;
  };
}
