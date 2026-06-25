/**
 * @fileoverview Обработчик запроса логов конкретного запуска бота
 * @module server/routes/botManagement/handlers/botLaunchLogsHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { getOwnerIdFromRequest } from '../../../telegram/auth-middleware';

/**
 * Обрабатывает GET /api/launch/:launchId/logs
 * Возвращает все логи, привязанные к конкретному запуску бота.
 * projectId запуска резолвится через сами логи (поле projectId), после чего
 * проверяется владение проектом. Пустой набор логов трактуется как
 * отсутствие запуска (404).
 * @param req - HTTP запрос с параметром launchId
 * @param res - HTTP ответ
 * @returns Promise<void>
 */
export async function handleGetLaunchLogs(req: Request, res: Response): Promise<void> {
  const launchId = parseInt(req.params.launchId);

  if (isNaN(launchId)) {
    res.status(400).json({ error: 'Некорректный launchId' });
    return;
  }

  try {
    const logs = await storage.getBotLogsByLaunch(launchId);

    // Резолвим projectId запуска из самих логов (нет прямого метода по launchId)
    if (logs.length === 0) {
      res.status(404).json({ error: 'Запуск не найден' });
      return;
    }

    // Проверка владения: projectId запуска → доступ владельца/коллаборатора
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId === null) {
      res.status(403).json({ error: 'Нет прав доступа' });
      return;
    }
    const hasAccess = await storage.hasProjectAccess(logs[0].projectId, ownerId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Нет прав доступа' });
      return;
    }

    res.json(logs);
  } catch (err) {
    console.error('[botLaunchLogsHandler] Ошибка получения логов запуска:', err);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
}
