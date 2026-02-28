/**
 * @fileoverview Тесты на отсутствие неопределённых переменных в сгенерированном коде
 *
 * Проверяет что все используемые переменные и функции определены до использования.
 * Сканирует код на наличие распространённых переменных и проверяет их определения.
 *
 * @module tests/test-undefined-variables
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePythonCode } from '../bot-generator.js';

/**
 * Список переменных/функций которые должны быть определены в коде
 */
const ALWAYS_REQUIRED = [
  // Основные переменные окружения - всегда
  { name: 'API_BASE_URL', type: 'variable', requiresDb: false },
  { name: 'API_TIMEOUT', type: 'variable', requiresDb: false },
  { name: 'PROJECT_ID', type: 'variable', requiresDb: false },
  { name: 'PROJECT_DIR', type: 'variable', requiresDb: false },
  { name: 'BOT_TOKEN', type: 'variable', requiresDb: false },
  
  // Функции - всегда
  { name: 'get_api_base_url', type: 'function', requiresDb: false },
  { name: 'save_message_to_api', type: 'function', requiresDb: false },
  
  // Переменные состояния - всегда
  { name: 'user_data', type: 'variable', requiresDb: false },
  
  // Только при включенной БД
  { name: 'DATABASE_URL', type: 'variable', requiresDb: true },
  { name: 'init_user_variables', type: 'function', requiresDb: true },
  { name: 'replace_variables_in_text', type: 'function', requiresDb: true },
  { name: 'get_user_from_db', type: 'function', requiresDb: true },
  { name: 'get_moscow_time', type: 'function', requiresDb: true },
  { name: 'db_pool', type: 'variable', requiresDb: true },
];

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
 * Проверяет что переменная/функция определена в коде
 * @param {string} code - Сгенерированный код
 * @param {string} name - Имя переменной/функции
 * @param {'variable' | 'function'} type - Тип
 * @returns {boolean} true если определена
 */
function isDefined(code, name, type) {
  if (type === 'function') {
    // Проверяем определение функции
    return code.includes(`def ${name}(`) || code.includes(`async def ${name}(`);
  } else {
    // Проверяем определение переменной
    return code.includes(`${name} =`) || code.includes(`${name}=`); 
  }
}

/**
 * Находит все использования переменной в коде
 * @param {string} code - Сгенерированный код
 * @param {string} name - Имя переменной
 * @returns {number} Количество использований
 */
function countUsages(code, name) {
  const regex = new RegExp(`\\b${name}\\b`, 'g');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}

