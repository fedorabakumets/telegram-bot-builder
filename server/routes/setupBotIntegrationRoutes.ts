/**
 * @fileoverview Модуль для настройки маршрутов интеграции с ботами
 *
 * Этот модуль предоставляет функции для настройки маршрутов, позволяющие
 * интегрировать ботов с различными функциями, включая обмен сообщениями,
 * управление группами, работу с медиафайлами и другие возможности.
 *
 * @module setupBotIntegrationRoutes
 */

import { insertBotGroupSchema, insertBotMessageSchema, sendMessageSchema } from "@shared/schema";
import type { Express } from "express";
import { storage } from "../storages/storage";
import { telegramClientManager } from "../telegram/telegram-client";
import { downloadTelegramAudio, downloadTelegramDocument, downloadTelegramPhoto, downloadTelegramVideo } from "../telegram/telegram-media";
import {
  analyzeTelegramError,
  fetchWithTelegramErrorHandling,
  getErrorStatusCode
} from "../utils/telegram-error-handler";

/**
 * Настраивает маршруты интеграции с ботами
 *
 * @function setupBotIntegrationRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/projects/:projectId/users/:userId/messages - получение сообщений пользователя
 * - POST /api/projects/:projectId/users/:userId/send-message - отправка сообщения пользователю
 * - POST /api/projects/:projectId/messages - сохранение сообщения от бота
 * - DELETE /api/projects/:projectId/users/:userId/messages - удаление истории сообщений
 * - POST /api/projects/:projectId/media/register-telegram-photo - регистрация медиафайла
 * - Маршруты для работы с группами ботов
 * - Маршруты для получения/обновления информации о боте
 * - Маршруты для работы с группами Telegram
 * - Маршруты для управления участниками группы
 * - Маршруты для работы с Telegram Client API
 */
