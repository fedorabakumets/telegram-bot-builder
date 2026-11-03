/** @fileoverview HTTP адаптер шаблонов с подтверждением изменённого состояния. */
import { isDeepStrictEqual } from 'node:util';
import { userDataRequest } from './user-data-db';
/** Выполняет фиксированную операцию шаблонов с серверной проверкой владельца. */
export async function templatesRequest(method = 'GET', templateId?: number, body?: unknown, use = false) {
  const path = `/api/templates${templateId === undefined ? '' : `/${templateId}`}${use ? '/use' : ''}`;
  const value = await userDataRequest(path, method, body);
  if (value.error || method === 'GET') return value;
  if (method === 'DELETE') {
    const remaining = await userDataRequest(path);
    return remaining.status === 404 ? { ...value, persistence: { confirmed: true, method: 'readback_absent' } } : { error: 'Удаление шаблона не подтверждено' };
  }
  const savedId = use ? (value.templateId ?? value.copiedTemplate?.id) : value.id;
  if (!Number.isSafeInteger(savedId)) return { error: 'API не подтвердил идентификатор сохранённого шаблона' };
  const stored = await userDataRequest(`/api/templates/${savedId}`);
  if (stored.error) return { error: 'Повторное чтение шаблона не удалось' };
  if (!use && Object.entries((body ?? {}) as Record<string, unknown>).some(([key, item]) => !isDeepStrictEqual(stored[key], item))) return { error: 'Сохранение полей шаблона не подтверждено' };
  if (use) {
    const project = await userDataRequest(`/api/projects/${value.projectId ?? value.project?.id}`);
    if (project.error || project.id !== (value.projectId ?? value.project?.id)) return { error: 'Копирование проекта не подтверждено' };
  }
  return { ...value, persistence: { confirmed: true, method: 'readback' } };
}
