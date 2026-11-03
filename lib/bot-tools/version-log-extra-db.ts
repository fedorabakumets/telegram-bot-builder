/** @fileoverview Дополнительное чтение версий, чекпоинты и управление сохранёнными логами. */
import { userDataRequest } from './user-data-db';
/** Читает снимок выбранной версии. */
export function getVersionSnapshot(projectId: number, versionId: number) { return userDataRequest(`/api/projects/${projectId}/versions/${versionId}`); }
/** Создаёт чекпоинт текущего сохранённого сценария. */
export async function createVersionCheckpoint(projectId: number, message: string) {
  const version = await userDataRequest(`/api/projects/${projectId}/versions/commit`, 'POST', { message });
  if (version.error || !Number.isSafeInteger(version.id)) return { error: 'Создание чекпоинта не подтверждено' };
  const stored = await getVersionSnapshot(projectId, version.id);
  if (stored.error || stored.id !== version.id || stored.projectId !== projectId) return { error: 'Повторное чтение не подтвердило чекпоинт' };
  return { ...stored, persistence: { confirmed: true, method: 'readback', resource: `version:${stored.id}` } };
}
/** Читает запись лога с серверной проверкой доступа к реальному проекту. */
export function getBotLog(logId: number) { return userDataRequest(`/api/bot-logs/${logId}`); }
/** Очищает live-логи выбранного бота. История запусков не удаляется. */
export function clearBotLogs(projectId: number, tokenId: number) { return userDataRequest(`/api/projects/${projectId}/tokens/${tokenId}/logs`, 'DELETE'); }
