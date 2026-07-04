/**
 * @fileoverview Хендлер выдачи квоты хранилища проекта
 * (GET /api/projects/:projectId/storage-quota).
 *
 * Возвращает занятое место по локальным бэкендам проекта, лимит из ENV и флаг
 * мягкого превышения (Req 4.1, 4.4, 4.5, 4.7). Расчёт делегирован каноничной
 * функции `computeStorageQuota`; ответ потребляет клиентский индикатор
 * `StorageQuotaBar` (usedBytes/limitBytes).
 * @module botIntegration/handlers/botData/getStorageQuotaHandler
 */

import type { Request, Response } from "express";

import { computeStorageQuota } from "../../../../storage/compute-quota";

/**
 * Возвращает квоту хранилища проекта `{ usedBytes, limitBytes, quotaExceeded }`.
 *
 * @route GET /api/projects/:projectId/storage-quota
 * @param req - Запрос с projectId в params
 * @param res - Ответ с объектом квоты хранилища
 */
export async function getStorageQuotaHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный projectId" });
      return;
    }

    const quota = await computeStorageQuota(projectId);
    res.json(quota);
  } catch (error) {
    console.error("Ошибка получения квоты хранилища проекта:", error);
    res.status(500).json({ message: "Не удалось получить квоту хранилища" });
  }
}
