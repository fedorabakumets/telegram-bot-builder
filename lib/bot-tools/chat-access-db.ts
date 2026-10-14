/** @fileoverview Проверка доступа бота к чату через Telegram API приложения. */
import { apiFetch } from './api-fetch.ts';

/** Параметры фактической проверки доступа. */
export interface ChatAccessOptions {
  /** Идентификатор выбранного токена бота. */
  token_id: number;
  /** Идентификатор чата Telegram. */
  chat_id: string;
  /** Тип чата из списка диалогов. */
  chat_type: 'private' | 'group' | 'supergroup' | 'channel';
}

/**
 * Запускает проверку Telegram и возвращает сохранённый результат с метаданными.
 * @param projectId - Идентификатор проекта
 * @param options - Токен и чат
 * @returns Состояние доступа или безопасная ошибка
 */
export async function checkChatAccessInDb(projectId: number, options: ChatAccessOptions) {
  try {
    const params = new URLSearchParams({ tokenId: String(options.token_id) });
    const path = options.chat_type === 'private'
      ? `/api/projects/${projectId}/dialogs/${encodeURIComponent(options.chat_id)}/check-access?${params}`
      : `/api/projects/${projectId}/groups/${encodeURIComponent(options.chat_id)}/sync?${params}`;
    const response = await apiFetch(path, {
      method: 'POST',
    });
    const value = await response.json();
    const status = value?.accessStatus;
    if (!['available', 'kicked', 'error'].includes(status)) {
      return { error: `Не удалось проверить доступ: HTTP ${response.status}` };
    }
    const group = value.group;
    return { ok: true, project_id: projectId, token_id: options.token_id,
      chat_id: options.chat_id, chat_type: group?.chatType ?? options.chat_type,
      access_status: status, access_checked_at: value.accessCheckedAt ?? null,
      title: group?.name ?? null, avatar_url: group?.avatarUrl ?? null,
      blocked: options.chat_type === 'private' ? value.blocked === true : null };
  } catch { return { error: 'Не удалось получить состояние доступа из API приложения' }; }
}
