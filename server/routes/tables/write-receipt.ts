/** @fileoverview Совместимые подтверждения записи для объектных и массивных ответов таблиц. */
import type { Response } from 'express';
/**
 * Добавляет доказательство завершённой записи, сохраняя прежнюю форму массива.
 * @param res - Ответ HTTP.
 * @param data - Результат успешного хранилища после COMMIT или RETURNING.
 * @param projectId - Авторизованный проект.
 * @param tableId - Изменённая таблица, если известна.
 * @returns Прежний массив либо объект с дополнительным подтверждением.
 */
export function tableWriteReceipt(res: Response, data: unknown, projectId: number, tableId?: number): unknown {
  const persistence = { confirmed: true, projectId, ...(tableId === undefined ? {} : { tableId }) };
  res.setHeader('x-botcraft-persistence', JSON.stringify(persistence));
  return Array.isArray(data) ? data : { ...(data as object), persistence };
}
