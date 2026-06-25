/**
 * @fileoverview Хендлер дублирования проекта
 *
 * Этот модуль предоставляет функцию для обработки запросов на создание
 * полной копии существующего проекта-источника. Токен бота НЕ копируется
 * (два бота не могут работать на одном токене), ответ отдаётся безопасным
 * DTO без секретов (botToken, sessionId).
 *
 * @module projectRoutes/handlers/duplicateProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import type { StorageBotProjectInput } from "../../../storages/storageTypes";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { ensureContentTable } from "../../../services/content-table";
import { broadcastProjectsChanged } from "../../../terminal/broadcastProjectsChanged";
import { toProjectListItem } from "../project-list-dto";

/**
 * Считает количество узлов и листов в data проекта
 *
 * @param data - Поле data проекта (структура листов или плоский список нод)
 * @returns Объект с количеством узлов и листов
 */
function countNodesAndSheets(data: unknown): { nodeCount: number; sheetsCount: number } {
    let nodeCount = 0;
    let sheetsCount = 0;
    if (data && typeof data === "object") {
        const d = data as any;
        if (Array.isArray(d.sheets)) {
            sheetsCount = d.sheets.length;
            nodeCount = d.sheets.reduce((sum: number, s: any) => sum + (s.nodes?.length || 0), 0);
        } else if (Array.isArray(d.nodes)) {
            sheetsCount = 1;
            nodeCount = d.nodes.length;
        }
    }
    return { nodeCount, sheetsCount };
}

/**
 * Обрабатывает запрос на дублирование проекта
 *
 * @function duplicateProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function duplicateProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const ownerId = getOwnerIdFromRequest(req);

        // Гостям дублирование проектов запрещено
        if (ownerId === null) {
            res.status(401).json({ message: "Требуется авторизация через Telegram" });
            return;
        }

        const sourceId = Number(req.params.id);
        const source = await storage.getBotProject(sourceId);
        if (!source) {
            res.status(404).json({ message: "Проект-источник не найден" });
            return;
        }

        // Имя из тела запроса (если непустая строка), иначе «{имя источника} (копия)»
        const requestedName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const name = requestedName.length > 0 ? requestedName : `${source.name} (копия)`;

        // botToken НЕ копируем — копия создаётся без токена
        const projectData: StorageBotProjectInput = {
            name,
            data: structuredClone(source.data),
            ownerId,
            sessionId: null,
        };

        const project = await storage.createBotProject(projectData);

        // Создаём таблицу _content для нового проекта
        try {
            await ensureContentTable(project.id);
        } catch (err) {
            console.error(`[duplicateProjectHandler] Ошибка создания _content для проекта ${project.id}:`, err);
        }

        // Live-обновление списка проектов владельца во всех открытых вкладках
        try {
            broadcastProjectsChanged(ownerId, "created");
        } catch (err) {
            console.error(`[duplicateProjectHandler] Ошибка broadcast projects-changed для владельца ${ownerId}:`, err);
        }

        const { nodeCount, sheetsCount } = countNodesAndSheets(project.data);
        res.status(201).json(toProjectListItem(project, nodeCount, sheetsCount));
    } catch (error) {
        res.status(500).json({ message: "Не удалось дублировать проект" });
    }
}
