/**
 * @fileoverview Генерация заголовка файла через шаблоны
 * 
 * Генерирует ТОЛЬКО UTF-8 кодировку (без импортов)
 * Использует Nunjucks шаблоны вместо конкатенации строк
 * 
 * @module bot-generator/templates/generate-header
 */

import { renderPartialTemplate } from './template-renderer';

/**
 * Опции для генерации заголовка (параметры не используются, оставлены для совместимости API)
 */
export interface HeaderOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
  /** Есть ли узлы с медиа */
  hasMediaNodes?: boolean;
}

/**
 * Генерирует UTF-8 кодировку для Python файла
 * 
 * @param _options - Опции генерации (не используются, оставлены для совместимости API)
 * @returns Строка с UTF-8 кодировкой
 * 
 * @example
 * const header = generateHeader();
 */
export function generateHeader(_options: HeaderOptions = {}): string {
  return renderPartialTemplate('header.py.jinja2', {});
}
