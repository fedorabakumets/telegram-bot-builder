/** @fileoverview Удаление базы выбранного проекта с транзакционным подтверждением. */
import type { Request, Response } from 'express';
import { pool } from '../../../database/db';
import { getRequestTokenId } from '../../utils/resolve-request-token';
import { deleteUserDataAtomically } from '../delete-user-data-atomically';
/** Удаляет данные только после внешней проверки доступа к проекту. */
export async function clearBotUsersHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  if (!Number.isSafeInteger(projectId) || projectId < 1) { res.status(400).json({ message: 'Некорректный projectId' }); return; }
  try { res.json(await deleteUserDataAtomically(pool, projectId, getRequestTokenId(req) ?? undefined)); }
  catch { res.status(500).json({ message: 'Не удалось удалить данные пользователей' }); }
}
