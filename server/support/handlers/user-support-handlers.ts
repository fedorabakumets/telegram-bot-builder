/**
 * @fileoverview Хендлеры чата поддержки со стороны пользователя конструктора
 * @module server/support/handlers/user-support-handlers
 */

import type { Request, Response } from "express";
import type { UserSupportThreadResponse } from "@shared/support/support.types";
import { getSetting } from "../../services/app-settings.service";
import { getOwnerIdFromRequest } from "../../telegram/auth-middleware";
import { toSupportThreadDto } from "../support-dto";
import { withSupportAttachments } from "../support-attachments-repo";
import { listThreadMessages } from "../support-messages-repo";
import { findThreadByUser, getOrCreateThread, markThreadRead } from "../support-threads-repo";
import { readSupportMessageForm } from "../support-message-form";
import { saveSupportMessageWithFiles, SupportMessageError } from "../save-support-message";
import { notifyAdminAboutUserMessage } from "../notify-admin-support-telegram";
import { notifySupportMessage, notifySupportRead, notifySupportSafe } from "../notify-support-change";

/**
 * Адрес сайта для ссылки в уведомлении администратору
 * @param req - Запрос пользователя
 * @returns Базовый URL без завершающего слэша
 */
function supportSiteBase(req: Request): string {
  const fromEnv = process.env.API_BASE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  const host = (req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return host ? `${proto}://${host}` : "";
}

/**
 * Возвращает идентификатор текущего пользователя или отвечает 401
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Идентификатор или null, если ответ уже отправлен
 */
function requireUserId(req: Request, res: Response): number | null {
  const userId = getOwnerIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Требуется авторизация через Telegram" });
    return null;
  }
  return userId;
}

/**
 * GET /api/support/thread — свой диалог и сообщения
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetUserSupportThread(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  try {
    const thread = await findThreadByUser(userId);
    const messages = thread ? await withSupportAttachments(await listThreadMessages(thread.id)) : [];
    const username = await getSetting("support_bot_username");
    const body: UserSupportThreadResponse = {
      thread: thread ? toSupportThreadDto(thread) : null,
      messages,
      telegramBot: username?.replace(/^@/, "") || null,
    };
    res.json(body);
  } catch (err) {
    console.error(`[support] Ошибка загрузки диалога ${userId}:`, err);
    res.status(500).json({ error: "Не удалось загрузить чат поддержки" });
  }
}

/**
 * POST /api/support/messages — отправка сообщения в поддержку
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handlePostUserSupportMessage(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  const form = readSupportMessageForm(req, true);
  if ("error" in form) {
    res.status(400).json({ error: form.error });
    return;
  }

  try {
    const thread = await getOrCreateThread(userId);
    const message = await saveSupportMessageWithFiles({
      threadId: thread.id,
      sender: "user",
      text: form.text,
      context: form.context ?? null,
      files: form.files,
    });
    res.status(201).json(message);
    notifySupportSafe(notifySupportMessage(thread.id, message));
    notifySupportSafe(notifyAdminAboutUserMessage(userId, thread.id, message, supportSiteBase(req)));
  } catch (err) {
    if (err instanceof SupportMessageError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(`[support] Ошибка отправки сообщения ${userId}:`, err);
    res.status(500).json({ error: "Не удалось отправить сообщение" });
  }
}

/**
 * POST /api/support/read — отметить ответы поддержки прочитанными
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handlePostUserSupportRead(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  try {
    const thread = await findThreadByUser(userId);
    if (thread) {
      const updated = await markThreadRead(thread.id, "user");
      if (updated) notifySupportSafe(notifySupportRead(updated, "user"));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(`[support] Ошибка отметки прочтения ${userId}:`, err);
    res.status(500).json({ error: "Не удалось обновить чат" });
  }
}
