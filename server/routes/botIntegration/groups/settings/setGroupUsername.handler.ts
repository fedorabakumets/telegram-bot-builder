/**
 * @fileoverview Обработчик установки username группы
 *
 * @module botIntegration/groups/settings/setGroupUsername
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { telegramClientManager } from "../../../telegram/telegram-client";

/**
 * Устанавливает username группы (делает публичной/приватной)
 *
 * @function setGroupUsernameHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/set-group-username
 */
export async function setGroupUsernameHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, username } = req.body;

        if (!groupId) {
            res.status(400).json({ 
                message: "Требуется ID группы" 
            });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ 
                message: "Токен бота не найден для этого проекта" 
            });
            return;
        }

        // Пытаемся использовать Client API для установки username
        const result = await setChatUsername(
            defaultToken.token,
            groupId,
            username
        );

        if (result.requiresClientApi) {
            res.status(400).json({
                message: "Для установки username группы требуются права создателя/администратора.",
                requiresClientApi: true
            });
            return;
        }

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось установить username группы",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({
            success: true,
            message: username 
                ? "Username группы успешно установлен" 
                : "Группа сделана приватной"
        });
    } catch (error) {
        console.error("Не удалось установить username группы:", error);
        res.status(500).json({ 
            message: "Не удалось установить username группы" 
        });
    }
}

/**
 * Устанавливает username группы через Client API
 *
 * @function setChatUsername
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {string} username - Новый username (или пустая строка)
 * @returns {Promise<{ success?: boolean; error?: string; requiresClientApi?: boolean }>}
 */
async function setChatUsername(
    token: string,
    groupId: string,
    username: string
): Promise<{ success?: boolean; error?: string; requiresClientApi?: boolean }> {
    try {
        const result = await telegramClientManager.setChatUsername(
            'default',
            groupId,
            username
        );
        return { success: true, result };
    } catch (error) {
        console.log("Client API не доступен:", error);
        // Bot API не может изменять username
        return { requiresClientApi: true };
    }
}
