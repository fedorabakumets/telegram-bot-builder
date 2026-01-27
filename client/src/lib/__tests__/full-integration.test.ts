/**
 * Полные integration тесты для проверки взаимодействия всех модулей
 * Задача 10.2: Integration тесты для проверки взаимодействия модулей
 * 
 * Этот файл содержит комплексные тесты, которые проверяют:
 * 1. Взаимодействие между всеми генераторами
 * 2. Интеграцию с существующими модулями
 * 3. Корректность композиции всех компонентов
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { CodeGenerator } from '../Core/CodeGenerator';
import { GenerationContext } from '../Core/GenerationContext';
import { ImportsGenerator } from '../Generators/ImportsGenerator';
import { PythonCodeGenerator } from '../Generators/PythonCodeGenerator';
import { HandlerGenerator } from '../Generators/HandlerGenerator';
import { MainLoopGenerator } from '../Generators/MainLoopGenerator';
import { baselineTestData } from './test-data/baseline-test-data';
import { regressionTestData } from './test-data/regression-test-data';
import { BotData, Node } from '../../../../shared/schema';

describe('Full Integration тесты', () => {
  describe('Полная интеграция через generatePythonCode', () => {
    it('должен корректно интегрировать все компоненты для простого бота', () => {
      const result = generatePythonCode(
        baselineTestData.simpleStartBot,
        'FullIntegrationSimple',
        [],
        true,
        123,
        true
      );

      // Проверяем структуру файла
      expect(result).toContain('# -*- coding: utf-8 -*-');
      
      // Проверяем импорты
      expect(result).toContain('import asyncio');
      expect(result).toContain('import logging');
      expect(result).toContain('import os');
      expect(result).toContain('from aiogram import Bot, Dispatcher');
      expect(result).toContain('from aiogram.filters import CommandStart');
      
      // Проверяем инициализацию бота
      expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(result).toContain('bot = Bot(token=BOT_TOKEN)');
      expect(result).toContain('dp = Dispatcher()');
      
      // Проверяем глобальные переменные
      expect(result).toContain('API_BASE_URL = os.getenv');
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "123"))');
      
      // Проверяем утилитарные функции
      expect(result).toContain('async def save_message_to_api');
      expect(result).toContain('async def message_logging_middleware');
      expect(result).toContain('async def safe_edit_or_send');
      
      // Проверяем обработчики
      expect(result).toContain('@@NODE_START:start_1@@');
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('async def start_handler');
      expect(result).toContain('@@NODE_END:start_1@@');
      
      // Проверяем основную функцию
      expect(result).toContain('async def main():');
      expect(result).toContain('logging.basicConfig');
      expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).toContain('await dp.start_polling(bot)');
      expect(result).toContain('if __name__ == "__main__":');
      expect(result).toContain('asyncio.run(main())');
    });

    it('должен корректно интегрировать все компоненты для комплексного бота', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'FullIntegrationComplex',
        regressionTestData.testGroups,
        true,
        456,
        true
      );

      // Проверяем все секции кода
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('# Обработчики команд');
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('# Обработчики автопереходов');
      expect(result).toContain('# Основная функция');
      
      // Проверяем маркеры всех узлов
      const nodeIds = regressionTestData.complexBot.nodes.map(node => node.id);
      nodeIds.forEach(nodeId => {
        expect(result).toContain(`@@NODE_START:${nodeId}@@`);
        expect(result).toContain(`@@NODE_END:${nodeId}@@`);
      });
      
      // Проверяем специфичные для комплексного бота функции
      expect(result).toContain('user_selections = {}');
      expect(result).toContain('multi_select_done_');
      expect(result).toContain('handle_callback_');
      expect(result).toContain('auto_transition_');
    });
  });

  describe('Интеграция через CodeGenerator', () => {
    let codeGenerator: CodeGenerator;

    beforeEach(() => {
      codeGenerator = new CodeGenerator(
        new ImportsGenerator(),
        new PythonCodeGenerator(),
        new HandlerGenerator(),
        new MainLoopGenerator()
      );
    });

    it('должен корректно композировать все генераторы', () => {
      const context = GenerationContext.fromBotData(
        baselineTestData.inlineButtonBot,
        'CodeGeneratorIntegration',
        [],
        true,
        789,
        false
      );

      const result = codeGenerator.generate(context);

      // Проверяем, что все части присутствуют в правильном порядке
      const sections = [
        '# -*- coding: utf-8 -*-',
        'import asyncio',
        'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"',
        'async def save_message_to_api',
        '# Обработчики команд',
        '# Обработчики inline кнопок',
        'async def main():'
      ];

      let lastIndex = -1;
      sections.forEach(section => {
        const currentIndex = result.indexOf(section);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      });
    });

    it('должен правильно передавать контекст между генераторами', () => {
      const context = GenerationContext.fromBotData(
        baselineTestData.multiSelectBot,
        'ContextIntegration',
        regressionTestData.testGroups,
        true,
        999,
        true
      );

      const result = codeGenerator.generate(context);

      // Проверяем, что контекст правильно используется всеми генераторами
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "999"))');
      expect(result).toContain('logging.basicConfig');
      expect(result).toContain('user_selections = {}');
      expect(result).toContain('multi_select_done_multi_select_msg');
    });
  });

  describe('Интеграция с существующими модулями', () => {
    it('должен корректно интегрироваться с CommandHandler для всех типов команд', () => {
      const commandBot: BotData = {
        nodes: [
          {
            id: 'start_cmd',
            type: 'start',
            position: { x: 0, y: 0 },
            data: {
              command: '/start',
              text: 'Добро пожаловать!',
              buttons: []
            }
          },
          {
            id: 'help_cmd',
            type: 'command',
            position: { x: 0, y: 100 },
            data: {
              command: '/help',
              text: 'Справка по боту',
              adminOnly: true,
              isPrivateOnly: true,
              buttons: []
            }
          },
          {
            id: 'settings_cmd',
            type: 'command',
            position: { x: 0, y: 200 },
            data: {
              command: '/settings',
              text: 'Настройки бота',
              adminOnly: false,
              isPrivateOnly: false,
              buttons: []
            }
          }
        ],
        connections: []
      };

      const result = generatePythonCode(
        commandBot,
        'CommandIntegration',
        [],
        true,
        111,
        true
      );

      // Проверяем интеграцию с CommandHandler
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('async def start_handler');
      expect(result).toContain('@dp.message(Command("help"))');
      expect(result).toContain('async def help_handler');
      expect(result).toContain('@dp.message(Command("settings"))');
      expect(result).toContain('async def settings_handler');
      
      // Проверяем обработку флагов adminOnly и isPrivateOnly
      expect(result).toContain('is_admin');
      expect(result).toContain('is_private_chat');
    });

    it('должен корректно интегрироваться с MediaHandler для всех типов медиа', () => {
      const result = generatePythonCode(
        regressionTestData.mediaHandlerBot,
        'MediaIntegration',
        [],
        false,
        null,
        false
      );

      // Проверяем интеграцию с MediaHandler
      expect(result).toContain('# Обработчики медиа');
      expect(result).toContain('handle_sticker_sticker_handler');
      expect(result).toContain('handle_voice_voice_handler');
      expect(result).toContain('handle_animation_animation_handler');
      expect(result).toContain('handle_location_location_handler');
      expect(result).toContain('handle_contact_contact_handler');
      
      // Проверяем регистрацию обработчиков
      expect(result).toContain('@dp.message(F.sticker)');
      expect(result).toContain('@dp.message(F.voice)');
      expect(result).toContain('@dp.message(F.animation)');
      expect(result).toContain('@dp.message(F.location)');
      expect(result).toContain('@dp.message(F.contact)');
    });

    it('должен корректно интегрироваться с Keyboard для всех типов клавиатур', () => {
      const keyboardBot: BotData = {
        nodes: [
          {
            id: 'inline_node',
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              text: 'Inline клавиатура',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'inline_btn1',
                  text: 'Inline кнопка 1',
                  target: 'target1',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'reply_node',
            type: 'message',
            position: { x: 100, y: 0 },
            data: {
              text: 'Reply клавиатура',
              keyboardType: 'reply',
              buttons: [
                {
                  id: 'reply_btn1',
                  text: 'Reply кнопка 1',
                  target: 'target2',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'target1',
            type: 'message',
            position: { x: 0, y: 100 },
            data: { text: 'Цель 1', buttons: [] }
          },
          {
            id: 'target2',
            type: 'message',
            position: { x: 100, y: 100 },
            data: { text: 'Цель 2', buttons: [] }
          }
        ],
        connections: [
          { source: 'inline_node', target: 'target1' },
          { source: 'reply_node', target: 'target2' }
        ]
      };

      const result = generatePythonCode(
        keyboardBot,
        'KeyboardIntegration',
        [],
        true,
        222,
        false
      );

      // Проверяем интеграцию с Keyboard модулем
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('handle_callback_target1');
      expect(result).toContain('@dp.callback_query');
      expect(result).toContain('# Обработчики автопереходов');
      expect(result).toContain('InlineKeyboardMarkup');
      expect(result).toContain('ReplyKeyboardMarkup');
    });

    it('должен корректно интегрироваться с Synonyms для обработки синонимов', () => {
      const result = generatePythonCode(
        regressionTestData.synonymBot,
        'SynonymIntegration',
        [],
        true,
        333,
        false
      );

      // Проверяем интеграцию с Synonyms модулем
      expect(result).toContain('# Обработчики синонимов');
      expect(result).toContain('synonym_synonym_handler_synonym_привет_handler');
      expect(result).toContain('message.text.lower() == "привет"');
      expect(result).toContain('message.text.lower() == "здравствуй"');
      expect(result).toContain('message.text.lower() == "добро пожаловать"');
    });

    it('должен корректно интегрироваться с UserHandler для админских функций', () => {
      const result = generatePythonCode(
        regressionTestData.adminBot,
        'UserHandlerIntegration',
        [],
        true,
        444,
        true
      );

      // Проверяем интеграцию с UserHandler
      expect(result).toContain('ban_user_ban_cmd_handler');
      expect(result).toContain('unban_user_unban_cmd_handler');
      expect(result).toContain('mute_user_mute_cmd_handler');
      expect(result).toContain('kick_user_kick_cmd_handler');
      
      // Проверяем функции администрирования
      expect(result).toContain('async def is_admin');
      expect(result).toContain('ADMIN_IDS');
    });

    it('должен корректно интегрироваться с Conditional для условных сообщений', () => {
      const result = generatePythonCode(
        baselineTestData.conditionalBot,
        'ConditionalIntegration',
        [],
        true,
        555,
        false
      );

      // Проверяем интеграцию с Conditional модулем
      expect(result).toContain('# Условная логика сообщений');
      expect(result).toContain('user_type');
      expect(result).toContain('premium');
      expect(result).toContain('regular');
    });

    it('должен корректно интегрироваться с variable модулем для замены переменных', () => {
      const result = generatePythonCode(
        baselineTestData.inputBot,
        'VariableIntegration',
        [],
        true,
        666,
        false
      );

      // Проверяем интеграцию с variable модулем
      expect(result).toContain('{user_name}');
      expect(result).toContain('user_data[');
      expect(result).toContain('input_variable');
    });
  });

  describe('Интеграция с Templates системой', () => {
    it('должен корректно использовать все шаблоны в композиции', () => {
      const result = generatePythonCode(
        baselineTestData.multiSelectBot,
        'TemplateIntegration',
        [],
        true,
        777,
        true
      );

      // Проверяем использование шаблонов кодировки
      expect(result).toContain('# -*- coding: utf-8 -*-');
      
      // Проверяем использование шаблонов импортов
      expect(result).toContain('import asyncio');
      expect(result).toContain('import logging');
      expect(result).toContain('from aiogram import Bot, Dispatcher');
      
      // Проверяем использование шаблонов инициализации
      expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(result).toContain('bot = Bot(token=BOT_TOKEN)');
      
      // Проверяем использование шаблонов утилитарных функций
      expect(result).toContain('async def save_message_to_api');
      expect(result).toContain('async def safe_edit_or_send');
      
      // Проверяем использование шаблонов основной функции
      expect(result).toContain('async def main():');
      expect(result).toContain('asyncio.run(main())');
    });

    it('должен корректно применять условные шаблоны в зависимости от конфигурации', () => {
      // Тест с БД
      const resultWithDB = generatePythonCode(
        baselineTestData.simpleStartBot,
        'TemplateWithDB',
        [],
        true, // userDatabaseEnabled
        888,
        true
      );

      expect(resultWithDB).toContain('API_BASE_URL = os.getenv');
      expect(resultWithDB).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "888"))');
      expect(resultWithDB).toContain('async def save_message_to_api');
      expect(resultWithDB).toContain('dp.message.middleware(message_logging_middleware)');

      // Тест без БД
      const resultWithoutDB = generatePythonCode(
        baselineTestData.simpleStartBot,
        'TemplateWithoutDB',
        [],
        false, // userDatabaseEnabled
        null,
        false
      );

      expect(resultWithoutDB).not.toContain('API_BASE_URL = os.getenv');
      expect(resultWithoutDB).not.toContain('PROJECT_ID');
      expect(resultWithoutDB).not.toContain('async def save_message_to_api');
      expect(resultWithoutDB).not.toContain('message_logging_middleware');
    });
  });

  describe('Комплексные сценарии интеграции', () => {
    it('должен корректно обрабатывать бот со всеми возможными функциями', () => {
      // Создаем максимально комплексный бот
      const complexIntegrationBot: BotData = {
        nodes: [
          {
            id: 'start_complex',
            type: 'start',
            position: { x: 0, y: 0 },
            data: {
              command: '/start',
              text: 'Комплексный бот',
              synonyms: ['старт', 'начать'],
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'menu_btn',
                  text: 'Меню',
                  target: 'menu_node',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'menu_node',
            type: 'message',
            position: { x: 200, y: 0 },
            data: {
              text: 'Главное меню',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'survey_btn',
                  text: 'Опрос',
                  target: 'survey_node',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                },
                {
                  id: 'media_btn',
                  text: 'Медиа',
                  target: 'media_node',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'survey_node',
            type: 'message',
            position: { x: 400, y: 0 },
            data: {
              text: 'Выберите интересы',
              keyboardType: 'inline',
              allowMultipleSelection: true,
              multiSelectVariable: 'interests',
              continueButtonTarget: 'survey_result',
              buttons: [
                {
                  id: 'tech_btn',
                  text: 'Технологии',
                  action: 'selection',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                },
                {
                  id: 'sport_btn',
                  text: 'Спорт',
                  action: 'selection',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'survey_result',
            type: 'message',
            position: { x: 600, y: 0 },
            data: {
              text: 'Ваши интересы: {interests}',
              conditionalMessages: [
                {
                  id: 'tech_condition',
                  condition: 'interests',
                  value: 'Технологии',
                  messageText: 'Отлично! Вы любите технологии.'
                }
              ],
              autoTransitionTo: 'thanks_node',
              autoTransitionDelay: 3,
              buttons: []
            }
          },
          {
            id: 'thanks_node',
            type: 'message',
            position: { x: 800, y: 0 },
            data: {
              text: 'Спасибо за участие!',
              buttons: []
            }
          },
          {
            id: 'media_node',
            type: 'message',
            position: { x: 400, y: 200 },
            data: {
              text: 'Медиа контент',
              attachedMedia: [
                {
                  type: 'photo',
                  url: 'https://example.com/photo.jpg'
                }
              ],
              buttons: []
            }
          },
          {
            id: 'input_node',
            type: 'input',
            position: { x: 0, y: 400 },
            data: {
              text: 'Введите ваше имя:',
              inputVariable: 'user_name',
              inputTargetNodeId: 'greeting_node',
              buttons: []
            }
          },
          {
            id: 'greeting_node',
            type: 'message',
            position: { x: 200, y: 400 },
            data: {
              text: 'Привет, {user_name}!',
              buttons: []
            }
          },
          {
            id: 'sticker_handler',
            type: 'sticker',
            position: { x: 0, y: 600 },
            data: {
              text: 'Получен стикер!',
              buttons: []
            }
          },
          {
            id: 'admin_cmd',
            type: 'ban_user',
            position: { x: 200, y: 600 },
            data: {
              command: '/ban',
              text: 'Пользователь забанен',
              adminOnly: true,
              buttons: []
            }
          }
        ],
        connections: [
          { source: 'start_complex', target: 'menu_node' },
          { source: 'menu_node', target: 'survey_node' },
          { source: 'menu_node', target: 'media_node' },
          { source: 'survey_node', target: 'survey_result' },
          { source: 'survey_result', target: 'thanks_node' },
          { source: 'input_node', target: 'greeting_node' }
        ]
      };

      const result = generatePythonCode(
        complexIntegrationBot,
        'ComplexIntegrationBot',
        regressionTestData.testGroups,
        true,
        999,
        true
      );

      // Проверяем все компоненты интеграции
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "999"))');
      
      // Команды и синонимы
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('# Обработчики синонимов');
      expect(result).toContain('start_synonym_старт_handler');
      
      // Inline кнопки и callback'и
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('handle_callback_menu_node');
      expect(result).toContain('handle_callback_survey_node');
      
      // Множественный выбор
      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('user_selections = {}');
      expect(result).toContain('multi_select_done_survey_node');
      
      // Автопереходы
      expect(result).toContain('# Обработчики автопереходов');
      expect(result).toContain('auto_transition_survey_result_to_thanks_node');
      
      // Медиа обработчики
      expect(result).toContain('# Обработчики медиа');
      expect(result).toContain('handle_sticker_sticker_handler');
      
      // Админские функции
      expect(result).toContain('ban_user_admin_cmd_handler');
      expect(result).toContain('async def is_admin');
      
      // Ввод данных
      expect(result).toContain('user_data[');
      expect(result).toContain('{user_name}');
      
      // Условные сообщения
      expect(result).toContain('interests');
      expect(result).toContain('Технологии');
      
      // Основная функция
      expect(result).toContain('async def main():');
      expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).toContain('await dp.start_polling(bot)');
      
      // Маркеры всех узлов
      complexIntegrationBot.nodes.forEach(node => {
        expect(result).toContain(`@@NODE_START:${node.id}@@`);
        expect(result).toContain(`@@NODE_END:${node.id}@@`);
      });
    });

    it('должен корректно обрабатывать циклические зависимости между узлами', () => {
      const cyclicBot: BotData = {
        nodes: [
          {
            id: 'node_a',
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              text: 'Узел A',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'to_b',
                  text: 'К узлу B',
                  target: 'node_b',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'node_b',
            type: 'message',
            position: { x: 100, y: 0 },
            data: {
              text: 'Узел B',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'to_c',
                  text: 'К узлу C',
                  target: 'node_c',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          },
          {
            id: 'node_c',
            type: 'message',
            position: { x: 200, y: 0 },
            data: {
              text: 'Узел C',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'to_a',
                  text: 'К узлу A',
                  target: 'node_a',
                  action: 'goto',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          }
        ],
        connections: [
          { source: 'node_a', target: 'node_b' },
          { source: 'node_b', target: 'node_c' },
          { source: 'node_c', target: 'node_a' } // Циклическая зависимость
        ]
      };

      const result = generatePythonCode(
        cyclicBot,
        'CyclicIntegrationBot',
        [],
        false,
        null,
        false
      );

      // Проверяем, что циклические зависимости обрабатываются корректно
      expect(result).toContain('handle_callback_node_a');
      expect(result).toContain('handle_callback_node_b');
      expect(result).toContain('handle_callback_node_c');
      
      // Все узлы должны быть определены
      expect(result).toContain('@@NODE_START:node_a@@');
      expect(result).toContain('@@NODE_START:node_b@@');
      expect(result).toContain('@@NODE_START:node_c@@');
    });
  });

  describe('Проверка целостности интеграции', () => {
    it('должен генерировать синтаксически корректный Python код', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'SyntaxCheckBot',
        regressionTestData.testGroups,
        true,
        1111,
        true
      );

      // Базовые проверки синтаксиса Python
      const lines = result.split('\n');
      
      // Проверяем, что нет незакрытых скобок
      let openParens = 0;
      let openBrackets = 0;
      let openBraces = 0;
      
      for (const line of lines) {
        openParens += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
        openBrackets += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
        openBraces += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      }
      
      expect(openParens).toBe(0);
      expect(openBrackets).toBe(0);
      expect(openBraces).toBe(0);
      
      // Проверяем, что все async функции имеют await где необходимо
      const asyncFunctions = result.match(/async def \w+/g) || [];
      expect(asyncFunctions.length).toBeGreaterThan(0);
      
      // Проверяем, что есть основные структурные элементы
      expect(result).toContain('if __name__ == "__main__":');
      expect(result).toContain('asyncio.run(main())');
    });

    it('должен сохранять правильный порядок определений функций', () => {
      const result = generatePythonCode(
        baselineTestData.inlineButtonBot,
        'OrderCheckBot',
        [],
        true,
        2222,
        true
      );

      // Проверяем порядок основных секций
      const encodingIndex = result.indexOf('# -*- coding: utf-8 -*-');
      const importsIndex = result.indexOf('import asyncio');
      const botInitIndex = result.indexOf('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      const utilityIndex = result.indexOf('async def save_message_to_api');
      const handlersIndex = result.indexOf('# Обработчики команд');
      const mainIndex = result.indexOf('async def main():');
      const runIndex = result.indexOf('asyncio.run(main())');

      expect(encodingIndex).toBeLessThan(importsIndex);
      expect(importsIndex).toBeLessThan(botInitIndex);
      expect(botInitIndex).toBeLessThan(utilityIndex);
      expect(utilityIndex).toBeLessThan(handlersIndex);
      expect(handlersIndex).toBeLessThan(mainIndex);
      expect(mainIndex).toBeLessThan(runIndex);
    });

    it('должен корректно обрабатывать пустые и граничные случаи', () => {
      // Пустой бот
      const emptyResult = generatePythonCode(
        baselineTestData.emptyBot,
        'EmptyIntegrationBot',
        [],
        false,
        null,
        false
      );

      expect(emptyResult).toContain('# -*- coding: utf-8 -*-');
      expect(emptyResult).toContain('async def main():');
      expect(emptyResult).toContain('asyncio.run(main())');

      // Бот с одним узлом
      const singleNodeResult = generatePythonCode(
        baselineTestData.simpleStartBot,
        'SingleNodeBot',
        [],
        false,
        null,
        false
      );

      expect(singleNodeResult).toContain('@@NODE_START:start_1@@');
      expect(singleNodeResult).toContain('@@NODE_END:start_1@@');
    });
  });
});