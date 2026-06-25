/**
 * @fileoverview Middleware проверки владения переменной окружения бота
 *
 * Переменная окружения адресуется собственным :id (не projectId/tokenId), поэтому
 * requireProjectAccess здесь бесполезен. Резолвер достаёт env-переменную по :id,
 * по её tokenId находит токен и возвращает projectId токена — это позволяет
 * requireResourceOwnership проверить доступ владельца/коллаборатора. Закрывает IDOR
 * на маршрутах PATCH/DELETE /api/bot/env/:id и особенно GET /api/bot/env/:id/reveal
 * (раскрытие секретного значения).
 *
 * @module middleware/requireEnvVariableOwnership
 */

import type { Request } from "express";
import { storage } from "../storages/storage";
import { requireResourceOwnership } from "./requireResourceOwnership";

/**
 * Резолвит projectId по числовому :id переменной окружения.
 * Цепочка: env-переменная → её tokenId → токен → projectId токена.
 * @param req - Запрос с параметром id переменной окружения
 * @returns projectId токена-владельца переменной или null, если что-то не найдено/некорректно
 */
async function resolveProjectIdByEnvParam(req: Request): Promise<number | null> {
    const variableId = parseInt(req.params.id, 10);
    if (isNaN(variableId)) return null;

    const variable = await storage.getEnvVariable(variableId);
    if (!variable) return null;

    const token = await storage.getBotToken(variable.tokenId);
    return token ? token.projectId : null;
}

/**
 * Middleware проверки владения переменной окружения по :id в пути.
 * Резолвит env → token → projectId → доступ владельца/коллаборатора.
 */
export const requireEnvVariableOwnership = requireResourceOwnership(
    resolveProjectIdByEnvParam,
    "Переменная не найдена",
);
