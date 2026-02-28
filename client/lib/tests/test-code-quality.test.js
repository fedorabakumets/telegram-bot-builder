/**
 * @fileoverview Тесты на качество сгенерированного кода
 *
 * Проверяет отсутствие дублирования, правильную обработку ошибок
 * и общее качество генерации Python кода.
 *
 * @module tests/test-code-quality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePythonCode } from '../bot-generator.js';

/**
 * Базовые данные проекта для тестов
 */
const baseProject = {
  sheets: [{
    id: 'test-sheet',
    name: 'Test',
    nodes: [{
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        command: '/start',
        messageText: 'Test',
        buttons: [],
        keyboardType: 'none',
        resizeKeyboard: true,
        oneTimeKeyboard: false,
        adminOnly: false,
        showInMenu: true,
        requiresAuth: false,
        attachedMedia: [],
        isPrivateOnly: false,
        enableStatistics: true,
        enableConditionalMessages: false,
        conditionalMessages: [],
        collectUserInput: false,
        enableAutoTransition: false
      }
    }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 }
  }],
  version: 2,
  activeSheetId: 'test-sheet'
};

/**
 * Подсчитывает количество вхождений паттерна в код
 * @param {string} code - Сгенерированный код
 * @param {string} pattern - Паттерн для поиска
 * @returns {number} Количество вхождений
 */
function countOccurrences(code, pattern) {
  const regex = new RegExp(pattern, 'g');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}

