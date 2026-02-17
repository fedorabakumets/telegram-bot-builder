/**
 * @fileoverview Модуль для настройки маршрутов управления проектами
 *
 * Этот модуль предоставляет функции для настройки маршрутов, позволяющие управлять
 * проектами ботов, включая создание, обновление, удаление и экспорт проектов.
 *
 * @module setupProjectRoutes
 */

import { insertBotProjectSchema } from "@shared/schema";
import type { Express } from "express";
import { URL } from "node:url";
import { z } from "zod";
import { restartBotIfRunning } from "../bots/restartBotIfRunning";
import { recreateBotFiles } from "../files/recreateBotFiles";
import { storage } from "../storages/storage";
import { getOwnerIdFromRequest } from "../telegram/auth-middleware";
import { getCachedOrExecute } from "../utils/cache";
import { normalizeProjectData } from "../utils/normalizeProjectData";
import { setupBotManagementRoutes } from "./setupBotManagementRoutes";
import { setupDeleteProjectRoute } from "./setupDeleteProjectRoute";

/**
 * Настраивает маршруты управления проектами
 *
 * @function setupProjectRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @param {Function} requireDbReady - Middleware для проверки готовности базы данных
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/projects/list - получение списка проектов (только метаданные)
 * - GET /api/projects - получение всех проектов (включая данные)
 * - GET /api/projects/:id - получение конкретного проекта
 * - POST /api/projects - создание нового проекта
 * - PUT /api/projects/:id - обновление проекта
 * - DELETE /api/projects/:id - удаление проекта
 * - POST /api/projects/:id/export - экспорт проекта в Python код
 * - GET /api/projects/:id/token - получение информации о токене
 * - DELETE /api/projects/:id/token - очистка токена
 */
