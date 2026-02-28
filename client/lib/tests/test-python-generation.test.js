/**
 * @fileoverview Тест генерации Python кода бота
 *
 * Проверяет, что сгенерированный код содержит все обязательные компоненты:
 * - Базовые импорты (asyncio, Bot, Dispatcher)
 * - Точку входа (if __name__ == "__main__":)
 * - Функцию main()
 *
 * @module tests/test-python-generation
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { generatePythonCode } from '../bot-generator.js';
import { validateGeneratedPython } from '../bot-generator/validation/validate-generated-python.js';

/**
 * Тестовые данные бота с автопереходами
 */
const testBotData = {
  sheets: [
    {
      id: 'test-sheet-1',
      name: 'Лист 1',
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: {
            command: '/start',
            messageText: 'Привет! Я ваш новый бот.',
            buttons: [],
            keyboardType: 'none',
            enableAutoTransition: true,
            autoTransitionTo: 'message-1',
            collectUserInput: false,
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
            enableTextInput: false,
            enablePhotoInput: false,
            enableVideoInput: false,
            enableAudioInput: false,
            enableDocumentInput: false,
            inputVariable: '',
            photoInputVariable: '',
            videoInputVariable: '',
            audioInputVariable: '',
            documentInputVariable: ''
          }
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 100, y: 300 },
          data: {
            messageText: 'Новое сообщение',
            buttons: [],
            keyboardType: 'none',
            collectUserInput: false,
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
            enableTextInput: false,
            enablePhotoInput: false,
            enableVideoInput: false,
            enableAudioInput: false,
            enableDocumentInput: false,
            inputVariable: '',
            photoInputVariable: '',
            videoInputVariable: '',
            audioInputVariable: '',
            documentInputVariable: ''
          }
        }
      ],
      createdAt: '2026-02-28T00:00:00.000Z',
      updatedAt: '2026-02-28T00:00:00.000Z',
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 }
    }
  ],
  version: 2,
  activeSheetId: 'test-sheet-1'
};

describe('Генерация Python кода бота', () => {
  let generatedCode = '';
  let generateError = null;

  before(() => {
    // Генерируем код перед тестами
    try {
      generatedCode = generatePythonCode(
        testBotData,
        'TestBot',
        [],
        false, // userDatabaseEnabled
        null,  // projectId
        false, // enableLogging
        false, // enableGroupHandlers
        true   // enableComments
      );
    } catch (error) {
      generateError = error.message;
      console.error('Ошибка генерации:', error.message);
      console.error('Сгенерированный код (первые 500 символов):', generatedCode?.substring(0, 500));
    }
  });

  describe('Базовые импорты', () => {
    it('должен успешно генерировать код без ошибок', () => {
      if (generateError) {
        console.error('Код генерации:', generatedCode?.substring(0, 1000));
      }
      assert.strictEqual(generateError, null, `Генерация кода не удалась: ${generateError}`);
    });

    it('должен содержать import asyncio', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('import asyncio'),
        'Отсутствует import asyncio'
      );
    });

    it('должен содержать from aiogram import Bot', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('from aiogram import Bot'),
        'Отсутствует from aiogram import Bot'
      );
    });

    it('должен содержать from aiogram import Dispatcher', () => {
      if (generateError) this.skip();
      // Проверяем наличие Dispatcher в импортах (может быть в combined import)
      const hasDispatcherImport = generatedCode.includes('from aiogram import') && generatedCode.includes('Dispatcher');
      assert.ok(
        hasDispatcherImport,
        'Отсутствует from aiogram import ... Dispatcher'
      );
    });

    it('должен содержать dp = Dispatcher()', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('dp = Dispatcher()'),
        'Отсутствует dp = Dispatcher()'
      );
    });

    it('должен содержать import logging', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('import logging'),
        'Отсутствует import logging'
      );
    });

    it('должен содержать import signal', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('import signal'),
        'Отсутствует import signal'
      );
    });
  });

  describe('Точка входа', () => {
    it('должен содержать async def main():', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('async def main():'),
        'Отсутствует async def main():'
      );
    });

    it('должен содержать if __name__ == "__main__":', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('if __name__ == "__main__":'),
        'Отсутствует if __name__ == "__main__":'
      );
    });

    it('должен содержать asyncio.run(main())', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('asyncio.run(main())'),
        'Отсутствует asyncio.run(main())'
      );
    });
  });

  describe('Валидация кода', () => {
    it('должен проходить валидацию validateGeneratedPython', () => {
      if (generateError) this.skip();
      const result = validateGeneratedPython(generatedCode);
      assert.ok(
        result.isValid,
        `Валидация не пройдена: ${result.errorMessage}\nОтсутствуют: ${result.missingComponents.join(', ')}`
      );
    });
  });

  describe('Обработчики узлов', () => {
    it('должен содержать обработчик start узла', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('start') || generatedCode.includes('/start'),
        'Отсутствует обработчик start узла'
      );
    });

    it('должен содержать обработчик message узла', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('message-1') || generatedCode.includes('Новое сообщение'),
        'Отсутствует обработчик message узла'
      );
    });
  });

  describe('Структура кода', () => {
    it('должен начинаться с docstring', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.trim().startsWith('"""'),
        'Код должен начинаться с docstring """'
      );
    });

    it('должен содержать UTF-8 кодировку', () => {
      if (generateError) this.skip();
      assert.ok(
        generatedCode.includes('# -*- coding: utf-8 -*-') ||
        generatedCode.includes('# coding: utf-8'),
        'Отсутствует объявление UTF-8 кодировки'
      );
    });

    it('должен содержать импорты до основного кода', () => {
      if (generateError) this.skip();
      const importIndex = generatedCode.indexOf('import asyncio');
      const mainIndex = generatedCode.indexOf('async def main():');
      assert.ok(
        importIndex !== -1 && mainIndex !== -1 && importIndex < mainIndex,
        'Импорты должны быть до определения main()'
      );
    });
  });
});

describe('Валидация validateGeneratedPython', () => {
  it('должна возвращать isValid=true для валидного кода', () => {
    const validCode = `
import asyncio
from aiogram import Bot, Dispatcher

bot = Bot(token="123")
dp = Dispatcher()

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
`;
    const result = validateGeneratedPython(validCode);
    assert.strictEqual(result.isValid, true, 'Валидный код должен проходить валидацию');
    assert.strictEqual(result.missingComponents.length, 0, 'Не должно быть отсутствующих компонентов');
  });

  it('должна возвращать isValid=false для невалидного кода', () => {
    const invalidCode = '# Просто комментарий';
    const result = validateGeneratedPython(invalidCode);
    assert.strictEqual(result.isValid, false, 'Невалидный код не должен проходить валидацию');
    assert.ok(result.missingComponents.length > 0, 'Должны быть отсутствующие компоненты');
  });

  it('должна проходить код с импортом from aiogram import Bot, Dispatcher', () => {
    const code = `
import asyncio
from aiogram import Bot, Dispatcher, types, F

dp = Dispatcher()

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;
    const result = validateGeneratedPython(code);
    assert.strictEqual(result.isValid, true, 'Код с совместным импортом должен проходить валидацию');
  });
});
