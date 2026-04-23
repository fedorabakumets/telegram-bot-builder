/**
 * @fileoverview Хендлер получения одного пользователя токена по userId
 *
 * Принимает tokenId и userId, проверяет доступ через telegram_id,
 * возвращает данные пользователя из таблицы bot_users и его аватарку.
 *
 * @module userProjectsTokens/handlers/users/getBotTokenUserHandler
 */

import type { Request, Response } from "express";
import { Pool } from "pg";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

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
 * Нормализует userId — срезает префикс `user_` если он есть
 * @param raw - Сырое значение из параметра маршрута
 * @returns Строковый идентификатор пользователя
 */
function parseUserId(raw: string): string {
    return raw.startsWith("user_") ? raw.slice(5) : raw;
}

/**
 * Скачивает файл по URL и сохраняет на диск
 * @param url - URL для скачивания
 * @param destPath - Путь для сохранения файла
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    const resp = await fetchWithProxy(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error(`Ошибка скачивания: ${resp.status}`);
    const dest = createWriteStream(destPath);
    await pipeline(Readable.fromWeb(resp.body as any), dest);
}

/**
 * Получает URL аватарки пользователя через Telegram API и сохраняет локально.
 * При любой ошибке возвращает null — не прерывает основной запрос.
 * @param token - Токен бота
 * @param userId - Telegram ID пользователя
 * @param projectId - ID проекта для пути сохранения
 * @returns Локальный путь к аватарке или null
 */
async function fetchUserPhotoUrl(
    token: string,
    userId: string,
    projectId: number,
): Promise<string | null> {
    try {
        const baseUrl = `https://api.telegram.org/bot${token}`;

        const photosResp = await fetchWithProxy(
            `${baseUrl}/getUserProfilePhotos?user_id=${userId}&limit=1`,
            { signal: AbortSignal.timeout(10000) },
        );
        if (!photosResp.ok) return null;

        const photosData = await photosResp.json() as {
            ok: boolean;
            result?: { total_count: number; photos: Array<Array<{ file_id: string }>> };
        };

        if (!photosData.ok || !photosData.result?.total_count || !photosData.result.photos?.[0]?.[0]) {
            return null;
        }

        const photos0 = photosData.result.photos[0];
        const fileId = photos0[photos0.length - 1].file_id;

        const fileResp = await fetchWithProxy(
            `${baseUrl}/getFile?file_id=${fileId}`,
            { signal: AbortSignal.timeout(10000) },
        );
        if (!fileResp.ok) return null;

        const fileData = await fileResp.json() as { ok: boolean; result?: { file_path: string } };
        if (!fileData.ok || !fileData.result?.file_path) return null;

        const telegramFileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;

        const uploadDir = join(process.cwd(), "uploads", String(projectId), "user_photos");
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

        const localPath = join(uploadDir, `user_${userId}.jpg`);
        await downloadFile(telegramFileUrl, localPath);

        return `/uploads/${projectId}/user_photos/user_${userId}.jpg`;
    } catch {
        return null;
    }
}

/**
 * Обрабатывает GET /api/bot/tokens/:tokenId/users/:userId
 *
 * Принимает tokenId (`131` или `token_131`) и userId (`1612141295` или `user_1612141295`).
 * Проверяет доступ через query-параметр telegram_id.
 * Возвращает данные пользователя с полем photoUrl.
 *
 * @param req - params: tokenId, userId; query: telegram_id
 * @param res - Объект пользователя с photoUrl или ошибка
 * @returns Promise<void>
 */
export async function getBotTokenUserHandler(req: Request, res: Response): Promise<void> {
    try {
        const tokenId = parseTokenId(req.params.tokenId);
        const userId = parseUserId(req.params.userId);
        const telegramId = Number(req.query.telegram_id);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }
        if (isNaN(tokenId)) {
            res.status(400).json({ error: "Некорректный tokenId" });
            return;
        }

        const tokenRecord = await storage.getBotToken(tokenId);
        if (!tokenRecord?.token) {
            res.status(404).json({ error: "Токен не найден" });
            return;
        }

        const { token, projectId } = tokenRecord;

        if (!(await storage.hasProjectAccess(projectId, telegramId))) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        const db = getPool();
        const result = await db.query(
            `SELECT user_id AS "userId", username AS "userName", first_name AS "firstName",
                    last_name AS "lastName", registered_at AS "registeredAt",
                    last_interaction AS "lastInteraction", interaction_count AS "interactionCount",
                    is_active AS "isActive"
             FROM bot_users
             WHERE project_id = $1 AND token_id = $2 AND user_id = $3
             LIMIT 1`,
            [projectId, tokenId, userId],
        );

        if (!result.rows.length) {
            res.status(404).json({ error: "Пользователь не найден" });
            return;
        }

        const user = result.rows[0];
        const photoUrl = await fetchUserPhotoUrl(token, userId, projectId);

        res.json({ ...user, photoUrl });
    } catch (error: any) {
        console.error("[BotTokenUser] Ошибка:", error.message);
        res.status(500).json({ error: "Не удалось получить пользователя" });
    }
}
