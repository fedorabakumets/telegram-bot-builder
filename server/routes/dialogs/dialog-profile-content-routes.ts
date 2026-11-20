/** @fileoverview Авторизованные маршруты сохранённых фотографий и ссылок профиля. */
import type { Express, Request, Response } from 'express';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { storage } from '../../storages/storage';
import { readProfileContent, type ProfileContentScope } from './dialog-profile-content-store';
import { serveProfilePhoto } from './dialog-profile-content-file';

/** Проверяет область профиля без подстановки бота по умолчанию. @param req - Запрос. @returns Область либо null. */
async function readScope(req: Request): Promise<ProfileContentScope | null> {
  const projectId = Number(req.params.projectId), userId = String(req.params.userId ?? '');
  const tokenId = req.query.tokenId === undefined ? null : Number(req.query.tokenId);
  const isGroup = req.query.isGroup === 'true';
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !(isGroup ? /^-[1-9]\d{0,19}$/ : /^[1-9]\d{0,19}$/).test(userId)
    || (tokenId !== null && (!Number.isSafeInteger(tokenId) || tokenId < 1))) return null;
  if (tokenId !== null && (await storage.getBotToken(tokenId))?.projectId !== projectId) return null;
  return { projectId, userId, tokenId, isGroup };
}

/** Регистрирует чтение материалов с общей проверкой прав проекта на обоих маршрутах. @param app - HTTP-сервер. */
export function registerDialogProfileContentRoutes(app: Express): void {
  const base = '/api/projects/:projectId/dialog-profiles/:userId/content';
  app.get(base, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const scope = await readScope(req);
      const beforeId = req.query.beforeId === undefined ? null : Number(req.query.beforeId);
      if (!scope || (beforeId !== null && (!Number.isSafeInteger(beforeId) || beforeId < 1))) {
        res.status(400).json({ message: 'Некорректная область материалов' }); return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.json(await readProfileContent(scope, beforeId));
    } catch { res.status(500).json({ message: 'Не удалось загрузить материалы профиля' }); }
  });
  app.get(`${base}/media/:mediaId`, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const scope = await readScope(req);
      if (!scope) { res.status(400).end(); return; }
      await serveProfilePhoto(req, res, scope);
    } catch { if (!res.destroyed) res.status(500).end(); }
  });
}
