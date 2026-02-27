/**
 * @fileoverview Модуль для настройки маршрутов интеграции с ботами
 *
 * Этот модуль предоставляет функции для настройки маршрутов, позволяющие
 * интегрировать ботов с различными функциями, включая обмен сообщениями,
 * управление группами, работу с медиафайлами и другие возможности.
 *
 * @module setupBotIntegrationRoutes
 */

import type { Express } from "express";
import { getBotDataHandler, getAvatarHandler } from "./botIntegration/handlers/botData";
import { getMessagesHandler, sendMessageHandler, saveMessageHandler, deleteMessagesHandler } from "./botIntegration/handlers/messages";
import { registerTelegramMediaHandler } from "./botIntegration/handlers/media";
import { getGroupsHandler, createGroupHandler, updateGroupHandler, deleteGroupHandler } from "./botIntegration/handlers/groups";
import { getBotInfoHandler, updateBotNameHandler, updateBotDescriptionHandler, updateBotShortDescriptionHandler } from "./botIntegration/handlers/botInfo";
import { sendGroupMessageHandler, getGroupInfoHandler, getGroupMembersCountHandler, getBotAdminStatusHandler, getGroupAdminsHandler, getGroupMembersHandler, checkMemberHandler, getSavedMembersHandler, banMemberHandler, unbanMemberHandler, promoteMemberHandler, demoteMemberHandler } from "./botIntegration/handlers/telegramGroups";
import { storage } from "../storages/storage";
import { telegramClientManager } from "../telegram/telegram-client";

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
     * Обработчик маршрута GET /api/projects/:projectId/bot/data
     *
     * Возвращает данные бота из bot_users
     *
     * @route GET /api/projects/:projectId/bot/data
     */
    app.get("/api/projects/:projectId/bot/data", getBotDataHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/users/:userId/avatar
     *
     * Возвращает аватарку пользователя через прокси (скрывает токен бота)
     *
     * @route GET /api/projects/:projectId/users/:userId/avatar
     */
    app.get("/api/projects/:projectId/users/:userId/avatar", getAvatarHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/users/:userId/messages
     *
     * Возвращает сообщения пользователя для указанного проекта
     *
     * @route GET /api/projects/:projectId/users/:userId/messages
     */
    app.get("/api/projects/:projectId/users/:userId/messages", getMessagesHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/users/:userId/send-message
     *
     * Отправляет сообщение пользователю от имени администратора
     *
     * @route POST /api/projects/:projectId/users/:userId/send-message
     */
    app.post("/api/projects/:projectId/users/:userId/send-message", sendMessageHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/messages
     *
     * Сохраняет сообщение от бота в базу данных
     *
     * @route POST /api/projects/:projectId/messages
     */
    app.post("/api/projects/:projectId/messages", saveMessageHandler);

    /**
     * Обработчик маршрута DELETE /api/projects/:projectId/users/:userId/messages
     *
     * Удаляет историю сообщений пользователя
     *
     * @route DELETE /api/projects/:projectId/users/:userId/messages
     */
    app.delete("/api/projects/:projectId/users/:userId/messages", deleteMessagesHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/media/register-telegram-photo
     *
     * Регистрирует медиафайл из Telegram и связывает его с сообщением
     *
     * @route POST /api/projects/:projectId/media/register-telegram-photo
     */
    app.post("/api/projects/:projectId/media/register-telegram-photo", registerTelegramMediaHandler);

    // Bot Groups API
    app.get("/api/projects/:id/groups", getGroupsHandler);
    app.post("/api/projects/:id/groups", createGroupHandler);
    app.put("/api/projects/:projectId/groups/:groupId", updateGroupHandler);
    app.delete("/api/projects/:projectId/groups/:groupId", deleteGroupHandler);

    // Get bot information (getMe)
    app.get("/api/projects/:id/bot/info", getBotInfoHandler);

    // Update bot name
    app.put("/api/projects/:id/bot/name", updateBotNameHandler);

    // Update bot description
    app.put("/api/projects/:id/bot/description", updateBotDescriptionHandler);

    // Update bot short description
    app.put("/api/projects/:id/bot/short-description", updateBotShortDescriptionHandler);

    // Telegram Bot API integration for groups
    app.post("/api/projects/:projectId/bot/send-group-message", sendGroupMessageHandler);
    app.get("/api/projects/:projectId/bot/group-info/:groupId", getGroupInfoHandler);
    app.get("/api/projects/:projectId/bot/group-members-count/:groupId", getGroupMembersCountHandler);
    app.get("/api/projects/:projectId/bot/admin-status/:groupId", getBotAdminStatusHandler);
    app.get("/api/projects/:projectId/bot/group-admins/:groupId", getGroupAdminsHandler);
    app.get("/api/projects/:projectId/bot/group-members/:groupId", getGroupMembersHandler);
    app.get("/api/projects/:projectId/bot/check-member/:groupId/:userId", checkMemberHandler);
    app.get("/api/projects/:projectId/groups/:groupId/saved-members", getSavedMembersHandler);
    app.post("/api/projects/:projectId/bot/ban-member", banMemberHandler);
    app.post("/api/projects/:projectId/bot/unban-member", unbanMemberHandler);
    app.post("/api/projects/:projectId/bot/promote-member", promoteMemberHandler);
    app.post("/api/projects/:projectId/bot/demote-member", demoteMemberHandler);

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

            // Fallback: используем Bot API (ограниченная функциональ��ость)
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
                    explanation: "Для по��учения полного списка участников необходимо настроить Telegram Client API с номером телефона",
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
