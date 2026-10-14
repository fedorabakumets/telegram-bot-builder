/** @fileoverview Публичное отображение истории без произвольных внутренних данных и секретных URL. */

/**
 * Извлекает только известные метаданные Telegram из сохранённого сообщения.
 * @param value - Сохранённые дополнительные данные
 * @returns Список метаданных вложений без токенов и сетевых URL
 */
export function mapTelegramMedia(value: unknown) {
  if (!value || typeof value !== 'object') return [];
  const data = value as Record<string, unknown>;
  return ['photo', 'video', 'animation', 'audio', 'voice', 'document', 'sticker', 'video_note'].flatMap(type => {
    const raw = data[type];
    const item = type === 'photo' && Array.isArray(raw) ? raw.at(-1) : raw;
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const source = item as Record<string, unknown>;
    const fields = Object.fromEntries(['file_id', 'file_unique_id', 'file_name', 'mime_type',
      'file_size', 'width', 'height', 'duration', 'is_animated', 'is_video'].flatMap(key => {
      const field = source[key];
      return ['string', 'number', 'boolean'].includes(typeof field) ? [[key, field]] : [];
    }));
    return Object.keys(fields).length ? [{ type, ...fields }] : [];
  });
}

/**
 * Преобразует строку SQL в публичное сообщение MCP/API.
 * @param row - Строка выбранного сообщения
 * @returns Текст, источник, время и безопасные метаданные медиа
 */
export function mapDialogMessage(row: Record<string, unknown>) {
  return { id: row.id, user_id: row.user_id, chat_id: row.chat_id, chat_type: row.chat_type,
    source_chat_title: row.source_chat_title ?? null, message_type: row.message_type,
    direction: row.message_type === 'user' ? 'incoming' : 'outgoing',
    message_text: row.message_text ?? null, telegram_message_id: row.telegram_message_id ?? null,
    created_at: row.created_at ? new Date(row.created_at as string).toISOString() : null,
    media: row.media ?? [], telegram_media: mapTelegramMedia(row.message_data) };
}
