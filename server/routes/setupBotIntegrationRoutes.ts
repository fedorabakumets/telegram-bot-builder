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
import { sendGroupMessageHandler, getGroupInfoHandler, getGroupMembersCountHandler, getBotAdminStatusHandler, getGroupAdminsHandler, getGroupMembersHandler, getSavedMembersHandler } from "./botIntegration/handlers/telegramGroups";
import { checkMemberHandler, banMemberHandler, unbanMemberHandler, promoteMemberHandler, demoteMemberHandler } from "./botIntegration/groups/members";
import { searchUserHandler } from "./botIntegration/user";
import { restrictMemberHandler } from "./botIntegration/groups/members";
import { setGroupPhotoHandler, setGroupTitleHandler, setGroupDescriptionHandler, setGroupUsernameHandler } from "./botIntegration/groups/settings";
import { pinMessageHandler, unpinMessageHandler, createInviteLinkHandler, deleteMessageHandler } from "./botIntegration/groups/moderation";
import { telegramSettingsHandler, groupMembersHandler } from "./botIntegration/telegram";

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
    app.post("/api/projects/:projectId/bot/restrict-member", restrictMemberHandler);

    // Установка фото группы через Bot API
    app.post("/api/projects/:projectId/bot/set-group-photo", setGroupPhotoHandler);

    // Установка названия группы
    app.post("/api/projects/:projectId/bot/set-group-title", setGroupTitleHandler);

    // Установка описания группы
    app.post("/api/projects/:projectId/bot/set-group-description", setGroupDescriptionHandler);

    // Установка username группы (сделать публичной/приватной)
    app.post("/api/projects/:projectId/bot/set-group-username", setGroupUsernameHandler);

    // Закрепление сообщения в группе
    app.post("/api/projects/:projectId/bot/pin-message", pinMessageHandler);

    // Открепление сообщения в группе
    app.post("/api/projects/:projectId/bot/unpin-message", unpinMessageHandler);

    // Создание новой ссылки-приглашения для группы
    app.post("/api/projects/:projectId/bot/create-invite-link", createInviteLinkHandler);

    // Удаление сообщения в группе
    app.post("/api/projects/:projectId/bot/delete-message", deleteMessageHandler);

    // Конечные точки Telegram Client API
    // Сохранение данных Telegram API пользователя
    app.post("/api/telegram-settings", telegramSettingsHandler);

    // Получение участников группы через Telegram Client API (общая база)
    app.get("/api/telegram-client/group-members/:groupId", groupMembersHandler);
}
