/**
 * @fileoverview Модуль для настройки маршрутов управления шаблонами пользователя
 *
 * Этот модуль предоставляет функции для настройки маршрутов, позволяющие пользователям
 * управлять своими шаблонами ботов.
 *
 * @module setupUserTemplateRoutes
 */

import type { Express } from "express";
import { storage } from "../storages/storage";

/**
 * Настраивает маршруты управления шаблонами пользователя
 *
 * @function setupUserTemplateRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/user/templates - получение шаблонов пользователя
 * - POST /api/user/templates - создание шаблона пользователя
 * - PATCH /api/user/templates/:id - обновление шаблона пользователя
 * - DELETE /api/user/templates/:id - удаление шаблона пользователя
 */
export function setupUserTemplateRoutes(app: Express) {
    /**
     * Обработчик маршрута GET /api/user/templates
     *
     * Возвращает список шаблонов пользователя
     *
     * @route GET /api/user/templates
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и возвращает список шаблонов,
     * принадлежащих ему. В случае ошибки возвращает соответствующий статус.
     */
    app.get("/api/user/templates", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const templates = await storage.getUserBotTemplates(userId);
            return res.json(templates);
        } catch (error: any) {
            console.error("Get user templates error:", error);
            return res.status(500).json({ error: "Failed to fetch templates" });
        }
    });

    /**
     * Обработчик маршрута POST /api/user/templates
     *
     * Создает новый шаблон пользователя
     *
     * @route POST /api/user/templates
     * @param {Object} req - Объект запроса
     * @param {Object} req.body - Данные шаблона
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и создает новый шаблон
     * с указанными параметрами. В случае ошибки возвращает соответствующий статус.
     */
    app.post("/api/user/templates", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const template = await storage.createBotTemplate({
                ...req.body,
                ownerId: userId
            });
            return res.json(template);
        } catch (error: any) {
            console.error("Create template error:", error);
            return res.status(500).json({ error: "Failed to create template" });
        }
    });

    /**
     * Обработчик маршрута PATCH /api/user/templates/:id
     *
     * Обновляет шаблон пользователя
     *
     * @route PATCH /api/user/templates/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор шаблона
     * @param {Object} req.body - Данные для обновления шаблона
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и право на изменение шаблона,
     * затем обновляет шаблон с указанными параметрами. В случае ошибки
     * возвращает соответствующий статус.
     */
    app.patch("/api/user/templates/:id", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const templateId = parseInt(req.params.id);

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const template = await storage.getBotTemplate(templateId);
            if (!template || template.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            const updated = await storage.updateBotTemplate(templateId, req.body);
            return res.json(updated);
        } catch (error: any) {
            console.error("Update template error:", error);
            return res.status(500).json({ error: "Failed to update template" });
        }
    });

    /**
     * Обработчик маршрута DELETE /api/user/templates/:id
     *
     * Удаляет шаблон пользователя
     *
     * @route DELETE /api/user/templates/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор шаблона
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и право на удаление шаблона,
     * затем удаляет шаблон. В случае ошибки возвращает соответствующий статус.
     */
    app.delete("/api/user/templates/:id", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const templateId = parseInt(req.params.id);

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const template = await storage.getBotTemplate(templateId);
            if (!template || template.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            await storage.deleteBotTemplate(templateId);
            return res.json({ success: true });
        } catch (error: any) {
            console.error("Delete template error:", error);
            return res.status(500).json({ error: "Failed to delete template" });
        }
    });
}
