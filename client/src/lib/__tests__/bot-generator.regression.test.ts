/**
 * Regression тесты для функции generatePythonCode
 * Задача 8.1: Подготовка к рефакторингу
 * 
 * Эти тесты проверяют сложные сценарии использования и граничные случаи
 * для обеспечения стабильности во время рефакторинга.
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { regressionTestData } from './test-data/regression-test-data';

describe('generatePythonCode - Regression Tests', () => {
  describe('Комплексные сценарии', () => {
    it('должна корректно обрабатывать комплексный бот с множественными функциями', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'ComplexBot',
        [],
        true, // с базой данных
        123,  // projectId
        true  // с логированием
      );

      // Проверяем основные компоненты
      expect(result).toContain('ComplexBot - Telegram Bot');
      expect(result).toContain('DATABASE_URL');
      expect(result).toContain('logging.basicConfig');
      
      // Проверяем обработчики узлов
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('async def start_complex_handler');
      expect(result).toContain('async def main_menu_handler');
      expect(result).toContain('async def survey_start_handler');
      
      // Проверяем множественный выбор
      expect(result).toContain('allowMultipleSelection');
      expect(result).toContain('multi_select_done_');
      expect(result).toContain('user_interests');
      
      // Проверяем автопереходы
      expect(result).toContain('asyncio.sleep(5)');
      expect(result).toContain('safe_edit_or_send');
      expect(result).toContain('is_auto_transition=True');
      
      // Проверяем условные сообщения
      expect(result).toContain('conditionalMessages');
      expect(result).toContain('user_data.get');
      
      // Проверяем медиа
      expect(result).toContain('attachedMedia');
      expect(result).toContain('URLInputFile');
      
      // Проверяем ввод данных
      expect(result).toContain('inputVariable');
      expect(result).toContain('user_name');
      
      // Проверяем inline и reply клавиатуры
      expect(result).toContain('InlineKeyboardBuilder');
      expect(result).toContain('ReplyKeyboardBuilder');
    });

    it('должна генерировать все админские команды', () => {
      const result = generatePythonCode(regressionTestData.adminBot);

      // Проверяем команды BotFather
      expect(result).toContain('Команды для @BotFather:');
      expect(result).toContain('help - ');
      expect(result).toContain('ban - ');
      expect(result).toContain('unban - ');
      expect(result).toContain('mute - ');
      expect(result).toContain('kick - ');

      // Проверяем обработчики команд
      expect(result).toContain('@dp.message(Command("help"))');
      expect(result).toContain('@dp.message(Command("ban"))');
      expect(result).toContain('@dp.message(Command("unban"))');
      expect(result).toContain('@dp.message(Command("mute"))');
      expect(result).toContain('@dp.message(Command("kick"))');

      // Проверяем функции управления пользователями
      expect(result).toContain('async def ban_user_handler');
      expect(result).toContain('async def unban_user_handler');
      expect(result).toContain('async def mute_user_handler');
      expect(result).toContain('async def kick_user_handler');
    });

    it('должна обрабатывать все типы медиа', () => {
      const result = generatePythonCode(regressionTestData.mediaHandlerBot);

      // Проверяем обработчики медиа
      expect(result).toContain('@dp.message(F.sticker)');
      expect(result).toContain('@dp.message(F.voice)');
      expect(result).toContain('@dp.message(F.animation)');
      expect(result).toContain('@dp.message(F.location)');
      expect(result).toContain('@dp.message(F.contact)');

      // Проверяем функции обработчиков
      expect(result).toContain('async def sticker_handler_handler');
      expect(result).toContain('async def voice_handler_handler');
      expect(result).toContain('async def animation_handler_handler');
      expect(result).toContain('async def location_handler_handler');
      expect(result).toContain('async def contact_handler_handler');
    });

    it('должна корректно обрабатывать синонимы', () => {
      const result = generatePythonCode(regressionTestData.synonymBot);

      // Проверяем обработчик синонимов
      expect(result).toContain('async def synonym_handler_handler');
      expect(result).toContain('привет');
      expect(result).toContain('здравствуй');
      expect(result).toContain('добро пожаловать');
      
      // Проверяем логику синонимов
      expect(result).toContain('message.text.lower()');
      expect(result).toContain('in [');
    });
  });

  describe('Граничные случаи', () => {
    it('должна обрабатывать бота с очень длинными текстами', () => {
      const longTextBot = {
        nodes: [
          {
            id: 'long_text',
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              text: 'Это очень длинный текст '.repeat(100),
              buttons: []
            }
          }
        ],
        connections: []
      };

      const result = generatePythonCode(longTextBot);
      expect(result).toContain('async def long_text_handler');
      expect(result.length).toBeGreaterThan(1000);
    });

    it('должна обрабатывать бота с большим количеством кнопок', () => {
      const manyButtonsBot = {
        nodes: [
          {
            id: 'many_buttons',
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              text: 'Выберите опцию:',
              keyboardType: 'inline',
              buttons: Array.from({ length: 20 }, (_, i) => ({
                id: `btn_${i}`,
                text: `Кнопка ${i + 1}`,
                target: `target_${i}`
              }))
            }
          },
          ...Array.from({ length: 20 }, (_, i) => ({
            id: `target_${i}`,
            type: 'message',
            position: { x: 100, y: i * 50 },
            data: {
              text: `Вы выбрали кнопку ${i + 1}`,
              buttons: []
            }
          }))
        ],
        connections: Array.from({ length: 20 }, (_, i) => ({
          source: 'many_buttons',
          target: `target_${i}`
        }))
      };

      const result = generatePythonCode(manyButtonsBot);
      expect(result).toContain('InlineKeyboardBuilder');
      
      // Проверяем что все кнопки сгенерированы
      for (let i = 0; i < 20; i++) {
        expect(result).toContain(`Кнопка ${i + 1}`);
        expect(result).toContain(`async def target_${i}_handler`);
      }
    });

    it('должна обрабатывать циклические связи', () => {
      const cyclicBot = {
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
                  target: 'node_b'
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
      expect(result).toContain('async def node_a_handler');
      expect(result).toContain('async def node_b_handler');
      expect(result).toContain('К узлу A');
      expect(result).toContain('К узлу B');
    });
  });

  describe('Производительность и размер', () => {
    it('должна генерировать код за разумное время для комплексного бота', () => {
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
      expect(result1).toBe(result2);
      expect(result1.length).toBe(result2.length);
    });
  });

  describe('Интеграция с группами', () => {
    it('должна корректно обрабатывать группы ботов', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'GroupBot',
        regressionTestData.testGroups
      );

      expect(result).toContain('Основная группа');
      expect(result).toContain('Тестовая группа');
      expect(result).toContain('Группа для тестирования');
    });
  });

  describe('Совместимость параметров', () => {
    it('должна работать со всеми комбинациями параметров', () => {
      const testCases = [
        { db: false, logging: false, projectId: null },
        { db: true, logging: false, projectId: null },
        { db: false, logging: true, projectId: null },
        { db: true, logging: true, projectId: null },
        { db: false, logging: false, projectId: 123 },
        { db: true, logging: true, projectId: 456 }
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
        
        if (logging) {
          expect(result).toContain('logging.basicConfig');
        }
      });
    });
  });
});