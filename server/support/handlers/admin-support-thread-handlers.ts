/**
 * @fileoverview Хендлеры одного диалога поддержки в админке
 * @module server/support/handlers/admin-support-thread-handlers
 */

import type { Request, Response } from "express";
import { telegramUsers } from "@shared/schema";
import type { AdminSupportThreadResponse } from "@shared/support/support.types";
import { eq } from "drizzle-orm";
import { db } from "../../database/db";
import { toSupportThreadDto, toSupportUserProfile } from "../support-dto";
import { withSupportAttachments } from "../support-attachments-repo";
import { listThreadMessages } from "../support-messages-repo";
import { findThreadById, markThreadRead, setThreadStatus } from "../support-threads-repo";
import {
  notifySupportRead,
  notifySupportSafe,
  notifySupportStatus,
} from "../notify-support-change";
import { adminSupportStatusSchema, parseSupportId } from "../support-validation";

/**
 * Разбирает идентификатор диалога из маршрута или отвечает 400
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Идентификатор или null, если ответ уже отправлен
 */
export function requireThreadId(req: Request, res: Response): number | null {
  const threadId = parseSupportId(req.params.id);
  if (threadId == null) res.status(400).json({ error: "Неверный идентификатор диалога" });
  return threadId;
}

/**
 * GET /admin/api/support/threads/:id — диалог, автор и сообщения
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetAdminSupportThread(req: Request, res: Response): Promise<void> {
  const threadId = requireThreadId(req, res);
  if (threadId == null) return;

  try {
    const thread = await findThreadById(threadId);
    const [user] = thread
      ? await db.select().from(telegramUsers).where(eq(telegramUsers.id, thread.userId))
      : [];
    if (!thread || !user) {
      res.status(404).json({ error: "Диалог не найден" });
      return;
    }
    const messages = await withSupportAttachments(await listThreadMessages(threadId));
    const body: AdminSupportThreadResponse = {
      thread: toSupportThreadDto(thread),
      user: toSupportUserProfile(user),
      messages,
    };
    res.json(body);
  } catch (err) {
    console.error(`[support] Ошибка загрузки диалога #${threadId}:`, err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

/**
 * POST /admin/api/support/threads/:id/read — отметить прочитанным
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handlePostAdminSupportRead(req: Request, res: Response): Promise<void> {
  const threadId = requireThreadId(req, res);
  if (threadId == null) return;

  try {
    const thread = await markThreadRead(threadId, "admin");
    if (!thread) {
      res.status(404).json({ error: "Диалог не найден" });
      return;
    }
    res.json(toSupportThreadDto(thread));
    notifySupportSafe(notifySupportRead(thread, "admin"));
  } catch (err) {
    console.error(`[support] Ошибка отметки прочтения #${threadId}:`, err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

/**
 * PATCH /admin/api/support/threads/:id — смена статуса диалога
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handlePatchAdminSupportThread(req: Request, res: Response): Promise<void> {
  const threadId = requireThreadId(req, res);
  if (threadId == null) return;

  const parsed = adminSupportStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Статус должен быть open или closed" });
    return;
  }

  try {
    const thread = await setThreadStatus(threadId, parsed.data.status);
    if (!thread) {
      res.status(404).json({ error: "Диалог не найден" });
      return;
    }
    res.json(toSupportThreadDto(thread));
    notifySupportSafe(notifySupportStatus(thread));
  } catch (err) {
    console.error(`[support] Ошибка смены статуса #${threadId}:`, err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}
