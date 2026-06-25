/**
 * @fileoverview Хендлер безопасного списка токенов проекта (без секрета token)
 * @module projectRoutes/handlers/listBotTokensHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { toBotTokenListItem } from "../bot-token-list-dto";

/**
 * Обрабатывает GET /api/projects/:id/tokens/list
 *
 * Возвращает список токенов проекта только с безопасными полями
 * (id/имя/username/флаги) через явный whitelist DTO. Секрет token и прочие
 * секреты в ответ не попадают. Доступ к проекту проверяется middleware
 * requireProjectAccess до вызова этого хендлера.
 *
 * @param req - Объект запроса Express с параметром id (projectId)
 * @param res - Объект ответа Express
 * @returns Promise<void>
 */
export async function listBotTokensHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный projectId" });
            return;
        }

        const tokens = await storage.getBotTokensByProject(projectId);
        res.json(tokens.map(toBotTokenListItem));
    } catch (err) {
        console.error("[listBotTokensHandler] Ошибка получения токенов:", err);
        res.status(500).json({ error: "Ошибка получения списка токенов" });
    }
}
