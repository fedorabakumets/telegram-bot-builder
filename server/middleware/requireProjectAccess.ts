/**
 * @fileoverview Middleware проверки доступа к проекту
 *
 * Проверяет что авторизованный пользователь является владельцем
 * или коллаборатором проекта перед выполнением хендлера.
 * Личность гарантирована вышестоящим requireApiAuth (deny-by-default);
 * отсутствие личности здесь — defense-in-depth → 403.
 *
 * @module middleware/requireProjectAccess
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storages/storage";
import { getOwnerIdFromRequest } from "../telegram/auth-middleware";

/**
 * Извлекает projectId из параметров запроса.
 * Поддерживает :id и :projectId.
 * @param req - Объект запроса Express
 * @returns Числовой ID проекта или NaN
 */
function extractProjectId(req: Request): number {
    const raw = req.params.id ?? req.params.projectId;
    return parseInt(raw, 10);
}

/**
 * Middleware проверки доступа к проекту.
 * Отсутствие личности → 403 (defense-in-depth; requireApiAuth выше уже гарантирует личность).
 * Для авторизованных пользователей проверяет владельца или коллаборатора.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @param next - Следующий middleware
 * @returns Promise<void>
 */
export async function requireProjectAccess(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const projectId = extractProjectId(req);

    if (isNaN(projectId)) {
        next();
        return;
    }

    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId === null) {
        res.status(403).json({ message: "Нет прав доступа к проекту" });
        return;
    }

    const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
    if (!hasAccess) {
        res.status(403).json({ message: "Нет прав доступа к проекту" });
        return;
    }

    next();
}
