/**
 * @fileoverview Обработчик запроса логов конкретного запуска бота
 * @module server/routes/botManagement/handlers/botLaunchLogsHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';

/**
 * Обрабатывает GET /api/launch/:launchId/logs
 * Возвращает все логи, привязанные к конкретному запуску бота
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
    res.json(logs);
  } catch (err) {
    console.error('[botLaunchLogsHandler] Ошибка получения логов запуска:', err);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
}
