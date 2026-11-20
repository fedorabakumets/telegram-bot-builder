/**
 * @fileoverview Чистое построение безопасного плана восстановления истории рассылки.
 */
import { isDeepStrictEqual } from 'node:util';

/** Группирует записи по получателю, не раскрывая его в отчёте. */
function group(rows) {
  const grouped = new Map();
  for (const row of rows) grouped.set(row.user_id, [...(grouped.get(row.user_id) ?? []), row]);
  return grouped;
}

/**
 * Восстанавливает только отсутствующие поля при однозначном соответствии.
 * @param broadcast - Задание рассылки в выбранной области.
 * @param messages - История только выбранного проекта, бота и рассылки.
 * @param results - Все результаты выбранной рассылки, включая неуспешные.
 * @returns План изменений и обезличенные счётчики причин пропуска.
 */
export function planBackfill(broadcast, messages, results) {
  const history = group(messages);
  const deliveries = group(results);
  const changes = [];
  const skipped = {};
  /** Учитывает причину пропуска без идентификатора получателя. */
  const skip = reason => { skipped[reason] = (skipped[reason] ?? 0) + 1; };
  for (const message of messages) {
    const candidates = deliveries.get(message.user_id) ?? [];
    if (history.get(message.user_id).length !== 1 || candidates.length !== 1) {
      skip('ambiguous'); continue;
    }
    const result = candidates[0];
    const data = message.message_data;
    if (result.status !== 'sent' || !Number.isSafeInteger(result.telegram_message_id) || result.telegram_message_id <= 0) {
      skip('delivery_unconfirmed'); continue;
    }
    if (!data || Array.isArray(data) || data.sentFromBroadcast !== true ||
        String(data.broadcastId) !== String(broadcast.id) || message.message_type !== 'bot' ||
        message.message_text !== broadcast.message_text ||
        (message.chat_id && message.chat_id !== message.user_id)) {
      skip('history_mismatch'); continue;
    }
    if (message.telegram_message_id != null && message.telegram_message_id !== result.telegram_message_id) {
      skip('existing_id_conflict'); continue;
    }
    const buttons = broadcast.buttons ?? [];
    const perRow = broadcast.buttons_per_row ?? 0;
    if (!Array.isArray(buttons) || !Number.isInteger(perRow) || perRow < 0 ||
        (data.buttons != null && !isDeepStrictEqual(data.buttons, buttons)) ||
        (data.buttonsPerRow != null && data.buttonsPerRow !== perRow)) {
      skip('keyboard_conflict'); continue;
    }
    const nextData = { ...data };
    if (data.buttons == null && buttons.length) nextData.buttons = buttons;
    if (data.buttonsPerRow == null) nextData.buttonsPerRow = perRow;
    if (message.telegram_message_id != null && isDeepStrictEqual(data, nextData)) {
      skip('already_complete'); continue;
    }
    changes.push({ id: message.id, telegramMessageId: result.telegram_message_id, messageData: nextData });
  }
  return { changes, skipped };
}
