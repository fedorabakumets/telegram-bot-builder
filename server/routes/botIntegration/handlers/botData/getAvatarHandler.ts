/**
 * @fileoverview Хендлер получения аватарки пользователя или бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение аватарки через прокси.
 *
 * @module botIntegration/handlers/botData/getAvatarHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Обрабатывает запрос на получение аватарки пользователя или бота
 *
 * @function getAvatarHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getAvatarHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.params.userId;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        let avatarUrl: string | null = null;

        // Проверяем, это аватарка бота — ищем по userId среди всех токенов проекта
        const allTokens = await storage.getBotTokensByProject(projectId);
        const botToken = allTokens.find(t => t.token.split(':')[0] === userId);
        const isBotAvatar = userId === 'bot' || !!botToken;

        if (isBotAvatar) {
            const tokenToUse = botToken || await storage.getDefaultBotToken(projectId);
            if (tokenToUse) {
                const botResult = await pool.query(
                    'SELECT bot_photo_url FROM bot_tokens WHERE id = $1',
                    [tokenToUse.id]
                );
                avatarUrl = botResult.rows[0]?.bot_photo_url || null;

                // Если фото нет в базе — получаем из Telegram и сохраняем
                if (!avatarUrl) {
                    try {
                        const photoResp = await fetchWithProxy(
                            `https://api.telegram.org/bot${tokenToUse.token}/getUserProfilePhotos`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, limit: 1 }) }
                        );
                        const photoData = await photoResp.json();
                        if (photoResp.ok && photoData.result?.total_count > 0) {
                            const fileId = photoData.result.photos[0].at(-1).file_id;
                            const fileResp = await fetchWithProxy(
                                `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: fileId }) }
                            );
                            const fileData = await fileResp.json();
                            if (fileResp.ok && fileData.result?.file_path) {
                                avatarUrl = `https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`;
                                // Сохраняем в базу чтобы не запрашивать каждый раз
                                await pool.query('UPDATE bot_tokens SET bot_photo_url = $1 WHERE id = $2', [avatarUrl, tokenToUse.id]);
                            }
                        }
                    } catch (e) {
                        console.warn('[avatar] failed to fetch from Telegram:', e);
                    }
                }
            }
        } else {
            // Ищем аватарку пользователя в bot_users
            let userResult = await pool.query(
                'SELECT avatar_url FROM bot_users WHERE user_id = $1 AND project_id = $2',
                [userId, projectId]
            );
            avatarUrl = userResult.rows[0]?.avatar_url || null;
            console.log(`[avatar] bot_users lookup: user_id=${userId}, project_id=${projectId}, found=${avatarUrl ? 'yes' : 'no'}`);

            // Если не найдено, пробуем user_bot_data
            if (!avatarUrl) {
                userResult = await pool.query(
                    'SELECT avatar_url FROM user_bot_data WHERE user_id = $1 AND project_id = $2',
                    [userId, projectId]
                );
                avatarUrl = userResult.rows[0]?.avatar_url || null;
                console.log(`[avatar] user_bot_data lookup: found=${avatarUrl ? 'yes' : 'no'}`);
            }
        }

        await pool.end();

        if (!avatarUrl) {
            console.log(`[avatar] avatarUrl is null for user_id=${userId}, project_id=${projectId}`);
            res.status(404).json({ message: "Аватарка не найдена" });
            return;
        }

        // avatarUrl — полный HTTPS URL, проксируем напрямую
        console.log(`[avatar] fetching: ${avatarUrl}`);
        const response = await fetchWithProxy(avatarUrl);

        if (!response.ok) {
            res.status(404).json({ message: "Не удалось получить аватарку" });
            return;
        }

        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Ошибка получения аватарки:", error);
        res.status(500).json({ message: "Не удалось получить аватарку" });
    }
}
