/**
 * @fileoverview Список людей с удалённым аккаунтом или блокировкой бота.
 * @module server/routes/analytics/unavailable-users-handlers
 */
import type { Express, Request, Response } from 'express';
import { pool } from '../../database/db';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { storage } from '../../storages/storage';
import { getRequestTokenId } from '../utils/resolve-request-token';
import { parseUnavailableKind, parseUnavailablePage, queryUnavailableUsers } from './unavailable-users-query';

/**
 * Отдаёт страницу по выбранному боту. Чужой токен не подменяется.
 * @param req - Проект и фильтры
 * @param res - Список или ошибка
 * @returns Завершение
 */
async function unavailableUsersHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const tokenId = getRequestTokenId(req);
  const kind = parseUnavailableKind(req.query.kind);
  const page = parseUnavailablePage(req.query.limit, req.query.offset);
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || !tokenId || !kind || !page) {
    res.status(400).json({ message: 'Некорректные параметры списка' });
    return;
  }
  const token = await storage.getBotToken(tokenId);
  if (!token || token.projectId !== projectId) {
    res.status(404).json({ message: 'Бот не найден в проекте' });
    return;
  }
  try {
    res.json(await queryUnavailableUsers(pool, projectId, tokenId, kind, page.limit, page.offset));
  } catch (error) {
    console.error('Не удалось получить недоступных пользователей', error);
    res.status(500).json({ message: 'Не удалось получить список' });
  }
}

/**
 * Регистрирует чтение удалённых и заблокировавших.
 * @param app - Приложение
 * @returns Ничего
 */
export function registerUnavailableUsersRoutes(app: Express): void {
  app.get('/api/projects/:projectId/users/unavailable', requireProjectAccess, unavailableUsersHandler);
}