export function setupProjectRoutes(app: Express, requireDbReady: (_req: any, res: any, next: any) => any) {
    /**
     * Обработчик маршрута GET /api/projects/list
     *
     * Возвращает список проектов (только метаданные)
     *
     * @route GET /api/projects/list
     * @param {Object} req - Объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {string} req.query.ids - (Опционально) Список ID проектов для фильтрации
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Возвращает список проектов, доступных пользователю. Для аутентифицированных
     * пользователей - их собственные проекты и гостевые проекты. Для гостей -
     * все проекты или фильтрованные по ID. Возвращает только метаданные, без поля data.
     */
    app.get("/api/projects/list", requireDbReady, async (req, res) => {
        try {
            const { ids } = req.query;
            const ownerId = getOwnerIdFromRequest(req);
            let projects;

            if (ownerId !== null) {
                // Authenticated user - return their projects + guest projects (ownerId=null)
                const userProjects = await storage.getUserBotProjects(ownerId);
                const guestProjects = await storage.getGuestBotProjects();
                // Объединяем: свои проекты + гостевые проекты
                projects = [...userProjects, ...guestProjects];
            } else {
                // Guest user - return their projects or all if no ids provided
                let allProjects = await getCachedOrExecute(
                    'all-projects-list',
                    async () => await storage.getAllBotProjects(),
                    30000
                );

                // Если гость передал IDs - фильтруем по ним
                if (ids && typeof ids === 'string') {
                    const requestedIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
                    if (requestedIds.length > 0) {
                        projects = allProjects.filter(p => requestedIds.includes(p.id));
                    } else {
                        projects = allProjects;
                    }
                } else {
                    projects = allProjects;
                }
            }

            // Возвращаем только метаданные, без поля data
            const projectsList = projects.map(({ data, ...metadata }) => metadata);
            return res.json(projectsList);
        } catch (error) {
            return res.status(500).json({ message: "Failed to fetch projects list" });
        }
    });

    /**
     * Обработчик маршрута GET /api/projects
     *
     * Возвращает все проекты (включая поле data, устаревший маршрут)
     *
     * @route GET /api/projects
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Возвращает все проекты, доступные пользователю. Для аутентифицированных
     * пользователей - их собственные проекты и гостевые проекты. Для гостей -
     * все проекты. Включает поле data, что делает его устаревшим по сравнению
     * с /api/projects/list.
     */
    app.get("/api/projects", requireDbReady, async (req, res) => {
        try {
            const ownerId = getOwnerIdFromRequest(req);
            let projects;

            if (ownerId !== null) {
                // Authenticated user - return their projects + guest projects (ownerId=null)
                const userProjects = await storage.getUserBotProjects(ownerId);
                const guestProjects = await storage.getGuestBotProjects();
                // Объединяем: свои проекты + гостевые проекты
                projects = [...userProjects, ...guestProjects];
            } else {
                // Guest user - return all projects (for localStorage mode)
                projects = await getCachedOrExecute(
                    'all-projects',
                    () => storage.getAllBotProjects(),
                    30000
                );
            }

            return res.json(projects);
        } catch (error) {
            return res.status(500).json({ message: "Failed to fetch projects" });
        }
    });

    /**
     * Обработчик маршрута GET /api/projects/:id
     *
     * Возвращает конкретный проект по ID
     *
     * @route GET /api/projects/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Возвращает проект с указанным ID. Проверяет права доступа: проект доступен
     * владельцу или если это гостевой проект (ownerId=null). Нормализует данные
     * проекта перед возвратом.
     */
    app.get("/api/projects/:id", requireDbReady, async (req, res) => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id) || !id) {
                return res.status(400).json({
                    message: 'Invalid project ID',
                    error: 'Project ID must be a valid number'
                });
            }

            const project = await storage.getBotProject(id);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Check ownership if user is authenticated
            const ownerId = getOwnerIdFromRequest(req);
            // Разрешаем доступ: если проект принадлежит пользователю ИЛИ это гостевой проект (ownerId=null)
            if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
                return res.status(403).json({ message: "You don't have permission to access this project" });
            }

            // Нормализуем данные проекта для добавления недостающих полей в узлы
            const normalizedProject = normalizeProjectData(project);

            return res.json(normalizedProject);
        } catch (error) {
            return res.status(500).json({ message: "Failed to fetch project" });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects
     *
     * Создает новый проект
     *
     * @route POST /api/projects
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
     * Создает новый проект с указанными параметрами. Автоматически устанавливает
     * ownerId из сессии аутентифицированного пользователя. Валидирует данные
     * с помощью схемы insertBotProjectSchema.
     */
    app.post("/api/projects", requireDbReady, async (req, res) => {
        try {
            // Игнорируем ownerId из body, используем только из сессии
            const { ownerId: _ignored, ...bodyData } = req.body;
            const validatedData = insertBotProjectSchema.parse(bodyData);
            // Автоматически устанавливаем ownerId из авторизованного пользователя
            const projectData = {
                ...validatedData,
                ownerId: getOwnerIdFromRequest(req)
            };
            const project = await storage.createBotProject(projectData);
            return res.status(201).json(project);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid data", errors: error.errors });
            }
            return res.status(500).json({ message: "Failed to create project" });
        }
    });

    /**
     * Обработчик маршрута PUT /api/projects/:id
     *
     * Обновляет проект
     *
     * @route PUT /api/projects/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} req.body - Данные для обновления проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Обновляет проект с указанными параметрами. Проверяет права доступа:
     * проект может быть обновлен владельцем или если это гостевой проект (ownerId=null).
     * Если обновляется поле data и указан флаг restartOnUpdate, перезапускает бота.
     */
    app.put("/api/projects/:id", requireDbReady, async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);

            if (isNaN(projectId) || !projectId) {
                return res.status(400).json({
                    message: 'Invalid project ID',
                    error: 'Project ID must be a valid number'
                });
            }

            // Check ownership if user is authenticated
            const ownerId = getOwnerIdFromRequest(req);
            if (ownerId !== null) {
                const existingProject = await storage.getBotProject(projectId);
                if (!existingProject) {
                    return res.status(404).json({ message: "Project not found" });
                }
                // Разрешаем редактирование: если проект принадлежит пользователю ИЛИ это гостевой проект (ownerId=null)
                if (existingProject.ownerId !== null && existingProject.ownerId !== ownerId) {
                    return res.status(403).json({ message: "You don't have permission to modify this project" });
                }
            }

            // console.log("Request body:", JSON.stringify(req.body, null, 2));
            const validatedData = insertBotProjectSchema.partial().parse(req.body);
            const project = await storage.updateBotProject(projectId, validatedData);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Если обновляется data (структура бота), перезапускаем бота если он запущен
            // Но только если явно указан флаг перезапуска или произошли значительные изменения
            if (validatedData.data && validatedData.restartOnUpdate) {
                console.log(`Проект ${projectId} обновлен, проверяем необходимость перезапуска бота...`);
                const restartResult = await restartBotIfRunning(projectId);
                if (!restartResult.success) {
                    console.error(`Ошибка перезапуска бота ${projectId}:`, restartResult.error);
                }
            }

            // Если обновляется имя проекта или явно указан флаг recreateFiles, пересоздаем файлы бота
            if (validatedData.name || req.body.recreateFiles) {
                console.log(`Проект ${projectId} обновлен, пересоздаем файлы бота...`);
                const recreateResult = await recreateBotFiles(projectId);
                if (!recreateResult) {
                    console.error(`Ошибка пересоздания файлов бота ${projectId}`);
                }
            }

            return res.json(project);
        } catch (error) {
            console.error("Error updating project:", error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid data", errors: error.errors });
            }
            return res.status(500).json({ message: "Failed to update project", error: (error as Error).message });
        }
    });

    // Delete bot project
    setupDeleteProjectRoute(app, requireDbReady);

    /**
     * Обработчик маршрута POST /api/projects/:id/export
     *
     * Экспортирует проект в Python код
     *
     * @route POST /api/projects/:id/export
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Генерирует Python код для проекта с указанным ID. Преобразует многолистовую
     * структуру в простую для генератора, затем использует динамический импорт
     * для вызова функции generatePythonCode. Возвращает сгенерированный код.
     */
    app.post("/api/projects/:id/export", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const project = await storage.getBotProject(id);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Преобразуем многолистовую структуру в простую для генератора
            const convertSheetsToSimpleBotData = (data: any) => {
                // Если уже простая структура - возвращаем как есть
                if (data.nodes && data.connections) {
                    return data;
                }

                // Если многолистовая структура - собираем все узлы и связи
                if (data.sheets && Array.isArray(data.sheets)) {
                    let allNodes: any[] = [];
                    let allConnections: any[] = [];

                    data.sheets.forEach((sheet: any) => {
                        if (sheet.nodes) allNodes.push(...sheet.nodes);
                        if (sheet.connections) allConnections.push(...sheet.connections);
                    });

                    // Добавляем межлистовые связи
                    if (data.interSheetConnections) {
                        allConnections.push(...data.interSheetConnections);
                    }

                    return {
                        nodes: allNodes,
                        connections: allConnections
                    };
                }

                // Если нет узлов вообще - возвращаем пустую структуру
                return {
                    nodes: [],
                    connections: []
                };
            };

            // Generate Python code using dynamic import with cache busting
            const modUrl = new URL("../client/src/lib/bot-generator.ts", import.meta.url);
            modUrl.searchParams.set("t", Date.now().toString());
            const { generatePythonCode } = await import(modUrl.href);
            const simpleBotData = convertSheetsToSimpleBotData(project.data);
            const userDatabaseEnabled = project.userDatabaseEnabled === 1;
            // Получаем настройки генерации комментариев из localStorage или используем значение по умолчанию
            const enableComments = process.env.BOTCRAFT_COMMENTS_GENERATION !== 'false';
            const pythonCode = generatePythonCode(simpleBotData as any, project.name, [], userDatabaseEnabled, null, false, false, enableComments);
            return res.json({ code: pythonCode });
        } catch (error) {
            console.error("❌ Ошибка генерации кода:", error);
            return res.status(500).json({ message: "Failed to generate code", error: String(error) });
        }
    });

    // Bot management endpoints
    // Get bot instance status
    setupBotManagementRoutes(app);

    /**
     * Обработчик маршрута GET /api/projects/:id/token
     *
     * Возвращает информацию о сохраненном токене бота
     *
     * @route GET /api/projects/:id/token
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Возвращает информацию о наличии токена бота для проекта и его предварительный просмотр.
     * Проверяет существование проекта по ID.
     */
    app.get("/api/projects/:id/token", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const project = await storage.getBotProject(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            return res.json({
                hasToken: !!project.botToken,
                tokenPreview: project.botToken ? `${project.botToken.substring(0, 10)}...` : null
            });
        } catch (error) {
            return res.status(500).json({ message: "Failed to get token info" });
        }
    });

    /**
     * Обработчик маршрута DELETE /api/projects/:id/token
     *
     * Очищает сохраненный токен бота
     *
     * @route DELETE /api/projects/:id/token
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Удаляет токен бота из проекта с указанным ID. Проверяет существование проекта
     * и возвращает сообщение об успешной очистке токена.
     */
    app.delete("/api/projects/:id/token", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const project = await storage.updateBotProject(projectId, { botToken: null });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            return res.json({ message: "Token cleared successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Failed to clear token" });
        }
    });

    // Endpoint для обновления настроек генерации комментариев
    app.post("/api/settings/comments-generation", async (req, res) => {
        try {
            const { enabled } = req.body;

            if (typeof enabled !== 'boolean') {
                return res.status(400).json({ message: "Invalid enabled value" });
            }

            // Устанавливаем переменную окружения для всей сессии
            process.env.BOTCRAFT_COMMENTS_GENERATION = enabled ? 'true' : 'false';

            return res.json({ success: true, message: `Comments generation ${enabled ? 'enabled' : 'disabled'}` });
        } catch (error) {
            console.error("❌ Ошибка обновления настроек генерации комментариев:", error);
            return res.status(500).json({ message: "Failed to update comments generation settings", error: String(error) });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:id/export-to-google-sheets
     *
     * Экспортирует данные пользователей проекта в Google Таблицы
     *
     * @route POST /api/projects/:id/export-to-google-sheets
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Идентификатор проекта
     * @param {Object} req.body - Тело запроса
     * @param {Array} req.body.data - Подготовленные данные для экспорта
     * @param {string} req.body.projectName - Название проекта
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Выполняет экспорт данных пользователей проекта в Google Таблицы.
     * Использует OAuth-аутентификацию для доступа к Google Sheets API.
     * Создает новую таблицу или обновляет существующую с данными пользователей.
     */
    app.post("/api/projects/:id/export-to-google-sheets", requireDbReady, async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);

            // Проверяем, существует ли проект
            const project = await storage.getBotProject(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Проверяем права доступа
            const ownerId = getOwnerIdFromRequest(req);
            if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
                return res.status(403).json({ message: "You don't have permission to access this project" });
            }

            // Получаем данные из тела запроса
            const { data: exportData, projectName } = req.body;

            if (!exportData || !Array.isArray(exportData)) {
                return res.status(400).json({ message: "Invalid export data provided" });
            }

            // Импортируем функцию экспорта в Google Таблицы
            const { exportToGoogleSheets } = await import("../google-sheets");
            const { saveExportMetadata } = await import("../google-sheets/export-metadata");

            console.log('\n📊 Экспорт в Google Таблицы');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Проект:', projectName);
            console.log('ID проекта:', projectId);
            console.log('Записей на экспорт:', exportData.length);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // Выполняем экспорт в Google Таблицы
            const spreadsheetId = await exportToGoogleSheets(exportData, projectName, projectId);

            // Сохраняем метаданные экспорта в базу данных
            await saveExportMetadata(projectId, spreadsheetId);

            console.log('✅ Экспорт завершён успешно!');
            console.log('📋 URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return res.json({
                success: true,
                message: "Data exported to Google Sheets successfully",
                spreadsheetId: spreadsheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            });
        } catch (error) {
            const errorObj = error as Error;
            const errorAsAny = error as any;
            
            // Проверяем, является ли ошибка связанной с аутентификацией
            if (errorObj.message.includes('OAuth token not found or invalid') ||
                errorObj.message.includes('Access token is invalid or expired') ||
                errorAsAny.requiresAuth === true) {
                
                console.warn('\n⚠️  Требуется аутентификация Google');
                console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.warn('Необходимо пройти аутентификацию для доступа к Google Таблицам');
                console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                
                return res.status(401).json({
                    message: "Authentication required",
                    error: errorObj.message,
                    requiresAuth: true
                });
            }

            console.error('\n❌ Ошибка экспорта в Google Таблицы');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Проект:', projectName, '(ID:', projectId + ')');
            console.error('Ошибка:', errorObj.message);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return res.status(500).json({
                message: "Failed to export data to Google Sheets",
                error: errorObj.message
            });
        }
    });
}
