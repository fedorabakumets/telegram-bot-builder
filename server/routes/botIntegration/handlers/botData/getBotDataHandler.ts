/**
 * @fileoverview Хендлер получения данных бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение данных бота из bot_tokens с синхронизацией из Telegram API.
 *
 * @module botIntegration/handlers/botData/getBotDataHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Обрабатывает запрос на получение данных бота
 *
 * @function getBotDataHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getBotDataHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.json(null);
            return;
        }

        const botId = defaultToken.token.split(':')[0];
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Получаем текущие данные из базы
        const cachedResult = await pool.query(
            `SELECT
                id,
                bot_photo_url AS "avatarUrl",
                bot_username AS "userName",
                bot_first_name AS "firstName",
                bot_description AS "description",
                bot_short_description AS "shortDescription"
            FROM bot_tokens
            WHERE id = $1`,
            [defaultToken.id]
        );

        let botData = cachedResult.rows[0];

        // Синхронизируем данные из Telegram API каждые 5 минут или если нет аватарки
        const lastSyncTime = defaultToken.lastUsedAt ? new Date(defaultToken.lastUsedAt).getTime() : 0;
        const now = Date.now();
        const shouldSync = !botData?.avatarUrl || (now - lastSyncTime > 5 * 60 * 1000);

        if (shouldSync) {
            try {
                // Получаем информацию из Telegram API через прокси
                const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getMe`;
                const response = await fetchWithProxy(telegramApiUrl);
                const result = await response.json();

                if (response.ok && result.result) {
                    const botInfo = result.result;
                    let photoUrl: string | null = null;

                    // Получаем фото бота через getUserProfilePhotos через прокси
                    try {
                        const photoResponse = await fetchWithProxy(
                            `https://api.telegram.org/bot${defaultToken.token}/getUserProfilePhotos`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: botInfo.id,
                                    limit: 1
                                })
                            }
                        );
                        const photoResult = await photoResponse.json();

                        if (photoResponse.ok && photoResult.result?.total_count > 0 && photoResult.result.photos?.[0]?.length > 0) {
                            const fileId = photoResult.result.photos[0][photoResult.result.photos[0].length - 1].file_id;

                            const fileResponse = await fetchWithProxy(
                                `https://api.telegram.org/bot${defaultToken.token}/getFile`,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ file_id: fileId })
                                }
                            );
                            const fileResult = await fileResponse.json();
                            if (fileResponse.ok && fileResult.result?.file_path) {
                                photoUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
                            }
                        }
                    } catch (photoError) {
                        console.warn("Не удалось получить фото бота:", photoError);
                    }

                    // Обновляем данные в базе
                    const updateResult = await pool.query(
                        `UPDATE bot_tokens SET
                            bot_first_name = $1,
                            bot_username = $2,
                            bot_description = $3,
                            bot_short_description = $4,
                            bot_photo_url = $5,
                            last_used_at = NOW()
                        WHERE id = $6
                        RETURNING
                            bot_photo_url AS "avatarUrl"`,
                        [
                            botInfo.first_name || null,
                            botInfo.username || null,
                            botInfo.description || null,
                            botInfo.short_description || null,
                            photoUrl,
                            defaultToken.id
                        ]
                    );

                    botData = updateResult.rows[0] || botData;
                }
            } catch (syncError) {
                console.warn("Не удалось синхронизировать данные бота из Telegram:", syncError);
                // Используем кэшированные данные
            }
        }

        await pool.end();

        if (!botData) {
            res.json(null);
            return;
        }

        // Форматируем в формат UserBotData для совместимости
        res.json({
            id: botId,
            userId: botId,
            avatarUrl: botData.avatarUrl,
            userName: botData.userName,
            firstName: botData.firstName,
            lastName: null,
            userData: null,
            isActive: true,
            isPremium: false,
            isBlocked: false,
            isBot: true,
            registeredAt: null,
            createdAt: null,
            lastInteraction: null,
            interactionCount: 0
        });
    } catch (error) {
        console.error("Ошибка получения данных бота:", error);
        res.status(500).json({ message: "Не удалось получить данные бота" });
    }
}
