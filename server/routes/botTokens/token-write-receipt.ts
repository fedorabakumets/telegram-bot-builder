/**
 * @fileoverview Безопасная квитанция сохранённой записи токена без раскрытия секрета.
 */
import type { BotToken } from '@shared/schema';
/**
 * Проверяет запись, возвращённую хранилищем после записи или чтения существующего токена.
 * @param token - Сохранённая строка
 * @param projectId - Авторизованный проект
 * @param requestedSecret - Новый секрет, если запрос его менял
 * @returns Квитанция без содержимого секрета
 */
export function botTokenWriteReceipt(token: BotToken, projectId: number, requestedSecret?: string) {
 if (token.projectId !== projectId || !Number.isSafeInteger(token.id) || (requestedSecret !== undefined && token.token !== requestedSecret)) throw new Error('Сохранённая запись токена не совпала с запросом');
 return { effect: 'application' as const, outcome: 'saved' as const,
  persistence: { confirmed: true, method: 'returning', projectId, resourceId: token.id, ...(requestedSecret !== undefined ? { secretMatched: true } : {}) } };
}
