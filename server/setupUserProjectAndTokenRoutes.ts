/**
 * @fileoverview Модуль для настройки маршрутов управления проектами и токенами пользователя
 *
 * Этот модуль предоставляет функции для настройки маршрутов, позволяющие пользователям
 * управлять своими проектами и токенами ботов.
 *
 * @module setupUserProjectAndTokenRoutes
 */

import type { Express } from "express";
import { storage } from "./storage";

/**
 * Настраивает маршруты управления проектами и токенами пользователя
 *
 * @function setupUserProjectAndTokenRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/user/projects - получение проектов пользователя
 * - POST /api/user/projects - создание проекта пользователя
 * - PATCH /api/user/projects/:id - обновление проекта пользователя
 * - DELETE /api/user/projects/:id - удаление проекта пользователя
 * - GET /api/user/tokens - получение токенов пользователя
 * - POST /api/user/tokens - создание токена пользователя
 * - PATCH /api/user/tokens/:id - обновление токена пользователя
 * - DELETE /api/user/tokens/:id - удаление токена пользователя
 */
export function setupUserProjectAndTokenRoutes(app: Express) {
    /**
     * Обработчик маршрута GET /api/user/projects
     *
     * Возвращает список проектов пользователя
     *
     * @route GET /api/user/projects
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и возвращает список проектов,
     * принадлежащих ему. В случае ошибки возвращает соответствующий статус.
     */
    app.get("/api/user/projects", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const projects = await storage.getUserBotProjects(userId);
            return res.json(projects);
        } catch (error: any) {
            console.error("Get user projects error:", error);
            return res.status(500).json({ error: "Failed to fetch projects" });
        }
    });

    /**
     * Обработчик маршрута POST /api/user/projects
     *
     * Создает новый проект пользователя
     *
     * @route POST /api/user/projects
     * @param {Object} req - Объект запроса
     * @param {Object} req.body - Данные проекта
     * @param {string} req.body.name - Название проекта
     * @param {string} req.body.description - Описание проекта
     * @param {Object} req.body.data - Данные проекта
     * @param {string} req.body.botToken - Токен бота
     * @param {number} req.body.userDatabaseEnabled - Флаг включения базы данных пользователей
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и создает новый проект
     * с указанными параметрами. В случае ошибки возвращает соответствующий статус.
     */
    app.post("/api/user/projects", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { name, description, data, botToken, userDatabaseEnabled } = req.body;
            const project = await storage.createBotProject({
                ownerId: userId,
                name,
                description,
                data,
                botToken,
                userDatabaseEnabled
            });
            return res.json(project);
        } catch (error: any) {
            console.error("Create project error:", error);
            return res.status(500).json({ error: "Failed to create project" });
        }
    });

    /**
     * Обработчик маршрута PATCH /api/user/projects/:id
     *
     * Обновляет проект пользователя
     *
     * @route PATCH /api/user/projects/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} req.body - Данные для обновления проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и право на изменение проекта,
     * затем обновляет проект с указанными параметрами. В случае ошибки
     * возвращает соответствующий статус.
     */
    app.patch("/api/user/projects/:id", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const project = await storage.getBotProject(projectId);
            if (!project || project.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            const updated = await storage.updateBotProject(projectId, req.body);
            return res.json(updated);
        } catch (error: any) {
            console.error("Update project error:", error);
            return res.status(500).json({ error: "Failed to update project" });
        }
    });

    /**
     * Обработчик маршрута DELETE /api/user/projects/:id
     *
     * Удаляет проект пользователя
     *
     * @route DELETE /api/user/projects/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и право на удаление проекта,
     * затем удаляет проект. В случае ошибки возвращает соответствующий статус.
     */
    app.delete("/api/user/projects/:id", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const projectId = parseInt(req.params.id);

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const project = await storage.getBotProject(projectId);
            if (!project || project.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            await storage.deleteBotProject(projectId);
            return res.json({ success: true });
        } catch (error: any) {
            console.error("Delete project error:", error);
            return res.status(500).json({ error: "Failed to delete project" });
        }
    });

    /**
     * Обработчик маршрута GET /api/user/tokens
     *
     * Возвращает список токенов пользователя
     *
     * @route GET /api/user/tokens
     * @param {Object} req - Объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {string} req.query.projectId - (Опционально) Идентификатор проекта для фильтрации токенов
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и возвращает список токенов,
     * принадлежащих ему. Можно фильтровать по projectId. В случае ошибки
     * возвращает соответствующий статус.
     */
    app.get("/api/user/tokens", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
            const tokens = await storage.getUserBotTokens(userId, projectId);
            return res.json(tokens);
        } catch (error: any) {
            console.error("Get user tokens error:", error);
            return res.status(500).json({ error: "Failed to fetch tokens" });
        }
    });

    /**
     * Обработчик маршрута POST /api/user/tokens
     *
     * Создает новый токен пользователя
     *
     * @route POST /api/user/tokens
     * @param {Object} req - Объект запроса
     * @param {Object} req.body - Данные токена
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и создает новый токен
     * с указанными параметрами. В случае ошибки возвращает соответствующий статус.
     */
    app.post("/api/user/tokens", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const token = await storage.createBotToken({
                ...req.body,
                ownerId: userId
            });
            return res.json(token);
        } catch (error: any) {
            console.error("Create token error:", error);
            return res.status(500).json({ error: "Failed to create token" });
        }
    });

    /**
     * Обработчик маршрута PATCH /api/user/tokens/:id
     *
     * Обновляет токен пользователя
     *
     * @route PATCH /api/user/tokens/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор токена
     * @param {Object} req.body - Данные для обновления токена
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и право на изменение токена,
     * затем обновляет токен с указанными параметрами. В случае ошибки
     * возвращает соответствующий статус.
     */
    app.patch("/api/user/tokens/:id", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const tokenId = parseInt(req.params.id);

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const token = await storage.getBotToken(tokenId);
            if (!token || token.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            const updated = await storage.updateBotToken(tokenId, req.body);
            return res.json(updated);
        } catch (error: any) {
            console.error("Update token error:", error);
            return res.status(500).json({ error: "Failed to update token" });
        }
    });

    /**
     * Обработчик маршрута DELETE /api/user/tokens/:id
     *
     * Удаляет токен пользователя
     *
     * @route DELETE /api/user/tokens/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор токена
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Проверяет аутентификацию пользователя и право на удаление токена,
     * затем удаляет токен. В случае ошибки возвращает соответствующий статус.
     */
    app.delete("/api/user/tokens/:id", async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const tokenId = parseInt(req.params.id);

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const token = await storage.getBotToken(tokenId);
            if (!token || token.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            await storage.deleteBotToken(tokenId);
            return res.json({ success: true });
        } catch (error: any) {
            console.error("Delete token error:", error);
            return res.status(500).json({ error: "Failed to delete token" });
        }
    });
}
