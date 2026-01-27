import { GenerationContext, IImportsGenerator } from '../Core/types';
import { hasInlineButtons, hasAutoTransitions } from '../has';
import type { Node } from '../../../../shared/schema';

/**
 * Генератор импортов и настройки кодировки для Python файлов
 */
export class ImportsGenerator implements IImportsGenerator {
  /**
   * Генерирует настройку UTF-8 кодировки для Python файла
   */
  generateEncodingSetup(): string {
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
    
    return code;
  }

  /**
   * Генерирует импорты Python библиотек с учетом возможностей бота
   */
  generateImports(context: GenerationContext): string {
    let code = '';
    
    // Базовые импорты
    code += 'import asyncio\n';
    code += 'import logging\n';
    code += 'import signal\n';
    code += 'import locale\n';
    
    // Aiogram импорты
    code += 'from aiogram import Bot, Dispatcher, types, F\n';
    code += 'from aiogram.filters import CommandStart, Command\n';
    code += 'from aiogram.exceptions import TelegramBadRequest\n';
    code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile\n';
    code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
    code += 'from aiogram.enums import ParseMode\n';
    
    // Дополнительные импорты
    code += 'from typing import Optional\n';
    
    // Условные импорты в зависимости от возможностей бота
    if (context.userDatabaseEnabled) {
      code += 'import asyncpg\n';
    }
    
    code += 'from datetime import datetime, timezone, timedelta\n';
    code += 'import json\n';
    code += 'import aiohttp\n';
    code += 'from aiohttp import TCPConnector\n\n';
    
    return code;
  }

  /**
   * Генерирует BotFather команды для настройки меню
   * @param nodes Узлы бота для анализа команд
   * @returns Строка с командами для BotFather
   */
  generateBotFatherCommands(nodes: readonly Node[]): string {
    if (!nodes || !Array.isArray(nodes)) {
      return '';
    }
    
    const commandNodes = nodes.filter((node): node is Node => 
      ((node.type === 'start' || node.type === 'command' || 
        ['ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user'].includes(node.type)) && 
       node.data?.command &&
       (node.data?.showInMenu !== false)) // Включаем команды где showInMenu = true, undefined или не установлено
    );
    
    if (commandNodes.length === 0) {
      return '';
    }
    
    let botFatherCommands = '';
    
    commandNodes.forEach((node: Node) => {
      const command = node.data.command?.replace('/', '') ?? '';
      const description = node.data.description || node.data.text || 'Команда бота';
      botFatherCommands += `${command} - ${description}\n`;
    });
    
    return botFatherCommands.trim();
  }
}