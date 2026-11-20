/**
 * @fileoverview Вызовы Telegram API для редактирования и удаления сообщений рассылки.
 */
import { getTelegramApiBaseUrl } from '../../../../utils/telegram-api-url';
import { fetchWithProxy } from '../../../../utils/telegram-proxy';

/** Параметры сохранения клавиатуры и типа сообщения при правке. */
export interface BroadcastMessageEditOptions {
  /** Сохранённая клавиатура; пустой массив явно снимает кнопки. */
  replyMarkup: { inline_keyboard: unknown[][] };
  /** У сообщения есть медиа с подписью вместо обычного текста. */
  hasMedia: boolean;
}

/** Подтверждённый ответ Telegram либо неизвестный результат запроса. */
export interface BroadcastMessageEditResult {
  /** Изменено, уже совпадает, отклонено Telegram или ответ не получен. */
  status: 'edited' | 'unchanged' | 'failed' | 'unknown';
  /** Описание отказа без токена и адреса запроса. */
  description?: string;
}

/**
 * Редактирует текст или подпись, явно сохраняя клавиатуру рассылки.
 * @param token - Токен бота
 * @param chatId - Идентификатор чата Telegram
 * @param messageId - Идентификатор сообщения Telegram
 * @param newText - Новый HTML-текст или подпись
 * @param options - Сохранённая клавиатура и тип сообщения
 * @returns Результат Telegram; сетевой сбой не объявляется отказом
 */
export async function editTelegramBroadcastMessage(
  token: string, chatId: string, messageId: number, newText: string,
  options: BroadcastMessageEditOptions,
): Promise<BroadcastMessageEditResult> {
  try {
    const method = options.hasMedia ? 'editMessageCaption' : 'editMessageText';
    const response = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, message_id: messageId,
        [options.hasMedia ? 'caption' : 'text']: newText,
        parse_mode: 'HTML', reply_markup: options.replyMarkup,
      }),
    });
    const json = await response.json() as { ok?: boolean; description?: string };
    if (json.ok === true) return { status: 'edited' };
    if (json.ok !== false) return { status: 'unknown', description: 'Telegram вернул некорректный ответ' };
    if (/message is not modified/i.test(json.description ?? '')) return { status: 'unchanged' };
    return { status: 'failed', description: json.description ?? 'Telegram отклонил редактирование' };
  } catch {
    return { status: 'unknown', description: 'Не удалось получить ответ Telegram' };
  }
}

/**
 * Удаляет сообщение рассылки в Telegram.
 * @param token - Токен бота
 * @param chatId - Идентификатор чата Telegram
 * @param messageId - Идентификатор сообщения Telegram
 * @returns Завершение попытки удаления
 */
export async function deleteTelegramBroadcastMessage(token: string, chatId: string, messageId: number): Promise<void> {
  try {
    await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${token}/deleteMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch {
    console.warn(`[deleteBroadcast] Не удалось удалить ${messageId} у ${chatId}`);
  }
}

/**
 * Ограничивает частоту массовых правок примерно до 25 запросов в секунду.
 * @param resultsLength - Число получателей
 * @returns Завершение паузы
 */
export async function throttleBroadcastTelegramOps(resultsLength: number): Promise<void> {
  if (resultsLength > 25) await new Promise((resolve) => setTimeout(resolve, 40));
}
