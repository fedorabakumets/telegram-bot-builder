/**
 * @fileoverview Хендлер получения информации о боте
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение информации о боте через Telegram Bot API.
 *
 * @module botIntegration/handlers/botInfo/getBotInfoHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение информации о боте
 *
 * @function getBotInfoHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getBotInfoHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        // Mask token for logging
        const maskedToken = defaultToken.token.length > 12
            ? `${defaultToken.token.slice(0, 8)}...${defaultToken.token.slice(-4)}`
            : '***';

        console.log(`[Telegram API] Getting bot info for project ${projectId}, token: ${maskedToken}`);

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getMe?_t=${Date.now()}`;
        const startTime = Date.now();

        let response;
        try {
            response = await fetchWithProxy(telegramApiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                signal: AbortSignal.timeout(10000)
            });
        } catch (fetchError) {
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
            const errorCause = fetchError instanceof Error && 'cause' in fetchError 
                ? (fetchError.cause as Error)?.message || fetchError.cause 
                : 'No cause';
            
            console.error(`[Telegram API] Failed to get bot info for ${maskedToken}: ${errorMessage} (${Date.now() - startTime}ms)`);
            
            res.status(500).json({
                message: "Не удалось подключиться к Telegram API",
                error: errorMessage,
                details: "Возможно, Telegram API заблокирован в вашей сети. Попробуйте использовать прокси или VPN."
            });
            return;
        }

        // response received

        const result = await response.json();

        if (!response.ok) {
            console.warn(`[Telegram API] Bot info request failed for ${maskedToken}: ${result.description || 'Unknown error'}`);
            res.status(400).json({
                message: "Не удалось получить информацию о боте",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        // bot info retrieved
        const botInfo = result.result;

        // Проверяем наличие фото через bot_tokens.bot_photo_url в БД.
        // Если пусто — пробуем получить file_id через getUserProfilePhotos и сохранить.
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const photoResult = await pool.query(
            'SELECT bot_photo_url FROM bot_tokens WHERE id = $1',
            [defaultToken.id]
        );
        let hasPhoto = !!photoResult.rows[0]?.bot_photo_url;

        if (!hasPhoto) {
            try {
                const photoResp = await fetchWithProxy(
                    `https://api.telegram.org/bot${defaultToken.token}/getUserProfilePhotos`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: botInfo.id, limit: 1 }) }
                );
                const photoData = await photoResp.json();
                if (photoResp.ok && photoData.result?.total_count > 0) {
                    const fileId = photoData.result.photos[0].at(-1).file_id;
                    await pool.query('UPDATE bot_tokens SET bot_photo_url = $1 WHERE id = $2', [fileId, defaultToken.id]);
                    hasPhoto = true;
                }
            } catch (e) {
                console.warn('[getBotInfo] failed to fetch bot photo:', e);
            }
        }

        await pool.end();

        const responseData = {
            ...botInfo,
            // Не возвращаем прямой URL Telegram — он протухает и раскрывает токен.
            // Клиент использует прокси /api/projects/:id/users/bot/avatar
            photoUrl: hasPhoto ? true : null
        };

        res.json(responseData);
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения информации о боте:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
