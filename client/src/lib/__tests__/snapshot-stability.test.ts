/**
 * Snapshot тесты для проверки стабильности генерируемого кода
 * Задача 10.2: Snapshot тесты для проверки стабильности генерируемого кода
 * 
 * Эти тесты проверяют, что генерируемый код остается стабильным
 * при различных конфигурациях и не изменяется неожиданно.
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { baselineTestData } from './test-data/baseline-test-data';
import { regressionTestData } from './test-data/regression-test-data';
import { BotData } from '../../../../shared/schema';

describe('Snapshot тесты стабильности', () => {
  /**
   * Нормализует код для стабильного сравнения
   * Удаляет временные метки и другие изменяющиеся элементы
   */
  const normalizeCode = (code: string): string => {
    return code
      // Удаляем временные метки
      .replace(/# Сгенерировано: .+/g, '# Сгенерировано: [TIMESTAMP]')
      // Нормализуем переносы строк
      .replace(/\r\n/g, '\n')
      // Удаляем лишние пробелы в конце строк
      .replace(/[ \t]+$/gm, '')
      // Нормализуем множественные пустые строки
      .replace(/\n{3,}/g, '\n\n');
  };

  describe('Базовые структуры ботов', () => {
    it('пустой бот должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.emptyBot,
        'EmptyBot',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('empty-bot');
    });

    it('простой start бот должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.simpleStartBot,
        'SimpleStartBot',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('simple-start-bot');
    });

    it('бот с командой должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.commandBot,
        'CommandBot',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('command-bot');
    });

    it('бот с обычным сообщением должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.messageBot,
        'MessageBot',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('message-bot');
    });
  });

  describe('Боты с клавиатурами', () => {
    it('бот с inline кнопками должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.inlineButtonBot,
        'InlineButtonBot',
        [],
        true,
        123,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('inline-button-bot');
    });

    it('бот с reply кнопками должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.replyButtonBot,
        'ReplyButtonBot',
        [],
        true,
        456,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('reply-button-bot');
    });

    it('бот с множественным выбором должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.multiSelectBot,
        'MultiSelectBot',
        [],
        true,
        789,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('multi-select-bot');
    });
  });

  describe('Боты с продвинутыми функциями', () => {
    it('бот с автопереходом должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.autoTransitionBot,
        'AutoTransitionBot',
        [],
        true,
        111,
        true
      );

      expect(normalizeCode(result)).toMatchSnapshot('auto-transition-bot');
    });

    it('бот с условными сообщениями должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.conditionalBot,
        'ConditionalBot',
        [],
        true,
        222,
        true
      );

      expect(normalizeCode(result)).toMatchSnapshot('conditional-bot');
    });

    it('бот с медиа должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.mediaBot,
        'MediaBot',
        [],
        true,
        333,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('media-bot');
    });

    it('бот с вводом данных должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.inputBot,
        'InputBot',
        [],
        true,
        444,
        true
      );

      expect(normalizeCode(result)).toMatchSnapshot('input-bot');
    });
  });

  describe('Комплексные боты', () => {
    it('комплексный бот должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'ComplexBot',
        regressionTestData.testGroups,
        true,
        555,
        true
      );

      expect(normalizeCode(result)).toMatchSnapshot('complex-bot');
    });

    it('админ бот должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        regressionTestData.adminBot,
        'AdminBot',
        [],
        true,
        666,
        true
      );

      expect(normalizeCode(result)).toMatchSnapshot('admin-bot');
    });

    it('медиа обработчик бот должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        regressionTestData.mediaHandlerBot,
        'MediaHandlerBot',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('media-handler-bot');
    });

    it('бот с синонимами должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        regressionTestData.synonymBot,
        'SynonymBot',
        [],
        true,
        777,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('synonym-bot');
    });
  });

  describe('Различные конфигурации', () => {
    it('бот без БД должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.inlineButtonBot,
        'NoDatabaseBot',
        [],
        false, // userDatabaseEnabled = false
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('no-database-config');
    });

    it('бот с БД должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.inlineButtonBot,
        'WithDatabaseBot',
        [],
        true, // userDatabaseEnabled = true
        888,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('with-database-config');
    });

    it('бот без логирования должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.inlineButtonBot,
        'NoLoggingBot',
        [],
        true,
        999,
        false // enableLogging = false
      );

      expect(normalizeCode(result)).toMatchSnapshot('no-logging-config');
    });

    it('бот с логированием должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.inlineButtonBot,
        'WithLoggingBot',
        [],
        true,
        1000,
        true // enableLogging = true
      );

      expect(normalizeCode(result)).toMatchSnapshot('with-logging-config');
    });

    it('бот с группами должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.simpleStartBot,
        'WithGroupsBot',
        regressionTestData.testGroups,
        true,
        1111,
        true
      );

      expect(normalizeCode(result)).toMatchSnapshot('with-groups-config');
    });
  });

  describe('Граничные случаи', () => {
    it('бот с очень длинным именем должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.simpleStartBot,
        'VeryLongBotNameThatExceedsNormalLimitsAndShouldBeHandledProperly',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('very-long-name-bot');
    });

    it('бот с максимальным projectId должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.simpleStartBot,
        'MaxProjectIdBot',
        [],
        true,
        2147483647, // Максимальный int32
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('max-project-id-bot');
    });

    it('бот с минимальным projectId должен генерировать стабильную структуру', () => {
      const result = generatePythonCode(
        baselineTestData.simpleStartBot,
        'MinProjectIdBot',
        [],
        true,
        1, // Минимальный положительный projectId
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('min-project-id-bot');
    });

    it('бот с пустыми узлами должен генерировать стабильную структуру', () => {
      const emptyNodeBot: BotData = {
        nodes: [
          {
            id: 'empty_node',
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              text: '',
              buttons: []
            }
          }
        ],
        connections: []
      };

      const result = generatePythonCode(
        emptyNodeBot,
        'EmptyNodeBot',
        [],
        false,
        null,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('empty-node-bot');
    });

    it('бот с множественными соединениями должен генерировать стабильную структуру', () => {
      const multiConnectionBot: BotData = {
        nodes: [
          {
            id: 'hub_node',
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              text: 'Центральный узел',
              keyboardType: 'inline',
              buttons: [
                { id: 'btn1', text: 'К узлу 1', target: 'node1' },
                { id: 'btn2', text: 'К узлу 2', target: 'node2' },
                { id: 'btn3', text: 'К узлу 3', target: 'node3' }
              ]
            }
          },
          {
            id: 'node1',
            type: 'message',
            position: { x: 100, y: 0 },
            data: { text: 'Узел 1', buttons: [] }
          },
          {
            id: 'node2',
            type: 'message',
            position: { x: 100, y: 100 },
            data: { text: 'Узел 2', buttons: [] }
          },
          {
            id: 'node3',
            type: 'message',
            position: { x: 100, y: 200 },
            data: { text: 'Узел 3', buttons: [] }
          }
        ],
        connections: [
          { source: 'hub_node', target: 'node1' },
          { source: 'hub_node', target: 'node2' },
          { source: 'hub_node', target: 'node3' },
          { source: 'node1', target: 'hub_node' },
          { source: 'node2', target: 'hub_node' },
          { source: 'node3', target: 'hub_node' }
        ]
      };

      const result = generatePythonCode(
        multiConnectionBot,
        'MultiConnectionBot',
        [],
        true,
        1234,
        false
      );

      expect(normalizeCode(result)).toMatchSnapshot('multi-connection-bot');
    });
  });

  describe('Стабильность при повторных вызовах', () => {
    it('повторные вызовы должны генерировать идентичный код', () => {
      const botData = baselineTestData.inlineButtonBot;
      const botName = 'RepeatabilityBot';
      const groups = regressionTestData.testGroups;
      const userDatabaseEnabled = true;
      const projectId = 5555;
      const enableLogging = true;

      // Генерируем код несколько раз
      const result1 = generatePythonCode(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
      const result2 = generatePythonCode(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
      const result3 = generatePythonCode(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);

      // Нормализуем результаты
      const normalized1 = normalizeCode(result1);
      const normalized2 = normalizeCode(result2);
      const normalized3 = normalizeCode(result3);

      // Все результаты должны быть идентичными
      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
      expect(normalized1).toMatchSnapshot('repeatability-test');
    });

    it('различные порядки узлов должны генерировать стабильный код', () => {
      // Создаем бот с узлами в разном порядке
      const originalOrder: BotData = {
        nodes: [
          {
            id: 'node_a',
            type: 'message',
            position: { x: 0, y: 0 },
            data: { text: 'Узел A', buttons: [] }
          },
          {
            id: 'node_b',
            type: 'message',
            position: { x: 100, y: 0 },
            data: { text: 'Узел B', buttons: [] }
          },
          {
            id: 'node_c',
            type: 'message',
            position: { x: 200, y: 0 },
            data: { text: 'Узел C', buttons: [] }
          }
        ],
        connections: [
          { source: 'node_a', target: 'node_b' },
          { source: 'node_b', target: 'node_c' }
        ]
      };

      const reversedOrder: BotData = {
        nodes: [
          originalOrder.nodes[2], // node_c
          originalOrder.nodes[1], // node_b
          originalOrder.nodes[0]  // node_a
        ],
        connections: originalOrder.connections
      };

      const result1 = generatePythonCode(originalOrder, 'OrderBot1', [], false, null, false);
      const result2 = generatePythonCode(reversedOrder, 'OrderBot2', [], false, null, false);

      // Результаты должны быть функционально эквивалентными
      // (порядок определения функций может отличаться, но структура должна быть стабильной)
      expect(normalizeCode(result1)).toMatchSnapshot('node-order-original');
      expect(normalizeCode(result2)).toMatchSnapshot('node-order-reversed');
    });
  });

  describe('Стабильность форматирования', () => {
    it('отступы и форматирование должны быть стабильными', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'FormattingBot',
        [],
        true,
        6666,
        true
      );

      const lines = result.split('\n');
      
      // Проверяем, что отступы корректные
      const pythonIndentPattern = /^( {0,})(.*)/;
      let hasCorrectIndentation = true;
      
      for (const line of lines) {
        if (line.trim() === '') continue; // Пропускаем пустые строки
        
        const match = line.match(pythonIndentPattern);
        if (match) {
          const indent = match[1];
          // Отступы должны быть кратны 4 пробелам (стандарт Python)
          if (indent.length % 4 !== 0) {
            hasCorrectIndentation = false;
            break;
          }
        }
      }
      
      expect(hasCorrectIndentation).toBe(true);
      expect(normalizeCode(result)).toMatchSnapshot('formatting-stability');
    });

    it('комментарии должны быть стабильными', () => {
      const result = generatePythonCode(
        baselineTestData.multiSelectBot,
        'CommentsBot',
        [],
        true,
        7777,
        true
      );

      // Проверяем наличие ключевых комментариев
      expect(result).toContain('# -*- coding: utf-8 -*-');
      expect(result).toContain('# Обработчики команд');
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('# Основная функция');
      
      expect(normalizeCode(result)).toMatchSnapshot('comments-stability');
    });

    it('маркеры узлов должны быть стабильными', () => {
      const result = generatePythonCode(
        regressionTestData.complexBot,
        'MarkersBot',
        [],
        true,
        8888,
        false
      );

      // Проверяем наличие маркеров для всех узлов
      const nodeIds = regressionTestData.complexBot.nodes.map(node => node.id);
      
      for (const nodeId of nodeIds) {
        expect(result).toContain(`@@NODE_START:${nodeId}@@`);
        expect(result).toContain(`@@NODE_END:${nodeId}@@`);
      }
      
      expect(normalizeCode(result)).toMatchSnapshot('markers-stability');
    });
  });
});