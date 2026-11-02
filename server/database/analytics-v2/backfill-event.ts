/** @fileoverview Безопасный перенос старой строки: личные сообщения без метки отделены от неизвестного происхождения. */
/** Строка истории; текст сообщения и произвольные данные не переносятся. */
export interface LegacyBackfillRow {
  /** Внутренний ID строки. */ id: number;
  /** Идентификатор отправителя. */ user_id: string | null;
  /** Сторона сообщения. */ message_type: string;
  /** Метаданные старого writer. */ message_data: Record<string, unknown> | null;
  /** Telegram ID сообщения. */ telegram_message_id: number | null;
  /** Тип чата. */ chat_type: string | null;
  /** Идентификатор чата. */ chat_id: string | null;
  /** Время сохранения. */ created_at: Date | null;
}
/**
 * Формирует минимальный факт либо безопасную причину пропуска.
 * @param row - Старая строка.
 * @param project - Проверенный проект.
 * @param token - Проверенный бот.
 * @returns Payload без содержимого переписки либо классифицированный пропуск.
 */
export function legacyBackfillEvent(row: LegacyBackfillRow, project: number, token: number) {
  const callback = row.message_type === 'user' && row.message_data?.button_clicked === true;
  const ids = [row.message_data?.callback_query_id, row.message_data?.callback_id].filter(value => value != null).map(String);
  if (callback && (!ids.length || ids.some(id => !/^[0-9]{1,30}$/.test(id)) || new Set(ids).size !== 1)) return { reason: 'callback_identity_missing' };
  const kind = row.message_type === 'user' ? callback ? 'callback' : 'message_in' : row.message_type === 'bot' ? 'message_out' : 'system';
  const timestamp = row.created_at ? new Date(row.created_at).getTime() : NaN;
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 300000) return { reason: 'invalid_timestamp' };
  if (kind === 'message_out' && !row.telegram_message_id) return { reason: 'outgoing_identity_missing' };
  const chatType = ['private', 'group', 'supergroup', 'channel'].includes(row.chat_type || '') ? row.chat_type : 'unknown';
  const chat = row.chat_id || (chatType === 'private' ? row.user_id : null);
  if (chat && !/^-?[0-9]{1,20}$/.test(chat)) return { reason: 'invalid_chat_identity' };
  const key = callback ? `cb:${ids[0]}` : row.telegram_message_id && chat && kind !== 'system'
    ? `${kind === 'message_out' ? 'msg_out' : 'msg'}:${chat}:${row.telegram_message_id}` : `backfill:${row.id}`;
  return { payload: { project_id: project, token_id: token, event_key: key, kind, user_id: row.user_id,
    chat_id: chat, chat_type: chatType, directed: kind === 'message_in' && chatType === 'private' || callback,
    occurred_at: new Date(timestamp).toISOString(), provenance: 'backfill', first_known: false,
    attribution_status: kind === 'message_in' && chatType === 'private' ? 'no_marker' : 'unknown', metadata: callback ? { button_label: row.message_data?.button_text } : {} } };
}
