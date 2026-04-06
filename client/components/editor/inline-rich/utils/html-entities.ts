/**
 * @fileoverview Утилита декодирования HTML-сущностей
 * @module utils/html-entities
 */

/**
 * Декодирует HTML-сущности в строке
 * @param str - Строка с HTML-сущностями
 * @returns Строка с заменёнными сущностями на символы
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
