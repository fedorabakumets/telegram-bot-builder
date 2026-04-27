/**
 * @fileoverview Хендлер экспорта project.json проекта в формате base64
 *
 * Возвращает содержимое project.json как объект типа file (base64),
 * совместимый с медиа-нодой для отправки файла пользователю через Telegram.
 * Проверяет принадлежность проекта пользователю по telegram_id.
 *
 * @module userProjectsTokens/handlers/projects/exportBotProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Извлекает числовой ID из строки вида "project_42" или "42"
 * @param raw - Строка с ID
 * @returns Числовой ID или NaN
 */
function parseProjectId(raw: string): number {
    const match = raw.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : NaN;
}

/**
 * Формирует безопасное имя файла из названия проекта
 * @param name - Название проекта
 * @returns Имя файла с расширением .json
 */
function buildFileName(name: string): string {
    return name.replace(/\s+/g, "_").replace(/[^\w\-_.а-яёА-ЯЁ]/gu, "") + ".json";
}

/**
 * Экспортирует project.json проекта в формате base64.
 * Параметр :id может быть числом (42) или callback-строкой (project_42).
 *
 * @param req - query: telegram_id, params: id
 * @param res - { type, data, mimeType, fileName }
 */
export async function exportBotProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseProjectId(req.params.id);
        const telegramId = Number(req.query.telegram_id);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный project_id" });
            return;
        }

        if (!(await storage.hasProjectAccess(projectId, telegramId))) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        const project = await storage.getBotProject(projectId);

        if (!project) {
            res.status(404).json({ error: "Проект не найден" });
            return;
        }

        const json = JSON.stringify(project.data, null, 2);
        const data = Buffer.from(json).toString("base64");

        res.json({
            type: "file",
            data,
            mimeType: "application/json",
            fileName: buildFileName(project.name),
        });
    } catch (error: any) {
        console.error("Ошибка экспорта проекта:", error);
        res.status(500).json({ error: "Не удалось экспортировать проект" });
    }
}
