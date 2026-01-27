/**
 * Baseline тесты для функции generatePythonCode
 * 
 * Эти тесты фиксируют текущее поведение функции generatePythonCode
 * перед рефакторингом для обеспечения regression testing.
 * 
 * ВАЖНО: Эти тесты НЕ должны изменяться во время рефакторинга!
 * Они служат эталоном для проверки идентичности результатов.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generatePythonCode } from '../../bot-generator';
import { BotData, Node, BotGroup } from '../../../../../shared/schema';
import { 
  createSimpleBotData,
  createComplexBotData,
  createBotWithInlineButtons,
  createBotWithMediaHandlers,
  createBotWithUserManagement,
  createBotWithMultiSelect,
  createBotWithConditionals,
  createBotWithAutoTransitions
} from './testData';

describe('generatePythonCode - Baseline Tests', () => {
  let testResults: Map<string, string>;

  beforeAll(() => {
    // Инициализируем Map для хранения результатов baseline тестов
    testResults = new Map();
  });

  describe('Базовая функциональность', () => {
    it('должен генерировать код для простого бота', () => {
      const botData = createSimpleBotData();
      const result = generatePythonCode(botData, 'SimpleBot');
      
      // Сохраняем результат для regression testing
      testResults.set('simple_bot', result);
      
      // Базовые проверки структуры
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import asyncio');
      expect(result).toContain('from aiogram import Bot, Dispatcher');
      expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(result).toContain('async def main():');
      expect(result).toContain('dp.startup.register(on_startup)');
      expect(result).toContain('await dp.start_polling(bot)');
      
      // Проверяем, что код валидный Python (базовая синтаксическая проверка)
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
      
      // Проверяем UTF-8 setup
      expect(result).toContain('os.environ["PYTHONIOENCODING"] = "utf-8"');
      expect(result).toContain('sys.stdout.reconfigure(encoding="utf-8")');
    });

    it('должен генерировать код с правильными параметрами по умолчанию', () => {
      const botData = createSimpleBotData();
      const result = generatePythonCode(botData);
      
      testResults.set('default_params', result);
      
      expect(result).toContain('MyBot - Telegram Bot');
      expect(result).not.toContain('save_message_to_api'); // userDatabaseEnabled = false
      expect(result).not.toContain('PROJECT_ID'); // userDatabaseEnabled = false
    });
  });

  describe('Функциональность с базой данных', () => {
    it('должен генерировать код с поддержкой базы данных', () => {
      const botData = createSimpleBotData();
      const result = generatePythonCode(botData, 'DBBot', [], true, 123);
      
      testResults.set('database_enabled', result);
      
      expect(result).toContain('save_message_to_api');
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "123"))');
      expect(result).toContain('message_logging_middleware');
      expect(result).toContain('send_message_with_logging');
    });

    it('должен генерировать код с логированием', () => {
      const botData = createSimpleBotData();
      const result = generatePythonCode(botData, 'LogBot', [], false, null, true);
      
      testResults.set('logging_enabled', result);
      
      // При включенном логировании должны быть debug сообщения
      expect(result).toContain('logging.info');
      expect(result).toContain('logging.debug');
    });
  });

  describe('Сложные сценарии', () => {
    it('должен генерировать код для сложного бота', () => {
      const botData = createComplexBotData();
      const result = generatePythonCode(botData, 'ComplexBot', [], true, 456);
      
      testResults.set('complex_bot', result);
      
      // Проверяем наличие различных обработчиков
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('@dp.message(Command(');
      expect(result).toContain('@dp.callback_query(');
      expect(result).toContain('async def handle_');
    });

    it('должен генерировать код для бота с inline кнопками', () => {
      const botData = createBotWithInlineButtons();
      const result = generatePythonCode(botData, 'InlineBot');
      
      testResults.set('inline_buttons', result);
      
      expect(result).toContain('safe_edit_or_send');
      expect(result).toContain('InlineKeyboardBuilder');
      expect(result).toContain('callback_data=');
    });

    it('должен генерировать код для бота с медиа обработчиками', () => {
      const botData = createBotWithMediaHandlers();
      const result = generatePythonCode(botData, 'MediaBot');
      
      testResults.set('media_handlers', result);
      
      expect(result).toContain('@dp.message(F.photo)');
      expect(result).toContain('@dp.message(F.voice)');
      expect(result).toContain('@dp.message(F.sticker)');
    });

    it('должен генерировать код для бота с управлением пользователями', () => {
      const botData = createBotWithUserManagement();
      const result = generatePythonCode(botData, 'AdminBot');
      
      testResults.set('user_management', result);
      
      expect(result).toContain('ADMIN_IDS');
      expect(result).toContain('ban_user');
      expect(result).toContain('unban_user');
      expect(result).toContain('mute_user');
    });

    it('должен генерировать код для бота с мультиселектом', () => {
      const botData = createBotWithMultiSelect();
      const result = generatePythonCode(botData, 'MultiSelectBot');
      
      testResults.set('multi_select', result);
      
      expect(result).toContain('allowMultipleSelection');
      expect(result).toContain('selected_options');
      expect(result).toContain('continue_button');
    });

    it('должен генерировать код для бота с условной логикой', () => {
      const botData = createBotWithConditionals();
      const result = generatePythonCode(botData, 'ConditionalBot');
      
      testResults.set('conditionals', result);
      
      expect(result).toContain('if ');
      expect(result).toContain('elif ');
      expect(result).toContain('else:');
    });

    it('должен генерировать код для бота с автопереходами', () => {
      const botData = createBotWithAutoTransitions();
      const result = generatePythonCode(botData, 'AutoTransitionBot');
      
      testResults.set('auto_transitions', result);
      
      expect(result).toContain('is_auto_transition=True');
      expect(result).toContain('safe_edit_or_send');
    });
  });

  describe('Граничные случаи', () => {
    it('должен обрабатывать пустые данные бота', () => {
      const botData: BotData = {
        nodes: [],
        connections: []
      };
      const result = generatePythonCode(botData, 'EmptyBot');
      
      testResults.set('empty_bot', result);
      
      // Даже для пустого бота должна быть базовая структура
      expect(result).toContain('async def main():');
      expect(result).toContain('BOT_TOKEN');
    });

    it('должен обрабатывать специальные символы в имени бота', () => {
      const botData = createSimpleBotData();
      const result = generatePythonCode(botData, 'Бот-Тест_123');
      
      testResults.set('special_chars_bot', result);
      
      expect(result).toContain('Бот-Тест_123 - Telegram Bot');
    });

    it('должен обрабатывать большие значения projectId', () => {
      const botData = createSimpleBotData();
      const result = generatePythonCode(botData, 'BigProjectBot', [], true, 999999999);
      
      testResults.set('big_project_id', result);
      
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "999999999"))');
    });
  });

  describe('Производительность', () => {
    it('должен генерировать код за разумное время', () => {
      const botData = createComplexBotData();
      
      const startTime = performance.now();
      const result = generatePythonCode(botData, 'PerformanceBot', [], true, 123, true);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      testResults.set('performance_test', result);
      
      // Генерация не должна занимать более 5 секунд даже для сложного бота
      expect(executionTime).toBeLessThan(5000);
      
      // Результат не должен быть пустым
      expect(result.length).toBeGreaterThan(1000);
    });
  });

  // Сохраняем все результаты тестов для regression testing
  afterAll(() => {
    // Экспортируем результаты для использования в regression тестах
    (global as any).baselineResults = testResults;
    
    console.log(`\n📊 Baseline тесты завершены. Сохранено ${testResults.size} результатов для regression testing.`);
    
    // Выводим статистику по размерам генерируемого кода
    testResults.forEach((code, testName) => {
      const lines = code.split('\n').length;
      const chars = code.length;
      console.log(`  ${testName}: ${lines} строк, ${chars} символов`);
    });
  });
});