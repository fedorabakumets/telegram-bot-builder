/** @fileoverview Чтение сохранённого состояния доступа к чату через API. */
import { apiFetch } from './api-fetch.ts';

/** Параметры проверки сохранённого доступа. */
export interface ChatAccessOptions {
  /** Идентификатор выбранного токена бота. */
  token_id: number;
  /** Идентификатор чата Telegram. */
  chat_id: string;
  /** Тип чата из списка диалогов. */
  chat_type: 'private' | 'group' | 'supergroup' | 'channel';
}

/**
 * Читает последнее сохранённое состояние доступа без обращения к Telegram.
 * @param projectId - Идентификатор проекта
 * @param options - Токен и чат
 * @returns Состояние доступа или безопасная ошибка
 */
export async function checkChatAccessInDb(projectId: number, options: ChatAccessOptions) {
  try {
    const params = new URLSearchParams({ tokenId: String(options.token_id), chatType: options.chat_type });
    const response = await apiFetch(`/api/projects/${projectId}/dialogs/${encodeURIComponent(options.chat_id)}/access?${params}`);
    if (!response.ok) return { error: `Не удалось проверить доступ: HTTP ${response.status}` };
    const value = await response.json();
    if (!value || value.ok !== true || value.project_id !== projectId || value.token_id !== options.token_id
      || value.chat_id !== options.chat_id || value.chat_type !== options.chat_type
      || !['unknown', 'available', 'kicked', 'error'].includes(value.access_status)) {
      return { error: 'Некорректный ответ API проверки доступа' };
    }
    return value;
  } catch { return { error: 'Не удалось получить состояние доступа из API приложения' }; }
}
