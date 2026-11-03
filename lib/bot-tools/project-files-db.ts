/** @fileoverview Чтение файлов и ограниченная загрузка байтов без серверных путей. */
import { apiFetch } from './api-fetch.ts';
import { userDataRequest } from './user-data-db.ts';
/** Убирает внутренние пути и секретные поля из файловых ответов. */
export function safeFileResult(value: unknown): any {
  if (Array.isArray(value)) return value.map(safeFileResult);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/^(token|filePath|storagePath|secretsEnc)$/i.test(key)).map(([key, item]) => [key, safeFileResult(item)]));
}
/** Читает или удаляет файлы через фиксированный API. */
export async function projectFilesRequest(projectId: number, method: 'GET' | 'DELETE', query: Record<string, unknown> = {}, body?: unknown) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value));
  try {
    const response = await apiFetch(`/api/projects/${projectId}/files?${params}`, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    const value = await response.json();
    if (!response.ok || value.success === false) return { error: 'Удаление файлов завершено не полностью или отклонено', status: value.status ?? 'error',
      deleted: typeof value.deleted === 'number' ? value.deleted : 0, requested: value.requested, missing: value.missing, physical: value.physical, persistence: value.persistence };
    return safeFileResult(value);
  } catch { return { error: 'Не удалось выполнить операцию файлов' }; }
}
/** Читает квоту проекта. */
export function projectQuota(projectId: number) { return userDataRequest(`/api/projects/${projectId}/storage-quota`); }
/** Загружает ограниченные байты в существующий multipart endpoint. */
export async function uploadProjectBytes(projectId: number, fileName: string, mimeType: string, base64: string) {
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > 2 * 1024 * 1024 || bytes.toString('base64') !== base64) return { error: 'Ожидается корректный base64 не более 2 МиБ' };
  const body = new FormData();
  body.append('file', new Blob([bytes], { type: mimeType }), fileName);
  try {
    const response = await apiFetch(`/api/media/upload/${projectId}`, { method: 'POST', body });
    if (!response.ok) return { error: `Загрузка: HTTP ${response.status}` };
    const value = await response.json();
    if (!Number.isSafeInteger(value.id)) return { error: 'API не подтвердил идентификатор загруженного файла' };
    const stored = await userDataRequest(`/api/media/${value.id}`);
    if (stored.error || stored.id !== value.id || stored.projectId !== projectId) return { error: 'Повторное чтение не подтвердило загрузку файла' };
    return { ...safeFileResult(value), persistence: { confirmed: true, method: 'readback' } };
  } catch { return { error: 'Не удалось загрузить файл' }; }
}

/** Сохраняет только разрешённые метаданные и подтверждает чтением. */
export async function updateProjectFileMetadata(mediaId: number, body: Record<string, unknown>) {
  const value = await userDataRequest(`/api/media/${mediaId}`, 'PUT', body);
  if (value.error) return value;
  const stored = await userDataRequest(`/api/media/${mediaId}`);
  if (stored.error || Object.entries(body).some(([key, item]) => JSON.stringify(stored[key]) !== JSON.stringify(item))) return { error: 'Изменение метаданных файла не подтверждено' };
  return { ...safeFileResult(stored), persistence: { confirmed: true, method: 'readback' } };
}
/** Отмечает использование принадлежащего пользователю медиа. */
export function markProjectFileUsed(mediaId: number) { return userDataRequest(`/api/media/${mediaId}/use`, 'POST'); }
