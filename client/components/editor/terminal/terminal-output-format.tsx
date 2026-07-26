/**
 * @fileoverview Форматирование и подсветка строк вывода терминала
 * @module terminal/terminal-output-format
 */

import Ansi from 'ansi-to-react';

/**
 * Короткое время для колонки: HH:MM:SS
 * @param date - Дата
 * @returns Строка времени или пустая
 */
export function formatLogTime(date?: Date): string {
  if (!date) return '';
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Полная дата для tooltip колонки времени
 * @param date - Дата
 * @returns Строка или undefined
 */
export function formatLogTimeTitle(date?: Date): string | undefined {
  if (!date) return undefined;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Убирает дублирующийся timestamp `[HH:MM:SS]` из начала содержимого
 * @param content - Содержимое строки
 * @returns Содержимое без префикса
 */
export function stripLeadingTimestamp(content: string): string {
  return content.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '');
}

/** CSS grid колонок шапки и строк логов */
export const LOG_ROW_GRID =
  'grid grid-cols-[4.5rem_3.75rem_minmax(0,1fr)] gap-x-3 px-4';


/**
 * Подсвечивает совпадения поискового запроса в тексте
 * @param text - Исходный текст
 * @param query - Поисковый запрос
 * @param isCurrentMatch - Текущее совпадение
 * @returns React-элементы с подсветкой
 */
export function highlightLogMatches(text: string, query: string, isCurrentMatch: boolean) {
  if (!query) return <Ansi>{text}</Ansi>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  const markClass = isCurrentMatch
    ? 'bg-yellow-400/60 dark:bg-yellow-500/50 rounded-sm px-0.5'
    : 'bg-yellow-300/40 dark:bg-yellow-500/30 rounded-sm px-0.5';

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className={markClass}>{part}</mark>
    ) : (
      <Ansi key={i}>{part}</Ansi>
    ),
  );
}
