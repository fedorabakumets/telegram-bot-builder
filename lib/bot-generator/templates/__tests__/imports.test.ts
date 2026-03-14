/**
 * @fileoverview Тесты для шаблона импортов
 * Проверяет корректность генерации импортов в зависимости от флагов
 */

import { describe, it, expect } from 'vitest';
import { renderPartialTemplate } from '../template-renderer';

describe('partials/imports.py.jinja2', () => {
  describe('Базовые импорты', () => {
    it('должен генерировать основные импорты aiogram', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).toContain('import asyncio');
      expect(imports).toContain('import logging');
      expect(imports).toContain('from aiogram import Bot, Dispatcher, types, F');
      expect(imports).toContain('from dotenv import load_dotenv');
      expect(imports).toContain('from aiogram.filters import CommandStart');
    });

    it('должен генерировать UTF-8 кодировку для Windows', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).toContain('sys.platform.startswith("win")');
      expect(imports).toContain('sys.stdout.reconfigure(encoding="utf-8")');
    });

    it('должен генерировать import re для работы с переменными', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).toContain('import re');
    });
  });

  describe('Импорты базы данных', () => {
    it('должен добавлять asyncpg и json при userDatabaseEnabled=true', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: true,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).toContain('import asyncpg');
      expect(imports).toContain('import json');
    });

    it('не должен добавлять asyncpg при userDatabaseEnabled=false', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).not.toContain('import asyncpg');
    });
  });

  describe('Импорты для inline кнопок и автопереходов', () => {
    it('должен добавлять TelegramBadRequest при hasInlineButtons=true', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: true,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).toContain('from aiogram.exceptions import TelegramBadRequest');
    });

    it('должен добавлять TelegramBadRequest при hasAutoTransitions=true', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: true,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).toContain('from aiogram.exceptions import TelegramBadRequest');
    });

    it('не должен добавлять TelegramBadRequest при обоих флагах false', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).not.toContain('TelegramBadRequest');
    });
  });

  describe('Импорты для работы с медиа', () => {
    it('должен добавлять aiohttp при hasMediaNodes=true', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: true,
        hasUploadImages: false,
      });

      expect(imports).toContain('import aiohttp');
      expect(imports).toContain('from aiohttp import TCPConnector');
    });

    it('должен добавлять aiohttp при hasUploadImages=true', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: true,
      });

      expect(imports).toContain('import aiohttp');
      expect(imports).toContain('from aiohttp import TCPConnector');
    });

    it('не должен добавлять aiohttp при обоих флагах false', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      expect(imports).not.toContain('import aiohttp');
    });
  });

  describe('Комбинированные сценарии', () => {
    it('должен генерировать все импорты для сложного бота', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: true,
        hasInlineButtons: true,
        hasAutoTransitions: true,
        hasMediaNodes: true,
        hasUploadImages: true,
      });

      // Базовые импорты
      expect(imports).toContain('import asyncio');
      expect(imports).toContain('from aiogram import Bot, Dispatcher, types, F');

      // БД
      expect(imports).toContain('import asyncpg');
      expect(imports).toContain('import json');

      // Inline кнопки
      expect(imports).toContain('TelegramBadRequest');

      // Медиа
      expect(imports).toContain('import aiohttp');
      expect(imports).toContain('TCPConnector');

      // Регулярные выражения
      expect(imports).toContain('import re');
    });

    it('должен генерировать минимальные импорты для простого бота', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      // Только базовые импорты
      expect(imports).toContain('import asyncio');
      expect(imports).toContain('from aiogram import Bot, Dispatcher, types, F');

      // Не должно быть дополнительных импортов
      expect(imports).not.toContain('import asyncpg');
      expect(imports).not.toContain('TelegramBadRequest');
      expect(imports).not.toContain('import aiohttp');
    });
  });

  describe('Валидация Python синтаксиса', () => {
    it('должен генерировать валидный Python синтаксис', () => {
      const imports = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: true,
        hasInlineButtons: true,
        hasAutoTransitions: false,
        hasMediaNodes: true,
        hasUploadImages: false,
      });

      // Проверяем что нет синтаксических ошибок
      const { execSync } = require('child_process');
      expect(() => {
        execSync('python -m py_compile', { input: imports, stdio: 'pipe' });
      }).not.toThrow();
    });
  });
});
