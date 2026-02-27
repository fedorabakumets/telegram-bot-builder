/**
 * @fileoverview Хендлер перезапуска бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на перезапуск бота для указанного проекта.
 *
 * @module botManagement/handlers/botRestartHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { stopBot } from '../../../bots/stopBot';
import { storage } from '../../../storages/storage';

/**
 * Обрабатывает запрос на перезапуск бота
 *
 * @function handleBotRestart
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 *
 * @description
 * Останавливает и затем запускает бота заново.
 * Использует токен по умолчанию для проекта.
 */
export async function handleBotRestart(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        const instance = await storage.getBotInstance(projectId);
        if (!instance) {
            res.status(404).json({ message: "Bot instance not found" });
            return;
        }

        const stopResult = await stopBot(projectId, instance.tokenId);
        if (!stopResult.success) {
            res.status(500).json({ message: stopResult.error || "Failed to stop bot" });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken || !defaultToken.token || !defaultToken.id) {
            res.status(400).json({ message: "Default bot token not found" });
            return;
        }

        const startResult = await startBot(projectId, defaultToken.token, defaultToken.id);
        if (startResult.success) {
            res.json({
                message: "Bot restarted successfully",
                processId: startResult.processId
            });
        } else {
            res.status(500).json({ message: startResult.error || "Failed to start bot after restart" });
        }
    } catch (error) {
        console.error('Ошибка перезапуска бота:', error);
        res.status(500).json({ message: "Failed to restart bot" });
    }
}
