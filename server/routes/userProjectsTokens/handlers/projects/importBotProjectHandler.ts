/**
 * @fileoverview Хендлер импорта проекта через Telegram-бота
 *
 * Принимает JSON-данные проекта двумя способами:
 * 1. Поле json_data (строка) в теле запроса — для передачи через бота
 * 2. Сам JSON объект как тело запроса — если Content-Type: application/json
 * Валидирует структуру и сохраняет как новый проект пользователя.
 *
 * @module userProjectsTokens/handlers/projects/importBotProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает POST-запрос на импорт проекта через Telegram-бота.
 * Поддерживает два формата тела: { json_data: string } или сырой JSON проекта.
 *
 * @param req - Запрос с query-параметром telegram_id
 * @param res - Ответ: { id, name, createdAt } или ошибка
 * @returns {Promise<void>}
 */
export async function importBotProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        let parsedData: any;

        // Вариант 1: тело содержит { json_data: "..." } — строка с JSON
        if (req.body?.json_data && typeof req.body.json_data === "string") {
            try {
                parsedData = JSON.parse(req.body.json_data);
            } catch {
                res.status(400).json({ error: "Неверный формат JSON в поле json_data" });
                return;
            }
        }
        // Вариант 2: тело само является объектом проекта (sheets присутствует)
        else if (req.body && typeof req.body === "object" && Array.isArray(req.body.sheets)) {
            parsedData = req.body;
        }
        // Вариант 3: тело — сырая строка (text/plain или не распарсенный JSON)
        else if (typeof req.body === "string") {
            try {
                parsedData = JSON.parse(req.body);
            } catch {
                res.status(400).json({ error: "Неверный формат JSON" });
                return;
            }
        }
        else {
            res.status(400).json({ error: "Тело запроса обязательно" });
            return;
        }

        // Базовая проверка структуры проекта — должен быть объект с массивом sheets
        if (
            typeof parsedData !== "object" ||
            parsedData === null ||
            !Array.isArray(parsedData.sheets)
        ) {
            res.status(400).json({ error: "Неверная структура проекта" });
            return;
        }

        // Убеждаемся что пользователь существует в telegram_users (FK constraint)
        await storage.getTelegramUserOrCreate({
            id: telegramId,
            firstName: "Пользователь",
        });

        const name: string = (parsedData.name as string) || "Импортированный проект";

        const project = await storage.createBotProject({
            ownerId: telegramId,
            name,
            description: "",
            data: parsedData,
        });

        res.status(200).json({
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
        });
    } catch (error: any) {
        console.error("Ошибка импорта проекта через бота:", error);
        res.status(500).json({ error: "Не удалось сохранить проект" });
    }
}
