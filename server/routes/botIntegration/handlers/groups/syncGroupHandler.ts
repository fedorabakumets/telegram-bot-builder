/**
 * @fileoverview Синхронизация группы из Telegram с привязкой к token_id
 * @module botIntegration/handlers/groups/syncGroupHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { saveChatAccess } from '../../../dialogs/access-store';
import {
  getRequestTokenId,
  resolveProjectBotToken,
} from "../../../utils/resolve-request-token";

/**
 * Синхронизирует название и аватарку группы; пишет token_id бота
 * @param req - Запрос (params: projectId, groupId; query: tokenId)
 * @param res - Ответ
 * @returns Promise<void>
 */
export async function syncGroupHandler(req: Request, res: Response): Promise<void> {
  let selected: {
    /** Проект проверяемой группы. */
    projectId: number;
    /** Бот, выполняющий проверку. */
    tokenId: number;
    /** Идентификатор группы. */
    chatId: string;
  } | undefined;
  try {
    const projectId = parseInt(req.params.projectId);
    const telegramGroupId = req.params.groupId;

    if (isNaN(projectId) || !telegramGroupId) {
      res.status(400).json({ message: "Неверный ID проекта или группы" });
      return;
    }

    const requestedTokenId = getRequestTokenId(req);
    const rawTokenId = req.query.tokenId ?? req.body?.tokenId;
    if (rawTokenId != null && requestedTokenId == null) {
      res.status(400).json({ message: 'Некорректный токен бота' }); return;
    }
    const botToken = requestedTokenId != null
      ? await storage.getBotToken(requestedTokenId)
      : await resolveProjectBotToken(projectId, null);
    if (botToken && botToken.projectId !== projectId) {
      res.status(404).json({ message: 'Бот не найден в проекте' }); return;
    }
    if (!botToken?.token) {
      res.status(400).json({ message: "Токен бота не найден" });
      return;
    }

    selected = { projectId, tokenId: botToken.id, chatId: telegramGroupId };

    const chatResponse = await fetchWithProxy(
      `https://api.telegram.org/bot${botToken.token}/getChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramGroupId }),
        signal: AbortSignal.timeout(12_000),
      },
    );

    const chatResult = await chatResponse.json();
    if (!chatResponse.ok || !chatResult.ok) {
      const status = /\bbot was kicked\b/i.test(String(chatResult.description ?? '')) ? 'kicked' : 'error';
      const access = await saveChatAccess(projectId, botToken.id, telegramGroupId, status);
      res.status(400).json({
        message: "Не удалось получить данные группы из Telegram",
        error: chatResult.description,
        ...access,
      });
      return;
    }

    const chatInfo = chatResult.result;
    const title: string = chatInfo.title || chatInfo.first_name || telegramGroupId;
    const chatType: string = chatInfo.type || "group";
    const tokenId = botToken.id;

    let avatarUrl: string | null = null;
    if (chatInfo.photo?.big_file_id) {
      const tokenQs = tokenId ? `&tokenId=${tokenId}` : "";
      avatarUrl =
        `/api/projects/${projectId}/telegram-file` +
        `?fileId=${encodeURIComponent(chatInfo.photo.big_file_id)}${tokenQs}`;
    }

    const existingGroup = await storage.getBotGroupByProjectAndGroupId(
      projectId,
      telegramGroupId,
      tokenId,
    );

    if (existingGroup) {
      const updated = await storage.updateBotGroup(existingGroup.id, {
        name: title,
        avatarUrl,
        chatType,
        tokenId,
        updatedAt: new Date(),
      });
      const access = await saveChatAccess(projectId, tokenId, telegramGroupId, 'available');
      res.json({ synced: true, group: updated, ...access });
      return;
    }

    const created = await storage.createBotGroup({
      projectId,
      tokenId,
      groupId: telegramGroupId,
      name: title,
      url: chatInfo.username ? `https://t.me/${chatInfo.username}` : "",
      avatarUrl,
      chatType,
      isActive: 1,
    });
    const access = await saveChatAccess(projectId, tokenId, telegramGroupId, 'available');
    res.json({ synced: true, group: created, ...access });
  } catch (error) {
    const access = selected
      ? await saveChatAccess(selected.projectId, selected.tokenId, selected.chatId, 'error').catch(() => undefined)
      : undefined;
    console.error("Ошибка синхронизации группы:", error);
    res.status(500).json({ message: "Не удалось синхронизировать группу", ...access });
  }
}
