/**
 * Функция для добавления UTF-8 кодировки и базовых импортов в начало Python-файла
 * @returns Строка с кодом для установки UTF-8 кодировки и импортами
 */
export function generateUtf8EncodingCode(): string {
  let code = '';

  // Добавляем UTF-8 кодировку в начало файла
  code += '# -*- coding: utf-8 -*-\n';
  code += 'import os\n';
  code += 'import sys\n';
  code += '\n';
  code += '# Устанавливаем UTF-8 кодировку для вывода\n';
  code += 'if sys.platform.startswith("win"):\n';
  code += '    # Для Windows устанавливаем UTF-8 кодировку\n';
  code += '    os.environ["PYTHONIOENCODING"] = "utf-8"\n';
  code += '    try:\n';
  code += '        import codecs\n';
  code += '        sys.stdout.reconfigure(encoding="utf-8")\n';
  code += '        sys.stderr.reconfigure(encoding="utf-8")\n';
  code += '    except (AttributeError, UnicodeError):\n';
  code += '        # Fallback для старых версий Python\n';
  code += '        import codecs\n';
  code += '        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())\n';
  code += '        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())\n';
  code += '\n';
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'import signal\n';
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
  code += 'from aiogram.enums import ParseMode\n';
  code += 'from typing import Optional\n';
  code += 'import asyncpg\n';
  code += 'import json\n';
  code += 'import aiohttp\n';
  code += 'from aiohttp import TCPConnector\n\n';

  return code;
}
