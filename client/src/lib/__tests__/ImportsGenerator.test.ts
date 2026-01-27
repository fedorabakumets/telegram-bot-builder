import { describe, it, expect } from 'vitest';
import { ImportsGenerator } from '../Generators/ImportsGenerator';
import { GenerationContext } from '../Core/types';

describe('ImportsGenerator', () => {
  let generator: ImportsGenerator;

  beforeEach(() => {
    generator = new ImportsGenerator();
  });

  describe('generateEncodingSetup', () => {
    it('должен генерировать корректную настройку UTF-8 кодировки', () => {
      const result = generator.generateEncodingSetup();
      
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import os');
      expect(result).toContain('import sys');
      expect(result).toContain('PYTHONIOENCODING');
      expect(result).toContain('sys.stdout.reconfigure(encoding="utf-8")');
      expect(result).toContain('sys.stderr.reconfigure(encoding="utf-8")');
    });

    it('должен включать fallback для старых версий Python', () => {
      const result = generator.generateEncodingSetup();
      
      expect(result).toContain('except (AttributeError, UnicodeError):');
      expect(result).toContain('codecs.getwriter("utf-8")');
    });

    it('должен включать проверку для Windows', () => {
      const result = generator.generateEncodingSetup();
      
      expect(result).toContain('if sys.platform.startswith("win"):');
    });
  });

  describe('generateImports', () => {
    it('должен генерировать базовые импорты', () => {
      const context: GenerationContext = {
        botData: {} as any,
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled: false,
        projectId: null,
        enableLogging: false,
        nodes: [],
        connections: [],
        mediaVariablesMap: new Map(),
        allNodeIds: []
      };

      const result = generator.generateImports(context);
      
      // Проверяем базовые импорты
      expect(result).toContain('import asyncio');
      expect(result).toContain('import logging');
      expect(result).toContain('import signal');
      expect(result).toContain('import locale');
      
      // Проверяем aiogram импорты
      expect(result).toContain('from aiogram import Bot, Dispatcher, types, F');
      expect(result).toContain('from aiogram.filters import CommandStart, Command');
      expect(result).toContain('from aiogram.exceptions import TelegramBadRequest');
      expect(result).toContain('from aiogram.types import ReplyKeyboardMarkup');
      expect(result).toContain('from aiogram.utils.keyboard import ReplyKeyboardBuilder');
      expect(result).toContain('from aiogram.enums import ParseMode');
      
      // Проверяем дополнительные импорты
      expect(result).toContain('from typing import Optional');
      expect(result).toContain('from datetime import datetime, timezone, timedelta');
      expect(result).toContain('import json');
      expect(result).toContain('import aiohttp');
      expect(result).toContain('from aiohttp import TCPConnector');
    });

    it('должен включать asyncpg импорт когда userDatabaseEnabled = true', () => {
      const context: GenerationContext = {
        botData: {} as any,
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled: true,
        projectId: null,
        enableLogging: false,
        nodes: [],
        connections: [],
        mediaVariablesMap: new Map(),
        allNodeIds: []
      };

      const result = generator.generateImports(context);
      
      expect(result).toContain('import asyncpg');
    });

    it('не должен включать asyncpg импорт когда userDatabaseEnabled = false', () => {
      const context: GenerationContext = {
        botData: {} as any,
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled: false,
        projectId: null,
        enableLogging: false,
        nodes: [],
        connections: [],
        mediaVariablesMap: new Map(),
        allNodeIds: []
      };

      const result = generator.generateImports(context);
      
      expect(result).not.toContain('import asyncpg');
    });
  });

  describe('generateBotFatherCommands', () => {
    it('должен возвращать пустую строку для пустого массива узлов', () => {
      const result = generator.generateBotFatherCommands([]);
      
      expect(result).toBe('');
    });

    it('должен возвращать пустую строку для null/undefined', () => {
      expect(generator.generateBotFatherCommands(null as any)).toBe('');
      expect(generator.generateBotFatherCommands(undefined as any)).toBe('');
    });

    it('должен генерировать команды для узлов типа start и command', () => {
      const nodes = [
        {
          type: 'start',
          data: {
            command: '/start',
            description: 'Начать работу с ботом'
          }
        },
        {
          type: 'command',
          data: {
            command: '/help',
            description: 'Показать справку'
          }
        }
      ];

      const result = generator.generateBotFatherCommands(nodes);
      
      expect(result).toContain('start - Начать работу с ботом');
      expect(result).toContain('help - Показать справку');
    });

    it('должен использовать описание по умолчанию если description отсутствует', () => {
      const nodes = [
        {
          type: 'command',
          data: {
            command: '/test'
          }
        }
      ];

      const result = generator.generateBotFatherCommands(nodes);
      
      expect(result).toContain('test - Команда бота');
    });

    it('должен фильтровать узлы без команд', () => {
      const nodes = [
        {
          type: 'message',
          data: {
            text: 'Обычное сообщение'
          }
        },
        {
          type: 'command',
          data: {
            command: '/help',
            description: 'Показать справку'
          }
        }
      ];

      const result = generator.generateBotFatherCommands(nodes);
      
      expect(result).toBe('help - Показать справку');
    });

    it('должен исключать команды с showInMenu = false', () => {
      const nodes = [
        {
          type: 'command',
          data: {
            command: '/help',
            description: 'Показать справку',
            showInMenu: true
          }
        },
        {
          type: 'command',
          data: {
            command: '/hidden',
            description: 'Скрытая команда',
            showInMenu: false
          }
        }
      ];

      const result = generator.generateBotFatherCommands(nodes);
      
      expect(result).toContain('help - Показать справку');
      expect(result).not.toContain('hidden - Скрытая команда');
    });

    it('должен включать команды с showInMenu = undefined', () => {
      const nodes = [
        {
          type: 'command',
          data: {
            command: '/help',
            description: 'Показать справку'
            // showInMenu не установлено
          }
        }
      ];

      const result = generator.generateBotFatherCommands(nodes);
      
      expect(result).toContain('help - Показать справку');
    });

    it('должен удалять символ "/" из команд', () => {
      const nodes = [
        {
          type: 'command',
          data: {
            command: '/start',
            description: 'Начать работу'
          }
        }
      ];

      const result = generator.generateBotFatherCommands(nodes);
      
      expect(result).toBe('start - Начать работу');
      expect(result).not.toContain('/start');
    });
  });
});