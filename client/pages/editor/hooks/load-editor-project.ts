/** @fileoverview Загрузка проекта с различением отсутствия, истечения сессии и временного сбоя. */
/** Ошибка загрузки с исходным HTTP-кодом, не содержащая данных проекта. */
export class ProjectLoadError extends Error {
  /** Код ответа сервера либо ноль при сбое соединения. */
  status: number;
  /** Сохраняет код ответа. @param status - HTTP-код. */
  constructor(status: number) { super('Не удалось загрузить проект'); this.status = status; }
}
/** Загружает проект после готовности сессии. @param id - ID проекта. @param signal - Отмена запроса. @returns Данные проекта. */
export async function loadEditorProject<T>(id: number, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/projects/${id}`, { credentials: 'include', signal });
  if (!response.ok) throw new ProjectLoadError(response.status);
  return response.json();
}
