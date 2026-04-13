/**
 * @fileoverview Хендлер запуска бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на запуск бота для указанного проекта.
 *
 * @module botManagement/handlers/botStartHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { storage } from '../../../storages/storage';

/**
 * Нормализует tokenId из тела запроса.
 * Принимает число, числовую строку или строку вида "token_42" — возвращает число.
 * @param raw - Сырое значение tokenId из body
 * @returns Числовой ID или undefined если не удалось распарсить
 */
function parseTokenId(raw: unknown): number | undefined {
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (typeof raw === 'string') {
        // Извлекаем последовательность цифр из конца строки: "token_42" → 42
        const match = raw.match(/(\d+)$/);
        if (match) {
            const n = parseInt(match[1], 10);
            return isNaN(n) ? undefined : n;
        }
    }
    return undefined;
}

/**
 * Обрабатывает запрос на запуск бота
 *
 * @function handleBotStart
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 *
 * @description
 * Запускает бота с указанным токеном. Если токен не передан,
 * используется токен по умолчанию для проекта.
 * Поддерживает tokenId как число, строку "42" или "token_42".
 */
export async function handleBotStart(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const { token } = req.body;
        const tokenId = parseTokenId(req.body.tokenId);

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        let botToken = token;
        let actualTokenId = tokenId;

        if (!botToken) {
            if (tokenId) {
                const selectedToken = await storage.getBotToken(tokenId);
                if (selectedToken && selectedToken.projectId === projectId) {
                    botToken = selectedToken.token;
                    actualTokenId = selectedToken.id;
                }
            } else {
                const defaultToken = await storage.getDefaultBotToken(projectId);
                if (defaultToken) {
                    botToken = defaultToken.token;
                    actualTokenId = defaultToken.id;
                }
            }
        }

        if (!botToken || !actualTokenId) {
            res.status(400).json({ message: "Требуется токен бота" });
            return;
        }

        const existingInstance = await storage.getBotInstanceByToken(actualTokenId);
        if (existingInstance && existingInstance.status === 'running') {
            res.status(400).json({ message: "Бот уже запущен" });
            return;
        }

        const result = await startBot(projectId, botToken, actualTokenId);
        if (result.success) {
            await storage.markTokenAsUsed(actualTokenId);
            res.json({
                message: "Бот успешно запущен",
                processId: result.processId,
                tokenUsed: true
            });
        } else {
            res.status(500).json({ message: result.error || "Не удалось запустить бота" });
        }
    } catch (error) {
        res.status(500).json({ message: "Не удалось запустить бота" });
    }
}
