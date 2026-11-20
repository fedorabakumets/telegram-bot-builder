/** @fileoverview Лёгкая пакетная загрузка подтверждённой аудитории для селекторов ботов. */
import type { Express, Request, Response } from 'express';
import { pool } from '../../database/db';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
/** Возвращает те же счётчики, что снимок аналитики, без расчёта графиков. @param req - Разрешённый проект. @param res - Все счётчики одним ответом. */
async function handleCounts(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (!Number.isSafeInteger(projectId) || projectId < 1) { res.status(400).json({ message: 'Неверный проект' }); return; }
  try {
    const result = await pool.query(`SELECT t.id token_id,COUNT(a.user_id)::integer total_users
      FROM bot_tokens t LEFT JOIN analytics_audience_v2 a ON a.project_id=t.project_id AND a.token_id=t.id
        AND a.first_interaction_at<=CURRENT_TIMESTAMP WHERE t.project_id=$1 GROUP BY t.id
      ORDER BY total_users DESC,t.id`, [projectId]);
    res.json(result.rows);
  } catch { res.status(500).json({ message: 'Не удалось получить количество пользователей ботов' }); }
}
/** Регистрирует защищённый маршрут счётчиков. @param app - Сервер приложения. */
export function registerBotAudienceCounts(app: Express): void {
  app.get('/api/projects/:projectId/bot-audience-counts', requireProjectAccess, handleCounts);
}
