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
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { getBotDataHandler, getAvatarHandler } from "./botIntegration/handlers/botData";
import { getTelegramFileHandler } from "./botIntegration/handlers/botData/getTelegramFileHandler";
import { getProjectFilesHandler, addProjectFileHandler, deleteProjectFilesHandler } from "./botIntegration/handlers/botData/getProjectFilesHandler";
import { getMessagesHandler, sendMessageHandler, sendNodeMessageHandler, saveMessageHandler, deleteMessagesHandler, deleteSingleMessageHandler, editSingleMessageHandler, getGroupMessagesHandler } from "./botIntegration/handlers/messages";
import { getGroupsHandler, createGroupHandler, updateGroupHandler, deleteGroupHandler, syncGroupHandler } from "./botIntegration/handlers/groups";
import { getBotInfoHandler, updateBotNameHandler, updateBotDescriptionHandler, updateBotShortDescriptionHandler } from "./botIntegration/handlers/botInfo";
import { sendGroupMessageHandler, getGroupInfoHandler, getGroupMembersCountHandler, getBotAdminStatusHandler, getGroupAdminsHandler, getGroupMembersHandler, getSavedMembersHandler } from "./botIntegration/handlers/telegramGroups";
import { checkMemberHandler, banMemberHandler, unbanMemberHandler, promoteMemberHandler, demoteMemberHandler } from "./botIntegration/groups/members";
import { searchUserHandler } from "./botIntegration/user";
import { restrictMemberHandler } from "./botIntegration/groups/members";
import { setGroupPhotoHandler, setGroupTitleHandler, setGroupDescriptionHandler, setGroupUsernameHandler } from "./botIntegration/groups/settings";
import { pinMessageHandler, unpinMessageHandler, createInviteLinkHandler, deleteMessageHandler } from "./botIntegration/groups/moderation";
import { telegramSettingsHandler, groupMembersHandler } from "./botIntegration/telegram";
import { createBroadcastHandler, getBroadcastsHandler, getBroadcastDetailHandler, stopBroadcastHandler, previewAudienceHandler, deleteBroadcastHandler, editBroadcastHandler } from "./botIntegration/handlers/broadcasts";

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
    app.get("/api/projects/:projectId/bot/data", requireProjectAccess, getBotDataHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/users/:userId/avatar
     *
     * Возвращает аватарку пользователя через прокси (скрывает токен бота)
     *
     * @route GET /api/projects/:projectId/users/:userId/avatar
     */
    app.get("/api/projects/:projectId/users/:userId/avatar", requireProjectAccess, getAvatarHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/telegram-file
     *
     * Проксирует файл из Telegram CDN, скрывая токен бота от клиента.
     * Используется для отображения входящих фото в диалоге.
     *
     * @route GET /api/projects/:projectId/telegram-file?fileId=...
     */
    app.get("/api/projects/:projectId/telegram-file", requireProjectAccess, getTelegramFileHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/files
     *
     * Возвращает файлы проекта из разных источников (incoming/outgoing/uploaded)
     * с поддержкой фильтрации по типу медиа и пагинации.
     *
     * @route GET /api/projects/:projectId/files?source=incoming|outgoing|uploaded
     */
    app.get("/api/projects/:projectId/files", requireProjectAccess, getProjectFilesHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/files
     *
     * Добавляет file_id вручную в файловое хранилище проекта.
     * Создаёт запись в media_files с маппингом tokenId → file_id.
     *
     * @route POST /api/projects/:projectId/files
     */
    app.post("/api/projects/:projectId/files", requireProjectAccess, addProjectFileHandler);

    /**
     * Обработчик маршрута DELETE /api/projects/:projectId/files
     *
     * Массовое удаление файлов проекта.
     * Для uploaded — удаляет записи из media_files и физические файлы.
     * Для incoming/outgoing — удаляет записи из bot_messages.
     *
     * @route DELETE /api/projects/:projectId/files
     */
    app.delete("/api/projects/:projectId/files", requireProjectAccess, deleteProjectFilesHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/users/:userId/messages
     *
     * Возвращает сообщения пользователя для указанного проекта
     *
     * @route GET /api/projects/:projectId/users/:userId/messages
     */
    app.get("/api/projects/:projectId/users/:userId/messages", requireProjectAccess, getMessagesHandler);

    /**
     * Обработчик маршрута GET /api/projects/:projectId/groups/:groupId/messages
     *
     * Возвращает все сообщения группового чата по Telegram chat_id
     *
     * @route GET /api/projects/:projectId/groups/:groupId/messages
     */
    app.get("/api/projects/:projectId/groups/:groupId/messages", requireProjectAccess, getGroupMessagesHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/users/:userId/send-message
     *
     * Отправляет сообщение пользователю от имени администратора
     *
     * @route POST /api/projects/:projectId/users/:userId/send-message
     */
    app.post("/api/projects/:projectId/users/:userId/send-message", requireProjectAccess, sendMessageHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/users/:userId/send-node-message
     *
     * Отправляет сообщение от узла проекта с поддержкой медиа, кнопок и переменных
     *
     * @route POST /api/projects/:projectId/users/:userId/send-node-message
     */
    app.post("/api/projects/:projectId/users/:userId/send-node-message", requireProjectAccess, sendNodeMessageHandler);

    /**
     * Обработчик маршрута POST /api/projects/:projectId/messages
     *
     * Сохраняет сообщение от бота в базу данных
     *
     * @route POST /api/projects/:projectId/messages
     */
    app.post("/api/projects/:projectId/messages", requireProjectAccess, saveMessageHandler);

    /**
     * Обработчик маршрута DELETE /api/projects/:projectId/users/:userId/messages
     *
     * Удаляет историю сообщений пользователя
     *
     * @route DELETE /api/projects/:projectId/users/:userId/messages
     */
    app.delete("/api/projects/:projectId/users/:userId/messages", requireProjectAccess, deleteMessagesHandler);

    /**
     * Удаление одного сообщения из диалога
     *
     * @route DELETE /api/projects/:projectId/messages/:messageId
     */
    app.delete("/api/projects/:projectId/messages/:messageId", requireProjectAccess, deleteSingleMessageHandler);

    /**
     * Редактирование одного сообщения бота в диалоге
     *
     * @route PATCH /api/projects/:projectId/messages/:messageId
     */
    app.patch("/api/projects/:projectId/messages/:messageId", requireProjectAccess, editSingleMessageHandler);

    // API групп ботов
    app.get("/api/projects/:id/groups", requireProjectAccess, getGroupsHandler);
    app.post("/api/projects/:id/groups", requireProjectAccess, createGroupHandler);
    app.put("/api/projects/:projectId/groups/:groupId", requireProjectAccess, updateGroupHandler);
    app.delete("/api/projects/:projectId/groups/:groupId", requireProjectAccess, deleteGroupHandler);

    /**
     * Синхронизация названия и аватарки группы из Telegram
     * @route POST /api/projects/:projectId/groups/:groupId/sync
     */
    app.post("/api/projects/:projectId/groups/:groupId/sync", requireProjectAccess, syncGroupHandler);

    // Получение информации о боте (getMe)
    app.get("/api/projects/:id/bot/info", requireProjectAccess, getBotInfoHandler);

    // Обновление имени бота
    app.put("/api/projects/:id/bot/name", requireProjectAccess, updateBotNameHandler);

    // Обновление описания бота
    app.put("/api/projects/:id/bot/description", requireProjectAccess, updateBotDescriptionHandler);

    // Обновление краткого описания бота
    app.put("/api/projects/:id/bot/short-description", requireProjectAccess, updateBotShortDescriptionHandler);

    // Интеграция Telegram Bot API для групп
    app.post("/api/projects/:projectId/bot/send-group-message", requireProjectAccess, sendGroupMessageHandler);
    app.get("/api/projects/:projectId/bot/group-info/:groupId", requireProjectAccess, getGroupInfoHandler);
    app.get("/api/projects/:projectId/bot/group-members-count/:groupId", requireProjectAccess, getGroupMembersCountHandler);
    app.get("/api/projects/:projectId/bot/admin-status/:groupId", requireProjectAccess, getBotAdminStatusHandler);
    app.get("/api/projects/:projectId/bot/group-admins/:groupId", requireProjectAccess, getGroupAdminsHandler);
    app.get("/api/projects/:projectId/bot/group-members/:groupId", requireProjectAccess, getGroupMembersHandler);
    app.get("/api/projects/:projectId/bot/check-member/:groupId/:userId", requireProjectAccess, checkMemberHandler);
    app.get("/api/projects/:projectId/groups/:groupId/saved-members", requireProjectAccess, getSavedMembersHandler);
    app.post("/api/projects/:projectId/bot/ban-member", requireProjectAccess, banMemberHandler);
    app.post("/api/projects/:projectId/bot/unban-member", requireProjectAccess, unbanMemberHandler);
    app.post("/api/projects/:projectId/bot/promote-member", requireProjectAccess, promoteMemberHandler);
    app.post("/api/projects/:projectId/bot/demote-member", requireProjectAccess, demoteMemberHandler);

    // Поиск пользователя по username или ID для повышения
    app.get("/api/projects/:projectId/bot/search-user/:query", requireProjectAccess, searchUserHandler);

    // Ограничение участника группы
    app.post("/api/projects/:projectId/bot/restrict-member", requireProjectAccess, restrictMemberHandler);

    // Установка фото группы через Bot API
    app.post("/api/projects/:projectId/bot/set-group-photo", requireProjectAccess, setGroupPhotoHandler);

    // Установка названия группы
    app.post("/api/projects/:projectId/bot/set-group-title", requireProjectAccess, setGroupTitleHandler);

    // Установка описания группы
    app.post("/api/projects/:projectId/bot/set-group-description", requireProjectAccess, setGroupDescriptionHandler);

    // Установка username группы (сделать публичной/приватной)
    app.post("/api/projects/:projectId/bot/set-group-username", requireProjectAccess, setGroupUsernameHandler);

    // Закрепление сообщения в группе
    app.post("/api/projects/:projectId/bot/pin-message", requireProjectAccess, pinMessageHandler);

    // Открепление сообщения в группе
    app.post("/api/projects/:projectId/bot/unpin-message", requireProjectAccess, unpinMessageHandler);

    // Создание новой ссылки-приглашения для группы
    app.post("/api/projects/:projectId/bot/create-invite-link", requireProjectAccess, createInviteLinkHandler);

    // Удаление сообщения в группе
    app.post("/api/projects/:projectId/bot/delete-message", requireProjectAccess, deleteMessageHandler);

    // Конечные точки Telegram Client API
    // Сохранение данных Telegram API пользователя
    app.post("/api/telegram-settings", telegramSettingsHandler);

    // Получение участников группы через Telegram Client API (общая база)
    app.get("/api/telegram-client/group-members/:groupId", groupMembersHandler);

    // Рассылки
    app.get("/api/projects/:projectId/broadcasts", requireProjectAccess, getBroadcastsHandler);
    app.post("/api/projects/:projectId/broadcasts", requireProjectAccess, createBroadcastHandler);
    app.post("/api/projects/:projectId/broadcasts/preview-audience", requireProjectAccess, previewAudienceHandler);
    app.get("/api/projects/:projectId/broadcasts/:broadcastId", requireProjectAccess, getBroadcastDetailHandler);
    app.post("/api/projects/:projectId/broadcasts/:broadcastId/stop", requireProjectAccess, stopBroadcastHandler);
    app.put("/api/projects/:projectId/broadcasts/:broadcastId", requireProjectAccess, editBroadcastHandler);
    app.delete("/api/projects/:projectId/broadcasts/:broadcastId", requireProjectAccess, deleteBroadcastHandler);
}
