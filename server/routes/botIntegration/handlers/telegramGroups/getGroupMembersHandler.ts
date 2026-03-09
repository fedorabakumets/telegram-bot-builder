/**
 * @fileoverview Хендлер получения участников группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка участников группы.
 *
 * @module botIntegration/handlers/telegramGroups/getGroupMembersHandler
 */

import type { Request, Response } from "express";
import { checkGroupHandler } from "./handlers/checkGroupHandler";
import { getMembersHandler } from "./handlers/getMembersHandler";

/**
 * Обрабатывает запрос на получение участников группы
 *
 * @function getGroupMembersHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupMembersHandler(req: Request, res: Response): Promise<void> {
    const groupData = await checkGroupHandler(req, res);

    if (!groupData) {
        return;
    }

    const { chatInfo, defaultToken } = groupData;
    const memberCount = chatInfo.result.members_count || 'Неизвестно';

    await getMembersHandler(res, defaultToken, req.params.groupId, memberCount);
}
