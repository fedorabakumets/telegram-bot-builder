/**
 * @fileoverview Ответ администратора в чат поддержки, в том числе с картинками
 * @module server/support/handlers/post-admin-support-message
 */

import type { Request, Response } from "express";
import { notifySupportMessage, notifySupportRead, notifySupportSafe } from "../notify-support-change";
import { notifyUserAboutSupportReply } from "../notify-support-telegram";
import { readSupportMessageForm } from "../support-message-form";
import { saveSupportMessageWithFiles, SupportMessageError } from "../save-support-message";
import { findThreadById, markThreadRead } from "../support-threads-repo";
import { requireThreadId } from "./admin-support-thread-handlers";

/**
 * Адрес сайта для ссылки «Перейти в диалог»
 * @param req - Запрос администратора
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
 * POST /admin/api/support/threads/:id/messages — ответ пользователю
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function handlePostAdminSupportMessage(req: Request, res: Response): Promise<void> {
  const threadId = requireThreadId(req, res);
  if (threadId == null) return;

  const form = readSupportMessageForm(req, false);
  if ("error" in form) {
    res.status(400).json({ error: form.error });
    return;
  }

  try {
    const thread = await findThreadById(threadId);
    if (!thread) {
      res.status(404).json({ error: "Диалог не найден" });
      return;
    }
    const message = await saveSupportMessageWithFiles({
      threadId,
      sender: "admin",
      text: form.text,
      files: form.files,
    });
    const readThread = await markThreadRead(threadId, "admin");
    res.status(201).json(message);
    notifySupportSafe(notifySupportMessage(threadId, message));
    notifySupportSafe(notifyUserAboutSupportReply(thread.userId, message, supportSiteBase(req)));
    if (readThread) notifySupportSafe(notifySupportRead(readThread, "admin"));
  } catch (err) {
    if (err instanceof SupportMessageError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(`[support] Ошибка ответа в диалог #${threadId}:`, err);
    res.status(500).json({ error: "Не удалось отправить ответ" });
  }
}
