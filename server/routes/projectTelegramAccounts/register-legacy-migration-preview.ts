/** @fileoverview Защищённый маршрут предварительного просмотра переноса Telegram-аккаунтов. */
import type { Express, RequestHandler } from 'express';
import { loadLegacyTelegramMigrationPreview } from '../../telegram-accounts/load-legacy-migration-preview';

/**
 * Регистрирует предварительный просмотр для владельца проекта.
 * @param app - Приложение Express.
 * @param requireAccess - Проверка доступа к проекту и флага функции.
 * @param requireManager - Проверка прав владельца проекта.
 */
export function registerLegacyTelegramMigrationPreview(
  app: Express, requireAccess: RequestHandler, requireManager: RequestHandler,
): void {
  app.get('/api/projects/:projectId/telegram-accounts/migration/preview', requireAccess, requireManager, (req, res) => {
    res.set('Cache-Control', 'no-store');
    void loadLegacyTelegramMigrationPreview(Number(req.params.projectId))
      .then(plan => res.json(plan))
      .catch(() => res.status(500).json({ message: 'Не удалось проверить старые привязки Telegram' }));
  });
}
