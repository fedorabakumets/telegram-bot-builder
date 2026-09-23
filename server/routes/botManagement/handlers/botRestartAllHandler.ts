/**
 * @fileoverview Хендлер перезапуска всех запущенных ботов проекта
 * @module botManagement/handlers/botRestartAllHandler
 */

import type { Request, Response } from 'express';
import { restartAllRunningBots } from '../../../bots/restartAllRunningBots';

/**
 * Обрабатывает запрос на перезапуск всех запущенных ботов проекта.
 * Фазы выполняет restartAllRunningBots: остановка, пауза, запуск по очереди.
 * @param req - Запрос с params.id
 * @param res - Ответ
 */
export async function handleBotRestartAll(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    const result = await restartAllRunningBots(projectId);

    if (!result.ok) {
      res.status(404).json({ message: result.message });
      return;
    }

    if (result.message) {
      res.json({ message: result.message, restarted: 0 });
      return;
    }

    res.json({
      restarted: result.restarted,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    console.error('Ошибка перезапуска всех ботов:', error);
    res.status(500).json({ message: 'Не удалось перезапустить ботов' });
  }
}
