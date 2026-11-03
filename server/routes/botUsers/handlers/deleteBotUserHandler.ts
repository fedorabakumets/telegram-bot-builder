/** @fileoverview Атомарное удаление одного пользователя и сохранённых сообщений. */
import type { Request, Response } from 'express';
import { pool } from '../../../database/db';
import { getRequestTokenId, resolveEffectiveProjectTokenId } from '../../utils/resolve-request-token';
import { deleteUserDataAtomically } from '../delete-user-data-atomically';
/** Удаляет данные выбранного пользователя без скрытых частичных ошибок. */
export async function deleteBotUserHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (!Number.isSafeInteger(projectId) || projectId < 1) { res.status(400).json({ message: 'Некорректный projectId' }); return; }
  try {
    const tokenId = await resolveEffectiveProjectTokenId(projectId, getRequestTokenId(req));
    const value = await deleteUserDataAtomically(pool, projectId, tokenId ?? undefined, req.params.userId);
    if (!value.deletedCount) { res.status(404).json({ message: 'Пользователь не найден' }); return; }
    res.json(value);
  } catch { res.status(500).json({ message: 'Не удалось удалить данные пользователя' }); }
}
