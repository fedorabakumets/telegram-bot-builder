/**
 * @fileoverview Личное уведомление пользователю об ответе поддержки в Telegram
 * @module server/support/notify-support-telegram
 */

import type { SupportMessageDto } from "@shared/support/support.types";
import { getSetting } from "../services/app-settings.service";
import { getStorageRegistry } from "../storage/storage-registry";
import { fetchWithProxy } from "../utils/telegram-proxy";
import { listMessageAttachmentFiles } from "./support-attachments-repo";

/** Ответ Bot API без полезной нагрузки */
interface TelegramApiResult {
  /** Успех вызова */
  ok?: boolean;
  /** Код ошибки Telegram */
  error_code?: number;
  /** Описание ошибки */
  description?: string;
}

/**
 * Экранирует текст для HTML-разметки Telegram
 * @param value - Исходный текст
 * @returns Безопасная строка
 */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Адрес диалога на сайте. Кнопка Telegram принимает только https,
 * поэтому http-адрес (в том числе localhost) пишется отдельной строкой.
 * @param siteBase - Публичный адрес сайта без слэша в конце
 * @returns Абсолютный URL или null
 */
function supportDialogUrl(siteBase: string): string | null {
  const base = siteBase.trim().replace(/\/$/, "");
  if (!base) return null;
  return `${base}/?support=1`;
}

/**
 * Собирает текст уведомления: заголовок, цитата ответа и при необходимости ссылка
 * @param replyText - Текст ответа администратора
 * @param dialogUrl - Адрес диалога
 * @param linkInText - Вставить ссылку в текст, а не в кнопку
 * @returns HTML для sendMessage
 */
function buildReplyNotice(replyText: string, dialogUrl: string | null, linkInText: boolean): string {
  const parts = ["Администратор вам ответил"];
  const quote = replyText.trim();
  if (quote) parts.push(`<blockquote>${escapeHtml(quote)}</blockquote>`);
  if (linkInText && dialogUrl) {
    parts.push(`Перейти в диалог на сайте\n${escapeHtml(dialogUrl)}`);
  }
  return parts.join("\n");
}
/**
 * Собирает поток хранилища в буфер
 * @param stream - Поток объекта
 * @returns Содержимое файла
 */
export async function readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Вызывает метод Bot API и пишет ошибку в лог, не бросая её наружу
 * @param token - Токен служебного бота
 * @param method - Метод, например sendMessage
 * @param userId - Получатель
 * @param init - Тело запроса
 */
export async function callTelegram(
  token: string,
  method: string,
  userId: number,
  init: RequestInit,
): Promise<void> {
  const response = await fetchWithProxy(`https://api.telegram.org/bot${token}/${method}`, init);
  const data = (await response.json()) as TelegramApiResult;
  if (data.ok) return;
  console.warn(
    `[support-tg] Не отправлено пользователю ${userId}: ${data.error_code ?? response.status} ${data.description ?? ""}`.trim(),
  );
}

/**
 * Отправляет ответ администратора в личку. Ошибка Telegram не должна всплывать.
 * @param userId - Telegram ID автора диалога
 * @param message - Сохранённый ответ
 * @param siteBase - Адрес сайта, с которого открывается диалог
 */
export async function notifyUserAboutSupportReply(
  userId: number,
  message: SupportMessageDto,
  siteBase: string,
): Promise<void> {
  const token = await getSetting("support_bot_token");
  if (!token) return;

  const dialogUrl = supportDialogUrl(siteBase);
  const linkInText = !dialogUrl?.startsWith("https://");
  const payload: Record<string, unknown> = {
    chat_id: userId,
    text: buildReplyNotice(message.text, dialogUrl, linkInText),
    parse_mode: "HTML",
  };
  if (dialogUrl?.startsWith("https://")) {
    payload.reply_markup = {
      inline_keyboard: [[{ text: "Перейти в диалог на сайте", url: dialogUrl }]],
    };
  }
  await callTelegram(token, "sendMessage", userId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const files = await listMessageAttachmentFiles(message.id);
  for (const file of files) {
    const stream = await getStorageRegistry().resolveBackend(file.storageConfigId).get(file.storageKey);
    const bytes = await readStream(stream);
    const form = new FormData();
    form.append("chat_id", String(userId));
    form.append("photo", new Blob([bytes], { type: file.mime }), file.fileName);
    await callTelegram(token, "sendPhoto", userId, { method: "POST", body: form });
  }
}
