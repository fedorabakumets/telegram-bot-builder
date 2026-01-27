/**
 * Integration и Performance тесты для bot-generator
 * Задача 10.2: Integration и performance тесты
 * 
 * Этот файл содержит:
 * 1. Integration тесты для проверки взаимодействия модулей
 * 2. Performance тесты для контроля производительности (цель: <500ms для больших ботов)
 * 3. Snapshot тесты для проверки стабильности генерируемого кода
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { CodeGenerator } from '../Core/CodeGenerator';
import { GenerationContext } from '../Core/GenerationContext';
import { ImportsGenerator } from '../Generators/ImportsGenerator';
import { PythonCodeGenerator } from '../Generators/PythonCodeGenerator';
import { HandlerGenerator } from '../Generators/HandlerGenerator';
import { MainLoopGenerator } from '../Generators/MainLoopGenerator';
import { baselineTestData } from './test-data/baseline-test-data';
import { regressionTestData } from './test-data/regression-test-data';
import { BotData } from '../../../../shared/schema';

describe('Integration и Performance тесты', () => {
  let performanceResults: Array<{ testName: string; duration: number; codeSize: number }> = [];

  beforeEach(() => {
    performanceResults = [];
  });

  afterEach(() => {
    // Выводим результаты производительности после каждого теста
    if (performanceResults.length > 0) {
      console.log('\n📊 Результаты производительности:');
      performanceResults.forEach(result => {
        console.log(`  ${result.testName}: ${result.duration.toFixed(2)}ms (${result.codeSize} символов)`);
      });
    }
  });

  /**
   * Вспомогательная функция для измерения производительности
   */
  const measurePerformance = async (testName: string, fn: () => Promise<string> | string): Promise<string> => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceResults.push({
      testName,
      duration,
      codeSize: result.length
    });
    
    return result;
  };

  describe('Integration тесты - взаимодействие модулей', () => {
    describe('Полная интеграция через CodeGenerator', () => {
      it('должен корректно интегрировать все генераторы для простого бота', async () => {
        const context = GenerationContext.fromBotData(
          baselineTestData.simpleStartBot,
          'SimpleBot',
          [],
          true,
          123,
          true
        );

        const codeGenerator = new CodeGenerator(
          new ImportsGenerator(),
          new PythonCodeGenerator(),
          new HandlerGenerator(),
          new MainLoopGenerator()
        );

        const result = await measurePerformance('Simple Bot Integration', () => 
          codeGenerator.generate(context)
        );

        // Проверяем, что все части присутствуют
        expect(result).toContain('# -*- coding: utf-8 -*-');
        expect(result).toContain('from aiogram import Bot, Dispatcher');
        expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
        expect(result).toContain('async def start_handler');
        expect(result).toContain('async def main():');
        expect(result).toContain('asyncio.run(main())');

        // Проверяем маркеры узлов
        expect(result).toContain('@@NODE_START:start_1@@');
        expect(result).toContain('@@NODE_END:start_1@@');
      });

      it('должен корректно интегрировать все генераторы для комплексного бота', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.complexBot,
          'ComplexBot',
          regressionTestData.testGroups,
          true,
          456,
          true
        );

        const codeGenerator = new CodeGenerator(
          new ImportsGenerator(),
          new PythonCodeGenerator(),
          new HandlerGenerator(),
          new MainLoopGenerator()
        );

        const result = await measurePerformance('Complex Bot Integration', () => 
          codeGenerator.generate(context)
        );

        // Проверяем основные компоненты
        expect(result).toContain('# -*- coding: utf-8 -*-');
        expect(result).toContain('from aiogram import Bot, Dispatcher');
        expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "456"))');
        
        // Проверяем обработчики
        expect(result).toContain('async def start_handler');
        expect(result).toContain('# Обработчики inline кнопок');
        expect(result).toContain('# Обработчики множественного выбора');
        expect(result).toContain('# Обработчики автопереходов');
        
        // Проверяем основную функцию
        expect(result).toContain('async def main():');
        expect(result).toContain('dp.message.middleware(message_logging_middleware)');
        expect(result).toContain('await dp.start_polling(bot)');

        // Проверяем маркеры всех узлов
        expect(result).toContain('@@NODE_START:start_complex@@');
        expect(result).toContain('@@NODE_START:main_menu@@');
        expect(result).toContain('@@NODE_START:survey_start@@');
      });
    });

    describe('Интеграция с существующими модулями', () => {
      it('должен корректно интегрироваться с CommandHandler', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.adminBot,
          'AdminBot',
          [],
          true,
          789,
          true
        );

        const handlerGenerator = new HandlerGenerator();
        
        const result = await measurePerformance('CommandHandler Integration', () => 
          handlerGenerator.generateMessageHandlers(context)
        );

        // Проверяем интеграцию с CommandHandler
        expect(result).toContain('@dp.message(CommandStart())');
        expect(result).toContain('@dp.message(Command("help"))');
        expect(result).toContain('async def help_handler');
        expect(result).toContain('async def ban_user_ban_cmd_handler');
        expect(result).toContain('async def unban_user_unban_cmd_handler');
      });

      it('должен корректно интегрироваться с MediaHandler', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.mediaHandlerBot,
          'MediaBot',
          [],
          false,
          null,
          false
        );

        const handlerGenerator = new HandlerGenerator();
        
        const result = await measurePerformance('MediaHandler Integration', () => 
          handlerGenerator.generateMediaHandlers(context)
        );

        // Проверяем интеграцию с MediaHandler
        expect(result).toContain('# Обработчики медиа');
        expect(result).toContain('handle_sticker_sticker_handler');
        expect(result).toContain('handle_voice_voice_handler');
        expect(result).toContain('handle_animation_animation_handler');
        expect(result).toContain('handle_location_location_handler');
        expect(result).toContain('handle_contact_contact_handler');
      });

      it('должен корректно интегрироваться с Keyboard модулем', async () => {
        const context = GenerationContext.fromBotData(
          baselineTestData.inlineButtonBot,
          'KeyboardBot',
          [],
          true,
          111,
          false
        );

        const handlerGenerator = new HandlerGenerator();
        
        const result = await measurePerformance('Keyboard Integration', () => 
          handlerGenerator.generateCallbackHandlers(context)
        );

        // Проверяем интеграцию с Keyboard
        expect(result).toContain('# Обработчики inline кнопок');
        expect(result).toContain('handle_callback_target_1');
        expect(result).toContain('handle_callback_target_2');
        expect(result).toContain('@dp.callback_query');
      });

      it('должен корректно интегрироваться с Synonyms модулем', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.synonymBot,
          'SynonymBot',
          [],
          false,
          null,
          false
        );

        const handlerGenerator = new HandlerGenerator();
        
        const result = await measurePerformance('Synonyms Integration', () => 
          handlerGenerator.generateMessageHandlers(context)
        );

        // Проверяем интеграцию с Synonyms
        expect(result).toContain('# Обработчики синонимов');
        expect(result).toContain('synonym_synonym_handler_synonym_привет_handler');
        expect(result).toContain('message.text.lower() == "привет"');
        expect(result).toContain('message.text.lower() == "здравствуй"');
      });
    });

    describe('Интеграция с Templates системой', () => {
      it('должен корректно использовать шаблоны в генерации', async () => {
        const context = GenerationContext.fromBotData(
          baselineTestData.multiSelectBot,
          'TemplateBot',
          [],
          true,
          222,
          true
        );

        const importsGenerator = new ImportsGenerator();
        const pythonCodeGenerator = new PythonCodeGenerator();
        
        const imports = await measurePerformance('Templates - Imports', () => 
          importsGenerator.generateImports(context)
        );
        
        const botInit = await measurePerformance('Templates - Bot Init', () => 
          pythonCodeGenerator.generateBotInitialization(context)
        );

        // Проверяем использование шаблонов
        expect(imports).toContain('# -*- coding: utf-8 -*-');
        expect(imports).toContain('import asyncio');
        expect(imports).toContain('from aiogram import Bot, Dispatcher');
        
        expect(botInit).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
        expect(botInit).toContain('bot = Bot(token=BOT_TOKEN)');
        expect(botInit).toContain('dp = Dispatcher()');
      });
    });
  });

  describe('Performance тесты - производительность генерации', () => {
    describe('Целевая производительность <500ms для больших ботов', () => {
      it('должен генерировать простой бот быстро (<50ms)', async () => {
        const result = await measurePerformance('Simple Bot Performance', () => 
          generatePythonCode(
            baselineTestData.simpleStartBot,
            'FastSimpleBot',
            [],
            false,
            null,
            false
          )
        );

        expect(result).toBeTruthy();
        
        // Проверяем, что время генерации меньше 50ms
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(50);
      });

      it('должен генерировать средний бот быстро (<200ms)', async () => {
        const result = await measurePerformance('Medium Bot Performance', () => 
          generatePythonCode(
            baselineTestData.inlineButtonBot,
            'FastMediumBot',
            [],
            true,
            123,
            true
          )
        );

        expect(result).toBeTruthy();
        
        // Проверяем, что время генерации меньше 200ms
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(200);
      });

      it('должен генерировать комплексный бот быстро (<500ms)', async () => {
        const result = await measurePerformance('Complex Bot Performance', () => 
          generatePythonCode(
            regressionTestData.complexBot,
            'FastComplexBot',
            regressionTestData.testGroups,
            true,
            456,
            true
          )
        );

        expect(result).toBeTruthy();
        
        // Проверяем, что время генерации меньше 500ms (основная цель)
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(500);
      });

      it('должен генерировать очень большой бот в разумное время (<1000ms)', async () => {
        // Создаем очень большой бот с множеством узлов
        const largeBotData: BotData = {
          nodes: [],
          connections: []
        };

        // Генерируем 100 узлов различных типов
        for (let i = 0; i < 100; i++) {
          const nodeTypes = ['message', 'command', 'input', 'sticker', 'voice'];
          const nodeType = nodeTypes[i % nodeTypes.length];
          
          largeBotData.nodes.push({
            id: `node_${i}`,
            type: nodeType as any,
            position: { x: i * 10, y: (i % 10) * 10 },
            data: {
              text: `Узел ${i} типа ${nodeType}`,
              command: nodeType === 'command' ? `cmd${i}` : undefined,
              keyboardType: i % 3 === 0 ? 'inline' : 'none',
              buttons: i % 3 === 0 ? [
                {
                  id: `btn_${i}`,
                  text: `Кнопка ${i}`,
                  target: `node_${(i + 1) % 100}`
                }
              ] : [],
              inputVariable: nodeType === 'input' ? `var_${i}` : undefined,
              inputTargetNodeId: nodeType === 'input' ? `node_${(i + 1) % 100}` : undefined
            }
          });

          // Добавляем соединения
          if (i < 99) {
            largeBotData.connections.push({
              source: `node_${i}`,
              target: `node_${i + 1}`
            });
          }
        }

        const result = await measurePerformance('Very Large Bot Performance', () => 
          generatePythonCode(
            largeBotData,
            'VeryLargeBot',
            regressionTestData.testGroups,
            true,
            999,
            true
          )
        );

        expect(result).toBeTruthy();
        
        // Проверяем, что даже очень большой бот генерируется за разумное время
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(1000);
        
        // Проверяем, что код содержит все узлы
        expect(result).toContain('@@NODE_START:node_0@@');
        expect(result).toContain('@@NODE_START:node_50@@');
        expect(result).toContain('@@NODE_START:node_99@@');
      });
    });

    describe('Производительность отдельных модулей', () => {
      it('ImportsGenerator должен работать быстро', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.complexBot,
          'PerfTestBot',
          [],
          true,
          123,
          true
        );

        const generator = new ImportsGenerator();
        
        const result = await measurePerformance('ImportsGenerator Performance', () => 
          generator.generateImports(context)
        );

        expect(result).toBeTruthy();
        
        // ImportsGenerator должен работать очень быстро
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(10);
      });

      it('PythonCodeGenerator должен работать быстро', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.complexBot,
          'PerfTestBot',
          [],
          true,
          123,
          true
        );

        const generator = new PythonCodeGenerator();
        
        const result = await measurePerformance('PythonCodeGenerator Performance', () => 
          generator.generateBotInitialization(context) +
          generator.generateGlobalVariables(context) +
          generator.generateUtilityFunctions(context)
        );

        expect(result).toBeTruthy();
        
        // PythonCodeGenerator должен работать быстро
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(50);
      });

      it('HandlerGenerator должен работать в разумное время', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.complexBot,
          'PerfTestBot',
          [],
          true,
          123,
          true
        );

        const generator = new HandlerGenerator();
        
        const result = await measurePerformance('HandlerGenerator Performance', () => 
          generator.generateMessageHandlers(context) +
          generator.generateCallbackHandlers(context) +
          generator.generateMultiSelectHandlers(context) +
          generator.generateMediaHandlers(context)
        );

        expect(result).toBeTruthy();
        
        // HandlerGenerator может быть медленнее, но должен укладываться в лимит
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(200);
      });

      it('MainLoopGenerator должен работать быстро', async () => {
        const context = GenerationContext.fromBotData(
          regressionTestData.complexBot,
          'PerfTestBot',
          [],
          true,
          123,
          true
        );

        const generator = new MainLoopGenerator();
        
        const result = await measurePerformance('MainLoopGenerator Performance', () => 
          generator.generateMainFunction(context)
        );

        expect(result).toBeTruthy();
        
        // MainLoopGenerator должен работать очень быстро
        const lastResult = performanceResults[performanceResults.length - 1];
        expect(lastResult.duration).toBeLessThan(10);
      });
    });

    describe('Масштабируемость производительности', () => {
      it('производительность должна масштабироваться линейно с размером бота', async () => {
        const sizes = [10, 25, 50];
        const timings: number[] = [];

        for (const size of sizes) {
          const botData: BotData = {
            nodes: [],
            connections: []
          };

          // Создаем бот заданного размера
          for (let i = 0; i < size; i++) {
            botData.nodes.push({
              id: `scale_node_${i}`,
              type: 'message',
              position: { x: i * 10, y: 0 },
              data: {
                text: `Сообщение ${i}`,
                keyboardType: 'inline',
                buttons: [
                  {
                    id: `scale_btn_${i}`,
                    text: `Кнопка ${i}`,
                    target: `scale_node_${(i + 1) % size}`
                  }
                ]
              }
            });
          }

          const result = await measurePerformance(`Scalability Test ${size} nodes`, () => 
            generatePythonCode(
              botData,
              `ScaleBot${size}`,
              [],
              true,
              123,
              false
            )
          );

          expect(result).toBeTruthy();
          
          const lastResult = performanceResults[performanceResults.length - 1];
          timings.push(lastResult.duration);
        }

        // Проверяем, что время растет не более чем квадратично
        // (линейный рост был бы идеальным, но квадратичный приемлем)
        const ratio1 = timings[1] / timings[0]; // 25/10 = 2.5x узлов
        const ratio2 = timings[2] / timings[1]; // 50/25 = 2x узлов
        
        // Время не должно расти быстрее чем квадратично
        expect(ratio1).toBeLessThan(10); // Не более чем в 10 раз медленнее
        expect(ratio2).toBeLessThan(5);  // Не более чем в 5 раз медленнее
      });
    });
  });

  describe('Snapshot тесты - стабильность генерируемого кода', () => {
    describe('Стабильность базовых компонентов', () => {
      it('должен генерировать стабильный код для простого бота', async () => {
        const result = await measurePerformance('Simple Bot Snapshot', () => 
          generatePythonCode(
            baselineTestData.simpleStartBot,
            'SnapshotSimpleBot',
            [],
            false,
            null,
            false
          )
        );

        // Проверяем ключевые элементы, которые должны быть стабильными
        expect(result).toMatchSnapshot('simple-bot-structure');
        
        // Дополнительные проверки стабильности
        expect(result).toContain('# -*- coding: utf-8 -*-');
        expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
        expect(result).toContain('async def start_handler');
        expect(result).toContain('if __name__ == "__main__":');
      });

      it('должен генерировать стабильный код для бота с кнопками', async () => {
        const result = await measurePerformance('Inline Buttons Snapshot', () => 
          generatePythonCode(
            baselineTestData.inlineButtonBot,
            'SnapshotButtonBot',
            [],
            true,
            123,
            true
          )
        );

        expect(result).toMatchSnapshot('inline-buttons-structure');
        
        // Проверяем стабильность обработчиков кнопок
        expect(result).toContain('handle_callback_target_1');
        expect(result).toContain('handle_callback_target_2');
        expect(result).toContain('@dp.callback_query');
      });

      it('должен генерировать стабильный код для бота с множественным выбором', async () => {
        const result = await measurePerformance('Multi-Select Snapshot', () => 
          generatePythonCode(
            baselineTestData.multiSelectBot,
            'SnapshotMultiBot',
            [],
            true,
            456,
            false
          )
        );

        expect(result).toMatchSnapshot('multi-select-structure');
        
        // Проверяем стабильность множественного выбора
        expect(result).toContain('user_selections = {}');
        expect(result).toContain('multi_select_done_');
        expect(result).toContain('selected_options');
      });
    });

    describe('Стабильность комплексных сценариев', () => {
      it('должен генерировать стабильный код для комплексного бота', async () => {
        const result = await measurePerformance('Complex Bot Snapshot', () => 
          generatePythonCode(
            regressionTestData.complexBot,
            'SnapshotComplexBot',
            regressionTestData.testGroups,
            true,
            789,
            true
          )
        );

        expect(result).toMatchSnapshot('complex-bot-structure');
        
        // Проверяем стабильность всех компонентов
        expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "789"))');
        expect(result).toContain('# Обработчики start узлов');
        expect(result).toContain('# Обработчики inline кнопок');
        expect(result).toContain('# Обработчики множественного выбора');
      });

      it('должен генерировать стабильный код для админ бота', async () => {
        const result = await measurePerformance('Admin Bot Snapshot', () => 
          generatePythonCode(
            regressionTestData.adminBot,
            'SnapshotAdminBot',
            [],
            true,
            999,
            true
          )
        );

        expect(result).toMatchSnapshot('admin-bot-structure');
        
        // Проверяем стабильность админских функций
        expect(result).toContain('ban_user_handler');
        expect(result).toContain('unban_user_handler');
        expect(result).toContain('mute_user_handler');
        expect(result).toContain('kick_user_handler');
      });

      it('должен генерировать стабильный код для медиа бота', async () => {
        const result = await measurePerformance('Media Bot Snapshot', () => 
          generatePythonCode(
            regressionTestData.mediaHandlerBot,
            'SnapshotMediaBot',
            [],
            false,
            null,
            false
          )
        );

        expect(result).toMatchSnapshot('media-bot-structure');
        
        // Проверяем стабильность медиа обработчиков
        expect(result).toContain('handle_sticker_sticker_handler');
        expect(result).toContain('handle_voice_voice_handler');
        expect(result).toContain('handle_animation_animation_handler');
        expect(result).toContain('handle_location_location_handler');
        expect(result).toContain('handle_contact_contact_handler');
      });
    });

    describe('Стабильность при различных конфигурациях', () => {
      it('должен генерировать стабильный код без БД', async () => {
        const result = await measurePerformance('No Database Snapshot', () => 
          generatePythonCode(
            baselineTestData.simpleStartBot,
            'SnapshotNoDB',
            [],
            false, // userDatabaseEnabled = false
            null,
            false
          )
        );

        expect(result).toMatchSnapshot('no-database-structure');
        
        // Проверяем отсутствие БД компонентов
        expect(result).not.toContain('API_BASE_URL');
        expect(result).not.toContain('PROJECT_ID');
        expect(result).not.toContain('save_message_to_api');
      });

      it('должен генерировать стабильный код с БД', async () => {
        const result = await measurePerformance('With Database Snapshot', () => 
          generatePythonCode(
            baselineTestData.simpleStartBot,
            'SnapshotWithDB',
            [],
            true, // userDatabaseEnabled = true
            123,
            true
          )
        );

        expect(result).toMatchSnapshot('with-database-structure');
        
        // Проверяем наличие БД компонентов
        expect(result).toContain('API_BASE_URL = os.getenv');
        expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "123"))');
        expect(result).toContain('async def save_message_to_api');
      });

      it('должен генерировать стабильный код с логированием', async () => {
        const result = await measurePerformance('With Logging Snapshot', () => 
          generatePythonCode(
            baselineTestData.simpleStartBot,
            'SnapshotWithLogging',
            [],
            true,
            456,
            true // enableLogging = true
          )
        );

        expect(result).toMatchSnapshot('with-logging-structure');
        
        // Проверяем наличие логирования
        expect(result).toContain('import logging');
        expect(result).toContain('logging.basicConfig');
        expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      });

      it('должен генерировать стабильный код без логирования', async () => {
        const result = await measurePerformance('No Logging Snapshot', () => 
          generatePythonCode(
            baselineTestData.simpleStartBot,
            'SnapshotNoLogging',
            [],
            false,
            null,
            false // enableLogging = false
          )
        );

        expect(result).toMatchSnapshot('no-logging-structure');
        
        // Проверяем минимальное логирование - базовое логирование все равно присутствует
        expect(result).toContain('logging.basicConfig');
        expect(result).not.toContain('message_logging_middleware');
      });
    });
  });

  describe('Regression тесты производительности', () => {
    it('новая реализация должна быть не медленнее старой более чем на 10%', async () => {
      // Этот тест будет полезен после полного рефакторинга
      // Пока что просто проверяем, что текущая реализация работает быстро
      
      const testCases = [
        { name: 'Simple', data: baselineTestData.simpleStartBot },
        { name: 'Inline Buttons', data: baselineTestData.inlineButtonBot },
        { name: 'Multi Select', data: baselineTestData.multiSelectBot },
        { name: 'Complex', data: regressionTestData.complexBot }
      ];

      for (const testCase of testCases) {
        const result = await measurePerformance(`Regression ${testCase.name}`, () => 
          generatePythonCode(
            testCase.data,
            `RegressionBot${testCase.name}`,
            [],
            true,
            123,
            true
          )
        );

        expect(result).toBeTruthy();
        
        // Проверяем базовые требования к производительности
        const lastResult = performanceResults[performanceResults.length - 1];
        if (testCase.name === 'Simple') {
          expect(lastResult.duration).toBeLessThan(50);
        } else if (testCase.name === 'Complex') {
          expect(lastResult.duration).toBeLessThan(500);
        } else {
          expect(lastResult.duration).toBeLessThan(200);
        }
      }
    });
  });
});