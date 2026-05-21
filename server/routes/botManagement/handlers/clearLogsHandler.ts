/**
 * @fileoverview Обработчик очистки логов бота
 *
 * Удаляет live-логи (без launch_id) для указанного токена из БД и буфера.
 *
 * @module clearLogsHandler
 */

import type { Request, Response } from 'express';
import { clearBotLogs } from '../../../terminal/botLogsBuffer';

/**
 * Очищает логи бота по projectId и tokenId
 * @param req - Express запрос
 * @param res - Express ответ
 */
export async function handleClearLogs(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const tokenId = parseInt(req.params.tokenId);

    if (isNaN(projectId) || isNaN(tokenId)) {
      res.status(400).json({ error: 'Некорректные projectId или tokenId' });
      return;
    }

    await clearBotLogs(projectId, tokenId);
    res.json({ success: true });
  } catch (err) {
    console.error('[ClearLogs] Ошибка очистки логов:', err);
    res.status(500).json({ error: 'Ошибка очистки логов' });
  }
}
