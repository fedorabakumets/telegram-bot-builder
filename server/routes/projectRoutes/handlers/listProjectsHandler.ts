/**
 * @fileoverview Хендлер получения списка проектов (метаданные)
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка метаданных проектов.
 *
 * @module projectRoutes/handlers/listProjectsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { toProjectListItem, type ProjectListItem } from "../project-list-dto";
import { parseArchivedQuery } from "../parse-archived-query";
import { getProjectBotCounts } from '../project-bot-counts';

/**
 * Считает количество узлов и листов в data проекта
 * @param data - Поле data проекта
 * @returns Количество узлов и листов
 */
function countNodesAndSheets(data: unknown): { nodeCount: number; sheetsCount: number } {
    let nodeCount = 0;
    let sheetsCount = 0;
    if (data && typeof data === "object") {
        const d = data as { sheets?: Array<{ nodes?: unknown[] }>; nodes?: unknown[] };
        if (Array.isArray(d.sheets)) {
            sheetsCount = d.sheets.length;
            nodeCount = d.sheets.reduce((sum, sheet) => sum + (sheet.nodes?.length || 0), 0);
        } else if (Array.isArray(d.nodes)) {
            sheetsCount = 1;
            nodeCount = d.nodes.length;
        }
    }
    return { nodeCount, sheetsCount };
}

/**
 * Обрабатывает запрос на получение списка проектов
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function listProjectsHandler(req: Request, res: Response): Promise<void> {
    try {
        const ownerId = getOwnerIdFromRequest(req);
        const archived = parseArchivedQuery(req);
        const projects = ownerId !== null
            ? await storage.getUserBotProjects(ownerId, { archived })
            : [];

        const projectsList: ProjectListItem[] = projects.map((project) => {
            const { nodeCount, sheetsCount } = countNodesAndSheets(project.data);
            return toProjectListItem(project, nodeCount, sheetsCount, archived);
        });
        /** Дополнительная метрика выдаётся без секретов и только для доступных проектов. */
        if (req.query.includeBotCounts === 'true') {
            const counts = await getProjectBotCounts(projectsList.map(project => project.id));
            res.json(projectsList.map(project => ({ ...project, botCount: counts.get(project.id) ?? 0 })));
        } else res.json(projectsList);
    } catch {
        res.status(500).json({ message: "Не удалось получить список проектов" });
    }
}
