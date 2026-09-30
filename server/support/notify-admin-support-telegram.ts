/**
 * @fileoverview Уведомление администратору в Telegram о сообщении пользователя
 * @module server/support/notify-admin-support-telegram
 */

import { eq } from "drizzle-orm";
import { telegramUsers } from "@shared/schema";
import type { SupportMessageDto } from "@shared/support/support.types";
import { db } from "../database/db";
import { getSetting } from "../services/app-settings.service";
import { getStorageRegistry } from "../storage/storage-registry";
import { listMessageAttachmentFiles } from "./support-attachments-repo";
import { callTelegram, escapeHtml, readStream } from "./notify-support-telegram";

/** Уже писали в лог, что список администраторов пуст */
let missingAdminsWarned = false;

/**
 * Telegram ID администраторов: сначала env, затем app_settings
 * @returns Уникальные положительные id
 */
async function listAdminChatIds(): Promise<number[]> {
  const fromEnv = process.env.SUPPORT_ADMIN_CHAT_IDS?.trim();
  const raw = fromEnv || (await getSetting("support_admin_chat_ids")) || "";
  const ids = new Set<number>();
  for (const part of raw.split(/[,\s]+/)) {
    const id = Number(part);
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }
  return [...ids];
}

/**
 * Имя автора для шапки уведомления
 * @param userId - Telegram ID пользователя
 * @returns Имя, username или сам id
 */
async function authorLabel(userId: number): Promise<string> {
  const rows = await db
    .select({
      firstName: telegramUsers.firstName,
      lastName: telegramUsers.lastName,
      username: telegramUsers.username,
    })
    .from(telegramUsers)
    .where(eq(telegramUsers.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return String(userId);
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ");
  const handle = row.username ? ` @${row.username.replace(/^@/, "")}` : "";
  return `${name}${handle}`.trim() || String(userId);
}

/**
 * Адрес диалога в админке. Кнопка Telegram принимает только https.
 * @param siteBase - Адрес сайта без слэша в конце
 * @param threadId - Диалог
 * @returns Абсолютный URL или null
 */
function adminDialogUrl(siteBase: string, threadId: number): string | null {
  const base = siteBase.trim().replace(/\/$/, "");
  if (!base) return null;
  return `${base}/admin/support/${threadId}`;
}

/**
 * Текст уведомления: кто написал, цитата и ссылка в админку
 * @param label - Имя пользователя
 * @param replyText - Текст сообщения
 * @param dialogUrl - Адрес диалога
 * @param linkInText - Писать URL строкой, а не кнопкой
 * @returns HTML для sendMessage
 */
function buildAdminNotice(
  label: string,
  replyText: string,
  dialogUrl: string | null,
  linkInText: boolean,
): string {
  const parts = ["Пользователь написал в поддержку", escapeHtml(label)];
  const quote = replyText.trim();
  if (quote) parts.push(`<blockquote>${escapeHtml(quote)}</blockquote>`);
  if (linkInText && dialogUrl) {
    parts.push(`Открыть диалог в админке\n${escapeHtml(dialogUrl)}`);
  }
  return parts.join("\n");
}

/**
 * Шлёт сообщение пользователя каждому администратору. Ошибка Telegram не всплывает.
 * @param userId - Автор сообщения
 * @param threadId - Диалог
 * @param message - Сохранённое сообщение
 * @param siteBase - Адрес сайта
 */
export async function notifyAdminAboutUserMessage(
  userId: number,
  threadId: number,
  message: SupportMessageDto,
  siteBase: string,
): Promise<void> {
  const token = await getSetting("support_bot_token");
  if (!token) return;

  const admins = await listAdminChatIds();
  if (admins.length === 0) {
    if (!missingAdminsWarned) {
      missingAdminsWarned = true;
      console.warn("[support-tg] SUPPORT_ADMIN_CHAT_IDS не задан, уведомление администратору пропущено");
    }
    return;
  }

  const dialogUrl = adminDialogUrl(siteBase, threadId);
  const linkInText = !dialogUrl?.startsWith("https://");
  const text = buildAdminNotice(await authorLabel(userId), message.text, dialogUrl, linkInText);
  const payload: Record<string, unknown> = { text, parse_mode: "HTML" };
  if (dialogUrl?.startsWith("https://")) {
    payload.reply_markup = {
      inline_keyboard: [[{ text: "Открыть диалог в админке", url: dialogUrl }]],
    };
  }

  const files = await listMessageAttachmentFiles(message.id);
  for (const adminId of admins) {
    await callTelegram(token, "sendMessage", adminId, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, chat_id: adminId }),
    });
    for (const file of files) {
      const stream = await getStorageRegistry().resolveBackend(file.storageConfigId).get(file.storageKey);
      const bytes = await readStream(stream);
      const form = new FormData();
      form.append("chat_id", String(adminId));
      form.append("photo", new Blob([bytes], { type: file.mime }), file.fileName);
      await callTelegram(token, "sendPhoto", adminId, { method: "POST", body: form });
    }
  }
}