describe('Отсутствие неопределённых переменных', () => {
  describe('Базовый проект (без БД)', () => {
    let generatedCode = '';
    let generateError = null;

    try {
      generatedCode = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        false, // userDatabaseEnabled
        null,
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

    ALWAYS_REQUIRED.forEach(({ name, type, requiresDb }) => {
      // Пропускаем DB-зависимые для проекта без БД
      if (requiresDb) return;
      
      it(`должен иметь определение для ${name} (${type})`, () => {
        if (generateError) this.skip();
        
        const isUsed = countUsages(generatedCode, name) > 0;
        const isDef = isDefined(generatedCode, name, type);
        
        // Если переменная используется, она должна быть определена
        if (isUsed) {
          assert.ok(isDef, `${name} используется но не определена`);
        }
      });
    });
  });

  describe('Проект с включенной БД', () => {
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

    ALWAYS_REQUIRED.forEach(({ name, type, requiresDb }) => {
      it(`должен иметь определение для ${name} (${type})`, () => {
        if (generateError) this.skip();
        
        const isUsed = countUsages(generatedCode, name) > 0;
        const isDef = isDefined(generatedCode, name, type);
        
        // Если переменная используется, она должна быть определена
        if (isUsed) {
          assert.ok(isDef, `${name} используется но не определена`);
        }
      });
    });

    // Дополнительные проверки для БД
    it('должен содержать save_user_to_db', () => {
      if (generateError) this.skip();
      assert.ok(isDefined(generatedCode, 'save_user_to_db', 'function'), 'save_user_to_db должна быть определена');
    });

    it('должен содержать update_user_data_in_db', () => {
      if (generateError) this.skip();
      assert.ok(isDefined(generatedCode, 'update_user_data_in_db', 'function'), 'update_user_data_in_db должна быть определена');
    });
  });

  describe('DB-заглушки функций (без БД)', () => {
    let codeWithoutDb = '';
    let generateError = null;

    try {
      codeWithoutDb = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        false, // userDatabaseEnabled
        null,
        false,
        false,
        true
      );
    } catch (error) {
      generateError = error;
    }

    it('должна быть определена init_user_variables', () => {
      if (generateError) this.skip();
      assert.ok(codeWithoutDb.includes('def init_user_variables('), 'init_user_variables должна быть определена');
    });

    it('должна быть определена get_user_from_db', () => {
      if (generateError) this.skip();
      assert.ok(codeWithoutDb.includes('async def get_user_from_db('), 'get_user_from_db должна быть определена');
    });

    it('должна быть определена replace_variables_in_text', () => {
      if (generateError) this.skip();
      assert.ok(codeWithoutDb.includes('def replace_variables_in_text('), 'replace_variables_in_text должна быть определена');
    });

    it('должна быть определена get_moscow_time', () => {
      if (generateError) this.skip();
      assert.ok(codeWithoutDb.includes('def get_moscow_time('), 'get_moscow_time должна быть определена');
    });

    it('должна быть определена update_user_data_in_db', () => {
      if (generateError) this.skip();
      assert.ok(codeWithoutDb.includes('async def update_user_data_in_db('), 'update_user_data_in_db должна быть определена');
    });
  });

  describe('Проект с медиа', () => {
    const projectWithMedia = {
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
            imageUrl: 'https://example.com/image.jpg',
            attachedMedia: ['imageUrlVar_start'],
            buttons: [],
            keyboardType: 'none',
            resizeKeyboard: true,
            oneTimeKeyboard: false,
            adminOnly: false,
            showInMenu: true,
            requiresAuth: false,
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

    let generatedCode = '';
    let generateError = null;

    try {
      generatedCode = generatePythonCode(
        projectWithMedia,
        'TestBot',
        [],
        false,
        null,
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

    it('должен содержать send_photo', () => {
      if (generateError) this.skip();
      const hasSendPhoto = generatedCode.includes('send_photo') || generatedCode.includes('answer_photo');
      assert.ok(hasSendPhoto, 'Должна быть функция отправки фото');
    });

    it('не должен содержать неопределённых переменных медиа', () => {
      if (generateError) this.skip();
      
      // Проверяем что API_BASE_URL определён до использования
      const apiBaseUrlDef = generatedCode.indexOf('API_BASE_URL =');
      const apiBaseUrlUse = generatedCode.indexOf('API_BASE_URL.startswith');
      
      if (apiBaseUrlUse !== -1) {
        assert.ok(apiBaseUrlDef !== -1 && apiBaseUrlDef < apiBaseUrlUse, 'API_BASE_URL должен быть определён до использования');
      }
    });
  });

  describe('Проект с inline кнопками', () => {
    const projectWithInlineButtons = {
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
            buttons: [{
              id: 'btn1',
              text: 'Button 1',
              action: 'goto',
              target: 'node2',
              buttonType: 'normal'
            }],
            keyboardType: 'inline',
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
        }, {
          id: 'node2',
          type: 'message',
          position: { x: 0, y: 200 },
          data: {
            messageText: 'Node 2',
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

    let generatedCode = '';
    let generateError = null;

    try {
      generatedCode = generatePythonCode(
        projectWithInlineButtons,
        'TestBot',
        [],
        false,
        null,
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

    it('должен содержать callback_query обработчики', () => {
      if (generateError) this.skip();
      const hasCallbackHandler = generatedCode.includes('@dp.callback_query') || 
                                generatedCode.includes('async def handle_callback_');
      assert.ok(hasCallbackHandler, 'Должны быть callback_query обработчики');
    });

    it('не должен содержать неопределённых callback функций', () => {
      if (generateError) this.skip();
      
      // Находим все вызовы handle_callback_*
      const callbackCalls = generatedCode.match(/await handle_callback_\w+\(/g) || [];
      
      // Находим все определения handle_callback_*
      const callbackDefs = generatedCode.match(/async def handle_callback_\w+\(/g) || [];
      
      // Для каждого вызова должно быть определение
      callbackCalls.forEach(call => {
        const funcName = call.replace('await ', '').replace('(', '');
        const hasDef = callbackDefs.some(def => def.includes(funcName));
        assert.ok(hasDef, `${funcName} вызывается но не определена`);
      });
    });
  });
});
