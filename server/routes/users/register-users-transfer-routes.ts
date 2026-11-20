/** @fileoverview Регистрация авторизованных маршрутов переноса пользователей проекта. */
import type { Express } from 'express';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { importUsersHandler } from './import-users-handler';
/** Подключает импорт без обращения к Telegram. @param app - Приложение сервера. @returns Ничего. */
export function registerUsersTransferRoutes(app: Express): void {
  app.post('/api/projects/:projectId/users/import', requireProjectAccess, importUsersHandler);
}
