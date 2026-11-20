/** @fileoverview Извлечение только обычных HTTP-ссылок из сохранённого сообщения. */

/** Проверяет схему и исключает служебные адреса с учётными данными. @param value - Возможная ссылка. @returns Безопасный адрес либо null. */
export function safeProfileLink(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.hostname.toLowerCase() === 'api.telegram.org' || /bot\d{5,}[:%]/i.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

/** Извлекает адреса из текста, текстовых сущностей и кнопок без раскрытия остальных метаданных. @param text - Текст сообщения. @param value - Метаданные сообщения. @returns Уникальные ссылки. */
export function extractProfileLinks(text: unknown, value: unknown): string[] {
  const candidates: unknown[] = typeof text === 'string' ? (text.match(/https?:\/\/[^\s<>"']+/gi) ?? []).map(link => link.replace(/[),.;!?]+$/, '')) : [];
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  for (const key of ['entities', 'caption_entities']) {
    if (Array.isArray(data[key])) for (const entity of data[key]) {
      if (entity && typeof entity === 'object' && entity.type === 'text_link') candidates.push(entity.url);
    }
  }
  const markup = data.reply_markup as { inline_keyboard?: unknown } | undefined;
  if (Array.isArray(markup?.inline_keyboard)) for (const row of markup.inline_keyboard) {
    if (Array.isArray(row)) for (const button of row) if (button && typeof button === 'object') candidates.push(button.url);
  }
  return [...new Set(candidates.map(safeProfileLink).filter((url): url is string => !!url))].slice(0, 30);
}
