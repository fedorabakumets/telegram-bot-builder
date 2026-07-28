/**
 * @fileoverview Хендлер удаления токена пользователя
 * @module userProjectsTokens/handlers/tokens/deleteTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { stopBot } from "../../../../bots/stopBot";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";

/**
 * DELETE /api/user/tokens/:id — доступ владельца или коллаборатора проекта токена
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id as number | undefined;
        const tokenId = parseInt(req.params.id, 10);

        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const token = await storage.getBotToken(tokenId);
        if (!token) {
            res.status(404).json({ error: "Токен не найден" });
            return;
        }

        const hasAccess = await storage.hasProjectAccess(token.projectId, userId);
        if (!hasAccess) {
            res.status(403).json({ error: "Нет доступа к проекту токена" });
            return;
        }

        try {
            await stopBot(token.projectId, tokenId);
        } catch (stopError) {
            console.warn(`[deleteTokenHandler] Не удалось остановить бота ${tokenId}:`, stopError);
        }

        await storage.deleteBotToken(tokenId);

        void broadcastProjectEvent(token.projectId, {
            type: 'token-deleted',
            projectId: token.projectId,
            tokenId,
            data: { tokenId, tokenName: token.name },
            timestamp: new Date().toISOString(),
        }).catch((err) => console.error('[deleteTokenHandler] broadcast:', err));

        res.json({ success: true });
    } catch (error: unknown) {
        console.error("Ошибка удаления токена:", error);
        res.status(500).json({ error: "Не удалось удалить токен" });
    }
}
