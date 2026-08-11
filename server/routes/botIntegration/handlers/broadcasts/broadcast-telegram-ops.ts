/**
 * @fileoverview Вызовы Telegram API для edit/delete сообщений рассылки
 * @module botIntegration/handlers/broadcasts/broadcast-telegram-ops
 */

import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Редактирует текст сообщения рассылки в Telegram
 * @param token - Токен бота
 * @param chatId - Telegram chat_id / user_id
 * @param messageId - ID сообщения в Telegram
 * @param newText - Новый HTML-текст
 * @returns true при успехе
 */
export async function editTelegramBroadcastMessage(
  token: string,
  chatId: string,
  messageId: number,
  newText: string,
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${token}/editMessageText`;
    const response = await fetchWithProxy(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "HTML",
      }),
    });
    const json = (await response.json()) as { ok?: boolean };
    return json.ok === true;
  } catch (err) {
    console.warn(`[editBroadcast] Не удалось отредактировать ${messageId} у ${chatId}:`, err);
    return false;
  }
}

/**
 * Удаляет сообщение рассылки в Telegram (ошибки глотаются)
 * @param token - Токен бота
 * @param chatId - Telegram chat_id / user_id
 * @param messageId - ID сообщения в Telegram
 * @returns void
 */
export async function deleteTelegramBroadcastMessage(
  token: string,
  chatId: string,
  messageId: number,
): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${token}/deleteMessage`;
    await fetchWithProxy(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch (err) {
    console.warn(`[deleteBroadcast] Не удалось удалить ${messageId} у ${chatId}:`, err);
  }
}

/**
 * Пауза throttle ~25 req/s при массовых правках
 * @param resultsLength - Число получателей
 * @returns void
 */
export async function throttleBroadcastTelegramOps(resultsLength: number): Promise<void> {
  if (resultsLength > 25) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}
