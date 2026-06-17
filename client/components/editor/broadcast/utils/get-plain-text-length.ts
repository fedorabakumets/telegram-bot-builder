/**
 * @fileoverview Подсчёт длины текста без HTML-разметки
 * @description Аппроксимация лимита Telegram «после парсинга entities»
 */

/**
 * Возвращает длину видимого текста без HTML-тегов
 * @param html - HTML-текст сообщения
 * @returns Количество символов
 */
export function getPlainTextLength(html: string): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n/g, '')
    .length;
}
