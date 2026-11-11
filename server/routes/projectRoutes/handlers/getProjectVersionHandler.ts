/**
 * @fileoverview Хендлер получения полной версии проекта со снимком
 *
 * Возвращает версию целиком (включая тяжёлый snapshot) для построения diff
 * между версией и текущим состоянием. Проверка доступа выполняется
 * middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/getProjectVersionHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на получение полной версии проекта (со snapshot)
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function getProjectVersionHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const versionId = parseInt(req.params.versionId);
        if (isNaN(projectId) || !projectId || isNaN(versionId) || !versionId) {
            res.status(400).json({ message: "Неверный ID проекта или версии" });
            return;
        }

        const version = await storage.getProjectVersion(versionId, projectId);
        if (!version || version.projectId !== projectId) {
            res.status(404).json({ message: "Версия не найдена" });
            return;
        }

        /** Технические координаты приватного объекта остаются только на сервере. */
        const { snapshotStorageId: _storageId, snapshotKey: _key, snapshotSha256: _sha,
            snapshotBytes: _bytes, snapshotState: _state, snapshotRetryAt: _retry,
            snapshotAttempts: _attempts, ...publicVersion } = version;
        res.json(publicVersion);
    } catch (error) {
        console.error("Ошибка получения версии проекта:", error);
        res.status(503).json({ message: "Не удалось прочитать снимок версии" });
    }
}
