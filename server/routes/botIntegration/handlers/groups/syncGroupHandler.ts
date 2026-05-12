/**
 * @fileoverview Хендлер синхронизации данных группы из Telegram
 * Получает актуальное название и аватарку группы через getChat и обновляет bot_groups
 * @module botIntegration/handlers/groups/syncGroupHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Синхронизирует название и аватарку группы из Telegram Bot API
 * Вызывает getChat по groupId, сохраняет title и photo в bot_groups
 *
 * @param req - Объект запроса (params: projectId, groupId)
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function syncGroupHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const telegramGroupId = req.params.groupId;

        if (isNaN(projectId) || !telegramGroupId) {
            res.status(400).json({ message: "Неверный ID проекта или группы" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken?.token) {
            res.status(400).json({ message: "Токен бота не найден" });
            return;
        }

        // Получаем информацию о чате из Telegram
        const chatResponse = await fetchWithProxy(
            `https://api.telegram.org/bot${defaultToken.token}/getChat`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: telegramGroupId }),
            }
        );

        const chatResult = await chatResponse.json();
        if (!chatResponse.ok || !chatResult.ok) {
            res.status(400).json({
                message: "Не удалось получить данные группы из Telegram",
                error: chatResult.description,
            });
            return;
        }

        const chatInfo = chatResult.result;
        const title: string = chatInfo.title || chatInfo.first_name || telegramGroupId;
        const chatType: string = chatInfo.type || "group";

        // Получаем file_id аватарки если есть фото — сохраняем file_id, не прямой URL
        let avatarUrl: string | null = null;
        if (chatInfo.photo?.big_file_id) {
            // Проксируем через наш сервер — скрываем токен бота от клиента
            avatarUrl = `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(chatInfo.photo.big_file_id)}`;
        }

        // Ищем запись в bot_groups по telegramGroupId
        const existingGroup = await storage.getBotGroupByProjectAndGroupId(
            projectId,
            telegramGroupId
        );

        if (existingGroup) {
            // Обновляем существующую запись
            const updated = await storage.updateBotGroup(existingGroup.id, {
                name: title,
                avatarUrl,
                chatType,
                updatedAt: new Date(),
            });
            res.json({ synced: true, group: updated });
        } else {
            // Создаём новую запись если группа ещё не зарегистрирована
            const created = await storage.createBotGroup({
                projectId,
                groupId: telegramGroupId,
                name: title,
                url: chatInfo.username ? `https://t.me/${chatInfo.username}` : "",
                avatarUrl,
                chatType,
                isActive: 1,
            });
            res.json({ synced: true, group: created });
        }
    } catch (error) {
        console.error("Ошибка синхронизации группы:", error);
        res.status(500).json({ message: "Не удалось синхронизировать группу" });
    }
}
