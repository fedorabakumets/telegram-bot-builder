/**
 * @fileoverview Хендлер получения статистики воркеров Worker Pool
 *
 * Возвращает общую статистику по активным воркерам:
 * количество воркеров, общее число ботов и детализацию по каждому воркеру.
 *
 * @module botManagement/handlers/workerStatsHandler
 */

import type { Request, Response } from "express";
import { workerManager } from "../../../bots/botWorkerManager";
import { storage } from "../../../storages/storage";

/** Детализация одного воркера для ответа API */
interface WorkerDetail {
  /** ID проекта */
  projectId: number;
  /** Количество активных ботов */
  botsCount: number;
  /** Статус воркера в БД */
  status: string;
  /** Время запуска */
  startedAt: Date | null;
}

/**
 * Обрабатывает GET /api/workers/stats
 * Возвращает статистику Worker Pool: количество воркеров, ботов и детализацию
 *
 * @param _req - Объект запроса Express
 * @param res - Объект ответа Express
 */
export async function handleWorkerStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = workerManager.getStats();

    res.json({
      workers: stats.workers,
      totalBots: stats.totalBots,
      totalMemoryMb: stats.totalMemoryMb,
      details: stats.details,
    });
  } catch (error: any) {
    console.error("[WorkerStats] Ошибка получения статистики:", error.message);
    res.status(500).json({ message: "Не удалось получить статистику воркеров" });
  }
}
