/** @fileoverview Запись сообщений и отмена проверки через фиксированные HTTP маршруты. */
import { userDataRequest } from './user-data-db.ts';
/** Выполняет операцию сообщения выбранного бота. */
export function writeDialogMessage(projectId: number, tokenId: number, userId: string, kind: 'send-message' | 'send-node-message', body: unknown) {
  return userDataRequest(`/api/projects/${projectId}/users/${encodeURIComponent(userId)}/${kind}?tokenId=${tokenId}`, 'POST', body);
}
/** Редактирует или удаляет сообщение проекта. */
export function mutateDialogMessage(projectId: number, tokenId: number, messageId: number, method: 'PATCH' | 'DELETE', body?: unknown) {
  return userDataRequest(`/api/projects/${projectId}/messages/${messageId}?tokenId=${tokenId}`, method, body);
}
/** Отменяет существующую проверку, не создавая новую. */
export function cancelDialogAccessCheck(projectId: number, tokenId: number, jobId: string) {
  return userDataRequest(`/api/projects/${projectId}/chat-access-checks/${encodeURIComponent(jobId)}/cancel?tokenId=${tokenId}`, 'POST');
}
