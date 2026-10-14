/** @fileoverview Буквальный поиск сохранённых сообщений через авторизованный API приложения. */
import { apiFetch } from './api-fetch.ts';

/** Фильтры поиска сообщений конкретного бота. */
export interface DialogSearchOptions {
  /** Идентификатор токена выбранного бота. */
  token_id: number;
  /** Непустая буквальная подстрока до двухсот символов. */
  query: string;
  /** Необязательный идентификатор чата Telegram. */
  chat_id?: string;
  /** Тип чата, обязательный для конкретного чата. */
  chat_type?: 'private' | 'group' | 'supergroup' | 'channel';
  /** Размер страницы от одного до ста, по умолчанию десять. */
  limit?: number;
  /** Продолжение к более старым совпадениям. */
  cursor?: string;
}

/**
 * Читает страницу совпадений, не вызывая Telegram.
 * @param projectId - Проект
 * @param options - Бот, текст и ограничения поиска
 * @returns Совпадения или безопасная ошибка
 */
export async function searchDialogMessagesInDb(projectId: number, options: DialogSearchOptions) {
  if (options.chat_id !== undefined && !options.chat_type) return { error: 'Для поиска в конкретном чате требуется тип чата' };
  const query = new URLSearchParams({ tokenId: String(options.token_id), query: options.query });
  if (options.chat_id !== undefined) query.set('chatId', options.chat_id);
  if (options.chat_type !== undefined) query.set('chatType', options.chat_type);
  if (options.limit !== undefined) query.set('limit', String(options.limit));
  if (options.cursor !== undefined) query.set('cursor', options.cursor);
  try {
    const response = await apiFetch(`/api/projects/${projectId}/dialogs/messages/search?${query}`);
    if (!response.ok) return { error: `Не удалось выполнить поиск сообщений: HTTP ${response.status}` };
    const value = await response.json();
    if (!value || value.ok !== true || !Array.isArray(value.messages) || value.project_id !== projectId
      || value.token_id !== options.token_id || value.query !== options.query.trim()
      || value.chat_id !== (options.chat_id ?? null) || value.chat_type !== (options.chat_type ?? null)
      || typeof value.has_more !== 'boolean' || !(value.next_cursor === null || typeof value.next_cursor === 'string')) {
      return { error: 'Некорректный ответ API поиска сообщений' };
    }
    return value;
  } catch { return { error: 'Не удалось выполнить поиск сообщений через API приложения' }; }
}
