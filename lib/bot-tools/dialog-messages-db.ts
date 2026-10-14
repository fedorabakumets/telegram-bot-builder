/** @fileoverview Получение сохранённой истории диалога через авторизованный HTTP API. */
import { apiFetch } from './api-fetch.ts';

/** Параметры истории конкретного чата. */
export interface DialogMessagesOptions {
  /** Идентификатор выбранного токена бота. */
  token_id: number;
  /** Идентификатор чата Telegram строкой. */
  chat_id: string;
  /** Тип чата из списка диалогов. */
  chat_type: 'private' | 'group' | 'supergroup' | 'channel';
  /** Размер страницы от 1 до 100. */
  limit?: number;
  /** Продолжение к более старым сообщениям. */
  cursor?: string;
  /** Добавление входящих сообщений пользователя из групп. */
  include_group_context?: boolean;
}

/**
 * Получает страницу сохранённой истории без доступа к Telegram-токену.
 * @param projectId - Проект
 * @param options - Бот, чат и пагинация
 * @returns История или безопасная ошибка
 */
export async function getDialogMessagesInDb(projectId: number, options: DialogMessagesOptions) {
  if (options.include_group_context && options.chat_type !== 'private') {
    return { error: 'Групповой контекст доступен только для личного диалога' };
  }
  const query = new URLSearchParams({ tokenId: String(options.token_id), chatType: options.chat_type,
    includeGroupContext: String(options.include_group_context ?? false) });
  if (options.limit !== undefined) query.set('limit', String(options.limit));
  if (options.cursor !== undefined) query.set('cursor', options.cursor);
  try {
    const response = await apiFetch(`/api/projects/${projectId}/dialogs/${encodeURIComponent(options.chat_id)}/messages?${query}`);
    if (!response.ok) return { error: `Не удалось получить историю диалога: HTTP ${response.status}` };
    const value = await response.json();
    if (!value || value.ok !== true || !Array.isArray(value.messages) || value.project_id !== projectId
      || value.token_id !== options.token_id || value.chat_id !== options.chat_id || value.chat_type !== options.chat_type
      || value.include_group_context !== (options.include_group_context ?? false)) {
      return { error: 'Некорректный ответ API истории диалога' };
    }
    return value;
  } catch { return { error: 'Не удалось получить историю диалога из API приложения' }; }
}
