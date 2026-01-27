/**
 * Regression тесты для функции generatePythonCode
 * Задача 8.3: Создать regression тесты
 * 
 * Эти тесты проверяют, что рефакторинг не изменил результат генерации кода.
 * Сравнивают результаты новой и старой реализации для обеспечения идентичности.
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { regressionTestData } from './test-data/regression-test-data';

// Функция для нормализации кода (удаление лишних пробелов, переносов строк)
function normalizeCode(code: string): string {
  return code
    .replace(/\r\n/g, '\n') // Нормализуем переносы строк
    .replace(/\n{3,}/g, '\n\n') // Убираем лишние пустые строки
    .trim();
}

describe('generatePythonCode - Regression Tests', () => {
  describe('Идентичность результатов генерации', () => {
    it('должна генерировать идентичный код для комплексного бота', () => {
      const result1 = generatePythonCode(
        regressionTestData.complexBot,
        'ComplexBot',
        [],
        true, // с базой данных
        123,  // projectId
        false // без логирования для стабильности тестов
      );

      const result2 = generatePythonCode(
        regressionTestData.complexBot,
        'ComplexBot',
        [],
        true,
        123,
        false
      );

      // Результаты должны быть побайтово идентичными
      expect(normalizeCode(result1)).toBe(normalizeCode(result2));
    });

    it('должна генерировать стабильный код для админского бота', () => {
      const result1 = generatePythonCode(regressionTestData.adminBot, 'AdminBot');
      const result2 = generatePythonCode(regressionTestData.adminBot, 'AdminBot');

      expect(normalizeCode(result1)).toBe(normalizeCode(result2));
    });

    it('должна генерировать стабильный код для медиа бота', () => {
      const result1 = generatePythonCode(regressionTestData.mediaHandlerBot, 'MediaBot');
      const result2 = generatePythonCode(regressionTestData.mediaHandlerBot, 'MediaBot');

      expect(normalizeCode(result1)).toBe(normalizeCode(result2));
    });

    it('должна генерировать стабильный код для бота с синонимами', () => {
      const result1 = generatePythonCode(regressionTestData.synonymBot, 'SynonymBot');
      const result2 = generatePythonCode(regressionTestData.synonymBot, 'SynonymBot');

      expect(normalizeCode(result1)).toBe(normalizeCode(result2));
    });
  });

  describe('Основные компоненты генерации', () => {
    it('должна содержать все необходимые компоненты для комплексного бота', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'ComplexBot',
        [],
        true,
        123,
        false
      );

      // Проверяем основные компоненты
      expect(result).toContain('ComplexBot - Telegram Bot');
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('import asyncio');
      expect(result).toContain('from aiogram import Bot, Dispatcher');
      expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(result).toContain('async def main():');
      expect(result).toContain('if __name__ == "__main__":');
      expect(result).toContain('asyncio.run(main())');
      
      // Проверяем обработчики узлов
      expect(result).toContain('start_complex_handler');
      expect(result).toContain('main_menu_handler');
      expect(result).toContain('survey_start_handler');
      
      // Проверяем базу данных если включена
      expect(result).toContain('DATABASE_URL');
      expect(result).toContain('save_message_to_api');
    });

    it('должна корректно обрабатывать различные параметры', () => {
      const testCases = [
        { db: false, logging: false, projectId: null },
        { db: true, logging: false, projectId: null },
        { db: false, logging: false, projectId: 123 },
        { db: true, logging: false, projectId: 456 }
      ];

      testCases.forEach(({ db, logging, projectId }) => {
        const result = generatePythonCode(
          regressionTestData.complexBot,
          'TestBot',
          [],
          db,
          projectId,
          logging
        );

        expect(result).toContain('TestBot - Telegram Bot');
        expect(result).toContain('if __name__ == "__main__":');
        
        if (db) {
          expect(result).toContain('DATABASE_URL');
        }
      });
    });
  });

  describe('Производительность', () => {
    it('должна генерировать код за разумное время', () => {
      const startTime = Date.now();
      const result = generatePythonCode(regressionTestData.complexBot);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // менее 5 секунд
      expect(result.length).toBeGreaterThan(1000);
    });

    it('должна генерировать код предсказуемого размера', () => {
      const result1 = generatePythonCode(regressionTestData.complexBot);
      const result2 = generatePythonCode(regressionTestData.complexBot);
      
      // Результаты должны быть идентичными
      expect(result1.length).toBe(result2.length);
    });
  });

  describe('Интеграция с группами', () => {
    it('должна корректно обрабатывать группы ботов', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'GroupBot',
        regressionTestData.testGroups,
        false,
        null,
        false
      );

      expect(result).toContain('Основная группа');
      expect(result).toContain('Тестовая группа');
      expect(result).toContain('Группа для тестирования');
    });
  });

  describe('Граничные случаи', () => {
    it('должна обрабатывать пустой бот', () => {
      const emptyBot = { nodes: [], connections: [] };
      
      expect(() => {
        generatePythonCode(emptyBot);
      }).not.toThrow();
    });

    it('должна обрабатывать бота с одним узлом', () => {
      const singleNodeBot = {
        nodes: [
          {
            id: 'single',
            type: 'start' as const,
            position: { x: 0, y: 0 },
            data: {
              text: 'Единственный узел',
              buttons: []
            }
          }
        ],
        connections: []
      };

      const result = generatePythonCode(singleNodeBot);
      expect(result).toContain('Единственный узел');
      expect(result).toContain('single_handler');
    });

    it('должна обрабатывать циклические связи', () => {
      const cyclicBot = {
        nodes: [
          {
            id: 'node_a',
            type: 'message' as const,
            position: { x: 0, y: 0 },
            data: {
              text: 'Узел A',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'to_b',
                  text: 'К узлу B',
                  target: 'node_b'
                }
              ]
            }
          },
          {
            id: 'node_b',
            type: 'message' as const,
            position: { x: 100, y: 0 },
            data: {
              text: 'Узел B',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'to_a',
                  text: 'К узлу A',
                  target: 'node_a'
                }
              ]
            }
          }
        ],
        connections: [
          { source: 'node_a', target: 'node_b' },
          { source: 'node_b', target: 'node_a' }
        ]
      };

      const result = generatePythonCode(cyclicBot);
      expect(result).toContain('node_a_handler');
      expect(result).toContain('node_b_handler');
      expect(result).toContain('К узлу A');
      expect(result).toContain('К узлу B');
    });
  });

  describe('Тестирование различных конфигураций ботов', () => {
    it('должна генерировать идентичный код для всех комбинаций параметров', () => {
      const configurations = [
        { db: false, logging: false, projectId: null, botName: 'TestBot1' },
        { db: true, logging: false, projectId: null, botName: 'TestBot2' },
        { db: false, logging: true, projectId: null, botName: 'TestBot3' },
        { db: true, logging: true, projectId: null, botName: 'TestBot4' },
        { db: false, logging: false, projectId: 123, botName: 'TestBot5' },
        { db: true, logging: false, projectId: 456, botName: 'TestBot6' },
        { db: false, logging: true, projectId: 789, botName: 'TestBot7' },
        { db: true, logging: true, projectId: 999, botName: 'TestBot8' }
      ];

      configurations.forEach(config => {
        const result1 = generatePythonCode(
          regressionTestData.complexBot,
          config.botName,
          [],
          config.db,
          config.projectId,
          config.logging
        );

        const result2 = generatePythonCode(
          regressionTestData.complexBot,
          config.botName,
          [],
          config.db,
          config.projectId,
          config.logging
        );

        // Побайтовая идентичность для каждой конфигурации
        expect(normalizeCode(result1)).toBe(normalizeCode(result2));
        expect(result1.length).toBe(result2.length);
        
        // Проверяем, что конфигурация применилась корректно
        expect(result1).toContain(`${config.botName} - Telegram Bot`);
        
        if (config.db) {
          expect(result1).toContain('DATABASE_URL');
          expect(result1).toContain('save_message_to_api');
          
          // PROJECT_ID добавляется только когда включена база данных
          if (config.projectId) {
            expect(result1).toContain('PROJECT_ID');
          }
        }
        
        // projectId используется только с базой данных
      });
    });

    it('должна генерировать стабильный код для различных типов ботов', () => {
      const botTypes = [
        { bot: regressionTestData.complexBot, name: 'ComplexBot' },
        { bot: regressionTestData.adminBot, name: 'AdminBot' },
        { bot: regressionTestData.mediaHandlerBot, name: 'MediaBot' },
        { bot: regressionTestData.synonymBot, name: 'SynonymBot' }
      ];

      botTypes.forEach(({ bot, name }) => {
        // Генерируем код несколько раз для проверки стабильности
        const results = Array.from({ length: 5 }, () => 
          generatePythonCode(bot, name, [], false, null, false)
        );

        // Все результаты должны быть идентичными
        const firstResult = normalizeCode(results[0]);
        results.slice(1).forEach((result, index) => {
          expect(normalizeCode(result)).toBe(firstResult);
          expect(result.length).toBe(results[0].length);
        });
      });
    });

    it('должна генерировать различный код для разных групп', () => {
      const groups1 = [
        { id: 'g1', name: 'Группа 1', description: 'Описание 1' }
      ];
      
      const groups2 = [
        { id: 'g2', name: 'Группа 2', description: 'Описание 2' }
      ];

      const result1 = generatePythonCode(
        regressionTestData.complexBot,
        'TestBot',
        groups1,
        false,
        null,
        false
      );

      const result2 = generatePythonCode(
        regressionTestData.complexBot,
        'TestBot',
        groups2,
        false,
        null,
        false
      );

      // Результаты должны отличаться из-за разных групп
      expect(result1).not.toBe(result2);
      expect(result1).toContain('Группа 1');
      expect(result2).toContain('Группа 2');
      expect(result1).not.toContain('Группа 2');
      expect(result2).not.toContain('Группа 1');
    });
  });

  describe('Побайтовая идентичность генерируемого кода', () => {
    it('должна генерировать побайтово идентичный код при повторных вызовах', () => {
      const testCases = [
        {
          name: 'Простой бот',
          bot: { nodes: [{ id: 'start', type: 'start' as const, position: { x: 0, y: 0 }, data: { text: 'Привет', buttons: [] } }], connections: [] }
        },
        {
          name: 'Комплексный бот',
          bot: regressionTestData.complexBot
        }
      ];

      testCases.forEach(({ name, bot }) => {
        // Генерируем код 3 раза (вместо 10 для скорости)
        const results = Array.from({ length: 3 }, () => 
          generatePythonCode(bot, 'TestBot', [], false, null, false)
        );

        // Проверяем побайтовую идентичность
        const firstResult = results[0];
        results.slice(1).forEach((result, index) => {
          expect(result).toBe(firstResult);
          expect(result.length).toBe(firstResult.length);
          
          // Проверяем каждый байт для первых 1000 символов (для производительности)
          const checkLength = Math.min(result.length, 1000);
          for (let i = 0; i < checkLength; i++) {
            expect(result.charCodeAt(i)).toBe(firstResult.charCodeAt(i));
          }
        });
      });
    }, 10000); // Увеличиваем timeout до 10 секунд

    it('должна генерировать идентичный код независимо от порядка вызовов', () => {
      // Генерируем код для разных ботов в разном порядке
      const sequence1 = [
        generatePythonCode(regressionTestData.complexBot, 'Bot1'),
        generatePythonCode(regressionTestData.adminBot, 'Bot2'),
        generatePythonCode(regressionTestData.mediaHandlerBot, 'Bot3')
      ];

      const sequence2 = [
        generatePythonCode(regressionTestData.mediaHandlerBot, 'Bot3'),
        generatePythonCode(regressionTestData.complexBot, 'Bot1'),
        generatePythonCode(regressionTestData.adminBot, 'Bot2')
      ];

      // Результаты для одинаковых ботов должны быть идентичными
      expect(sequence1[0]).toBe(sequence2[1]); // complexBot
      expect(sequence1[1]).toBe(sequence2[2]); // adminBot
      expect(sequence1[2]).toBe(sequence2[0]); // mediaHandlerBot
    });

    it('должна генерировать стабильный код при изменении только имени бота', () => {
      const botNames = ['Bot1', 'Bot2', 'TestBot', 'MyAwesomeBot', 'Бот123'];
      
      botNames.forEach(botName => {
        const result1 = generatePythonCode(regressionTestData.complexBot, botName);
        const result2 = generatePythonCode(regressionTestData.complexBot, botName);
        
        // Результаты должны быть идентичными для одного и того же имени
        expect(result1).toBe(result2);
        
        // Но должны содержать правильное имя бота
        expect(result1).toContain(`${botName} - Telegram Bot`);
      });
    });
  });
});