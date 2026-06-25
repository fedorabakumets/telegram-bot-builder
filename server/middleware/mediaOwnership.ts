/**
 * @fileoverview Middleware проверки владения медиафайлом по :id
 *
 * Закрывает IDOR на маршрутах /api/media/:id (GET/PUT/DELETE и /:id/use), где
 * ресурс адресуется не-проектным идентификатором и requireProjectAccess бесполезен.
 * Резолвит медиафайл → его projectId → доступ владельца/коллаборатора.
 *
 * @module middleware/mediaOwnership
 */

import type { Request } from "express";
import { storage } from "../storages/storage";
import { requireResourceOwnership } from "./requireResourceOwnership";

/**
 * Резолвит projectId медиафайла по числовому :id из пути.
 * @param req - Запрос с параметром id медиафайла
 * @returns projectId медиафайла или null, если файл не найден/некорректен
 */
async function resolveProjectIdByMediaParam(req: Request): Promise<number | null> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return null;
    const media = await storage.getMediaFile(id);
    return media ? media.projectId : null;
}

/**
 * Middleware проверки владения медиафайлом по :id в пути.
 * Пропускает запрос только владельцу/коллаборатору проекта, которому принадлежит файл.
 */
export const requireMediaOwnership = requireResourceOwnership(
    resolveProjectIdByMediaParam,
    "Файл не найден",
);
