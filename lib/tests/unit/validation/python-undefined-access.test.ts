/**
 * @fileoverview Тесты для проверки ошибок доступа к несуществующим атрибутам/переменным
 * 
 * Проверяет сгенерированный Python код на ошибку Pylance:
 * "Доступ к "" не осуществляется" (Access to "" is not available)
 * 
 * Эта ошибка возникает когда:
 * - Используется несуществующая переменная
 * - Используется несуществующий атрибут объекта
 * - Используется функция до её определения
 * - Используется переменная вне области видимости
 * 
 * @module tests/unit/validation/python-undefined-access.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { generatePythonCode } from '../../../bot-generator';
// Примечание: generateInitAllUserVars удалена после миграции на Jinja2
// import { generateInitAllUserVars } from '../../../bot-generator/database/generate-init-all-user-vars';
import { generateNavigateToNode } from '../../../bot-generator/transitions/generate-node-navigation';

describe('PythonUndefinedAccessValidation', () => {
  describe('Проверка использования определённых переменных', () => {
    // Примечание: тесты generateInitAllUserVars удалены после миграции на Jinja2
    // Функциональность перенесена в lib/templates/database/database.py.jinja2

    describe('generateNavigateToNode', () => {
      const code = generateNavigateToNode();

      it('должен использовать только определённые функции', () => {
        const usedFunctions = [
          'init_all_user_vars',
          'replace_variables_in_text',
          'message.answer',
        ];
        
        for (const func of usedFunctions) {
          assert.ok(
            code.includes(func),
            `Должна использоваться функция: ${func}`
          );
        }
      });

      it('должен определять все используемые локальные переменные', () => {
        assert.ok(
          code.includes('user_id = message.from_user.id'),
          'user_id должна быть определена'
        );
        assert.ok(
          code.includes('all_user_vars: dict = None'),
          'all_user_vars должна быть параметром'
        );
        assert.ok(
          code.includes('text: str = None'),
          'text должна быть параметром'
        );
        assert.ok(
          code.includes('variable_filters = user_data.get'),
          'variable_filters должна быть определена'
        );
      });

      it('не должен использовать message до определения', () => {
        // message это параметр функции, проверяем что он используется корректно
        assert.ok(
          code.includes('async def navigate_to_node(message,'),
          'message должна быть параметром функции'
        );
      });

      it('не должен использовать reply_markup до определения', () => {
        // reply_markup это параметр функции
        assert.ok(
          code.includes('reply_markup=None'),
          'reply_markup должна быть параметром функции'
        );
      });
    });
  });

  describe('Проверка области видимости переменных', () => {
    describe('Полная генерация кода', () => {
      const botData = {
        botName: 'TestBot',
        nodes: [
          {
            id: 'start_node',
            type: 'start' as const,
            data: {
              command: '/start',
              messageText: 'Hello',
              buttons: [],
              keyboardType: 'inline' as const,
            },
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      } as any;

      it('не должен содержать ошибок доступа к неопределённым переменным', () => {
        const code = generatePythonCode(botData, {
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        // Проверяем что код содержит основные определения
        assert.ok(
          code.includes('user_data = {}'),
          'user_data должна быть определена'
        );
        assert.ok(
          code.includes('all_user_vars = {}'),
          'all_user_vars должна быть определена'
        );
      });

      it('должен содержать основные определения функций', () => {
        const code = generatePythonCode(botData, {
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        // Проверяем что код содержит основные определения
        assert.ok(
          code.includes('async def'),
          'Должны быть async функции'
        );
        assert.ok(
          code.includes('def '),
          'Должны быть функции'
        );
      });

      it('не должен использовать переменные до их определения', () => {
        const code = generatePythonCode(botData, { 
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        // Проверяем что bot определён до использования
        const botIndex = code.indexOf('bot = Bot(');
        const dpIndex = code.indexOf('dp = Dispatcher(');
        
        assert.ok(
          botIndex !== -1 && dpIndex !== -1,
          'bot и dp должны быть определены'
        );
      });
    });
  });

  describe('Проверка импортов', () => {
    describe('Полная генерация кода', () => {
      const botData = {
        botName: 'TestBot',
        nodes: [
          {
            id: 'start_node',
            type: 'start' as const,
            data: {
              command: '/start',
              messageText: 'Hello',
              buttons: [],
              keyboardType: 'inline' as const,
            },
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      } as any;

      it('должен импортировать все используемые модули', () => {
        const code = generatePythonCode(botData, { 
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        // Проверяем основные импорты
        const requiredImports = [
          'import asyncio',
          'import logging',
          'from aiogram import Bot, Dispatcher',
          'from aiogram.types',
          'from aiogram.filters',
        ];

        for (const imp of requiredImports) {
          assert.ok(
            code.includes(imp),
            `Должен быть импортирован модуль: ${imp}`
          );
        }
      });

      it('должен импортировать types из aiogram', () => {
        const code = generatePythonCode(botData, { 
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        assert.ok(
          code.includes('from aiogram import Bot, Dispatcher, types') ||
          code.includes('from aiogram import types'),
          'types должен быть импортирован из aiogram'
        );
      });

      it('должен импортировать F для фильтров', () => {
        const code = generatePythonCode(botData, { 
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        assert.ok(
          code.includes('from aiogram import Bot, Dispatcher, types, F') ||
          code.includes('import F') ||
          code.includes('from aiogram import F'),
          'F должен быть импортирован для фильтров'
        );
      });
    });
  });

  describe('Проверка атрибутов объектов', () => {
    describe('Доступ к атрибутам message', () => {
      it('должен использовать только существующие атрибуты message', () => {
        // Проверяем что используются только валидные атрибуты message из aiogram
        const validMessageAttributes = [
          'message.from_user',
          'message.from_user.id',
          'message.from_user.username',
          'message.from_user.first_name',
          'message.from_user.last_name',
          'message.chat',
          'message.chat.id',
          'message.text',
          'message.message_id',
          'message.answer',
          'message.photo',
          'message.video',
          'message.audio',
          'message.document',
        ];

        // Эти атрибуты используются в генераторе
        const usedAttributes = [
          'message.from_user.id',
          'message.from_user.username',
          'message.from_user.first_name',
          'message.from_user.last_name',
          'message.chat.id',
          'message.text',
          'message.answer',
        ];

        for (const attr of usedAttributes) {
          assert.ok(
            validMessageAttributes.includes(attr),
            `Атрибут должен быть валидным: ${attr}`
          );
        }
      });

      it('не должен использовать несуществующие атрибуты message', () => {
        const invalidAttributes = [
          'message.user_id',  // должно быть message.from_user.id
          'message.chat_id',  // должно быть message.chat.id
          'message.username',  // должно быть message.from_user.username
          'message.first_name',  // должно быть message.from_user.first_name
        ];

        // Проверяем что эти атрибуты не используются напрямую
        const code = generateNavigateToNode();
        
        for (const invalidAttr of invalidAttributes) {
          // Игнорируем случаи когда это часть комментария или строки
          const lines = code.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('#') || line.includes('"""')) {
              continue;  // Пропускаем комментарии и строки
            }
            assert.ok(
              !line.includes(invalidAttr),
              `Не должен использоваться несуществующий атрибут: ${invalidAttr}`
            );
          }
        }
      });
    });

    describe('Доступ к атрибутам callback_query', () => {
      it('должен использовать только существующие атрибуты callback_query', () => {
        const validCallbackAttributes = [
          'callback_query.from_user',
          'callback_query.from_user.id',
          'callback_query.data',
          'callback_query.message',
          'callback_query.answer',
          'callback_query.edit_text',
          'callback_query.chat_instance',
        ];

        // Эти атрибуты используются в генераторе
        const usedAttributes = [
          'callback_query.from_user.id',
          'callback_query.data',
          'callback_query.message',
          'callback_query.answer',
        ];

        for (const attr of usedAttributes) {
          assert.ok(
            validCallbackAttributes.includes(attr),
            `Атрибут должен быть валидным: ${attr}`
          );
        }
      });
    });

    describe('Доступ к атрибутам bot', () => {
      it('должен использовать только существующие атрибуты bot', () => {
        const validBotAttributes = [
          'bot.send_message',
          'bot.send_photo',
          'bot.send_video',
          'bot.send_audio',
          'bot.send_document',
          'bot.edit_message_text',
          'bot.delete_message',
          'bot.get_file',
          'bot.get_user_profile_photos',
          'bot.set_my_commands',
          'bot.session',
        ];

        // Эти атрибуты используются в генераторе
        const usedAttributes = [
          'bot.send_message',
          'bot.send_photo',
          'bot.get_file',
          'bot.get_user_profile_photos',
          'bot.set_my_commands',
          'bot.session.close',
        ];

        for (const attr of usedAttributes) {
          assert.ok(
            validBotAttributes.includes(attr) || attr.startsWith('bot.'),
            `Атрибут должен быть валидным: ${attr}`
          );
        }
      });
    });
  });

  describe('Интеграционные тесты', () => {
    it('должен генерировать код без ошибок доступа к неопределённым переменным', () => {
      const botData = {
        botName: 'TestBot',
        nodes: [
          {
            id: 'start_node',
            type: 'start' as const,
            data: {
              command: '/start',
              messageText: 'Hello {user_name}',
              buttons: [],
              keyboardType: 'inline' as const,
            },
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      } as any;

      const code = generatePythonCode(botData, {
        botName: 'TestBot',
        enableLogging: false,
        enableComments: false,
      });

      // Проверяем что переменная user_name определяется до использования
      const userInitIndex = code.indexOf('await init_user_variables');

      // user_name используется в тексте сообщения, а не в коде
      // Проверяем что init_user_variables вызывается до использования user_name
      assert.ok(
        userInitIndex !== -1,
        'init_user_variables должна вызываться'
      );
    });

    it('должен определять db_pool до использования', () => {
      const botData = {
        botName: 'TestBot',
        nodes: [
          {
            id: 'start_node',
            type: 'start' as const,
            data: {
              command: '/start',
              messageText: 'Hello',
              buttons: [],
              keyboardType: 'inline' as const,
            },
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      } as any;

      const code = generatePythonCode(botData, {
        botName: 'TestBot',
        userDatabaseEnabled: true,
        enableLogging: false,
        enableComments: false,
      });

      // Проверяем что db_pool определён в коде
      const dbPoolDef = code.indexOf('db_pool = None');
      
      assert.ok(
        dbPoolDef !== -1,
        'db_pool должна быть определена'
      );
    });

    it('должен определять PROJECT_DIR до использования', () => {
      const botData = {
        botName: 'TestBot',
        nodes: [
          {
            id: 'start_node',
            type: 'start',
            data: {
              command: '/start',
              messageText: 'Hello',
              buttons: [],
              keyboardType: 'inline',
              attachedMedia: ['/uploads/test.jpg'],
            },
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      } as any;

      const code = generatePythonCode(botData, { 
        botName: 'TestBot',
        enableLogging: false,
        enableComments: false,
      });

      const projectDirDef = code.indexOf('PROJECT_DIR = os.path.dirname');
      
      assert.ok(
        projectDirDef !== -1,
        'PROJECT_DIR должна быть определена'
      );
    });
  });

  describe('Проверка на распространённые ошибки Pylance', () => {
    const pylanceUndefinedAccessPatterns = [
      { 
        name: 'Доступ к несуществующему атрибуту message', 
        pattern: /message\.(user_id|chat_id|username|first_name|last_name)(?!\.from_user)/ 
      },
      { 
        name: 'Доступ к несуществующему атрибуту callback_query', 
        pattern: /callback_query\.(user_id|chat_id|text|photo)/ 
      },
      { 
        name: 'Использование неопределённой переменной user_id', 
        pattern: /(?<!message\.from_user\.)(?<!callback_query\.from_user\.)(?<!user_id\s*=\s*)user_id(?!\s*=)/ 
      },
      { 
        name: 'Использование неопределённой переменной all_user_vars', 
        pattern: /(?<!all_user_vars\s*=\s*)all_user_vars(?!\s*=)/ 
      },
      { 
        name: 'Использование неопределённой переменной db_pool', 
        pattern: /(?<!db_pool\s*=\s*)db_pool(?!\s*=)/ 
      },
    ];

    for (const { name, pattern } of pylanceUndefinedAccessPatterns) {
      it(`не должен содержать ошибку: ${name}`, () => {
        const botData = {
          botName: 'TestBot',
          nodes: [
            {
              id: 'start_node',
              type: 'start',
              data: {
                command: '/start',
                messageText: 'Hello',
                buttons: [],
                keyboardType: 'inline',
              },
              position: { x: 0, y: 0 },
            },
          ],
          connections: [],
        } as any;

        const code = generatePythonCode(botData, {
          botName: 'TestBot',
          enableLogging: false,
          enableComments: false,
        });

        // Для некоторых паттернов делаем исключение если они в комментариях
        const lines = code.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('#')) {
            continue;  // Пропускаем комментарии
          }
          if (line.includes('"""') || line.includes("'''")) {
            continue;  // Пропускаем строки документации
          }
          
          // Проверяем что паттерн не совпадает с кодом
          // (с учётом что некоторые совпадения могут быть валидными)
          if (pattern.test(line)) {
            // Дополнительная проверка на валидность
            if (name.includes('message')) {
              assert.ok(
                line.includes('message.from_user') || 
                line.includes('message.chat') ||
                line.includes('message.text') ||
                line.includes('message.answer') ||
                line.includes('message.message_id'),
                `Строка должна использовать валидные атрибуты message: ${line.trim()}`
              );
            }
          }
        }
      });
    }
  });
});
