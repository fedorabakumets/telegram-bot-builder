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
        console.log(`[Telegram API] Using undici ProxyAgent`);

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
            
            console.error(`[Telegram API] Failed to get bot info for ${maskedToken}:`);
            console.error(`  - Error: ${errorMessage}`);
            console.error(`  - Cause: ${errorCause}`);
            console.error(`  - Time: ${Date.now() - startTime}ms`);
            console.error(`  - Possible reasons: Telegram API blocked, DNS failed, network issues`);
            
            res.status(500).json({
                message: "Не удалось подключиться к Telegram API",
                error: errorMessage,
                details: "Возможно, Telegram API заблокирован в вашей сети. Попробуйте использовать прокси или VPN."
            });
            return;
        }

        console.log(`[Telegram API] Response received in ${Date.now() - startTime}ms, status: ${response.status}`);

        const result = await response.json();

        if (!response.ok) {
            console.warn(`[Telegram API] Bot info request failed for ${maskedToken}: ${result.description || 'Unknown error'}`);
            res.status(400).json({
                message: "Не удалось получить информацию о боте",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        console.log(`[Telegram API] Bot info retrieved: @${result.result.username}`);
        const botInfo = result.result;

        let photoUrl = null;
        if (botInfo.photo && botInfo.photo.big_file_id) {
            try {
                const photoStartTime = Date.now();
                const fileResponse = await fetchWithProxy(`https://api.telegram.org/bot${defaultToken.token}/getFile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        file_id: botInfo.photo.big_file_id
                    }),
                    signal: AbortSignal.timeout(5000)
                });

                const fileResult = await fileResponse.json();
                console.log(`[Telegram API] Photo response: ${fileResponse.status} (${Date.now() - photoStartTime}ms)`);

                if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
                    photoUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
                    console.log(`[Telegram API] Bot photo URL obtained`);
                }
            } catch (photoError) {
                const photoErrorMessage = photoError instanceof Error ? photoError.message : 'Unknown error';
                console.warn(`[Telegram API] Failed to get bot photo for ${maskedToken}: ${photoErrorMessage}`);
            }
        }

        const responseData = {
            ...botInfo,
            photoUrl: photoUrl
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
