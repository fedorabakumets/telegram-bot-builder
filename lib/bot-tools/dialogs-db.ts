/** @fileoverview Чтение списка диалогов через авторизованный API приложения. */
import { apiFetch } from './api-fetch.ts';

/** Параметры списка диалогов для MCP. */
export interface DialogsOptions {
  /** Обязательный идентификатор бота. */
  token_id: number;
  /** Фильтр чатов. */
  kind?: 'all' | 'users' | 'groups' | 'channels';
  /** Строка поиска. */
  search?: string;
  /** Размер страницы. */
  limit?: number;
  /** Курсор продолжения. */
  cursor?: string;
}

/**
 * Получает диалоги без чтения токена Telegram и вызовов Bot API.
 * @param projectId - Идентификатор проекта
 * @param options - Бот и фильтры списка
 * @returns Данные или безопасная ошибка
 */
export async function listDialogsInDb(projectId: number, options: DialogsOptions) {
  const query = new URLSearchParams({ tokenId: String(options.token_id) });
  for (const key of ['kind', 'search', 'limit', 'cursor'] as const) {
    if (options[key] !== undefined) query.set(key, String(options[key]));
  }
  try {
    const response = await apiFetch(`/api/projects/${projectId}/dialogs?${query}`);
    if (!response.ok) return { error: `Не удалось получить диалоги: HTTP ${response.status}` };
    const value = await response.json();
    if (!value || value.ok !== true || !Array.isArray(value.dialogs)
      || value.project_id !== projectId || value.token_id !== options.token_id) {
      return { error: 'Некорректный ответ API диалогов' };
    }
    return value;
  } catch { return { error: 'Не удалось получить диалоги из API приложения' }; }
}