describe('Качество сгенерированного кода', () => {
  describe('Дублирование get_api_base_url', () => {
    let generatedCode = '';
    let generateError = null;

    try {
      generatedCode = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        true, // userDatabaseEnabled
        1,
        false,
        false,
        true
      );
    } catch (error) {
      generateError = error;
    }

    it('не должен содержать ошибок генерации', () => {
      assert.strictEqual(generateError, null, `Генерация не удалась: ${generateError?.message}`);
    });

    it('должен содержать только одно определение get_api_base_url', () => {
      if (generateError) this.skip();
      
      const count = countOccurrences(generatedCode, 'def get_api_base_url\\(');
      
      assert.strictEqual(count, 1, `get_api_base_url определена ${count} раз(а), должна быть 1`);
    });

    it('не должен содержать дублирования API_BASE_URL = get_api_base_url()', () => {
      if (generateError) this.skip();
      
      const count = countOccurrences(generatedCode, 'API_BASE_URL = get_api_base_url\\(\\)');
      
      assert.strictEqual(count, 1, `API_BASE_URL = get_api_base_url() встречается ${count} раз(а), должен быть 1`);
    });
  });

  describe('Дублирование импортов', () => {
    let generatedCode = '';
    let generateError = null;

    try {
      generatedCode = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        true,
        1,
        false,
        false,
        true
      );
    } catch (error) {
      generateError = error;
    }

    it('не должен содержать дублирования import asyncio', () => {
      if (generateError) this.skip();
      
      // Считаем только импорты в начале файла (первые 100 строк)
      const firstLines = generatedCode.split('\n').slice(0, 100).join('\n');
      const count = countOccurrences(firstLines, '^import asyncio$');
      
      assert.strictEqual(count, 1, `import asyncio встречается ${count} раз(а) в первых 100 строках`);
    });

    it('не должен содержать дублирования import logging', () => {
      if (generateError) this.skip();
      
      const firstLines = generatedCode.split('\n').slice(0, 100).join('\n');
      const count = countOccurrences(firstLines, '^import logging$');
      
      assert.strictEqual(count, 1, `import logging встречается ${count} раз(а) в первых 100 строках`);
    });

    it('не должен содержать дублирования import signal', () => {
      if (generateError) this.skip();
      
      const firstLines = generatedCode.split('\n').slice(0, 100).join('\n');
      const count = countOccurrences(firstLines, '^import signal$');
      
      assert.strictEqual(count, 1, `import signal встречается ${count} раз(а) в первых 100 строках`);
    });

    it('не должен содержать дублирования from aiogram import', () => {
      if (generateError) this.skip();
      
      const firstLines = generatedCode.split('\n').slice(0, 100).join('\n');
      const count = countOccurrences(firstLines, '^from aiogram import');
      
      assert.strictEqual(count, 1, `from aiogram import встречается ${count} раз(а) в первых 100 строках`);
    });
  });

  describe('Обработка ошибок CSV', () => {
    const projectWithInput = {
      sheets: [{
        id: 'test-sheet',
        name: 'Test',
        nodes: [{
          id: 'input-node',
          type: 'message',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Enter your ID',
            collectUserInput: true,
            inputVariable: 'user_id',
            saveToDatabase: true,
            buttons: [],
            keyboardType: 'none',
            resizeKeyboard: true,
            oneTimeKeyboard: false,
            adminOnly: false,
            showInMenu: true,
            requiresAuth: false,
            attachedMedia: [],
            isPrivateOnly: false,
            enableStatistics: true,
            enableConditionalMessages: false,
            conditionalMessages: [],
            enableAutoTransition: false
          }
        }],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        viewState: { pan: { x: 0, y: 0 }, zoom: 100 }
      }],
      version: 2,
      activeSheetId: 'test-sheet'
    };

    let generatedCode = '';
    let generateError = null;

    try {
      generatedCode = generatePythonCode(
        projectWithInput,
        'TestBot',
        [],
        true,
        1,
        false,
        false,
        true
      );
    } catch (error) {
      generateError = error;
    }

    it('не должен содержать ошибок генерации', () => {
      assert.strictEqual(generateError, null, `Генерация не удалась: ${generateError?.message}`);
    });

    it('должен содержать обработку ошибок CSV в try/except', () => {
      if (generateError) this.skip();
      
      // Проверяем что запись в CSV обёрнута в try/except
      const hasTryCatch = generatedCode.includes('try:') && 
                         generatedCode.includes('with open(csv_file') &&
                         generatedCode.includes('except Exception');
      
      assert.ok(hasTryCatch, 'Запись в CSV должна быть обёрнута в try/except');
    });

    it('должен логировать ошибки CSV', () => {
      if (generateError) this.skip();
      
      // Проверяем что ошибки CSV логируются
      const hasLogging = generatedCode.includes('logging.error') && 
                        generatedCode.includes('CSV');
      
      assert.ok(hasLogging, 'Ошибки CSV должны логироваться через logging.error');
    });

    it('не должен использовать pass для обработки ошибок CSV', () => {
      if (generateError) this.skip();
      
      // Проверяем что нет pass в блоке except для CSV
      const csvBlockStart = generatedCode.indexOf('with open(csv_file');
      const csvBlockEnd = generatedCode.indexOf('return', csvBlockStart);
      const csvBlock = generatedCode.substring(csvBlockStart, csvBlockEnd);
      
      const hasPassInExcept = csvBlock.includes('except') && 
                             csvBlock.includes('pass');
      
      assert.ok(!hasPassInExcept, 'Не должно быть pass в except блоке для CSV');
    });
  });

  describe('Комплексная проверка кода', () => {
    let generatedCode = '';

    try {
      generatedCode = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        true,
        1,
        false,
        false,
        true
      );
    } catch (error) {
      // Игнорируем ошибки для комплексной проверки
    }

    it('должен содержать все необходимые определения переменных', () => {
      assert.ok(generatedCode.includes('API_BASE_URL ='), 'API_BASE_URL должна быть определена');
      assert.ok(generatedCode.includes('PROJECT_ID ='), 'PROJECT_ID должна быть определена');
      assert.ok(generatedCode.includes('PROJECT_DIR ='), 'PROJECT_DIR должна быть определена');
      assert.ok(generatedCode.includes('API_TIMEOUT ='), 'API_TIMEOUT должна быть определена');
    });

    it('должен содержать импорты в начале файла', () => {
      const firstLines = generatedCode.split('\n').slice(0, 50).join('\n');
      
      assert.ok(firstLines.includes('import asyncio'), 'asyncio должен быть в первых 50 строках');
      assert.ok(firstLines.includes('import logging'), 'logging должен быть в первых 50 строках');
      assert.ok(firstLines.includes('from aiogram import'), 'aiogram должен быть в первых 50 строках');
    });

    it('не должен содержать заглушек при включенной БД', () => {
      // Проверяем что нет заглушки get_user_from_db с return {}
      const hasStub = generatedCode.includes('async def get_user_from_db(user_id):') && 
                     generatedCode.includes('return {}');
      
      assert.ok(!hasStub, 'Не должно быть заглушки get_user_from_db при включенной БД');
    });
  });
});
