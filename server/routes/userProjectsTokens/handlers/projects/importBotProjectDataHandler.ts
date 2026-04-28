/**
 * @fileoverview Хендлер импорта JSON-данных в существующий проект через Telegram-бота
 *
 * Позволяет боту обновить данные (sheets) существующего проекта от имени пользователя.
 * Идентификация через telegram_id в query-параметре — без браузерной сессии.
 * Проверяет доступ к проекту перед обновлением. Токены из данных не удаляются.
 *
 * @module userProjectsTokens/handlers/projects/importBotProjectDataHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Разбирает тело запроса в трёх поддерживаемых форматах и возвращает объект данных.
 * Возвращает null если тело не удалось распарсить или оно отсутствует.
 *
 * @param body - Тело запроса из Express
 * @returns Распарсенный объект или null
 */
function parseRequestBody(body: any): any | null {
    // Вариант 1: { json_data: "..." } — строка с JSON
    if (body?.json_data && typeof body.json_data === "string") {
        try {
            return JSON.parse(body.json_data);
        } catch {
            return null;
        }
    }

    // Вариант 2: тело само является объектом с sheets
    if (body && typeof body === "object" && Array.isArray(body.sheets)) {
        return body;
    }

    // Вариант 3: сырая строка (text/plain или не распарсенный JSON)
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * Подсчитывает суммарное количество нод по всем листам проекта.
 *
 * @param sheets - Массив листов проекта
 * @returns Суммарное количество нод
 */
function countNodes(sheets: any[]): number {
    return sheets.reduce((sum: number, sheet: any) => {
        return sum + (Array.isArray(sheet.nodes) ? sheet.nodes.length : 0);
    }, 0);
}

/**
 * Обрабатывает PUT-запрос на импорт JSON-данных в существующий проект через Telegram-бота.
 * Поддерживает три формата тела: { json_data: string }, объект с sheets, сырая строка.
 * Токены из данных не удаляются — пользователь обновляет свой проект.
 *
 * @param req - Запрос с query-параметром telegram_id, params.id и телом JSON
 * @param res - Ответ: { id, name, updatedAt, sheetsCount, nodesCount } или ошибка
 * @returns {Promise<void>}
 */
export async function importBotProjectDataHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);
        const projectId = parseInt(req.params.id, 10);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный project_id" });
            return;
        }

        const parsedData = parseRequestBody(req.body);

        if (parsedData === null) {
            console.error("importBotProjectDataHandler: body parse failed", {
                bodyType: typeof req.body,
                bodyKeys: req.body && typeof req.body === "object" ? Object.keys(req.body) : "n/a",
                bodyPreview: typeof req.body === "string" ? req.body.slice(0, 200) : String(req.body).slice(0, 200),
                contentType: req.headers["content-type"],
            });
            res.status(400).json({ error: "Тело запроса обязательно и должно быть валидным JSON" });
            return;
        }

        // Валидация структуры: обязателен массив sheets (BotDataWithSheets)
        if (typeof parsedData !== "object" || !Array.isArray(parsedData.sheets)) {
            console.error("importBotProjectDataHandler: invalid structure", {
                parsedType: typeof parsedData,
                hasSheets: parsedData && "sheets" in parsedData,
                sheetsType: parsedData && typeof parsedData.sheets,
                keys: parsedData && typeof parsedData === "object" ? Object.keys(parsedData) : "n/a",
            });
            res.status(400).json({ error: "Неверная структура проекта: ожидается поле sheets (массив)" });
            return;
        }

        const project = await storage.getBotProject(projectId);

        if (!project) {
            res.status(404).json({ error: "Проект не найден" });
            return;
        }

        // Проверяем доступ: владелец или коллаборатор
        if (!(await storage.hasProjectAccess(projectId, telegramId))) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        // Токены не удаляем — пользователь обновляет свой проект
        const cleanData = { ...parsedData };

        const updated = await storage.updateBotProject(projectId, { data: cleanData });

        res.json({
            id: updated!.id,
            name: updated!.name,
            updatedAt: updated!.updatedAt,
            sheetsCount: cleanData.sheets.length,
            nodesCount: countNodes(cleanData.sheets),
        });
    } catch (error: any) {
        console.error("Ошибка импорта данных проекта через бота:", error);
        res.status(500).json({ error: "Не удалось обновить данные проекта" });
    }
}
