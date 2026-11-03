/**
 * @fileoverview Постоянные заявки создания проектов с безопасной квитанцией без сценария и секретов.
 */
import type { Request, Response } from 'express';
import { durableAction } from '../../../services/action-requests/durable-action';
import { actionRequestLedger } from '../../../services/action-requests/default-ledger';
/**
 * Сохраняет только идентификатор, имя и подтверждение созданного проекта.
 * @param body - Результат обработчика
 * @param status - HTTP-код
 * @returns Безопасная квитанция для повторного запроса
 */
function creationReceipt(body: unknown, status: number) {
 const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
 if (status >= 400) return { message: 'Создание проекта отклонено', status };
 return { id: value.id, name: value.name, revision: value.revision,
  effect: 'application', outcome: 'saved', persistence: value.persistence };
}
/**
 * Выполняет создание после авторизации и захвата необязательной постоянной заявки.
 * @param req - Авторизованный запрос
 * @param res - Ответ
 * @param ownerId - Проверенный владелец
 * @param action - Вид создания
 * @param handler - Создание и JSON-ответ
 * @returns Завершение действия
 */
export async function durableProjectCreation(req: Request, res: Response, ownerId: number, action: 'create_project' | 'duplicate_project', handler: () => Promise<void>): Promise<void> {
 await durableAction(async () => handler(), { action, scope: () => `owner:${ownerId}`, ledger: actionRequestLedger, receipt: creationReceipt })(req, res, () => undefined);
}
