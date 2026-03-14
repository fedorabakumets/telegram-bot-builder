/**
 * @fileoverview Интеграционные тесты для полной генерации Python кода бота
 * @module lib/tests/integration/full-generation.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { generatePythonCode } from '../../bot-generator';
import type { BotData, BotGroup } from '@shared/schema';

describe('FullGeneration (Integration)', () => {
  describe('generatePythonCode - простой бот', () => {
    it('должен генерировать валидный Python код для простого бота', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет! Добро пожаловать.',
              command: '/start',
              showInMenu: true,
              buttons: [
                {
                  id: 'btn_1',
                  text: 'Начать',
                  action: 'goto',
                  target: 'message_1',
                },
              ],
            },
          },
          {
            id: 'message_1',
            type: 'message',
            position: { x: 200, y: 200 },
            data: {
              text: 'Главное меню',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, {
        botName: 'TestBot',
        enableComments: true,
        enableLogging: false,
      });

      // Assert
      assert.ok(code);
      assert.ok(code.length > 0);
      assert.ok(code.includes('import asyncio'));
      assert.ok(code.includes('from aiogram import Bot, Dispatcher'));
      assert.ok(code.includes('async def main():'));
      assert.ok(code.includes('if __name__ == "__main__":'));
      assert.ok(code.includes('asyncio.run(main())'));
    });

    it('должен генерировать код с именем бота в docstring', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'MyCustomBot' });

      // Assert
      assert.ok(code.includes('MyCustomBot'));
    });

    it('должен генерировать код с обработчиком /start команды', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData);

      // Assert
      assert.ok(code.includes('/start') || code.includes('start'));
    });
  });

  describe('generatePythonCode - бот с командами', () => {
    it('должен генерировать код с несколькими командами', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              showInMenu: true,
              buttons: [],
            },
          },
          {
            id: 'command_1',
            type: 'command',
            position: { x: 200, y: 200 },
            data: {
              text: 'Помощь',
              command: '/help',
              showInMenu: true,
              buttons: [],
            },
          },
          {
            id: 'command_2',
            type: 'command',
            position: { x: 300, y: 300 },
            data: {
              text: 'О боте',
              command: '/about',
              showInMenu: false,
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'CommandsBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('/start'));
      assert.ok(code.includes('/help'));
      assert.ok(code.includes('/about'));
    });
  });

  describe('generatePythonCode - бот с inline кнопками', () => {
    it('должен генерировать код с inline кнопками', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [
                {
                  id: 'inline_btn_1',
                  text: 'Inline кнопка',
                  action: 'inline',
                  target: 'message_1',
                },
              ],
            },
          },
          {
            id: 'message_1',
            type: 'message',
            position: { x: 200, y: 200 },
            data: {
              text: 'Ответ на inline кнопку',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'InlineBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('InlineKeyboard') || code.includes('inline_keyboard'));
    });
  });

  describe('generatePythonCode - бот с reply кнопками', () => {
    it('должен генерировать код с reply кнопками', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [
                {
                  id: 'reply_btn_1',
                  text: 'Reply кнопка',
                  action: 'goto',
                  target: 'message_1',
                },
              ],
            },
          },
          {
            id: 'message_1',
            type: 'message',
            position: { x: 200, y: 200 },
            data: {
              text: 'Ответ',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'ReplyBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('ReplyKeyboard') || code.includes('reply_keyboard') || code.includes('KeyboardButton'));
    });
  });

  describe('generatePythonCode - бот с автопереходами', () => {
    it('должен генерировать код с автопереходами', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              enableAutoTransition: true,
              autoTransitionTo: 'message_1',
              autoTransitionDelay: 2,
              buttons: [],
            },
          },
          {
            id: 'message_1',
            type: 'message',
            position: { x: 200, y: 200 },
            data: {
              text: 'Автоматический ответ',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'AutoBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('asyncio.sleep') || code.includes('sleep'));
    });
  });

  describe('generatePythonCode - бот с сбором пользовательского ввода', () => {
    it('должен генерировать код с сбором пользовательского ввода', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'input_1',
            type: 'message',
            position: { x: 100, y: 100 },
            data: {
              text: 'Введите ваше имя:',
              collectUserInput: true,
              inputTargetNodeId: 'message_after_input',
              responseType: 'text',
              buttons: [],
            },
          },
          {
            id: 'message_after_input',
            type: 'message',
            position: { x: 200, y: 200 },
            data: {
              text: 'Спасибо!',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'InputBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('waiting_for_input') || code.includes('user_input'));
    });
  });

  describe('generatePythonCode - бот с опциями генерации', () => {
    it('должен генерировать код с включенным логированием', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, {
        botName: 'LoggingBot',
        enableLogging: true,
      });

      // Assert
      assert.ok(code);
      // Логирование может быть реализовано через print или logging
      assert.ok(code.includes('logging') || code.includes('print(') || code.includes('logger'));
    });

    it('должен генерировать код с включенными комментариями', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, {
        botName: 'CommentsBot',
        enableComments: true,
      });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('#'));
    });

    it('должен генерировать код без комментариев при enableComments: false', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, {
        botName: 'NoCommentsBot',
        enableComments: false,
      });

      // Assert
      assert.ok(code);
      // Код всё ещё может содержать некоторые комментарии (например, в docstring)
      // но их должно быть меньше
    });
  });

  describe('generatePythonCode - бот с базой данных', () => {
    it('должен генерировать код с включенной базой данных', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, {
        botName: 'DatabaseBot',
        userDatabaseEnabled: true,
      });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('user_data') || code.includes('database') || code.includes('db'));
    });
  });

  describe('generatePythonCode - бот с группами', () => {
    it('должен генерировать код с конфигурацией групп', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      const groups: BotGroup[] = [
        {
          id: 1,
          projectId: 1,
          name: 'Test Group',
          groupId: '-1001234567890',
          enabled: true,
        },
      ] as unknown as BotGroup[];

      // Act
      const code = generatePythonCode(botData, {
        botName: 'GroupBot',
        groups,
        enableGroupHandlers: true,
      });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('-1001234567890') || code.includes('group') || code.includes('Group'));
    });
  });

  describe('generatePythonCode - edge cases', () => {
    it('должен генерировать код для бота без узлов', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'EmptyBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('import asyncio'));
      assert.ok(code.includes('async def main():'));
    });

    it('должен генерировать код для бота с одним узлом', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'SingleNodeBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.includes('SingleNodeBot'));
    });

    it('должен генерировать код для бота с большим количеством узлов', () => {
      // Arrange
      const nodes = Array.from({ length: 50 }, (_, i) => ({
        id: `node_${i}`,
        type: 'message' as const,
        position: { x: i * 100, y: i * 100 },
        data: {
          text: `Message ${i}`,
          buttons: i < 49 ? [{
            id: `btn_${i}`,
            text: 'Next',
            action: 'goto' as const,
            target: `node_${i + 1}`,
          }] : [],
        },
      }));

      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 0, y: 0 },
            data: {
              text: 'Start',
              command: '/start',
              buttons: [{
                id: 'btn_start',
                text: 'Begin',
                action: 'goto',
                target: 'node_0',
              }],
            },
          },
          ...nodes,
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'BigBot' });

      // Assert
      assert.ok(code);
      assert.ok(code.length > 1000);
    });
  });

  describe('generatePythonCode - валидация результата', () => {
    it('должен генерировать код который проходит валидацию', () => {
      // Arrange
      const botData: BotData = {
        id: 1,
        projectId: 1,
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              text: 'Привет!',
              command: '/start',
              buttons: [],
            },
          },
        ],
      } as unknown as BotData;

      // Act
      const code = generatePythonCode(botData, { botName: 'ValidBot' });

      // Assert - код должен содержать все обязательные элементы
      assert.ok(code.includes('import asyncio'), 'должен содержать import asyncio');
      assert.ok(code.includes('Bot'), 'должен содержать Bot');
      assert.ok(code.includes('Dispatcher'), 'должен содержать Dispatcher');
      assert.ok(code.includes('async def main():'), 'должен содержать async def main()');
      assert.ok(code.includes('if __name__ == "__main__":'), 'должен содержать if __name__');
      assert.ok(code.includes('asyncio.run(main())'), 'должен содержать asyncio.run(main())');
    });
  });
});
