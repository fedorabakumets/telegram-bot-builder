/**
 * @fileoverview Генерация заголовка файла через шаблоны
 * 
 * Использует Nunjucks шаблоны вместо конкатенации строк
 * 
 * @module bot-generator/templates/generate-header
 */

import { renderPartialTemplate } from './template-renderer.js';

/**
 * Опции для генерации заголовка
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
 * Генерирует UTF-8 кодировку и базовые импорты
 * 
 * @param options - Опции генерации
 * @returns Строка с кодом заголовка
 * 
 * @example
 * const header = generateHeader({ userDatabaseEnabled: true });
 */
export function generateHeader(options: HeaderOptions = {}): string {
  return renderPartialTemplate('partials/header.py.jinja2', {
    userDatabaseEnabled: options.userDatabaseEnabled ?? false,
    hasInlineButtons: options.hasInlineButtons ?? false,
    hasMediaNodes: options.hasMediaNodes ?? false,
  });
}
