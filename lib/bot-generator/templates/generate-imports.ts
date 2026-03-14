/**
 * @fileoverview Генерация всех импортов через шаблоны
 * 
 * Использует Nunjucks шаблоны вместо конкатенации строк
 * Заменяет generatePythonImports() и импорты из generateUtf8EncodingCode()
 * 
 * @module bot-generator/templates/generate-imports
 */

import { renderPartialTemplate } from './template-renderer.js';

/**
 * Опции для генерации импортов
 */
export interface ImportsOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
  /** Есть ли автопереходы */
  hasAutoTransitions?: boolean;
  /** Есть ли узлы с медиа */
  hasMediaNodes?: boolean;
  /** Есть ли ссылки на /uploads/ */
  hasUploadImages?: boolean;
}

/**
 * Генерирует все Python импорты для бота
 * 
 * Включает:
 * - Базовые импорты (asyncio, logging, signal)
 * - Aiogram импорты (Bot, Dispatcher, types, F)
 * - Типы клавиатур (KeyboardButton, InlineKeyboardButton, etc.)
 * - Утилиты (ReplyKeyboardBuilder, InlineKeyboardBuilder)
 * - Загрузку .env (load_dotenv)
 * - Фильтры и команды (CommandStart)
 * - Дату и время (datetime)
 * - Условные импорты (asyncpg, json, TelegramBadRequest, aiohttp)
 * - Регулярные выражения (re)
 * 
 * @param options - Опции генерации
 * @returns Строка со всеми импортами
 * 
 * @example
 * const imports = generateImports({ userDatabaseEnabled: true, hasInlineButtons: true });
 */
export function generateImports(options: ImportsOptions = {}): string {
  return renderPartialTemplate('partials/imports.py.jinja2', {
    userDatabaseEnabled: options.userDatabaseEnabled ?? false,
    hasInlineButtons: options.hasInlineButtons ?? false,
    hasAutoTransitions: options.hasAutoTransitions ?? false,
    hasMediaNodes: options.hasMediaNodes ?? false,
    hasUploadImages: options.hasUploadImages ?? false,
  });
}
