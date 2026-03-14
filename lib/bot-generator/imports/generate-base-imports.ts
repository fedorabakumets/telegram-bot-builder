/**
 * @fileoverview Генерация базовых импортов для бота
 *
 * Модуль создаёт обязательные импорты, необходимые для работы любого бота:
 * - asyncio для асинхронной работы
 * - Bot и Dispatcher из aiogram
 * - logging для логирования
 * - signal для обработки сигналов ОС
 *
 * @module bot-generator/imports/generate-base-imports
 */

/** Параметры для генерации базовых импортов */
export interface BaseImportGeneratorOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
}

/**
 * Генерирует базовые импорты для Telegram бота
 *
 * @param options - Параметры генерации
 * @returns {string} Python код базовых импортов
 *
 * @example
 * // Без опций
 * generateBaseImports({})
 * // Вернёт:
 * // import asyncio
 * // import logging
 * // import signal
 * // from aiogram import Bot, Dispatcher, types, F
 *
 * @example
 * // С базой данных
 * generateBaseImports({ userDatabaseEnabled: true })
 * // Добавит: import os
 */
export function generateBaseImports(options: BaseImportGeneratorOptions = {}): string {
  const { userDatabaseEnabled = false, hasInlineButtons = false } = options;

  let imports = '';

  // Базовые импорты - всегда нужны
  imports += 'import asyncio\n';
  imports += 'import logging\n';
  imports += 'import signal\n';
  imports += '\n';

  // Основные импорты aiogram
  imports += 'from aiogram import Bot, Dispatcher, types, F\n';

  // Дополнительные импорты для базы данных
  if (userDatabaseEnabled) {
    imports += 'import os\n';
  }

  // Дополнительные импорты для inline кнопок
  if (hasInlineButtons) {
    imports += 'from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton\n';
  }

  imports += '\n';

  return imports;
}
