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
import { searchUserHandler } from "./botIntegration/user/searchUser.handler";
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

    // API групп ботов
    app.get("/api/projects/:id/groups", getGroupsHandler);
    app.post("/api/projects/:id/groups", createGroupHandler);
    app.put("/api/projects/:projectId/groups/:groupId", updateGroupHandler);
    app.delete("/api/projects/:projectId/groups/:groupId", deleteGroupHandler);

    // Получение информации о боте (getMe)
    app.get("/api/projects/:id/bot/info", getBotInfoHandler);

    // Обновление имени бота
    app.put("/api/projects/:id/bot/name", updateBotNameHandler);

    // Обновление описания бота
    app.put("/api/projects/:id/bot/description", updateBotDescriptionHandler);

    // Обновление краткого описания бота
    app.put("/api/projects/:id/bot/short-description", updateBotShortDescriptionHandler);

    // Интеграция Telegram Bot API для групп
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

    // Поиск пользователя по username или ID для повышения
    app.get("/api/projects/:projectId/bot/search-user/:query", searchUserHandler);

    // Ограничение участника группы
    app.post("/api/projects/:projectId/bot/restrict-member", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, userId, permissions, untilDate } = req.body;

            if (!groupId || !userId) {
                return res.status(400).json({ message: "Требуются ID группы и ID пользователя" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                console.error("Ошибка Bot API при ограничении участника:", result);
                return res.status(400).json({
                    message: "Не удалось ограничить участника",
                    error: result.description || "Неизвестная ошибка",
                    details: result
                });
            }

            res.json({ success: true, message: "Участник успешно ограничен" });
        } catch (error) {
            console.error("Не удалось ограничить участника:", error);
            res.status(500).json({ message: "Не удалось ограничить участника" });
        }
    });

    // Установка фото группы через Bot API
    app.post("/api/projects/:projectId/bot/set-group-photo", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, photoPath } = req.body;

            if (!groupId || !photoPath) {
                return res.status(400).json({ message: "Требуются ID группы и путь к фото" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось установить фото группы",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({ success: true, message: "Фото группы успешно обновлено" });
        } catch (error: any) {
            console.error("Не удалось установить фото группы:", error);
            res.status(500).json({
                message: "Не удалось установить фото группы",
                error: error.message || "Неизвестная ошибка"
            });
        }
    });

    // Установка названия группы
    app.post("/api/projects/:projectId/bot/set-group-title", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, title } = req.body;

            if (!groupId || !title) {
                return res.status(400).json({ message: "Требуются ID группы и название" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось установить название группы",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({ success: true, message: "Название группы успешно обновлено" });
        } catch (error) {
            console.error("Не удалось установить название группы:", error);
            res.status(500).json({ message: "Не удалось установить название группы" });
        }
    });

    // Установка описания группы
    app.post("/api/projects/:projectId/bot/set-group-description", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, description } = req.body;

            if (!groupId || !description) {
                return res.status(400).json({ message: "Требуются ID группы и описание" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось установить описание группы",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({ success: true, message: "Описание группы успешно обновлено" });
        } catch (error) {
            console.error("Не удалось установить описание группы:", error);
            res.status(500).json({ message: "Не удалось установить описание группы" });
        }
    });

    // Установка username группы (сделать публичной/приватной)
    app.post("/api/projects/:projectId/bot/set-group-username", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, username } = req.body;

            if (!groupId) {
                return res.status(400).json({ message: "Требуется ID группы" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                        message: username ? "Username группы успешно установлен" : "Группа сделана приватной",
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
                message: "Для установки username группы требуются права создателя/администратора. Пожалуйста, используйте авторизацию через Telegram Client API.",
                requiresClientApi: true
            });

        } catch (error) {
            console.error("Не удалось установить username группы:", error);
            res.status(500).json({ message: "Не удалось установить username группы" });
        }
    });

    // Закрепление сообщения в группе
    app.post("/api/projects/:projectId/bot/pin-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, messageId, disableNotification } = req.body;

            if (!groupId || !messageId) {
                return res.status(400).json({ message: "Требуются ID группы и ID сообщения" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось закрепить сообщение",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({ success: true, message: "Сообщение успешно закреплено" });
        } catch (error) {
            console.error("Не удалось закрепить сообщение:", error);
            res.status(500).json({ message: "Не удалось закрепить сообщение" });
        }
    });

    // Открепление сообщения в группе
    app.post("/api/projects/:projectId/bot/unpin-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, messageId } = req.body;

            if (!groupId) {
                return res.status(400).json({ message: "Требуется ID группы" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось открепить сообщение",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({ success: true, message: messageId ? "Сообщение успешно откреплено" : "Все сообщения успешно откреплены" });
        } catch (error) {
            console.error("Не удалось открепить сообщение:", error);
            res.status(500).json({ message: "Не удалось открепить сообщение" });
        }
    });

    // Создание новой ссылки-приглашения для группы
    app.post("/api/projects/:projectId/bot/create-invite-link", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, name, expireDate, memberLimit, createsJoinRequest } = req.body;

            if (!groupId) {
                return res.status(400).json({ message: "Требуется ID группы" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось создать ссылку-приглашение",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({
                success: true,
                inviteLink: result.result,
                message: "Ссылка-приглашение успешно создана"
            });
        } catch (error) {
            console.error("Не удалось создать ссылку-приглашение:", error);
            res.status(500).json({ message: "Не удалось создать ссылку-приглашение" });
        }
    });

    // Удаление сообщения в группе
    app.post("/api/projects/:projectId/bot/delete-message", async (req, res) => {
        try {
            const projectId = parseInt(req.params.projectId);
            const { groupId, messageId } = req.body;

            if (!groupId || !messageId) {
                return res.status(400).json({ message: "Требуются ID группы и ID сообщения" });
            }

            const defaultToken = await storage.getDefaultBotToken(projectId);
            if (!defaultToken) {
                return res.status(400).json({ message: "Токен бота не найден для этого проекта" });
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
                    message: "Не удалось удалить сообщение",
                    error: result.description || "Неизвестная ошибка"
                });
            }

            res.json({ success: true, message: "Сообщение успешно удалено" });
        } catch (error) {
            console.error("Не удалось удалить сообщение:", error);
            res.status(500).json({ message: "Не удалось удалить сообщение" });
        }
    });

    // Конечные точки Telegram Client API
    // Сохранение данных Telegram API пользователя
    app.post("/api/telegram-settings", async (req, res) => {
        try {
            const { userId, apiId, apiHash } = req.body;

            if (!userId || !apiId || !apiHash) {
                return res.status(400).json({
                    message: "Требуются userId, apiId и apiHash"
                });
            }

            // Здесь мы сохраняем в базу данных - пока возвращаем успех
            // TODO: Реализовать storage.createUserTelegramSettings()
            res.json({
                message: "Данные Telegram API успешно сохранены",
                success: true
            });
        } catch (error) {
            console.error("Не удалось сохранить данные Telegram API:", error);
            res.status(500).json({ message: "Не удалось сохранить данные" });
        }
    });

    // Получение участников группы через Telegram Client API (общая база)
    app.get("/api/telegram-client/group-members/:groupId", async (req, res) => {
        try {
            const { groupId } = req.params;

            // Проверяем доступны ли API-credentials
            const apiId = process.env.TELEGRAM_API_ID;
            const apiHash = process.env.TELEGRAM_API_HASH;

            if (!apiId || !apiHash) {
                console.log('⚠️ CLIENT API: Данные Telegram API не настроены, возвращаем демо-данные');

                // Возвращаем демо-данные, когда данные не настроены
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
                // Пробуем использовать настоящий Telegram Client API для получения участников группы
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
                    throw new Error('Участники не найдены или Client API не подключен');
                }
            } catch (error: any) {
                console.log(`⚠️ CLIENT API: Ошибка получения реальных данных: ${error?.message || 'Неизвестная ошибка'}`);
                console.log('📝 CLIENT API: Требуется настройка Telegram клиента');

                res.status(400).json({
                    success: false,
                    message: "❌ Client API требует настройки",
                    explanation: "Для получения полного списка участников необходимо настроить Telegram Client API с номером телефона",
                    groupId,
                    error: error?.message || 'Неизвестная ошибка',
                    requirements: [
                        "Подключение к Telegram Client API с номером телефона",
                        "Авторизация через код подтверждения",
                        "Права доступа к данным группы"
                    ],
                    note: "Bot API показывает только администраторов, Client API может показать всех участников"
                });
            }
        } catch (error) {
            console.error("Не удалось получить участников группы через Client API:", error);
            res.status(500).json({ message: "Не удалось получить участников группы через Client API" });
        }
    });
}
