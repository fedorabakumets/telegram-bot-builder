/**
 * @fileoverview Хендлер перезапуска всех запущенных ботов проекта
 * @module botManagement/handlers/botRestartAllHandler
 */

import type { Request, Response } from 'express';
import { restartAllJobs } from '../restart-all-jobs';
import { RestartAllInProgressError, restartAllRunningBots } from '../../../bots/restartAllRunningBots';

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
      res.json({ message: result.message, restarted: result.restarted, failed: result.failed, results: result.results });
      return;
    }

    res.json({
      restarted: result.restarted,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    if (error instanceof RestartAllInProgressError) {
      res.status(409).json({ message: error.message });
      return;
    }
    console.error('Ошибка перезапуска всех ботов:', error);
    res.status(500).json({ message: 'Не удалось перезапустить ботов' });
  }
}

/** Проверяет ID проекта до обращения к очереди. */
function projectId(req: Request): number | undefined {
  const id = Number(req.params.id);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

/** Принимает работу и сразу возвращает 202; повтор получает то же активное задание. */
export async function handleCreateBotRestartAllJob(req: Request, res: Response): Promise<void> {
  const id = projectId(req);
  if (!id) { res.status(400).json({ message: 'Неверный ID проекта' }); return; }
  try {
    res.status(202).json(restartAllJobs.start(id));
  } catch (error) {
    if (error instanceof RestartAllInProgressError) {
      res.status(409).json({ message: 'В проекте уже выполняется перезапуск ботов.' });
      return;
    }
    res.status(503).json({ message: 'Очередь перезапусков заполнена. Повторите позже.' });
  }
}

/** Показывает прогресс только в проекте, уже проверенном middleware доступа. */
export async function handleBotRestartAllJob(req: Request, res: Response): Promise<void> {
  const id = projectId(req);
  if (!id) { res.status(400).json({ message: 'Неверный ID проекта' }); return; }
  const job = restartAllJobs.get(id, String(req.params.jobId));
  res.setHeader('Cache-Control', 'no-store');
  if (!job) {
    res.status(404).json({ code: 'RESTART_JOB_NOT_FOUND',
      message: 'Задание недоступно: срок хранения истёк или панель перезапустилась. Проверьте состояние ботов.' });
    return;
  }
  res.json(job);
}
