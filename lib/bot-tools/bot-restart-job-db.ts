/** @fileoverview Чтение прогресса фонового перезапуска ботов через авторизованный API. */
import { apiFetch } from './api-fetch.ts';
import type { ReadDbOptions } from './node-query-db.ts';

/** Прочитать задание без повторного запуска массовой операции. */
export async function getBotRestartJobInDb(projectId: number, jobId: string, options?: ReadDbOptions) {
  try {
    const response = await apiFetch(`/api/projects/${projectId}/bot/restart-all/jobs/${encodeURIComponent(jobId)}`,
      { apiBaseUrl: options?.apiBaseUrl });
    if (!response.ok) return { error: `HTTP ${response.status}: задание недоступно; проверьте состояние ботов` };
    return await response.json();
  } catch {
    return { error: 'Не удалось прочитать задание; не запускайте массовый перезапуск повторно вслепую' };
  }
}
