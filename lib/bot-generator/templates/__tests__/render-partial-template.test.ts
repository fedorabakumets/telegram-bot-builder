/**
 * @fileoverview Тесты для renderPartialTemplate
 * Проверяют корректность работы функции рендеринга шаблонов
 */

import { describe, it, expect } from 'vitest';
import { renderPartialTemplate } from '../template-renderer.js';

describe('renderPartialTemplate', () => {
  describe('Автоматическое добавление partials/', () => {
    it('должен автоматически добавлять "partials/" к имени шаблона', () => {
      // Шаблон без 'partials/' должен работать
      const result = renderPartialTemplate('header.py.jinja2', {});
      
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import os');
      expect(result).toContain('import sys');
    });

    it('должен работать с путями которые уже содержат "partials/"', () => {
      // Шаблон с 'partials/' тоже должен работать
      const result = renderPartialTemplate('partials/header.py.jinja2', {});
      
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import os');
      expect(result).toContain('import sys');
    });

    it('должен генерировать одинаковый код с "partials/" и без', () => {
      const resultWithoutPrefix = renderPartialTemplate('header.py.jinja2', {});
      const resultWithPrefix = renderPartialTemplate('partials/header.py.jinja2', {});
      
      expect(resultWithoutPrefix).toBe(resultWithPrefix);
    });
  });

  describe('Рендеринг различных шаблонов', () => {
    it('должен рендерить imports.py.jinja2', () => {
      const result = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });
      
      expect(result).toContain('import asyncio');
      expect(result).toContain('from aiogram import Bot, Dispatcher, types, F');
      expect(result).toContain('import re');
    });

    it('должен рендерить config.py.jinja2', () => {
      const result = renderPartialTemplate('config.py.jinja2', {
        userDatabaseEnabled: false,
        projectId: null,
      });
      
      expect(result).toContain('load_dotenv()');
      expect(result).toContain('BOT_TOKEN = os.getenv("BOT_TOKEN")');
      expect(result).toContain('bot = Bot(token=BOT_TOKEN)');
      expect(result).toContain('dp = Dispatcher()');
    });

    it('должен рендерить utils.py.jinja2', () => {
      const result = renderPartialTemplate('utils.py.jinja2', {
        userDatabaseEnabled: false,
      });
      
      expect(result).toContain('from aiogram import types');
      expect(result).toContain('async def is_admin(user_id: int) -> bool:');
      expect(result).toContain('def get_user_variables(user_id):');
    });
  });

  describe('Условные импорты в imports.py.jinja2', () => {
    it('должен добавлять asyncpg при userDatabaseEnabled=true', () => {
      const result = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: true,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });
      
      expect(result).toContain('import asyncpg');
      expect(result).toContain('import json');
    });

    it('должен добавлять TelegramBadRequest при hasInlineButtons=true', () => {
      const result = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: true,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });
      
      expect(result).toContain('from aiogram.exceptions import TelegramBadRequest');
    });

    it('должен добавлять TelegramBadRequest при hasAutoTransitions=true', () => {
      const result = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: true,
        hasMediaNodes: false,
        hasUploadImages: false,
      });
      
      expect(result).toContain('from aiogram.exceptions import TelegramBadRequest');
    });

    it('должен добавлять aiohttp при hasMediaNodes=true', () => {
      const result = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: true,
        hasUploadImages: false,
      });
      
      expect(result).toContain('import aiohttp');
      expect(result).toContain('from aiohttp import TCPConnector');
    });

    it('должен добавлять все условные импорты одновременно', () => {
      const result = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: true,
        hasInlineButtons: true,
        hasAutoTransitions: true,
        hasMediaNodes: true,
        hasUploadImages: true,
      });
      
      // БД
      expect(result).toContain('import asyncpg');
      expect(result).toContain('import json');
      
      // Ошибки
      expect(result).toContain('from aiogram.exceptions import TelegramBadRequest');
      
      // HTTP
      expect(result).toContain('import aiohttp');
      expect(result).toContain('from aiohttp import TCPConnector');
    });
  });

  describe('Обработка ошибок', () => {
    it('должен бросать ошибку для несуществующего шаблона', () => {
      expect(() => {
        renderPartialTemplate('nonexistent.py.jinja2', {});
      }).toThrow(/template not found/);
    });
  });
});
