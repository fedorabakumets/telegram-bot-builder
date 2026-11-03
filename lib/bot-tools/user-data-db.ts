/** @fileoverview Авторизованные запросы операций пользователей без раскрытия HTTP ошибок. */
import { apiFetch } from './api-fetch.ts';
/** Выполняет фиксированный маршрут API и возвращает безопасный результат. */
export async function userDataRequest(path: string, method = 'GET', body?: unknown) {
  try {
    const response = await apiFetch(path, { method, ...(body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }) });
    if (!response.ok) return { error: `API приложения: HTTP ${response.status}`, status: response.status };
    const value = await response.json();
    if (!value || typeof value !== 'object') return { error: 'Некорректный ответ API приложения' };
    if (value.state === 'unknown') return { ...value, error: 'Исход действия неизвестен; повторное выполнение запрещено', outcome: 'unknown' };
    if (value.success === false || value.deleted === false || typeof value.error === 'string') return { error: 'API приложения не подтвердил выполнение операции' };
    return value;
  } catch { return { error: 'Не удалось выполнить запрос API приложения' }; }
}
/** Читает страницу пользователей с переменными и структурированными ответами. */
export function listUserData(projectId: number, query: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value));
  return userDataRequest(`/api/projects/${projectId}/users?${params}`);
}
/** Читает развёрнутые переменные выбранного бота. */
export function getUserVariables(projectId: number, tokenId: number, limit: number) {
  return userDataRequest(`/api/projects/${projectId}/users/variables?tokenId=${tokenId}&limit=${limit}`);
}
/** Сохраняет состояние пользователя; сервер возвращает строку после записи. */
export function updateUserData(projectId: number, tokenId: number, userId: string, body: unknown) {
  return userDataRequest(`/api/projects/${projectId}/users/${encodeURIComponent(userId)}?tokenId=${tokenId}`, 'PUT', body);
}
/** Удаляет пользователя выбранного бота. */
export function deleteUserData(projectId: number, tokenId: number, userId: string) {
  return userDataRequest(`/api/projects/${projectId}/users/${encodeURIComponent(userId)}?tokenId=${tokenId}`, 'DELETE');
}
