/** @fileoverview Авторизованное чтение ботов и общих дат личного профиля во всём проекте. */
import type { Express, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { pool } from '../../database/db';
import { enrichDialogBotMemberships } from './enrich-dialog-bots';
import type { DialogProfileBotsData } from '../../../shared/dialog-profile-bots';
import { UsersRateLimitStore } from '../userProjectsTokens/users-rate-limit-store';

/**
 * Читает только сохранённые связи и даты, не обращаясь к Telegram и не возвращая токены.
 * @param req - Запрос после проверки прав проекта
 * @param res - Ответ общего профиля
 * @returns Завершение HTTP-ответа
 */
export async function dialogProfileBotsHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const userId = String(req.params.userId ?? '');
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !/^[1-9]\d{0,19}$/.test(userId)) {
    res.status(400).json({ message: 'Некорректный проект или пользователь' }); return;
  }
  try {
    const [entries, dates] = await Promise.all([
      enrichDialogBotMemberships(projectId, [{ userId }]),
      pool.query(`SELECT MIN(first_at) AS "registeredAt", MAX(last_at) AS "lastInteraction" FROM (
        SELECT registered_at first_at,last_interaction last_at FROM bot_users
          WHERE project_id=$1 AND user_id::text=$2 AND COALESCE(is_bot,0)=0
        UNION ALL SELECT MIN(created_at),MAX(created_at) FROM bot_messages
          WHERE project_id=$1 AND user_id=$2 AND COALESCE(chat_type,'private')='private'
      ) saved_dates`, [projectId, userId]),
    ]);
    /** Явный список полей исключает токены, ошибки авторизации и переменные пользователя. */
    const botMemberships = (entries[0].botMemberships ?? []).map(bot => ({
      tokenId: bot.tokenId, name: bot.name, username: bot.username, status: bot.status,
      incomingMessageCount: bot.incomingMessageCount, buttonClickCount: bot.buttonClickCount,
      lastInteraction: bot.lastInteraction, firstSavedMessageAt: bot.firstSavedMessageAt,
      isActive: bot.isActive, isBlocked: bot.isBlocked, isDeleted: bot.isDeleted, botAvailability: bot.botAvailability,
    }));
    const response: DialogProfileBotsData = { botMemberships, registeredAt: dates.rows[0]?.registeredAt ?? null,
      lastInteraction: dates.rows[0]?.lastInteraction ?? null };
    res.json(response);
  } catch { res.status(500).json({ message: 'Не удалось загрузить ботов пользователя' }); }
}

/** Регистрирует чтение общего профиля с обязательной проверкой доступа. @param app - HTTP-сервер. */
export function registerDialogProfileBotsRoutes(app: Express): void {
  /** Ограничивает чтение связей и дат до обращения к хранилищу проекта. */
  const profileBotsLimit = rateLimit({
    windowMs: 60_000, limit: 120, store: new UsersRateLimitStore('dialog-profile-bots'),
    standardHeaders: 'draft-7', legacyHeaders: false,
    message: { message: 'Слишком много запросов профиля. Повторите позже.' },
  });
  app.get('/api/projects/:projectId/dialog-users/:userId/profile-bots', profileBotsLimit, requireProjectAccess, dialogProfileBotsHandler);
}
