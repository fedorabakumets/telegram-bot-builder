/**
 * @fileoverview Хендлер запуска бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на запуск бота для указанного проекта.
 *
 * @module botManagement/handlers/botStartHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../bots/startBot';
import { storage } from '../../storages/storage';

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
 */
export async function handleBotStart(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const { token, tokenId } = req.body;

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Project not found" });
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
            res.status(400).json({ message: "Bot token is required" });
            return;
        }

        const existingInstance = await storage.getBotInstanceByToken(actualTokenId);
        if (existingInstance && existingInstance.status === 'running') {
            res.status(400).json({ message: "Bot is already running" });
            return;
        }

        const result = await startBot(projectId, botToken, actualTokenId);
        if (result.success) {
            await storage.markTokenAsUsed(actualTokenId);
            res.json({
                message: "Bot started successfully",
                processId: result.processId,
                tokenUsed: true
            });
        } else {
            res.status(500).json({ message: result.error || "Failed to start bot" });
        }
    } catch (error) {
        res.status(500).json({ message: "Failed to start bot" });
    }
}
