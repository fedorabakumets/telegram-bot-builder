/**
 * @fileoverview Тесты для исправленных ошибок интеграции шаблонов
 * 
 * Проверяет:
 * - getTemplatesDir() работает корректно
 * - renderPartialTemplate() находит шаблоны
 * - browser-версии функций работают
 * - isBrowser() определяет среду правильно
 */

import { describe, it, expect } from 'vitest';
import { isBrowser, isNode } from '../utils/is-browser';
import { getTemplatesDir } from './utils/get-templates-dir';
import { renderPartialTemplate } from './template-renderer';
import { generateHeaderBrowser } from './generate-header-browser';
import { generateImportsBrowser } from './generate-imports-browser';
import { generateConfigBrowser } from './generate-config-browser';

describe('Интеграция шаблонов - Исправленные ошибки', () => {
  
  describe('isBrowser() / isNode()', () => {
    it('должен определять среду выполнения', () => {
      // В Node.js (тесты)
      expect(isNode()).toBe(true);
      expect(isBrowser()).toBe(false);
    });
  });

  describe('getTemplatesDir()', () => {
    it('должен возвращать правильный путь к директории шаблонов', () => {
      const templatesDir = getTemplatesDir();
      
      expect(templatesDir).toBeDefined();
      expect(typeof templatesDir).toBe('string');
      expect(templatesDir).toContain('templates');
      expect(templatesDir).toContain('bot-generator');
    });

    it('должен возвращать абсолютный путь', () => {
      const templatesDir = getTemplatesDir();
      
      // Путь должен быть абсолютным (начинаться с / или диска на Windows)
      expect(
        templatesDir.startsWith('/') || 
        /^[A-Z]:\\/.test(templatesDir)
      ).toBe(true);
    });
  });

  describe('renderPartialTemplate()', () => {
    it('должен находить шаблон header.py.jinja2', () => {
      expect(() => {
        renderPartialTemplate('header.py.jinja2', {});
      }).not.toThrow();
    });

    it('должен находить шаблон imports.py.jinja2', () => {
      expect(() => {
        renderPartialTemplate('imports.py.jinja2', {
          userDatabaseEnabled: false,
          hasInlineButtons: false,
          hasAutoTransitions: false,
          hasMediaNodes: false,
          hasUploadImages: false,
        });
      }).not.toThrow();
    });

    it('должен находить шаблон config.py.jinja2', () => {
      expect(() => {
        renderPartialTemplate('config.py.jinja2', {
          userDatabaseEnabled: false,
          projectId: null,
        });
      }).not.toThrow();
    });

    it('должен находить шаблон utils.py.jinja2', () => {
      expect(() => {
        renderPartialTemplate('utils.py.jinja2', {
          userDatabaseEnabled: false,
        });
      }).not.toThrow();
    });

    it('должен генерировать UTF-8 кодировку из header.py.jinja2', () => {
      const result = renderPartialTemplate('header.py.jinja2', {});
      
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import os');
      expect(result).toContain('import sys');
    });

    it('должен автоматически добавлять "partials/" к пути', () => {
      const result1 = renderPartialTemplate('header.py.jinja2', {});
      const result2 = renderPartialTemplate('partials/header.py.jinja2', {});
      
      expect(result1).toBe(result2);
    });

    it('должен бросать ошибку для несуществующего шаблона', () => {
      expect(() => {
        renderPartialTemplate('nonexistent.py.jinja2', {});
      }).toThrow(/template not found/);
    });
  });

  describe('generateHeaderBrowser()', () => {
    it('должен генерировать UTF-8 кодировку', () => {
      const result = generateHeaderBrowser();
      
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import os');
      expect(result).toContain('import sys');
    });

    it('должен генерировать код для Windows', () => {
      const result = generateHeaderBrowser();
      
      expect(result).toContain('sys.platform.startswith("win")');
      expect(result).toContain('PYTHONIOENCODING');
    });

    it('должен работать без параметров', () => {
      expect(() => {
        generateHeaderBrowser();
      }).not.toThrow();
    });

    it('должен игнорировать параметры', () => {
      const result1 = generateHeaderBrowser();
      const result2 = generateHeaderBrowser({
        userDatabaseEnabled: true,
        hasInlineButtons: true,
        hasMediaNodes: true,
      });
      
      expect(result1).toBe(result2);
    });
  });

  describe('generateImportsBrowser()', () => {
    it('должен генерировать базовые импорты', () => {
      const result = generateImportsBrowser();
      
      expect(result).toContain('import asyncio');
      expect(result).toContain('import logging');
      expect(result).toContain('from aiogram import Bot, Dispatcher, types, F');
      expect(result).toContain('import re');
    });

    it('должен добавлять asyncpg при userDatabaseEnabled=true', () => {
      const result = generateImportsBrowser({
        userDatabaseEnabled: true,
      });
      
      expect(result).toContain('import asyncpg');
      expect(result).toContain('import json');
    });

    it('должен добавлять TelegramBadRequest при hasInlineButtons=true', () => {
      const result = generateImportsBrowser({
        hasInlineButtons: true,
      });
      
      expect(result).toContain('from aiogram.exceptions import TelegramBadRequest');
    });

    it('должен добавлять TelegramBadRequest при hasAutoTransitions=true', () => {
      const result = generateImportsBrowser({
        hasAutoTransitions: true,
      });
      
      expect(result).toContain('from aiogram.exceptions import TelegramBadRequest');
    });

    it('должен добавлять aiohttp при hasMediaNodes=true', () => {
      const result = generateImportsBrowser({
        hasMediaNodes: true,
      });
      
      expect(result).toContain('import aiohttp');
      expect(result).toContain('from aiohttp import TCPConnector');
    });

    it('должен добавлять все условные импорты одновременно', () => {
      const result = generateImportsBrowser({
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

  describe('generateConfigBrowser()', () => {
    it('должен генерировать загрузку .env', () => {
      const result = generateConfigBrowser();
      
      expect(result).toContain('from dotenv import load_dotenv');
      expect(result).toContain('load_dotenv()');
    });

    it('должен генерировать токен бота', () => {
      const result = generateConfigBrowser();
      
      expect(result).toContain('BOT_TOKEN = os.getenv("BOT_TOKEN")');
    });

    it('должен генерировать логирование', () => {
      const result = generateConfigBrowser();
      
      expect(result).toContain('logging.basicConfig(');
      expect(result).toContain('LOG_LEVEL');
    });

    it('должен генерировать бота и диспетчер', () => {
      const result = generateConfigBrowser();
      
      expect(result).toContain('bot = Bot(token=BOT_TOKEN)');
      expect(result).toContain('dp = Dispatcher()');
    });

    it('должен генерировать ADMIN_IDS', () => {
      const result = generateConfigBrowser();
      
      expect(result).toContain('ADMIN_IDS = [int(x.strip())');
    });

    it('должен генерировать user_data и all_user_vars', () => {
      const result = generateConfigBrowser();
      
      expect(result).toContain('user_data = {}');
      expect(result).toContain('all_user_vars = {}');
    });

    it('должен добавлять DATABASE_URL при userDatabaseEnabled=true', () => {
      const result = generateConfigBrowser({
        userDatabaseEnabled: true,
      });
      
      expect(result).toContain('DATABASE_URL = os.getenv("DATABASE_URL")');
      expect(result).toContain('db_pool = None');
    });

    it('должен добавлять PROJECT_ID при projectId !== null', () => {
      const result = generateConfigBrowser({
        projectId: 123,
      });
      
      expect(result).toContain('PROJECT_ID = 123');
      expect(result).toContain('PROJECT_DIR');
    });
  });

  describe('Сравнение browser и server версий', () => {
    it('должен генерировать одинаковый UTF-8 заголовок', () => {
      const browser = generateHeaderBrowser();
      const server = renderPartialTemplate('header.py.jinja2', {});
      
      // Обе версии должны содержать UTF-8 кодировку
      expect(browser).toContain('# -*- coding: utf-8 -*-');
      expect(server).toContain('# -*- coding: utf-8 -*-');
    });

    it('должен генерировать одинаковые базовые импорты', () => {
      const browser = generateImportsBrowser();
      const server = renderPartialTemplate('imports.py.jinja2', {
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });
      
      // Обе версии должны содержать базовые импорты
      expect(browser).toContain('import asyncio');
      expect(server).toContain('import asyncio');
      
      expect(browser).toContain('from aiogram import Bot, Dispatcher, types, F');
      expect(server).toContain('from aiogram import Bot, Dispatcher, types, F');
    });

    it('должен генерировать одинаковую конфигурацию', () => {
      const browser = generateConfigBrowser();
      const server = renderPartialTemplate('config.py.jinja2', {
        userDatabaseEnabled: false,
        projectId: null,
      });
      
      // Обе версии должны содержать базовую конфигурацию
      expect(browser).toContain('load_dotenv()');
      expect(server).toContain('load_dotenv()');
      
      expect(browser).toContain('BOT_TOKEN = os.getenv("BOT_TOKEN")');
      expect(server).toContain('BOT_TOKEN = os.getenv("BOT_TOKEN")');
    });
  });

  describe('Edge cases', () => {
    it('должен работать с пустыми параметрами', () => {
      expect(() => {
        generateHeaderBrowser({});
        generateImportsBrowser({});
        generateConfigBrowser({});
      }).not.toThrow();
    });

    it('должен работать с undefined параметрами', () => {
      expect(() => {
        generateHeaderBrowser(undefined as any);
        generateImportsBrowser(undefined as any);
        generateConfigBrowser(undefined as any);
      }).not.toThrow();
    });

    it('должен генерировать непустую строку', () => {
      const header = generateHeaderBrowser();
      const imports = generateImportsBrowser();
      const config = generateConfigBrowser();
      
      expect(header.length).toBeGreaterThan(0);
      expect(imports.length).toBeGreaterThan(0);
      expect(config.length).toBeGreaterThan(0);
    });
  });
});
