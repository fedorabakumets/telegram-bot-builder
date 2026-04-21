/**
 * @fileoverview Хендлер импорта проекта через Telegram-бота
 *
 * Принимает JSON-данные проекта в виде строки, валидирует структуру
 * и сохраняет как новый проект пользователя.
 *
 * @module userProjectsTokens/handlers/projects/importBotProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает POST-запрос на импорт проекта через Telegram-бота.
 * Принимает строку JSON в поле json_data, парсит и сохраняет как проект.
 *
 * @param req - Запрос с query-параметром telegram_id и body { json_data: string }
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

        const jsonData: string | undefined = req.body?.json_data;

        if (!jsonData) {
            res.status(400).json({ error: "Поле json_data обязательно" });
            return;
        }

        // Парсим JSON-строку в объект
        let parsedData: any;
        try {
            parsedData = JSON.parse(jsonData);
        } catch {
            res.status(400).json({ error: "Неверный формат JSON" });
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
