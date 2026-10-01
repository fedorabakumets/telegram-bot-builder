/**
 * @fileoverview Хендлер получения статистики воркеров Worker Pool
 *
 * Возвращает общую статистику по активным воркерам, СКОУПЛЕННУЮ по владельцу:
 * количество воркеров, общее число ботов, суммарную память и детализацию только
 * по тем воркерам, чьи проекты принадлежат текущей личности. Эндпоинт глобальный
 * (без :projectId/:tokenId в пути), поэтому изоляция выполняется in-handler:
 * фильтрация stats.details по проектам владельца и пересчёт агрегатов. Это закрывает
 * IDOR — раньше любой аутентифицированный пользователь видел воркеры всех проектов.
 * Общий воркер (WORKER_GROUPING=shared) приходит уже разбитым по проектам: владелец
 * видит только свои проекты и их долю памяти, но не соседей по процессу.
 *
 * @module botManagement/handlers/workerStatsHandler
 */

import type { Request, Response } from "express";
import { workerManager } from "../../../bots/botWorkerManager";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/** Детализация одного воркера для ответа API (без внутреннего pid) */
interface WorkerDetail {
  /** ID проекта */
  projectId: number;
  /** Количество активных ботов */
  botsCount: number;
  /** Потребление памяти в МБ: RSS воркера или доля проекта в общем воркере */
  memoryMb: number;
  /** true, если воркер общий для нескольких проектов (memoryMb — оценка доли) */
  shared: boolean;
}

/**
 * Обрабатывает GET /api/workers/stats
 * Возвращает статистику Worker Pool, ограниченную проектами текущего владельца:
 * количество воркеров, ботов, суммарную память и детализацию (без pid). Без владельца
 * (ownerId === null) — нулевые агрегаты и пустой details (defense-in-depth).
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 */
export async function handleWorkerStats(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = getOwnerIdFromRequest(req);

    // Без личности отдаём пустую статистику, не раскрывая чужие воркеры
    if (ownerId === null) {
      res.json({ workers: 0, totalBots: 0, totalMemoryMb: 0, details: [] });
      return;
    }

    const stats = workerManager.getStats();

    // Множество projectId, доступных владельцу/коллаборатору
    const ownerProjects = await storage.getUserBotProjects(ownerId, { ignoreArchive: true });
    const ownedProjectIds = new Set(ownerProjects.map((project) => project.id));

    // Оставляем только проекты владельца; pid и ключ воркера наружу не отдаём
    const owned = stats.details.filter((detail) => ownedProjectIds.has(detail.projectId));
    const details: WorkerDetail[] = owned.map((detail) => ({
      projectId: detail.projectId,
      botsCount: detail.botsCount,
      memoryMb: detail.memoryMb,
      shared: detail.shared,
    }));

    // Пересчитываем агрегаты; проекты общего воркера — один процесс
    const workers = new Set(owned.map((detail) => detail.workerKey)).size;
    const totalBots = details.reduce((sum, detail) => sum + detail.botsCount, 0);
    const totalMemoryMb = details.reduce((sum, detail) => sum + detail.memoryMb, 0);

    res.json({
      workers,
      totalBots,
      totalMemoryMb,
      details,
    });
  } catch (error: any) {
    console.error("[WorkerStats] Ошибка получения статистики:", error.message);
    res.status(500).json({ message: "Не удалось получить статистику воркеров" });
  }
}
