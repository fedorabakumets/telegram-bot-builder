/**
 * @fileoverview Middleware проверки владения ресурсом, привязанным к проекту
 *
 * Дополняет requireProjectAccess (который умеет только :id/:projectId) для случаев,
 * когда ресурс адресуется НЕ-проектным идентификатором (:tokenId, :id медиа/env и т.п.).
 * Фабрика requireResourceOwnership принимает резолвер «запрос → projectId» и проверяет,
 * что текущая личность (владелец/коллаборатор) имеет доступ к этому проекту. Это
 * закрывает IDOR на маршрутах, где requireProjectAccess бесполезен (NaN projectId).
 *
 * По эталонной модели безопасности (api-security-ideal-architecture.md, раздел
 * «Проверка ownership для конкретных ресурсов»).
 *
 * @module middleware/requireResourceOwnership
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storages/storage";
import { getOwnerIdFromRequest } from "../telegram/auth-middleware";
import { getBotActorId } from "./bot-api-actor";

/** Резолвер проекта по запросу: возвращает projectId ресурса или null, если ресурс не найден */
export type ProjectIdResolver = (req: Request) => Promise<number | null>;

/** Резолвер личности для проверки доступа */
export type ActorIdResolver = (req: Request) => number | null;

/**
 * Создаёт middleware проверки владения ресурсом через резолвер projectId.
 * Личность гарантирована вышестоящим requireApiAuth; здесь — авторизация (доступ к проекту).
 * @param resolveProjectId - Функция, извлекающая projectId ресурса из запроса (null = не найден)
 * @param notFoundMessage - Сообщение при отсутствии ресурса (по умолчанию «Ресурс не найден»)
 * @param resolveActorId - Кто проверяется (по умолчанию session/PAT owner)
 * @returns Express-middleware, пропускающий запрос только владельцу/коллаборатору проекта
 */
export function requireResourceOwnership(
    resolveProjectId: ProjectIdResolver,
    notFoundMessage = "Ресурс не найден",
    resolveActorId: ActorIdResolver = getOwnerIdFromRequest,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const ownerId = resolveActorId(req);
        if (ownerId === null) {
            res.status(403).json({ message: "Нет прав доступа" });
            return;
        }

        let projectId: number | null;
        try {
            projectId = await resolveProjectId(req);
        } catch {
            res.status(500).json({ message: "Ошибка проверки доступа" });
            return;
        }

        if (projectId === null) {
            res.status(404).json({ message: notFoundMessage });
            return;
        }

        const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
        if (!hasAccess) {
            res.status(403).json({ message: "Нет прав доступа к проекту" });
            return;
        }

        next();
    };
}

/**
 * Резолвит projectId токена бота по :tokenId или :id из пути.
 * @param req - Запрос с параметром tokenId или id
 * @returns projectId токена или null, если токен не найден/некорректен
 */
async function resolveProjectIdByTokenParam(req: Request): Promise<number | null> {
    const raw = req.params.tokenId ?? req.params.id;
    const tokenId = parseInt(raw, 10);
    if (isNaN(tokenId)) return null;
    const token = await storage.getBotToken(tokenId);
    return token ? token.projectId : null;
}

/**
 * Middleware проверки владения по :tokenId в пути.
 * Резолвит токен → его projectId → доступ владельца/коллаборатора. Закрывает IDOR на
 * маршрутах вида /api/tokens/:tokenId/* и /api/bot/tokens/:tokenId/*, где
 * requireProjectAccess не работает (нет :projectId), а также защищает от подмены
 * чужого tokenId на маршрутах /api/projects/:projectId/tokens/:tokenId/* (проверяется
 * РЕАЛЬНЫЙ projectId токена, а не значение из URL).
 */
export const requireTokenOwnership = requireResourceOwnership(
    resolveProjectIdByTokenParam,
    "Токен не найден",
);

/**
 * Владение токеном для `/api/bot/*` — проверка по req.botActorId.
 */
export const requireBotTokenOwnership = requireResourceOwnership(
    resolveProjectIdByTokenParam,
    "Токен не найден",
    getBotActorId,
);
