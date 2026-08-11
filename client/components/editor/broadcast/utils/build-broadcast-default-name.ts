/**
 * @fileoverview Автоназвание рассылки из даты и начала текста сообщения
 * @module client/components/editor/broadcast/utils/build-broadcast-default-name
 */

/** Месяцы кратко для подписи даты */
const MONTHS_SHORT_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

/** Максимальная длина фрагмента текста в автоназвании */
const SNIPPET_MAX = 48;

/**
 * Убирает HTML и сжимает пробелы до читаемого plain-текста
 * @param html - HTML-текст сообщения рассылки
 * @returns Текст без тегов
 */
function stripBroadcastHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Форматирует момент времени как «12 авг, 01:48»
 * @param date - Дата создания (по умолчанию сейчас)
 * @returns Короткая русская дата со временем
 */
function formatBroadcastNameTimestamp(date: Date = new Date()): string {
  const day = date.getDate();
  const month = MONTHS_SHORT_RU[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hours}:${minutes}`;
}

/**
 * Собирает автоназвание: «12 авг, 01:48 · Привет! Скидка…»
 * @param messageText - HTML-текст сообщения
 * @param date - Момент для метки времени
 * @returns Название для UI / превью
 */
export function buildBroadcastDefaultName(messageText: string, date: Date = new Date()): string {
  const stamp = formatBroadcastNameTimestamp(date);
  const plain = stripBroadcastHtml(messageText);
  if (!plain) {
    return `Рассылка · ${stamp}`;
  }

  const snippet =
    plain.length > SNIPPET_MAX ? `${plain.slice(0, SNIPPET_MAX).trimEnd()}…` : plain;

  return `${stamp} · ${snippet}`;
}
