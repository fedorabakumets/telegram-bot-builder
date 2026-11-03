/** @fileoverview Точное чтение пользователя выбранного бота и его сохранённых ответов. */
import type { Request, Response } from 'express';
import { pool } from '../../../database/db';
import { getRequestTokenId, resolveEffectiveProjectTokenId } from '../../utils/resolve-request-token';
/** Читает одного пользователя; доступ к проекту проверяет внешний middleware. */
export async function getBotUserDataHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !/^[1-9]\d{0,19}$/.test(req.params.userId)) { res.status(400).json({ message: 'Некорректные параметры пользователя' }); return; }
  try {
    const tokenId = await resolveEffectiveProjectTokenId(projectId, getRequestTokenId(req));
    if (!tokenId) { res.status(404).json({ message: 'Бот проекта не найден' }); return; }
    const result = await pool.query(`SELECT user_id::text AS "userId", username AS "userName", first_name AS "firstName", last_name AS "lastName", user_data AS "userData", is_active AS "isActive", registered_at AS "registeredAt", last_interaction AS "lastInteraction", interaction_count AS "interactionCount" FROM bot_users WHERE project_id=$1 AND token_id=$2 AND user_id=$3 LIMIT 1`, [projectId, tokenId, req.params.userId]);
    if (!result.rows.length) { res.status(404).json({ message: 'Пользователь не найден' }); return; }
    res.json({ ...result.rows[0], projectId, tokenId });
  } catch { res.status(500).json({ message: 'Не удалось прочитать пользователя' }); }
}
