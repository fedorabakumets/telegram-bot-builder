/** @fileoverview Фиксированные авторизованные маршруты рассылок и кампаний. */
import { userDataRequest } from './user-data-db.ts';
/** Читает или изменяет разрешённый ресурс рассылок. */
export function requestBroadcast(projectId: number, resource: 'broadcasts' | 'broadcast-campaigns', method: string, suffix = '', body?: unknown, query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value));
  return userDataRequest(`/api/projects/${projectId}/${resource}${suffix}${params.size ? `?${params}` : ''}`, method, body);
}
