/**
 * @fileoverview Проверка, что Telegram-группа относится к проекту
 * @module botIntegration/utils/assert-project-group
 */

import type { Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Группа «своя» для проекта: есть в `bot_groups` или уже есть сообщения с этим chat_id.
 * Нужно, чтобы диалог не ломался, пока `sync` ещё не создал запись.
 * @param projectId - ID проекта
 * @param groupId - Telegram chat_id
 * @param res - Ответ (пишет 404 при отказе)
 * @returns true если доступ разрешён
 */
export async function assertProjectGroup(
  projectId: number,
  groupId: string,
  res: Response,
): Promise<boolean> {
  const linked = await storage.getBotGroupByProjectAndGroupId(projectId, groupId);
  if (linked) return true;

  const existing = await storage.getGroupChatMessages(projectId, groupId, 1, null);
  if (existing.length > 0) return true;

  res.status(404).json({ message: "Группа не найдена в проекте" });
  return false;
}
