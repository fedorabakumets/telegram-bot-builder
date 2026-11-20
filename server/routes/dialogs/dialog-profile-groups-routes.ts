/** @fileoverview Авторизованный маршрут групп общего профиля с проверкой проекта и пользователя. */
import type { Express, Request, Response } from 'express';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { getDialogProfileGroups } from './dialog-profile-groups-store';

/**
 * Возвращает только сохранённые сведения о группах в разрешённом проекте.
 * @param req - Запрос после проверки прав проекта.
 * @param res - Ответ с группами либо понятной ошибкой.
 * @returns Завершение обработки запроса.
 */
export async function dialogProfileGroupsHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId), userId = String(req.params.userId ?? '');
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !/^[1-9]\d{0,19}$/.test(userId)) {
    res.status(400).json({ message: 'Некорректный проект или пользователь' }); return;
  }
  res.setHeader('Cache-Control', 'no-store');
  try { res.json({ groups: await getDialogProfileGroups(projectId, userId) }); }
  catch { res.status(500).json({ message: 'Не удалось загрузить группы пользователя' }); }
}

/** Регистрирует чтение групп с обязательной проверкой доступа к проекту. @param app - HTTP-сервер. */
export function registerDialogProfileGroupsRoutes(app: Express): void {
  app.get('/api/projects/:projectId/users/:userId/groups', requireProjectAccess, dialogProfileGroupsHandler);
}
