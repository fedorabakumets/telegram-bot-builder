/**
 * @fileoverview Хендлер списка Telegram-групп проекта (с фильтром по токену)
 * @module botIntegration/handlers/groups/getGroupsHandler
 */

import type { Request, Response } from "express";
import type { BotGroup } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";

/**
 * Собирает группы токена: bot_groups + чаты из bot_messages без строки справочника
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Массив групп для пикера
 */
async function listGroupsForToken(projectId: number, tokenId: number): Promise<BotGroup[]> {
  const fromTable = await storage.getBotGroupsByProject(projectId, tokenId);
  const known = new Set(fromTable.map((g) => g.groupId).filter(Boolean) as string[]);
  const fromMessages = await storage.listGroupChatsFromMessages(projectId, tokenId);
  const extras: BotGroup[] = [];

  for (const chat of fromMessages) {
    if (known.has(chat.groupId)) continue;
    extras.push({
      id: -extras.length - 1,
      projectId,
      tokenId,
      groupId: chat.groupId,
      name: chat.nameHint,
      url: "",
      isAdmin: 0,
      memberCount: null,
      isActive: 1,
      description: null,
      settings: {},
      avatarUrl: null,
      chatType: chat.chatType,
      inviteLink: null,
      adminRights: {},
      messagesCount: 0,
      activeUsers: 0,
      lastActivity: null,
      isPublic: 0,
      language: "ru",
      timezone: null,
      tags: [],
      notes: null,
      createdAt: null,
      updatedAt: null,
    } as BotGroup);
  }

  return [...fromTable, ...extras];
}

/**
 * Возвращает группы проекта. С `tokenId` — только группы этого бота (+ из messages).
 * @param req - Запрос
 * @param res - Ответ
 * @returns Promise<void>
 */
export async function getGroupsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id ?? req.params.projectId, 10);

    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const tokenId = getRequestTokenId(req);
    if (tokenId != null) {
      res.json(await listGroupsForToken(projectId, tokenId));
      return;
    }

    res.json(await storage.getBotGroupsByProject(projectId));
  } catch (error) {
    console.error("Ошибка получения групп:", error);
    res.status(500).json({ message: "Не удалось получить группы" });
  }
}
