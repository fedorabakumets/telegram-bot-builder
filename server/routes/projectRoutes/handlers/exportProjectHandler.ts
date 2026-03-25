/**
 * @fileoverview Хендлер экспорта проекта в Python
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на экспорт проекта в Python код.
 *
 * @module projectRoutes/handlers/exportProjectHandler
 */

import type { Request, Response } from "express";
import { URL } from "node:url";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на экспорт проекта
 *
 * @function exportProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function exportProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);
        const project = await storage.getBotProject(id);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const modUrl = new URL("../lib/bot-generator.ts", import.meta.url);
        modUrl.searchParams.set("t", Date.now().toString());
        const { generatePythonCode } = await import(modUrl.href);

        const userDatabaseEnabled = project.userDatabaseEnabled === 1;
        const enableComments = process.env.BOTCRAFT_COMMENTS_GENERATION === 'true';

        const pythonCode = generatePythonCode(
            project.data as any,
            project.name,
            [],
            userDatabaseEnabled,
            null,
            false,
            false,
            enableComments
        );

        res.json({ code: pythonCode });
    } catch (error) {
        console.error("❌ Ошибка генерации кода:", error);
        res.status(500).json({ message: "Не удалось сгенерировать код", error: String(error) });
    }
}
