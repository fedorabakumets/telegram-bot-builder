/**
 * @fileoverview Хендлер перезапуска бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на перезапуск бота для указанного проекта.
 * Проверка доступа выполняется middleware requireProjectAccess.
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
            res.status(404).json({ message: "Экземпляр бота не найден" });
            return;
        }

        const stopResult = await stopBot(projectId, instance.tokenId);
        if (!stopResult.success) {
            res.status(500).json({ message: stopResult.error || "Не удалось остановить бота" });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken || !defaultToken.token || !defaultToken.id) {
            res.status(400).json({ message: "Токен бота по умолчанию не найден" });
            return;
        }

        const startResult = await startBot(projectId, defaultToken.token, defaultToken.id);
        if (startResult.success) {
            res.json({
                message: "Бот успешно перезапущен",
                processId: startResult.processId
            });
        } else {
            res.status(500).json({ message: startResult.error || "Не удалось запустить бота после перезапуска" });
        }
    } catch (error) {
        console.error('Ошибка перезапуска бота:', error);
        res.status(500).json({ message: "Не удалось перезапустить бота" });
    }
}
