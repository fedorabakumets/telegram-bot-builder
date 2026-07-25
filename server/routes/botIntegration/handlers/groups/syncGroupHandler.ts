/**
 * @fileoverview Хендлер синхронизации данных группы из Telegram
 * Получает актуальное название и аватарку группы через getChat и обновляет bot_groups
 * @module botIntegration/handlers/groups/syncGroupHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
  getRequestTokenId,
  resolveProjectBotToken,
} from "../../../utils/resolve-request-token";

/**
 * Синхронизирует название и аватарку группы из Telegram Bot API
 * Вызывает getChat по groupId, сохраняет title и photo в bot_groups
 *
 * @param req - Объект запроса (params: projectId, groupId; query: tokenId)
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

    const requestedTokenId = getRequestTokenId(req);
    const botToken = await resolveProjectBotToken(projectId, requestedTokenId);
    if (!botToken?.token) {
      res.status(400).json({ message: "Токен бота не найден" });
      return;
    }

    const chatResponse = await fetchWithProxy(
      `https://api.telegram.org/bot${botToken.token}/getChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramGroupId }),
      },
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

    // file_id привязан к боту — кладём tokenId в URL прокси
    let avatarUrl: string | null = null;
    if (chatInfo.photo?.big_file_id) {
      const tokenQs = botToken.id ? `&tokenId=${botToken.id}` : "";
      avatarUrl =
        `/api/projects/${projectId}/telegram-file` +
        `?fileId=${encodeURIComponent(chatInfo.photo.big_file_id)}${tokenQs}`;
    }

    const existingGroup = await storage.getBotGroupByProjectAndGroupId(
      projectId,
      telegramGroupId,
    );

    if (existingGroup) {
      const updated = await storage.updateBotGroup(existingGroup.id, {
        name: title,
        avatarUrl,
        chatType,
        updatedAt: new Date(),
      });
      res.json({ synced: true, group: updated });
    } else {
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
