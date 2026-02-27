/**
 * @fileoverview Хендлер проверки группы
 *
 * Этот модуль предоставляет функцию для проверки
 * информации о группе и валидации.
 *
 * @module botIntegration/handlers/telegramGroups/handlers/checkGroupHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { isLargeGroup, createLargeGroupResponse } from "../utils/checkGroupSize";

/**
 * Проверяет информацию о группе
 *
 * @function checkGroupHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<Object | null>} Информация о группе или null
 */
export async function checkGroupHandler(req: Request, res: Response): Promise<any | null> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId } = req.params;

        if (!groupId || groupId === "null") {
            res.status(400).json({ message: "Требуется ID группы" });
            return null;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return null;
        }

        const chatInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: groupId })
        });

        const chatInfo = await chatInfoResponse.json();

        if (!chatInfoResponse.ok) {
            res.status(400).json({
                message: "Не удалось получить информацию о группе",
                error: chatInfo.description || "Неизвестная ошибка"
            });
            return null;
        }

        if (chatInfo.result.members_count && isLargeGroup(chatInfo.result.members_count)) {
            res.status(400).json(createLargeGroupResponse(chatInfo.result.members_count));
            return null;
        }

        return { chatInfo, defaultToken };
    } catch (error) {
        console.error("Ошибка проверки группы:", error);
        return null;
    }
}
