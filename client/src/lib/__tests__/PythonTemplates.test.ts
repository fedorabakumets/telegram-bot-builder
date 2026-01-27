import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PythonTemplates, pythonTemplates } from '../Templates/PythonTemplates';

describe('PythonTemplates', () => {
  let templates: PythonTemplates;

  beforeEach(() => {
    templates = new PythonTemplates();
  });

  afterEach(() => {
    // Очищаем кэш после каждого теста
    templates.clearCache();
  });

  describe('кэширование', () => {
    it('должен кэшировать шаблоны', () => {
      expect(templates.getCacheSize()).toBe(0);
      
      // Первый вызов - создает кэш
      const template1 = templates.getEncodingTemplate();
      expect(templates.getCacheSize()).toBe(1);
      
      // Второй вызов - использует кэш
      const template2 = templates.getEncodingTemplate();
      expect(templates.getCacheSize()).toBe(1);
      expect(template1).toBe(template2);
    });

    it('должен очищать кэш', () => {
      templates.getEncodingTemplate();
      templates.getImportsTemplate();
      expect(templates.getCacheSize()).toBe(2);
      
      templates.clearCache();
      expect(templates.getCacheSize()).toBe(0);
    });

    it('должен кэшировать разные типы шаблонов отдельно', () => {
      templates.getEncodingTemplate();
      templates.getImportsTemplate();
      templates.getBotInitTemplate();
      
      expect(templates.getCacheSize()).toBe(3);
    });
  });

  describe('getEncodingTemplate', () => {
    it('должен возвращать корректный шаблон кодировки UTF-8', () => {
      const template = templates.getEncodingTemplate();
      
      expect(template).toContain('# -*- coding: utf-8 -*-');
      expect(template).toContain('import os');
      expect(template).toContain('import sys');
      expect(template).toContain('PYTHONIOENCODING');
      expect(template).toContain('sys.stdout.reconfigure(encoding="utf-8")');
      expect(template).toContain('sys.stderr.reconfigure(encoding="utf-8")');
      expect(template).toContain('if sys.platform.startswith("win"):');
      expect(template).toContain('except (AttributeError, UnicodeError):');
    });

    it('должен включать fallback для старых версий Python', () => {
      const template = templates.getEncodingTemplate();
      
      expect(template).toContain('codecs.getwriter("utf-8")');
      expect(template).toContain('sys.stdout.detach()');
      expect(template).toContain('sys.stderr.detach()');
    });
  });

  describe('getImportsTemplate', () => {
    it('должен возвращать все необходимые импорты', () => {
      const template = templates.getImportsTemplate();
      
      // Базовые импорты
      expect(template).toContain('import asyncio');
      expect(template).toContain('import logging');
      expect(template).toContain('import signal');
      expect(template).toContain('import locale');
      
      // Aiogram импорты
      expect(template).toContain('from aiogram import Bot, Dispatcher, types, F');
      expect(template).toContain('from aiogram.filters import CommandStart, Command');
      expect(template).toContain('from aiogram.exceptions import TelegramBadRequest');
      expect(template).toContain('from aiogram.types import ReplyKeyboardMarkup');
      expect(template).toContain('from aiogram.utils.keyboard import ReplyKeyboardBuilder');
      expect(template).toContain('from aiogram.enums import ParseMode');
      
      // Дополнительные импорты
      expect(template).toContain('from typing import Optional');
      expect(template).toContain('from datetime import datetime, timezone, timedelta');
      expect(template).toContain('import json');
      expect(template).toContain('import aiohttp');
      expect(template).toContain('from aiohttp import TCPConnector');
    });
  });

  describe('getBotInitTemplate', () => {
    it('должен возвращать корректный шаблон инициализации бота', () => {
      const template = templates.getBotInitTemplate();
      
      expect(template).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(template).toContain('logging.basicConfig(');
      expect(template).toContain('level=logging.INFO');
      expect(template).toContain('bot = Bot(token=BOT_TOKEN)');
      expect(template).toContain('dp = Dispatcher()');
    });

    it('должен включать настройку логирования с UTF-8', () => {
      const template = templates.getBotInitTemplate();
      
      expect(template).toContain('logging.StreamHandler(sys.stdout)');
      expect(template).toContain('format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"');
    });
  });

  describe('getMainFunctionTemplate', () => {
    it('должен возвращать корректный шаблон основной функции', () => {
      const template = templates.getMainFunctionTemplate();
      
      expect(template).toContain('async def main():');
      expect(template).toContain('await bot.set_my_commands(commands)');
      expect(template).toContain('await dp.start_polling(bot)');
      expect(template).toContain('await bot.session.close()');
      expect(template).toContain('if __name__ == "__main__":');
      expect(template).toContain('asyncio.run(main())');
    });

    it('должен включать обработку ошибок', () => {
      const template = templates.getMainFunctionTemplate();
      
      expect(template).toContain('try:');
      expect(template).toContain('except Exception as e:');
      expect(template).toContain('except KeyboardInterrupt:');
      expect(template).toContain('finally:');
    });

    it('должен включать установку команд бота', () => {
      const template = templates.getMainFunctionTemplate();
      
      expect(template).toContain('commands = [');
      expect(template).toContain('BotCommand(command="start", description="Запустить бота")');
    });
  });

  describe('getHandlerTemplate', () => {
    it('должен возвращать шаблон для команды', () => {
      const template = templates.getHandlerTemplate('command');
      
      expect(template).toContain('@dp.message(Command("{command}"))');
      expect(template).toContain('async def handle_{command}_command');
      expect(template).toContain('message: types.Message');
      expect(template).toContain('await message.answer("{response_text}")');
    });

    it('должен возвращать шаблон для callback', () => {
      const template = templates.getHandlerTemplate('callback');
      
      expect(template).toContain('@dp.callback_query(lambda c: c.data == "{callback_data}")');
      expect(template).toContain('async def handle_callback_{callback_name}');
      expect(template).toContain('callback_query: types.CallbackQuery');
      expect(template).toContain('await callback_query.answer()');
      expect(template).toContain('await callback_query.message.edit_text');
    });

    it('должен возвращать шаблон для сообщения', () => {
      const template = templates.getHandlerTemplate('message');
      
      expect(template).toContain('@dp.message(F.text == "{trigger_text}")');
      expect(template).toContain('async def handle_message_{message_name}');
      expect(template).toContain('message: types.Message');
    });

    it('должен возвращать шаблон для медиа', () => {
      const template = templates.getHandlerTemplate('media');
      
      expect(template).toContain('@dp.message(F.{media_type})');
      expect(template).toContain('async def handle_{media_type}_message');
      expect(template).toContain('message: types.Message');
    });

    it('должен возвращать комментарий для неизвестного типа', () => {
      const template = templates.getHandlerTemplate('unknown_type');
      
      expect(template).toContain('# Неизвестный тип обработчика: unknown_type');
    });

    it('должен кэшировать шаблоны обработчиков по типу', () => {
      const template1 = templates.getHandlerTemplate('command');
      const template2 = templates.getHandlerTemplate('command');
      const template3 = templates.getHandlerTemplate('callback');
      
      expect(template1).toBe(template2);
      expect(template1).not.toBe(template3);
      expect(templates.getCacheSize()).toBe(2); // command и callback
    });
  });

  describe('getSaveMessageTemplate', () => {
    it('должен возвращать корректный шаблон функции сохранения', () => {
      const template = templates.getSaveMessageTemplate();
      
      expect(template).toContain('async def save_message_to_api');
      expect(template).toContain('user_id: str, message_type: str');
      expect(template).toContain('API_BASE_URL');
      expect(template).toContain('PROJECT_ID');
      expect(template).toContain('aiohttp.ClientSession');
      expect(template).toContain('session.post(api_url, json=payload');
    });

    it('должен включать обработку SSL для локальных подключений', () => {
      const template = templates.getSaveMessageTemplate();
      
      expect(template).toContain('ssl_context = None');
      expect(template).toContain('if "localhost" in api_url or "127.0.0.1" in api_url:');
      expect(template).toContain('ssl_context = False');
      expect(template).toContain('TCPConnector(ssl=ssl_context)');
    });

    it('должен включать обработку ошибок', () => {
      const template = templates.getSaveMessageTemplate();
      
      expect(template).toContain('try:');
      expect(template).toContain('except Exception as e:');
      expect(template).toContain('logging.error');
    });
  });

  describe('getMiddlewareTemplate', () => {
    it('должен возвращать шаблон middleware для сообщений', () => {
      const template = templates.getMiddlewareTemplate();
      
      expect(template).toContain('async def message_logging_middleware');
      expect(template).toContain('handler, event: types.Message, data: dict');
      expect(template).toContain('return await handler(event, data)');
    });

    it('должен включать middleware для callback query', () => {
      const template = templates.getMiddlewareTemplate();
      
      expect(template).toContain('async def callback_query_logging_middleware');
      expect(template).toContain('handler, event: types.CallbackQuery, data: dict');
    });

    it('должен включать обработку фото', () => {
      const template = templates.getMiddlewareTemplate();
      
      expect(template).toContain('if event.photo:');
      expect(template).toContain('largest_photo = event.photo[-1]');
      expect(template).toContain('photo_file_id = largest_photo.file_id');
    });

    it('должен включать регистрацию медиа', () => {
      const template = templates.getMiddlewareTemplate();
      
      expect(template).toContain('register-telegram-photo');
      expect(template).toContain('media_payload = {');
      expect(template).toContain('"messageId": saved_message["id"]');
    });
  });

  describe('getSafeEditOrSendTemplate', () => {
    it('должен возвращать корректный шаблон safe_edit_or_send', () => {
      const template = templates.getSafeEditOrSendTemplate();
      
      expect(template).toContain('async def safe_edit_or_send');
      expect(template).toContain('cbq, text, node_id=None, is_auto_transition=False');
      expect(template).toContain('if is_auto_transition:');
      expect(template).toContain('await cbq.edit_text(text, **kwargs)');
      expect(template).toContain('await cbq.message.answer(text, **kwargs)');
    });

    it('должен включать обработку автопереходов', () => {
      const template = templates.getSafeEditOrSendTemplate();
      
      expect(template).toContain('При автопереходе сразу отправляет новое сообщение');
      expect(template).toContain('logging.info(f"⚡ Автопереход:');
    });

    it('должен включать fallback логику', () => {
      const template = templates.getSafeEditOrSendTemplate();
      
      expect(template).toContain('except Exception as e:');
      expect(template).toContain('logging.warning(f"Не удалось отредактировать сообщение');
    });
  });

  describe('getUtilityFunctionsTemplate', () => {
    it('должен возвращать утилитарные функции', () => {
      const template = templates.getUtilityFunctionsTemplate();
      
      expect(template).toContain('async def is_admin(user_id: int) -> bool:');
      expect(template).toContain('async def is_private_chat(message: types.Message) -> bool:');
      expect(template).toContain('def format_user_info(user: types.User) -> str:');
      expect(template).toContain('def escape_markdown(text: str) -> str:');
    });

    it('должен включать функцию проверки администратора', () => {
      const template = templates.getUtilityFunctionsTemplate();
      
      expect(template).toContain('return user_id in ADMIN_IDS');
    });

    it('должен включать функцию экранирования Markdown', () => {
      const template = templates.getUtilityFunctionsTemplate();
      
      expect(template).toContain('escape_chars = [');
      expect(template).toContain('text.replace(char, f\'\\\\{char}\')');
    });
  });

  describe('глобальный экземпляр pythonTemplates', () => {
    it('должен быть доступен как глобальный экземпляр', () => {
      expect(pythonTemplates).toBeInstanceOf(PythonTemplates);
    });

    it('должен работать с кэшированием', () => {
      pythonTemplates.clearCache();
      expect(pythonTemplates.getCacheSize()).toBe(0);
      
      pythonTemplates.getEncodingTemplate();
      expect(pythonTemplates.getCacheSize()).toBe(1);
    });
  });
});