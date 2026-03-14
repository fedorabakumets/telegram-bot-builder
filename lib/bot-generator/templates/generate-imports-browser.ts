/**
 * @fileoverview Генерация импортов для браузера
 * 
 * Browser-совместимая версия без использования Node.js API
 * Использует конкатенацию строк вместо шаблонов
 * 
 * @module bot-generator/templates/generate-imports-browser
 */

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
 * Генерирует все Python импорты для бота (browser версия)
 * 
 * @param options - Опции генерации
 * @returns Строка со всеми импортами
 */
export function generateImportsBrowser(options: ImportsOptions = {}): string {
  const {
    userDatabaseEnabled = false,
    hasInlineButtons = false,
    hasAutoTransitions = false,
    hasMediaNodes = false,
    hasUploadImages = false,
  } = options;

  let code = '';

  // Основные импорты Python
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'import signal\n';
  code += 'from datetime import datetime\n';
  code += '\n';

  // Основные импорты aiogram
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.types import (\n';
  code += '    KeyboardButton,\n';
  code += '    InlineKeyboardButton,\n';
  code += '    InlineKeyboardMarkup,\n';
  code += '    BotCommand,\n';
  code += '    ReplyKeyboardRemove,\n';
  code += '    FSInputFile\n';
  code += ')\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
  code += 'from typing import Optional\n';
  code += '\n';

  // Загрузка .env
  code += 'from dotenv import load_dotenv\n';
  code += '\n';

  // Фильтры и команды
  code += 'from aiogram.filters import CommandStart\n';
  code += '\n';

  // Импорты для работы с БД
  if (userDatabaseEnabled) {
    code += 'import asyncpg\n';
    code += 'import json\n';
    code += '\n';
  }

  // Импорты для обработки ошибок inline кнопок и автопереходов
  if (hasInlineButtons || hasAutoTransitions) {
    code += 'from aiogram.exceptions import TelegramBadRequest\n';
    code += '\n';
  }

  // Импорты для работы с медиа и HTTP запросами
  if (hasMediaNodes || hasUploadImages) {
    code += 'import aiohttp\n';
    code += 'from aiohttp import TCPConnector\n';
    code += '\n';
  }

  // Модуль re для работы с регулярными выражениями
  code += 'import re\n';
  code += '\n';

  return code;
}
