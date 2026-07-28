/**
 * @fileoverview Настройки токена бота через живой API (MCP)
 * @description Срок хранения сообщений и другие безопасные настройки токена
 * без раскрытия секрета token. Ходит в API через apiFetch (Bearer MCP_AGENT_TOKEN).
 * @module lib/bot-tools/bot-token-settings-db
 */

import {
  isMessagesRetentionDays,
  MESSAGES_RETENTION_DAYS_VALUES,
  type MessagesRetentionDays,
} from '@shared/messages-retention';
import { apiFetch } from './api-fetch.ts';
import type { ReadDbOptions } from './node-query-db.ts';

/**
 * Обновляет срок хранения сообщений токена через
 * PUT /api/projects/:projectId/tokens/:tokenId/messages-retention.
 * 0 — без автоочистки; иначе сервер раз в час удаляет bot_messages старше N дней.
 * Агрегаты message_activity_daily не трогаются. Перезапуск бота не нужен.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param tokenId - ID токена из db_list_bot_tokens
 * @param messagesRetentionDays - Допустимое значение: 0, 7, 30, 60, 90, 180, 365
 * @param options - Опции запроса (URL API)
 * @returns { ok, messagesRetentionDays } либо { error }
 */
export async function setMessagesRetentionInDb(
  projectId: number,
  tokenId: number,
  messagesRetentionDays: number,
  options?: ReadDbOptions,
): Promise<
  { ok: true; messagesRetentionDays: MessagesRetentionDays } | { error: string }
> {
  if (!isMessagesRetentionDays(messagesRetentionDays)) {
    return {
      error: `messages_retention_days должен быть одним из: ${MESSAGES_RETENTION_DAYS_VALUES.join(', ')}`,
    };
  }

  let res: Response;
  try {
    res = await apiFetch(
      `/api/projects/${projectId}/tokens/${tokenId}/messages-retention`,
      {
        apiBaseUrl: options?.apiBaseUrl,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messagesRetentionDays }),
      },
    );
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) {
      return { error: `HTTP 404: токен или проект не найден${body ? `: ${body}` : ''}` };
    }
    if (res.status === 400) {
      return { error: body ? `HTTP 400: ${body}` : 'HTTP 400: неверные данные' };
    }
    if (res.status === 403) {
      return { error: body ? `HTTP 403: ${body}` : 'HTTP 403: нет доступа к токену' };
    }
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { success?: boolean; messagesRetentionDays?: number };
  try {
    body = (await res.json()) as { success?: boolean; messagesRetentionDays?: number };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const days = body.messagesRetentionDays ?? messagesRetentionDays;
  if (!isMessagesRetentionDays(days)) {
    return { error: `Сервер вернул недопустимое значение: ${days}` };
  }

  return { ok: true, messagesRetentionDays: days };
}
