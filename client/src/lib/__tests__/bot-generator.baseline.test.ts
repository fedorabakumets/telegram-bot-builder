/**
 * Baseline тесты для функции generatePythonCode
 * Задача 8.1: Подготовка к рефакторингу
 * 
 * Эти тесты фиксируют текущее поведение функции generatePythonCode
 * для предотвращения регрессий во время рефакторинга.
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { BotData, Node, BotGroup } from '../../../../shared/schema';
import { baselineTestData } from './test-data/baseline-test-data';

describe('generatePythonCode - Baseline Tests', () => {
  describe('Базовая функциональность', () => {
    it('должна генерировать код для пустого бота', () => {
      const emptyBotData: BotData = {
        nodes: [],
        connections: []
      };
      
      const result = generatePythonCode(emptyBotData, 'TestBot');
      
      // Проверяем основные элементы структуры
      expect(result).toContain('TestBot - Telegram Bot');
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import asyncio');
      expect(result).toContain('from aiogram import Bot, Dispatcher');
      expect(result).toContain('if __name__ == "__main__":');
    });

    it('должна генерировать код с базовыми параметрами по умолчанию', () => {
      const result = generatePythonCode(baselineTestData.emptyBot);
      
      expect(result).toContain('MyBot - Telegram Bot');
      expect(result).not.toContain('DATABASE_URL');
      // Логирование всегда включено в текущей реализации
      expect(result).toContain('logging.basicConfig');
    });

    it('должна включать настройки базы данных когда userDatabaseEnabled=true', () => {
      const result = generatePythonCode(
        baselineTestData.emptyBot, 
        'TestBot', 
        [], 
        true // userDatabaseEnabled
      );
      
      expect(result).toContain('DATABASE_URL');
      expect(result).toContain('asyncpg');
      expect(result).toContain('async def init_database()');
    });

    it('должна включать логирование когда enableLogging=true', () => {
      const result = generatePythonCode(
        baselineTestData.emptyBot, 
        'TestBot', 
        [], 
        false, 
        null, 
        true // enableLogging
      );
      
      expect(result).toContain('logging.basicConfig');
      expect(result).toContain('level=logging.INFO');
    });
  });

  describe('Обработка узлов', () => {
    it('должна генерировать обработчик для start узла', () => {
      const result = generatePythonCode(baselineTestData.simpleStartBot);
      
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('start_1_handler'); // Новое имя функции
      expect(result).toContain('Добро пожаловать!');
    });

    it('должна генерировать обработчик для command узла', () => {
      const result = generatePythonCode(baselineTestData.commandBot);
      
      expect(result).toContain('@dp.message(Command("help"))');
      expect(result).toContain('async def help_handler');
    });

    it('должна генерировать обработчик для message узла', () => {
      const result = generatePythonCode(baselineTestData.messageBot);
      
      // Message узлы без связей не генерируют обработчики
      expect(result).toContain('@@NODE_START:msg_1@@');
      expect(result).toContain('@@NODE_END:msg_1@@');
    });
  });

  describe('Обработка кнопок', () => {
    it('должна генерировать inline клавиатуру', () => {
      const result = generatePythonCode(baselineTestData.inlineButtonBot);
      
      expect(result).toContain('InlineKeyboardBuilder');
      expect(result).toContain('handle_callback_btn_1'); // Новое имя функции
      expect(result).toContain('@dp.callback_query');
    });

    it('должна генерировать reply клавиатуру', () => {
      const result = generatePythonCode(baselineTestData.replyButtonBot);
      
      expect(result).toContain('ReplyKeyboardBuilder');
      expect(result).toContain('KeyboardButton');
    });
  });

  describe('Специальные функции', () => {
    it('должна генерировать код для множественного выбора', () => {
      const result = generatePythonCode(baselineTestData.multiSelectBot);
      
      expect(result).toContain('allowMultipleSelection');
      expect(result).toContain('multi_select_');
      expect(result).toContain('multi_select_done_');
    });

    it('должна генерировать код для автопереходов', () => {
      const result = generatePythonCode(baselineTestData.autoTransitionBot);
      
      // Автопереходы генерируются только если есть связи и обработчики
      expect(result).toContain('@@NODE_START:auto_msg@@');
      expect(result).toContain('@@NODE_START:auto_target@@');
      expect(result).toContain('safe_edit_or_send');
    });

    it('должна генерировать код для условных сообщений', () => {
      const result = generatePythonCode(baselineTestData.conditionalBot);
      
      // Условные сообщения генерируются только если есть обработчики
      expect(result).toContain('@@NODE_START:conditional_msg@@');
      expect(result).toContain('@@NODE_END:conditional_msg@@');
    });
  });

  describe('Группы и команды BotFather', () => {
    it('должна генерировать команды для BotFather', () => {
      const result = generatePythonCode(baselineTestData.commandBot);
      
      expect(result).toContain('Команды для @BotFather:');
      expect(result).toContain('help - ');
    });

    it('должна обрабатывать группы ботов', () => {
      const groups: BotGroup[] = [
        { id: '1', name: 'Группа 1', description: 'Описание группы' }
      ];
      
      const result = generatePythonCode(baselineTestData.emptyBot, 'TestBot', groups);
      
      expect(result).toContain('Группа 1');
    });
  });

  describe('Размер и структура генерируемого кода', () => {
    it('должна генерировать код определенного размера для базового бота', () => {
      const result = generatePythonCode(baselineTestData.emptyBot);
      const lines = result.split('\n').length;
      
      // Фиксируем примерное количество строк для отслеживания значительных изменений
      expect(lines).toBeGreaterThan(50);
      expect(lines).toBeLessThan(200);
    });

    it('должна содержать все необходимые импорты', () => {
      const result = generatePythonCode(baselineTestData.emptyBot);
      
      const requiredImports = [
        'import asyncio',
        'import logging',
        'from aiogram import Bot, Dispatcher',
        'from aiogram.filters import CommandStart',
        'from aiogram.types import ReplyKeyboardMarkup'
      ];

      requiredImports.forEach(importStatement => {
        expect(result).toContain(importStatement);
      });
    });
  });
});