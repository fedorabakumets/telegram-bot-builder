/**
 * @fileoverview Хендлер получения пользователей токена через Telegram-бота
 *
 * Возвращает список пользователей бота по tokenId и telegram_id владельца.
 * Проверяет принадлежность токена пользователю.
 * Не требует браузерной сессии.
 * Возвращает { items: [...], count: N } для корректной работы condition-нод.
 *
 * @module userProjectsTokens/handlers/users/getBotTokenUsersHandler
 */

import type { Request, Response } from "express";
import { Pool } from "pg";
import { storage } from "../../../../storages/storage";

/** Пул подключений к PostgreSQL */
let pool: InstanceType<typeof Pool> | null = null;

/**
 * Возвращает или создаёт пул подключений к БД
 * @returns Экземпляр Pool
 */
function getPool(): InstanceType<typeof Pool> {
    if (!pool) {
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
    return pool;
}

/**
 * Нормализует tokenId — срезает префикс `token_` если он есть
 * @param raw - Сырое значение из параметра маршрута
 * @returns Числовой идентификатор токена
 */
function parseTokenId(raw: string): number {
    const cleaned = raw.startsWith("token_") ? raw.slice(6) : raw;
    return parseInt(cleaned, 10);
}

/**
 * Обрабатывает GET /api/bot/tokens/:tokenId/users
 *
 * Принимает tokenId в формате `131` или `token_131`.
 * Возвращает { items: [...], count: N } — список пользователей бота.
 * Поддерживает пагинацию через query-параметры limit и offset.
 *
 * @param req - query: telegram_id, limit, offset; params: tokenId
 * @param res - { items: BotUser[], count: number }
 * @returns Promise<void>
 */
export async function getBotTokenUsersHandler(req: Request, res: Response): Promise<void> {
    try {
        const tokenId = parseTokenId(req.params.tokenId);
        const telegramId = Number(req.query.telegram_id);
        const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10), 50);
        const offset = parseInt(String(req.query.offset ?? "0"), 10);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(tokenId)) {
            res.status(400).json({ error: "Некорректный tokenId" });
            return;
        }

        // Получаем токен и проверяем доступ
        const tokenRecord = await storage.getBotToken(tokenId);
        if (!tokenRecord) {
            res.status(404).json({ error: "Токен не найден" });
            return;
        }

        const projectId = tokenRecord.projectId;
        if (!(await storage.hasProjectAccess(projectId, telegramId))) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        const db = getPool();

        // Получаем общее количество пользователей
        const countResult = await db.query<{ total: string }>(
            `SELECT COUNT(*) AS total
             FROM bot_users
             WHERE project_id = $1
               AND token_id = $2
               AND is_bot = 0`,
            [projectId, tokenId]
        );
        const count = parseInt(countResult.rows[0]?.total ?? "0", 10);

        // Получаем пользователей с пагинацией
        const usersResult = await db.query(
            `SELECT
               bu.user_id        AS "userId",
               bu.username       AS "userName",
               bu.first_name     AS "firstName",
               bu.last_name      AS "lastName",
               bu.avatar_url     AS "avatarUrl",
               bu.registered_at  AS "registeredAt",
               bu.last_interaction AS "lastInteraction",
               bu.interaction_count AS "interactionCount",
               bu.is_active      AS "isActive",
               bu.user_data      AS "userData"
             FROM bot_users bu
             WHERE bu.project_id = $1
               AND bu.token_id = $2
               AND bu.is_bot = 0
             ORDER BY bu.last_interaction DESC
             LIMIT $3 OFFSET $4`,
            [projectId, tokenId, limit, offset]
        );

        res.json({ items: usersResult.rows, count });
    } catch (error: any) {
        console.error("[BotTokenUsers] Ошибка:", error.message);
        res.status(500).json({ error: "Не удалось получить пользователей" });
    }
}
