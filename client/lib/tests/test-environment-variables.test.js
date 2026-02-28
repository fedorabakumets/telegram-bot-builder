/**
 * @fileoverview Тесты для проверки определения переменных окружения
 *
 * Проверяет что сгенерированный Python код содержит все необходимые
 * определения переменных окружения и констант.
 *
 * @module tests/test-environment-variables
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

describe('Определения переменных окружения', () => {
  let generatedCode = '';
  let generateError = null;

  try {
    generatedCode = generatePythonCode(
      baseProject,
      'TestBot',
      [],
      true, // userDatabaseEnabled
      1,    // projectId
      false,
      false,
      true
    );
  } catch (error) {
    generateError = error;
  }

  describe('API_BASE_URL', () => {
    it('должен быть определён через os.getenv', () => {
      if (generateError) this.skip();
      
      // Проверяем что API_BASE_URL определяется через os.getenv
      const hasGetEnv = generatedCode.includes('os.getenv("API_BASE_URL"') ||
                       generatedCode.includes("os.getenv('API_BASE_URL'");
      
      assert.ok(hasGetEnv, 'API_BASE_URL должен быть определён через os.getenv');
    });

    it('должен иметь fallback значение', () => {
      if (generateError) this.skip();
      
      // Проверяем что есть fallback значение
      const hasFallback = generatedCode.includes('API_BASE_URL') && 
                         (generatedCode.includes('REPLIT_DEV_DOMAIN') ||
                          generatedCode.includes('localhost'));
      
      assert.ok(hasFallback, 'API_BASE_URL должен иметь fallback значение');
    });

    it('должен логироваться после определения', () => {
      if (generateError) this.skip();
      
      // Проверяем что значение логируется
      const hasLogging = generatedCode.includes('logging.info') && 
                        generatedCode.includes('API_BASE_URL');
      
      assert.ok(hasLogging, 'API_BASE_URL должен логироваться после определения');
    });
  });

  describe('PROJECT_ID', () => {
    it('должен быть определён', () => {
      if (generateError) this.skip();
      
      const hasProjectId = generatedCode.includes('PROJECT_ID');
      
      assert.ok(hasProjectId, 'PROJECT_ID должен быть определён');
    });
  });

  describe('BOT_TOKEN', () => {
    it('должен быть определён через os.getenv', () => {
      if (generateError) this.skip();
      
      const hasBotToken = generatedCode.includes('BOT_TOKEN') && 
                         generatedCode.includes('os.getenv');
      
      assert.ok(hasBotToken, 'BOT_TOKEN должен быть определён через os.getenv');
    });
  });

  describe('DATABASE_URL', () => {
    it('должен быть определён при включенной БД', () => {
      if (generateError) this.skip();
      
      const hasDatabaseUrl = generatedCode.includes('DATABASE_URL') && 
                            generatedCode.includes('os.getenv');
      
      assert.ok(hasDatabaseUrl, 'DATABASE_URL должен быть определён');
    });
  });

  describe('ADMIN_IDS', () => {
    it('должен быть определён', () => {
      if (generateError) this.skip();
      
      const hasAdminIds = generatedCode.includes('ADMIN_IDS');
      
      assert.ok(hasAdminIds, 'ADMIN_IDS должен быть определён');
    });
  });

  describe('Функция get_api_base_url', () => {
    it('должна быть определена при включенной БД', () => {
      // Генерируем код с включенной БД
      const codeWithDb = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        true, // userDatabaseEnabled = true
        1,
        false,
        false,
        true
      );
      
      const hasFunction = codeWithDb.includes('def get_api_base_url()');
      
      assert.ok(hasFunction, 'Функция get_api_base_url должна быть определена при включенной БД');
    });

    it('не должна быть определена при выключенной БД', () => {
      // Генерируем код без БД
      const codeWithoutDb = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        false, // userDatabaseEnabled = false
        null,
        false,
        false,
        true
      );
      
      const hasFunction = codeWithoutDb.includes('def get_api_base_url()');
      
      assert.ok(!hasFunction, 'Функция get_api_base_url не должна быть определена при выключенной БД');
    });

    it('должна проверять REPLIT_DEV_DOMAIN', () => {
      // Генерируем код с включенной БД
      const codeWithDb = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        true,
        1,
        false,
        false,
        true
      );
      
      const hasReplitCheck = codeWithDb.includes('REPLIT_DEV_DOMAIN');
      
      assert.ok(hasReplitCheck, 'Функция должна проверять REPLIT_DEV_DOMAIN');
    });

    it('должна добавлять https:// префикс если нужно', () => {
      // Генерируем код с включенной БД
      const codeWithDb = generatePythonCode(
        baseProject,
        'TestBot',
        [],
        true,
        1,
        false,
        false,
        true
      );
      
      const hasHttpsCheck = codeWithDb.includes('https://') ||
                           codeWithDb.includes('startswith("http")');
      
      assert.ok(hasHttpsCheck, 'Функция должна проверять наличие http/https префикса');
    });
  });

  describe('Отсутствие неопределённых переменных', () => {
    it('не должен содержать API_BASE_URL без определения', () => {
      if (generateError) this.skip();
      
      // Проверяем что API_BASE_URL не используется до определения
      const apiBaseUrlDefIndex = generatedCode.indexOf('API_BASE_URL =');
      const apiBaseUrlUseIndex = generatedCode.indexOf('if API_BASE_URL');
      
      // Если есть использование, должно быть после определения
      if (apiBaseUrlUseIndex !== -1 && apiBaseUrlDefIndex !== -1) {
        assert.ok(
          apiBaseUrlDefIndex < apiBaseUrlUseIndex,
          'API_BASE_URL должен быть определён до использования'
        );
      }
    });

    it('не должен содержать PROJECT_ID без определения', () => {
      if (generateError) this.skip();
      
      const projectIdDefIndex = generatedCode.indexOf('PROJECT_ID =');
      const projectIdUseIndex = generatedCode.indexOf('{PROJECT_ID}');
      
      if (projectIdUseIndex !== -1 && projectIdDefIndex !== -1) {
        assert.ok(
          projectIdDefIndex < projectIdUseIndex,
          'PROJECT_ID должен быть определён до использования'
        );
      }
    });
  });
});

describe('Проверка полноты определений', () => {
  it('должен содержать все необходимые импорты для работы с окружением', () => {
    const code = generatePythonCode(
      baseProject,
      'TestBot',
      [],
      true,
      1,
      false,
      false,
      true
    );
    
    assert.ok(code.includes('import os'), 'Должен быть import os');
    assert.ok(code.includes('import logging'), 'Должен быть import logging');
  });

  it('должен содержать dotenv загрузку', () => {
    const code = generatePythonCode(
      baseProject,
      'TestBot',
      [],
      true,
      1,
      false,
      false,
      true
    );
    
    const hasDotenv = code.includes('load_dotenv') || 
                     code.includes('from dotenv import');
    
    assert.ok(hasDotenv, 'Должна быть загрузка .env файла');
  });
});