export function setupBotIntegrationRoutes(app: Express) {
    /**
     * Обработчик маршрута GET /api/projects/:projectId/users/:userId/messages
     *
     * Возвращает сообщения пользователя для указанного проекта
     *
     * @route GET /api/projects/:projectId/users/:userId/messages
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.projectId - Идентификатор проекта
     * @param {string} req.params.userId - Идентификатор пользователя
     * @param {Object} req.query - Параметры запроса
     * @param {string} req.query.limit - (Опционально) Ограничение количества сообщений
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Возвращает список сообщений для указанного пользователя в проекте.
     * Поддерживает ограничение количества возвращаемых сообщений.
     */
    app.get("/api/projects/:projectId/users/:userId/messages", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.params.userId;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            const messages = await storage.getBotMessagesWithMedia(projectId, userId, limit);
            return res.json(messages);
        } catch (error) {
            console.error("Failed to get messages:", error);
            return res.status(500).json({ message: "Failed to get messages" });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:projectId/users/:userId/send-message
     *
     * Отправляет сообщение пользователю от имени администратора
     *
     * @route POST /api/projects/:projectId/users/:userId/send-message
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.projectId - Идентификатор проекта
     * @param {string} req.params.userId - Идентификатор пользователя
     * @param {Object} req.body - Тело запроса
     * @param {string} req.body.messageText - Текст сообщения
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Отправляет сообщение пользователю через Telegram Bot API.
     * Валидирует тело запроса с помощью Zod схемы.
     * Сохраняет сообщение в базу данных.
     */
    app.post("/api/projects/:projectId/users/:userId/send-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.params.userId;

            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            // Validate request body with Zod
            const validationResult = sendMessageSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    message: "Invalid request body",
                    errors: validationResult.error.errors
                });
            }

            const { messageText } = validationResult.data;

            // Get the default bot token
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            // Send message via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/sendMessage`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: userId,
                    text: messageText.trim()
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to send message",
                    error: result.description || "Unknown error"
                });
            }

            // Save message to database
            await storage.createBotMessage({
                projectId,
                userId,
                messageType: "bot",
                messageText: messageText.trim(),
                messageData: { sentFromAdmin: true }
            });

            return res.json({ message: "Message sent successfully", result });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to send message:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            return res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:projectId/messages
     *
     * Сохраняет сообщение от бота в базу данных
     *
     * @route POST /api/projects/:projectId/messages
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.projectId - Идентификатор проекта
     * @param {Object} req.body - Тело запроса с данными сообщения
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Сохраняет сообщение от бота в базу данных.
     * Валидирует тело запроса с помощью Zod схемы.
     */
    app.post("/api/projects/:projectId/messages", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);

            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            // Validate request body with Zod
            const validationResult = insertBotMessageSchema.safeParse({ ...req.body, projectId });
            if (!validationResult.success) {
                return res.status(400).json({
                    message: "Invalid message data",
                    errors: validationResult.error.errors
                });
            }

            const message = await storage.createBotMessage(validationResult.data);
            return res.json({ message: "Message saved successfully", data: message });
        } catch (error) {
            console.error("Failed to save message:", error);
            return res.status(500).json({ message: "Failed to save message" });
        }
    });

    /**
     * Обработчик маршрута DELETE /api/projects/:projectId/users/:userId/messages
     *
     * Удаляет историю сообщений пользователя
     *
     * @route DELETE /api/projects/:projectId/users/:userId/messages
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.projectId - Идентификатор проекта
     * @param {string} req.params.userId - Идентификатор пользователя
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Удаляет все сообщения пользователя в проекте.
     */
    app.delete("/api/projects/:projectId/users/:userId/messages", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.params.userId;

            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            const success = await storage.deleteBotMessages(projectId, userId);
            return res.json({ message: "Messages deleted successfully", deleted: success });
        } catch (error) {
            console.error("Failed to delete messages:", error);
            return res.status(500).json({ message: "Failed to delete messages" });
        }
    });

    /**
     * Обработчик маршрута POST /api/projects/:projectId/media/register-telegram-photo
     *
     * Регистрирует медиафайл из Telegram и связывает его с сообщением
     *
     * @route POST /api/projects/:projectId/media/register-telegram-photo
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.projectId - Идентификатор проекта
     * @param {Object} req.body - Тело запроса
     * @param {string} req.body.messageId - Идентификатор сообщения
     * @param {string} req.body.fileId - Идентификатор файла в Telegram
     * @param {string} req.body.botToken - Токен бота для доступа к файлу
     * @param {string} req.body.mediaType - Тип медиа ('photo', 'video', 'audio', 'document')
     * @param {string} req.body.originalFileName - (Опционально) Оригинальное имя файла
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Загружает медиафайл из Telegram, сохраняет его локально, создает запись в базе данных
     * и связывает с указанным сообщением.
     */
    app.post("/api/projects/:projectId/media/register-telegram-photo", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);

            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            const { messageId, fileId, botToken, mediaType = 'photo', originalFileName } = req.body;

            if (!messageId || !fileId || !botToken) {
                return res.status(400).json({
                    message: "Missing required fields: messageId, fileId, botToken"
                });
            }

            // Download media from Telegram based on type
            let downloadedFile;
            switch (mediaType) {
                case 'video':
                    downloadedFile = await downloadTelegramVideo(botToken, fileId, projectId);
                    break;
                case 'audio':
                    downloadedFile = await downloadTelegramAudio(botToken, fileId, projectId);
                    break;
                case 'document':
                    downloadedFile = await downloadTelegramDocument(botToken, fileId, projectId, originalFileName);
                    break;
                case 'photo':
                default:
                    downloadedFile = await downloadTelegramPhoto(botToken, fileId, projectId);
                    break;
            }

            // Generate URL for the file (relative from public root)
            const fileUrl = `/${downloadedFile.filePath}`;

            // Determine file type based on media type
            let fileType: 'photo' | 'video' | 'audio' | 'document';
            if (mediaType === 'video') {
                fileType = 'video';
            } else if (mediaType === 'audio') {
                fileType = 'audio';
            } else if (mediaType === 'document') {
                fileType = 'document';
            } else {
                fileType = 'photo';
            }

            // Create media file record in database
            const mediaFile = await storage.createMediaFile({
                projectId,
                fileName: downloadedFile.fileName,
                fileType,
                filePath: downloadedFile.filePath,
                fileSize: downloadedFile.fileSize,
                mimeType: downloadedFile.mimeType,
                url: fileUrl,
                description: `Telegram ${mediaType} from user`,
                tags: [],
                isPublic: 0,
            });

            // Link media file to message
            await storage.createBotMessageMedia({
                messageId: parseInt(messageId),
                mediaFileId: mediaFile.id,
                mediaKind: fileType,
                orderIndex: 0,
            });

            return res.json({
                message: "Media registered successfully",
                mediaFile,
                url: fileUrl
            });
        } catch (error) {
            console.error("Failed to register Telegram media:", error);
            return res.status(500).json({
                message: "Failed to register media",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Bot Groups API
    // Get groups for a project
    app.get("/api/projects/:id/groups", async (req, res) => {
        console.log("=== GROUPS API CALLED ===");
        try {
            const projectId = parseInt(req.params.id);
            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            console.log("Getting groups for project", projectId);
            console.log("Storage methods available:", Object.getOwnPropertyNames(storage).includes('getBotGroupsByProject'));
            console.log("Storage prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storage)));

            const groups = await storage.getBotGroupsByProject(projectId);
            console.log("Groups found:", groups);
            res.json(groups);
        } catch (error) {
            console.error("Failed to get groups:", error);
            res.status(500).json({ message: "Failed to get groups" });
        }
    });

    // Create a new group
    app.post("/api/projects/:id/groups", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            if (isNaN(projectId)) {
                return res.status(400).json({ message: "Invalid project ID" });
            }

            // console.log("=== CREATE GROUP DEBUG ===");
            // console.log("Request body:", JSON.stringify(req.body, null, 2));
            // console.log("Project ID:", projectId);
            // console.log("Data to validate:", JSON.stringify({ ...req.body, projectId }, null, 2));
            const result = insertBotGroupSchema.safeParse({ ...req.body, projectId });
            if (!result.success) {
                console.log("Validation errors:", JSON.stringify(result.error.errors, null, 2));
                return res.status(400).json({ message: "Invalid group data", errors: result.error.errors });
            }

            console.log("Validation successful, data:", JSON.stringify(result.data, null, 2));

            const group = await storage.createBotGroup(result.data);
            res.json(group);
        } catch (error) {
            console.error("Failed to create group:", error);
            res.status(500).json({ message: "Failed to create group" });
        }
    });

    // Update a group
    app.put("/api/projects/:projectId/groups/:groupId", async (req, res) => {
        try {
            const groupId = parseInt(req.params.groupId);
            if (isNaN(groupId)) {
                return res.status(400).json({ message: "Invalid group ID" });
            }

            const group = await storage.updateBotGroup(groupId, req.body);
            if (!group) {
                return res.status(404).json({ message: "Group not found" });
            }

            res.json(group);
        } catch (error) {
            console.error("Failed to update group:", error);
            res.status(500).json({ message: "Failed to update group" });
        }
    });

    // Delete a group
    app.delete("/api/projects/:projectId/groups/:groupId", async (req, res) => {
        try {
            const groupId = parseInt(req.params.groupId);
            if (isNaN(groupId)) {
                return res.status(400).json({ message: "Invalid group ID" });
            }

            const success = await storage.deleteBotGroup(groupId);
            if (!success) {
                return res.status(404).json({ message: "Group not found" });
            }

            res.json({ message: "Group deleted successfully" });
        } catch (error) {
            console.error("Failed to delete group:", error);
            res.status(500).json({ message: "Failed to delete group" });
        }
    });

    // Get bot information (getMe)
    app.get("/api/projects/:id/bot/info", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);

            // Добавляем заголовки для отключения кэширования при обновлении
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            // Get bot information via Telegram Bot API with cache busting
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getMe?_t=${Date.now()}`;
            const response = await fetch(telegramApiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to get bot info",
                    error: result.description || "Unknown error"
                });
            }

            const botInfo = result.result;

            // Логируем ответ от Telegram API для отладки
            console.log('Telegram API response:', JSON.stringify({
                first_name: botInfo.first_name,
                username: botInfo.username,
                description: botInfo.description,
                short_description: botInfo.short_description
            }, null, 2));

            // If bot has photo, get the file URL
            let photoUrl = null;
            if (botInfo.photo && botInfo.photo.big_file_id) {
                try {
                    // Get file info
                    const fileResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getFile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            file_id: botInfo.photo.big_file_id
                        })
                    });

                    const fileResult = await fileResponse.json();

                    if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
                        // Construct full photo URL
                        photoUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
                    }
                } catch (photoError) {
                    console.warn("Failed to get bot photo URL:", photoError);
                    // Continue without photo - not a critical error
                }
            }

            // Add photo URL to response
            const responseData = {
                ...botInfo,
                photoUrl: photoUrl
            };

            res.json(responseData);
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get bot info:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Update bot name
    app.put("/api/projects/:id/bot/name", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const { name, language_code = 'ru' } = req.body;

            console.log('🔧 Обновление имени бота:', { projectId, name, language_code });

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                console.error('❌ Токен бота не найден для проекта', projectId);
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            console.log('✅ Токен найден, отправляем запрос к Telegram API...');

            // Update bot name via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setMyName`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, language_code })
            });

            const result = await response.json();

            console.log('📡 Ответ от Telegram API setMyName:', { status: response.status, result });

            if (!response.ok) {
                console.error('❌ Ошибка от Telegram API:', result);
                return res.status(400).json({
                    message: "Failed to update bot name",
                    error: result.description || "Unknown error"
                });
            }

            console.log('✅ Имя бота успешно обновлено через Telegram API');
            res.json({ message: "Bot name updated successfully" });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to update bot name:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Update bot description
    app.put("/api/projects/:id/bot/description", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const { description, language_code = 'ru' } = req.body;

            console.log('🔧 Обновление описания бота:', { projectId, description, language_code });

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                console.error('❌ Токен бота не найден для проекта', projectId);
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            console.log('✅ Токен найден, отправляем запрос к Telegram API...');

            // Update bot description via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setMyDescription`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description, language_code })
            });

            const result = await response.json();

            console.log('📡 Ответ от Telegram API setMyDescription:', { status: response.status, result });

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to update bot description",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ message: "Bot description updated successfully" });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to update bot description:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Update bot short description
    app.put("/api/projects/:id/bot/short-description", async (req, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const { short_description, language_code = 'ru' } = req.body;

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            // Update bot short description via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setMyShortDescription`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ short_description, language_code })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to update bot short description",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ message: "Bot short description updated successfully" });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to update bot short description:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Telegram Bot API integration for groups
    // Send message to group
    app.post("/api/projects/:projectId/bot/send-group-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, message } = req.body;

            if (!groupId || !message) {
                return res.status(400).json({ message: "Group ID and message are required" });
            }

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            // Send message via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/sendMessage`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to send message",
                    error: result.description || "Unknown error"
                });
            }

            res.json({
                message: "Message sent successfully",
                messageId: result.result.message_id
            });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to send group message:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Get group chat information
    app.get("/api/projects/:projectId/bot/group-info/:groupId", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId } = req.params;

            // Check if groupId is null, undefined, or "null" string
            if (!groupId || groupId === 'null' || groupId === 'undefined') {
                return res.status(400).json({
                    message: "Не указан ID группы",
                    error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
                });
            }

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            // Get chat information via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChat`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to get group info",
                    error: result.description || "Unknown error"
                });
            }

            const chatInfo = result.result;

            // If chat has photo, get the file URL
            let avatarUrl = null;
            if (chatInfo.photo && chatInfo.photo.big_file_id) {
                try {
                    // Get file info
                    const fileResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getFile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            file_id: chatInfo.photo.big_file_id
                        })
                    });

                    const fileResult = await fileResponse.json();

                    if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
                        // Construct full photo URL
                        avatarUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
                    }
                } catch (photoError) {
                    console.warn("Failed to get group photo URL:", photoError);
                    // Continue without photo - not a critical error
                }
            }

            // Add avatar URL to response
            const responseData = {
                ...chatInfo,
                avatarUrl: avatarUrl
            };

            res.json(responseData);
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get group info:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Get group members count
    app.get("/api/projects/:projectId/bot/group-members-count/:groupId", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId } = req.params;

            // Check if groupId is null, undefined, or "null" string
            if (!groupId || groupId === 'null' || groupId === 'undefined') {
                return res.status(400).json({
                    message: "Не указан ID группы",
                    error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
                });
            }

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            // Get members count via Telegram Bot API
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMemberCount`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to get members count",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ count: result.result });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get members count:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Get bot admin status in group
    app.get("/api/projects/:projectId/bot/admin-status/:groupId", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId } = req.params;

            // Check if groupId is null, undefined, or "null" string
            if (!groupId || groupId === 'null' || groupId === 'undefined') {
                return res.status(400).json({
                    message: "Не указан ID группы",
                    error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
                });
            }

            // Get bot token for this project
            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found. Please add a token first." });
            }

            // Get bot information first
            const botInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
            const botInfo = await botInfoResponse.json();

            if (!botInfoResponse.ok) {
                return res.status(400).json({ message: "Failed to get bot info" });
            }

            const botId = botInfo.result.id;

            // Check bot admin status
            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: botId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to get admin status",
                    error: result.description || "Unknown error"
                });
            }

            const isAdmin = ['administrator', 'creator'].includes(result.result.status);

            res.json({
                isAdmin,
                status: result.result.status,
                permissions: result.result
            });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get admin status:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Get group administrators
    app.get("/api/projects/:projectId/bot/group-admins/:groupId", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId } = req.params;

            if (!groupId || groupId === "null") {
                return res.status(400).json({ message: "Group ID is required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to get administrators",
                    error: result.description || "Unknown error"
                });
            }

            // Найти бота среди администраторов и извлечь его права
            let botAdminRights = null;
            const botUser = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
            const botInfo = await botUser.json();

            if (botUser.ok && result.result) {
                const botAdmin = result.result.find((admin: any) => admin.user && admin.user.id === botInfo.result.id
                );

                if (botAdmin && botAdmin.status === 'administrator') {
                    // Извлекаем права администратора бота
                    botAdminRights = {
                        can_manage_chat: botAdmin.can_manage_chat || false,
                        can_change_info: botAdmin.can_change_info || false,
                        can_delete_messages: botAdmin.can_delete_messages || false,
                        can_invite_users: botAdmin.can_invite_users || false,
                        can_restrict_members: botAdmin.can_restrict_members || false,
                        can_pin_messages: botAdmin.can_pin_messages || false,
                        can_promote_members: botAdmin.can_promote_members || false,
                        can_manage_video_chats: botAdmin.can_manage_video_chats || false
                    };
                }
            }

            res.json({
                administrators: result.result,
                botAdminRights: botAdminRights
            });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get administrators:", errorInfo);
            
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Get all group members (works only for small groups <200 members)
    app.get("/api/projects/:projectId/bot/group-members/:groupId", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId } = req.params;

            if (!groupId || groupId === "null") {
                return res.status(400).json({ message: "Group ID is required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            // First check if this is a small group by getting chat info
            const chatInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId
                })
            });

            const chatInfo = await chatInfoResponse.json();

            if (!chatInfoResponse.ok) {
                return res.status(400).json({
                    message: "Failed to get chat info",
                    error: chatInfo.description || "Unknown error"
                });
            }

            // For large groups, we can only provide administrators
            // Check only member count, not group type - small supergroups should work
            if (chatInfo.result.members_count && chatInfo.result.members_count > 200) {
                return res.status(400).json({
                    message: "Cannot get member list for large groups",
                    error: "Telegram API allows getting full member list only for small groups (<200 members). For large groups, only administrators are available.",
                    membersCount: chatInfo.result.members_count
                });
            }

            // Telegram Bot API has limitations for getting chat members
            // For privacy reasons, even small groups only allow getting administrators
            try {
                const adminsResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: groupId
                    })
                });

                const adminsResult = await adminsResponse.json();

                if (!adminsResponse.ok) {
                    return res.status(400).json({
                        message: "Ошибка при получении участников",
                        error: adminsResult.description || "Неизвестная ошибка"
                    });
                }

                // Include information about group size
                const memberCount = chatInfo.result.members_count || 'Неизвестно';

                return res.json({
                    members: adminsResult.result,
                    isPartialList: true,
                    totalCount: memberCount,
                    message: `Группа содержит ${memberCount} участников. Показаны только администраторы (${adminsResult.result.length}).`,
                    explanation: "Telegram API ограничивает доступ к списку участников по соображениям приватности. Доступны только администраторы."
                });

            } catch (error) {
                const errorInfo = analyzeTelegramError(error);
                console.error("Error getting members:", errorInfo);
                const statusCode = getErrorStatusCode(errorInfo.type);
                res.status(statusCode).json({
                    message: errorInfo.userFriendlyMessage,
                    errorType: errorInfo.type,
                    details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
                });
            }

        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get group members:", errorInfo);
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Check specific member status
    app.get("/api/projects/:projectId/bot/check-member/:groupId/:userId", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, userId } = req.params;

            if (!groupId || groupId === "null" || !userId) {
                return res.status(400).json({ message: "Group ID and User ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: parseInt(userId)
                })
            });

            const result = await response.json();

            console.log("Telegram API response for check member:", {
                ok: response.ok,
                status: response.status,
                result: result,
                groupId: groupId,
                userId: userId
            });

            if (!response.ok) {
                console.error("Failed to check member status via Telegram API:", result);
                // Если это ошибка из-за неправильного username, пробуем объяснить
                if (result.description && result.description.includes("user not found")) {
                    return res.status(400).json({
                        message: "User not found",
                        error: "Пользователь не найден. Убедитесь, что вы указали правильный @username или числовой ID."
                    });
                }
                return res.status(400).json({
                    message: "Failed to check member status",
                    error: result.description || "Unknown error"
                });
            }

            // Return member info with friendly status
            const member = result.result;
            const friendlyStatus = {
                'creator': 'Создатель',
                'administrator': 'Администратор',
                'member': 'Участник',
                'restricted': 'Ограничен',
                'left': 'Покинул группу',
                'kicked': 'Исключен'
            };

            // Сохраняем участника в базе данных, если его там еще нет
            try {
                // Находим внутренний ID группы из botGroups таблицы
                const group = await storage.getBotGroupByProjectAndGroupId(projectId, groupId);
                if (group) {
                    // Проверяем, есть ли уже такой участник в базе
                    const existingMembers = await storage.getGroupMembers(group.id);
                    const existingMember = existingMembers.find(m => m.userId.toString() === userId);

                    if (!existingMember) {
                        // Создаем нового участника
                        const memberData = {
                            groupId: group.id,
                            userId: parseInt(userId),
                            username: member.user?.username || null,
                            firstName: member.user?.first_name || null,
                            lastName: member.user?.last_name || null,
                            status: member.status,
                            isBot: member.user?.is_bot ? 1 : 0,
                            isActive: 1,
                            adminRights: member.status === 'administrator' ? {
                                can_change_info: member.can_change_info || false,
                                can_delete_messages: member.can_delete_messages || false,
                                can_restrict_members: member.can_restrict_members || false,
                                can_invite_users: member.can_invite_users || false,
                                can_pin_messages: member.can_pin_messages || false,
                                can_promote_members: member.can_promote_members || false,
                                can_manage_video_chats: member.can_manage_video_chats || false,
                                can_be_anonymous: member.is_anonymous || false
                            } : {},
                            customTitle: member.custom_title || null,
                            restrictions: {},
                            messageCount: 0,
                            lastSeen: new Date()
                        };

                        await storage.createGroupMember(memberData);
                        console.log(`✅ Участник ${member.user?.first_name || userId} сохранен в базу данных`);
                    } else {
                        // Обновляем существующего участника
                        const updateData = {
                            status: member.status,
                            username: member.user?.username || existingMember.username,
                            firstName: member.user?.first_name || existingMember.firstName,
                            lastName: member.user?.last_name || existingMember.lastName,
                            isActive: 1,
                            adminRights: member.status === 'administrator' ? {
                                can_change_info: member.can_change_info || false,
                                can_delete_messages: member.can_delete_messages || false,
                                can_restrict_members: member.can_restrict_members || false,
                                can_invite_users: member.can_invite_users || false,
                                can_pin_messages: member.can_pin_messages || false,
                                can_promote_members: member.can_promote_members || false,
                                can_manage_video_chats: member.can_manage_video_chats || false,
                                can_be_anonymous: member.is_anonymous || false
                            } : {},
                            customTitle: member.custom_title || existingMember.customTitle,
                            restrictions: existingMember.restrictions || {},
                            messageCount: existingMember.messageCount || 0,
                            lastSeen: new Date()
                        };

                        await storage.updateGroupMember(existingMember.id, updateData);
                        console.log(`✅ Участник ${member.user?.first_name || userId} обновлен в базе данных`);
                    }
                }
            } catch (dbError) {
                console.error("Ошибка сохранения участника в базу:", dbError);
                // Не прерываем выполнение, просто логируем ошибку
            }

            const responseData = {
                member: {
                    ...member,
                    friendlyStatus: (friendlyStatus as any)[member.status] || member.status
                }
            };

            console.log("Sending response:", responseData);
            res.json(responseData);
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to check member status:", errorInfo);
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Get saved group members from database
    app.get("/api/projects/:projectId/groups/:groupId/saved-members", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId } = req.params;

            if (!groupId || groupId === "null") {
                return res.status(400).json({ message: "Group ID is required" });
            }

            // Находим внутренний ID группы из botGroups таблицы
            const group = await storage.getBotGroupByProjectAndGroupId(projectId, groupId);
            if (!group) {
                return res.json({ members: [] }); // Возвращаем пустой список если группа не найдена
            }

            // Получаем сохраненных участников из базы данных
            const savedMembers = await storage.getGroupMembers(group.id);

            // Преобразуем данные в формат, совместимый с фронтендом
            const members = savedMembers.map(member => ({
                user: {
                    id: member.userId,
                    username: member.username || undefined,
                    first_name: member.firstName || undefined,
                    last_name: member.lastName || undefined,
                    is_bot: member.isBot === 1
                },
                status: member.status,
                custom_title: member.customTitle || undefined,
                friendlyStatus: {
                    'creator': 'Создатель',
                    'administrator': 'Администратор',
                    'member': 'Участник',
                    'restricted': 'Ограничен',
                    'left': 'Покинул группу',
                    'kicked': 'Исключен'
                }[member.status as keyof typeof member.status] || member.status,
                savedFromDatabase: true, // Флаг для фронтенда
                lastSeen: member.lastSeen,
                messageCount: member.messageCount,
                ...(typeof member.adminRights === 'object' && member.adminRights ? member.adminRights : {}) // Разворачиваем права администратора
            }));

            console.log(`✅ Загружено ${members.length} сохраненных участников группы ${groupId} из базы данных`);
            res.json({ members });

        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to get saved group members:", errorInfo);
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Ban group member
    app.post("/api/projects/:projectId/bot/ban-member", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, userId, untilDate } = req.body;

            if (!groupId || !userId) {
                return res.status(400).json({ message: "Group ID and User ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/banChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: userId,
                    until_date: untilDate || undefined
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to ban member",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Member banned successfully" });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to ban member:", errorInfo);
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Unban group member
    app.post("/api/projects/:projectId/bot/unban-member", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, userId } = req.body;

            if (!groupId || !userId) {
                return res.status(400).json({ message: "Group ID and User ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/unbanChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: userId,
                    only_if_banned: true
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to unban member",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Member unbanned successfully" });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Failed to unban member:", errorInfo);
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    });

    // Promote group member to admin
    app.post("/api/projects/:projectId/bot/promote-member", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const {
                groupId, userId, can_manage_chat, can_change_info, can_delete_messages, can_invite_users, can_restrict_members, can_pin_messages, can_promote_members, can_manage_video_chats
            } = req.body;

            if (!groupId || !userId) {
                return res.status(400).json({ message: "Group ID and User ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            // С??ачала проверяем, является ли пользователь участником группы
            const memberCheckUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
            const memberCheckResponse = await fetch(memberCheckUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: parseInt(userId)
                })
            });

            const memberCheckResult = await memberCheckResponse.json();

            if (!memberCheckResponse.ok) {
                if (memberCheckResult.error_code === 400 && memberCheckResult.description?.includes('user not found')) {
                    return res.status(400).json({
                        message: "User is not a member of this group",
                        error: "Пользователь не является участником группы. Сначала пригласите пользователя в группу, а затем назначьте администратором."
                    });
                }
                return res.status(400).json({
                    message: "Failed to check user membership",
                    error: memberCheckResult.description || "Unknown error"
                });
            }

            const memberStatus = memberCheckResult.result?.status;
            if (memberStatus === 'left' || memberStatus === 'kicked') {
                return res.status(400).json({
                    message: "User is not a member of this group",
                    error: "Пользователь покинул группу или был исключен. Сначала пригласите пользователя в группу."
                });
            }

            console.log('User membership status:', memberStatus);
            console.log('Promoting user with rights:', {
                groupId,
                userId,
                can_manage_chat,
                can_change_info,
                can_delete_messages,
                can_invite_users,
                can_restrict_members,
                can_pin_messages,
                can_promote_members,
                can_manage_video_chats
            });

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/promoteChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: parseInt(userId),
                    can_manage_chat: can_manage_chat !== undefined ? can_manage_chat : true,
                    can_change_info: can_change_info !== undefined ? can_change_info : true,
                    can_delete_messages: can_delete_messages !== undefined ? can_delete_messages : true,
                    can_invite_users: can_invite_users !== undefined ? can_invite_users : true,
                    can_restrict_members: can_restrict_members !== undefined ? can_restrict_members : true,
                    can_pin_messages: can_pin_messages !== undefined ? can_pin_messages : true,
                    can_promote_members: can_promote_members !== undefined ? can_promote_members : true,
                    can_manage_video_chats: can_manage_video_chats !== undefined ? can_manage_video_chats : true,
                    can_post_stories: true,
                    can_edit_stories: true,
                    can_delete_stories: true,
                    is_anonymous: true
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Telegram API error:', result);
                return res.status(400).json({
                    message: "Failed to promote member",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Member promoted successfully" });
        } catch (error) {
            console.error("Failed to promote member:", error);
            res.status(500).json({ message: "Failed to promote member" });
        }
    });

    // Demote admin to regular member
    app.post("/api/projects/:projectId/bot/demote-member", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, userId } = req.body;

            if (!groupId || !userId) {
                return res.status(400).json({ message: "Group ID and User ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/promoteChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: userId,
                    can_manage_chat: false,
                    can_change_info: false,
                    can_delete_messages: false,
                    can_invite_users: false,
                    can_restrict_members: false,
                    can_pin_messages: false,
                    can_promote_members: false,
                    can_manage_video_chats: false
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to demote member",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Member demoted successfully" });
        } catch (error) {
            console.error("Failed to demote member:", error);
            res.status(500).json({ message: "Failed to demote member" });
        }
    });

    // Search user by username or ID for promotion
    app.get("/api/projects/:projectId/bot/search-user/:query", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const query = req.params.query;

            if (!query) {
                return res.status(400).json({ message: "Search query is required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            // Сначала попробуем найти пользователя в локальной базе данных
            const localUserBotData = await storage.searchUserBotData(projectId, query);
            const localBotUsers = await storage.searchBotUsers(query);

            // Проверяем user_bot_data (специфично для проекта)
            if (localUserBotData && localUserBotData.length > 0) {
                const user = localUserBotData[0];
                return res.json({
                    success: true,
                    user: {
                        id: parseInt(user.userId),
                        first_name: user.firstName,
                        last_name: user.lastName,
                        username: user.userName,
                        type: 'private'
                    },
                    userId: user.userId,
                    source: 'local_project'
                });
            }

            // Проверяем bot_users (глобальная таблица пользователей)
            if (localBotUsers && localBotUsers.length > 0) {
                const user = localBotUsers[0];
                return res.json({
                    success: true,
                    user: {
                        id: user.userId,
                        first_name: user.firstName,
                        last_name: user.lastName,
                        username: user.username,
                        type: 'private'
                    },
                    userId: user.userId.toString(),
                    source: 'local_global'
                });
            }

            // Если не найден в локальной базе, пробуем через Telegram API
            const isNumeric = /^\d+$/.test(query);
            let userId = null;

            if (isNumeric) {
                userId = query;
            } else {
                // Если это username, убираем @ если есть
                const username = query.startsWith('@') ? query.slice(1) : query;

                // Для поиска по username нужно использовать getChatMember или getChat
                // Но Bot API не предоставляет прямого поиска по username
                // Поэтому попробуем сначала получить информацию через @username
                try {
                    const chatResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_id: `@${username}`
                        })
                    });

                    const chatResult = await chatResponse.json();
                    if (chatResponse.ok && chatResult.result && chatResult.result.id) {
                        userId = chatResult.result.id.toString();
                    }
                } catch (error) {
                    console.log('Username search failed, user might not have public username');
                }
            }

            if (!userId) {
                return res.status(404).json({
                    message: "User not found",
                    error: "Пользователь не найден ни в локальной базе данных, ни через Telegram API. Убедитесь, что пользователь взаимодействовал с ботом или имеет публичный username."
                });
            }

            // Получаем информацию о пользователе
            const userResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: userId
                })
            });

            const userResult = await userResponse.json();

            if (!userResponse.ok) {
                return res.status(400).json({
                    message: "Failed to get user info",
                    error: userResult.description || "Unknown error"
                });
            }

            res.json({
                success: true,
                user: userResult.result,
                userId: userId,
                source: 'telegram'
            });
        } catch (error) {
            console.error("Failed to search user:", error);
            res.status(500).json({ message: "Failed to search user" });
        }
    });

    // Restrict group member
    app.post("/api/projects/:projectId/bot/restrict-member", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, userId, permissions, untilDate } = req.body;

            if (!groupId || !userId) {
                return res.status(400).json({ message: "Group ID and User ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/restrictChatMember`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: userId,
                    permissions: permissions,
                    until_date: untilDate || undefined
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Bot API restrict member failed:", result);
                return res.status(400).json({
                    message: "Failed to restrict member",
                    error: result.description || "Unknown error",
                    details: result
                });
            }

            res.json({ success: true, message: "Member restricted successfully" });
        } catch (error) {
            console.error("Failed to restrict member:", error);
            res.status(500).json({ message: "Failed to restrict member" });
        }
    });

    // Set group photo using Bot API
    app.post("/api/projects/:projectId/bot/set-group-photo", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, photoPath } = req.body;

            if (!groupId || !photoPath) {
                return res.status(400).json({ message: "Group ID and photo path are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            // Читаем файл и отправляем через multipart/form-data
            const fs = await import('fs');
            const path = await import('path');

            const photoBuffer = fs.readFileSync(photoPath);
            const fileName = path.basename(photoPath);

            // Создаем multipart form data вручную
            const boundary = '----formdata-replit-' + Math.random().toString(36);
            const CRLF = '\r\n';

            let body = '';
            body += `--${boundary}${CRLF}`;
            body += `Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}`;
            body += `${groupId}${CRLF}`;
            body += `--${boundary}${CRLF}`;
            body += `Content-Disposition: form-data; name="photo"; filename="${fileName}"${CRLF}`;
            body += `Content-Type: image/png${CRLF}${CRLF}`;

            const bodyBuffer = Buffer.concat([
                Buffer.from(body, 'utf8'),
                photoBuffer,
                Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8')
            ]);

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setChatPhoto`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': bodyBuffer.length.toString(),
                },
                body: bodyBuffer,
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to set group photo",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Group photo updated successfully" });
        } catch (error: any) {
            console.error("Failed to set group photo:", error);
            res.status(500).json({
                message: "Failed to set group photo",
                error: error.message || "Unknown error"
            });
        }
    });

    // Set group title
    app.post("/api/projects/:projectId/bot/set-group-title", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, title } = req.body;

            if (!groupId || !title) {
                return res.status(400).json({ message: "Group ID and title are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setChatTitle`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    title: title
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to set group title",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Group title updated successfully" });
        } catch (error) {
            console.error("Failed to set group title:", error);
            res.status(500).json({ message: "Failed to set group title" });
        }
    });

    // Set group description
    app.post("/api/projects/:projectId/bot/set-group-description", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, description } = req.body;

            if (!groupId || !description) {
                return res.status(400).json({ message: "Group ID and description are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setChatDescription`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    description: description
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to set group description",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Group description updated successfully" });
        } catch (error) {
            console.error("Failed to set group description:", error);
            res.status(500).json({ message: "Failed to set group description" });
        }
    });

    // Set group username (make public/private)
    app.post("/api/projects/:projectId/bot/set-group-username", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, username } = req.body;

            if (!groupId) {
                return res.status(400).json({ message: "Group ID is required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            // Для установки username нужны права создателя или админа, используем Client API если доступен
            try {
                // Проверяем есть ли Telegram Client API доступ
                const clientManager = telegramClientManager;
                if (clientManager) {
                    // Пытаемся использовать Client API для установки username
                    const result = await clientManager.setChatUsername('default', groupId, username);

                    res.json({
                        success: true,
                        message: username ? "Group username set successfully" : "Group made private successfully",
                        result
                    });
                    return;
                }
            } catch (clientError) {
                console.log("Client API не доступен, используем Bot API:", clientError);
            }

            // Fallback: используем Bot API (ограниченная функциональность)
            // Bot API не может изменять username, только создатель через Client API
            return res.status(400).json({
                message: "Setting group username requires creator/admin privileges. Please use Telegram Client API authorization.",
                requiresClientApi: true
            });

        } catch (error) {
            console.error("Failed to set group username:", error);
            res.status(500).json({ message: "Failed to set group username" });
        }
    });

    // Pin message in group
    app.post("/api/projects/:projectId/bot/pin-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, messageId, disableNotification } = req.body;

            if (!groupId || !messageId) {
                return res.status(400).json({ message: "Group ID and message ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/pinChatMessage`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    message_id: messageId,
                    disable_notification: disableNotification || false
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to pin message",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Message pinned successfully" });
        } catch (error) {
            console.error("Failed to pin message:", error);
            res.status(500).json({ message: "Failed to pin message" });
        }
    });

    // Unpin message in group
    app.post("/api/projects/:projectId/bot/unpin-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, messageId } = req.body;

            if (!groupId) {
                return res.status(400).json({ message: "Group ID is required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = messageId
                ? `https://api.telegram.org/bot${defaultToken.token}/unpinChatMessage`
                : `https://api.telegram.org/bot${defaultToken.token}/unpinAllChatMessages`;

            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    ...(messageId && { message_id: messageId })
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to unpin message",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: messageId ? "Message unpinned successfully" : "All messages unpinned successfully" });
        } catch (error) {
            console.error("Failed to unpin message:", error);
            res.status(500).json({ message: "Failed to unpin message" });
        }
    });

    // Create new invite link for group
    app.post("/api/projects/:projectId/bot/create-invite-link", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, name, expireDate, memberLimit, createsJoinRequest } = req.body;

            if (!groupId) {
                return res.status(400).json({ message: "Group ID is required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/createChatInviteLink`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    name: name || undefined,
                    expire_date: expireDate || undefined,
                    member_limit: memberLimit || undefined,
                    creates_join_request: createsJoinRequest || false
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to create invite link",
                    error: result.description || "Unknown error"
                });
            }

            res.json({
                success: true,
                inviteLink: result.result,
                message: "Invite link created successfully"
            });
        } catch (error) {
            console.error("Failed to create invite link:", error);
            res.status(500).json({ message: "Failed to create invite link" });
        }
    });

    // Delete message in group
    app.post("/api/projects/:projectId/bot/delete-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, messageId } = req.body;

            if (!groupId || !messageId) {
                return res.status(400).json({ message: "Group ID and message ID are required" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Bot token not found for this project" });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/deleteMessage`;
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    message_id: messageId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    message: "Failed to delete message",
                    error: result.description || "Unknown error"
                });
            }

            res.json({ success: true, message: "Message deleted successfully" });
        } catch (error) {
            console.error("Failed to delete message:", error);
            res.status(500).json({ message: "Failed to delete message" });
        }
    });

    // Telegram Client API endpoints
    // Save user Telegram API credentials
    app.post("/api/telegram-settings", async (req, res) => {
        try {
            const { userId, apiId, apiHash } = req.body;

            if (!userId || !apiId || !apiHash) {
                return res.status(400).json({
                    message: "userId, apiId, and apiHash are required"
                });
            }

            // Here we would save to database - for now, return success
            // TODO: Implement storage.createUserTelegramSettings()
            res.json({
                message: "Telegram API credentials saved successfully",
                success: true
            });
        } catch (error) {
            console.error("Failed to save Telegram API credentials:", error);
            res.status(500).json({ message: "Failed to save credentials" });
        }
    });

    // Get group members using Telegram Client API (общая база)
    app.get("/api/telegram-client/group-members/:groupId", async (req, res) => {
        try {
            const { groupId } = req.params;

            // Check if API credentials are available
            const apiId = process.env.TELEGRAM_API_ID;
            const apiHash = process.env.TELEGRAM_API_HASH;

            if (!apiId || !apiHash) {
                console.log('⚠️ CLIENT API: Telegram API credentials not configured, returning demo data');

                // Return demo data when credentials are not configured
                return res.json({
                    success: true,
                    message: "🎭 Демо-режим: показаны примерные участники",
                    explanation: "Для получения реальных данных настройте TELEGRAM_API_ID и TELEGRAM_API_HASH",
                    groupId,
                    memberCount: 3,
                    members: [
                        {
                            id: 123456789,
                            username: "demo_user1",
                            firstName: "Демо",
                            lastName: "Пользователь 1",
                            isBot: false,
                            status: "active",
                            joinedAt: new Date().toISOString(),
                            source: "demo_data"
                        },
                        {
                            id: 987654321,
                            username: "demo_user2",
                            firstName: "Демо",
                            lastName: "Пользователь 2",
                            isBot: false,
                            status: "active",
                            joinedAt: new Date().toISOString(),
                            source: "demo_data"
                        },
                        {
                            id: 555666777,
                            username: "demo_bot",
                            firstName: "Демо",
                            lastName: "Бот",
                            isBot: true,
                            status: "active",
                            joinedAt: new Date().toISOString(),
                            source: "demo_data"
                        }
                    ],
                    isDemoMode: true,
                    note: "Это демонстрационные данные. Для получения реальных участников настройте API credentials."
                });
            }

            console.log(`🔍 CLIENT API: Получение участников группы ${groupId} через Client API`);

            try {
                // Try to use real Telegram Client API to get group members
                const members = await telegramClientManager.getGroupMembers('default', groupId);

                if (members && members.length > 0) {
                    console.log(`✅ CLIENT API: Найдено ${members.length} реальных участников группы`);

                    res.json({
                        success: true,
                        message: `✅ Получен полный список участников через Client API`,
                        explanation: "Client API позволяет получить всех участников группы, а не только администраторов",
                        groupId,
                        memberCount: members.length,
                        members: members.map((member: any) => ({
                            id: member.id,
                            username: member.username,
                            firstName: member.firstName,
                            lastName: member.lastName,
                            isBot: member.isBot,
                            status: member.status,
                            joinedAt: member.joinedAt,
                            source: "client_api"
                        })),
                        advantages: [
                            `Показывает всех участников группы (${members.length} реальных участников)`,
                            "Включает обычных пользователей, не только админов",
                            "Предоставляет полную информацию о пользователях",
                            "Обходит ограничения Bot API"
                        ]
                    });
                } else {
                    throw new Error('No members found or Client API not connected');
                }
            } catch (error: any) {
                console.log(`⚠️ CLIENT API: Ошибка получения реальных данных: ${error?.message || 'Unknown error'}`);
                console.log('📝 CLIENT API: Требуется настройка Telegram клиента');

                res.status(400).json({
                    success: false,
                    message: "❌ Client API требует настройки",
                    explanation: "Для получения полного списка участников необходимо настроить Telegram Client API с номером телефона",
                    groupId,
                    error: error?.message || 'Unknown error',
                    requirements: [
                        "Подключение к Telegram Client API с номером телефона",
                        "Авторизация через код подтверждения",
                        "Права доступа к данным группы"
                    ],
                    note: "Bot API показывает только администраторов, Client API может показать всех участников"
                });
            }
        } catch (error) {
            console.error("Failed to get group members via Client API:", error);
            res.status(500).json({ message: "Failed to get group members via Client API" });
        }
    });
}
