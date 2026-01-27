/**
 * Unit тесты для GenerationContext
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GenerationContextBuilder, GenerationContextFactory } from '../Core/GenerationContext';
import { GenerationContext, GenerationErrorType } from '../Core/types';
import { BotData, Node, BotGroup } from '../../../shared/schema';

describe('GenerationContextBuilder', () => {
  let mockBotData: BotData;
  let mockNodes: Node[];
  let mockOptions: {
    botName: string;
    groups: BotGroup[];
    userDatabaseEnabled: boolean;
    projectId: number | null;
    enableLogging: boolean;
  };

  beforeEach(() => {
    mockNodes = [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Привет! Это стартовое сообщение.',
          buttons: []
        }
      },
      {
        id: 'message-1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          messageText: 'Это обычное сообщение.',
          buttons: []
        }
      }
    ];

    mockBotData = {
      nodes: mockNodes,
      connections: [
        {
          id: 'conn-1',
          source: 'start-1',
          target: 'message-1'
        }
      ]
    };

    mockOptions = {
      botName: 'test_bot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false
    };
  });

  describe('createFromBotData', () => {
    it('должен создать валидный контекст из данных бота', () => {
      const context = GenerationContextBuilder.createFromBotData(mockBotData, mockOptions);

      expect(context.botData).toBe(mockBotData);
      expect(context.botName).toBe('test_bot');
      expect(context.groups).toEqual([]);
      expect(context.userDatabaseEnabled).toBe(false);
      expect(context.projectId).toBe(null);
      expect(context.enableLogging).toBe(false);
      expect(context.nodes).toHaveLength(2);
      expect(context.connections).toHaveLength(1);
      expect(context.allNodeIds).toEqual(['start-1', 'message-1']);
      expect(context.mediaVariablesMap).toBeInstanceOf(Map);
    });

    it('должен правильно извлечь узлы из данных бота', () => {
      const context = GenerationContextBuilder.createFromBotData(mockBotData, mockOptions);

      expect(context.nodes[0].id).toBe('start-1');
      expect(context.nodes[0].type).toBe('start');
      expect(context.nodes[1].id).toBe('message-1');
      expect(context.nodes[1].type).toBe('message');
    });
  });

  describe('validateContext', () => {
    it('должен пройти валидацию для корректного контекста', () => {
      const context = GenerationContextBuilder.createFromBotData(mockBotData, mockOptions);
      const errors = GenerationContextBuilder.validateContext(context);

      expect(errors).toHaveLength(0);
    });

    it('должен вернуть ошибку для пустого имени бота', () => {
      const context = GenerationContextBuilder.createFromBotData(mockBotData, {
        ...mockOptions,
        botName: ''
      });
      const errors = GenerationContextBuilder.validateContext(context);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.type === GenerationErrorType.VALIDATION_ERROR && e.message.includes('Имя бота не может быть пустым'))).toBe(true);
    });

    it('должен вернуть ошибку для некорректного имени бота', () => {
      const context = GenerationContextBuilder.createFromBotData(mockBotData, {
        ...mockOptions,
        botName: '123invalid-name'
      });
      const errors = GenerationContextBuilder.validateContext(context);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(GenerationErrorType.VALIDATION_ERROR);
      expect(errors[0].message).toContain('только латинские буквы');
    });

    it('должен вернуть ошибку при отсутствии узлов', () => {
      const emptyBotData: BotData = { nodes: [], connections: [] };
      const context = GenerationContextBuilder.createFromBotData(emptyBotData, mockOptions);
      const errors = GenerationContextBuilder.validateContext(context);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.type === GenerationErrorType.VALIDATION_ERROR && e.message.includes('хотя бы один узел'))).toBe(true);
    });

    it('должен вернуть ошибку при отсутствии стартового узла', () => {
      const noStartBotData: BotData = {
        nodes: [mockNodes[1]], // только message узел, без start
        connections: []
      };
      const context = GenerationContextBuilder.createFromBotData(noStartBotData, mockOptions);
      const errors = GenerationContextBuilder.validateContext(context);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(GenerationErrorType.VALIDATION_ERROR);
      expect(errors[0].message).toContain('стартовый узел');
    });

    it('должен вернуть ошибку при дублировании ID узлов', () => {
      const duplicateIdBotData: BotData = {
        nodes: [
          { ...mockNodes[0] },
          { ...mockNodes[1], id: 'start-1' } // дублируем ID
        ],
        connections: []
      };
      const context = GenerationContextBuilder.createFromBotData(duplicateIdBotData, mockOptions);
      const errors = GenerationContextBuilder.validateContext(context);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(GenerationErrorType.VALIDATION_ERROR);
      expect(errors[0].message).toContain('уникальными');
    });
  });

  describe('cloneWithChanges', () => {
    it('должен создать копию контекста с изменениями', () => {
      const originalContext = GenerationContextBuilder.createFromBotData(mockBotData, mockOptions);
      const clonedContext = GenerationContextBuilder.cloneWithChanges(originalContext, {
        botName: 'new_bot_name',
        enableLogging: true
      });

      expect(clonedContext.botName).toBe('new_bot_name');
      expect(clonedContext.enableLogging).toBe(true);
      expect(clonedContext.botData).toBe(originalContext.botData); // должен быть тот же объект
      expect(clonedContext.nodes).toBe(originalContext.nodes); // должен быть тот же массив
    });
  });

  describe('getContextStats', () => {
    it('должен вернуть корректную статистику контекста', () => {
      const context = GenerationContextBuilder.createFromBotData(mockBotData, mockOptions);
      const stats = GenerationContextBuilder.getContextStats(context);

      expect(stats.totalNodes).toBe(2);
      expect(stats.totalConnections).toBe(1);
      expect(stats.totalButtons).toBe(0);
      expect(stats.nodesByType).toEqual({
        start: 1,
        message: 1
      });
      expect(stats.hasGroups).toBe(false);
      expect(stats.hasDatabaseEnabled).toBe(false);
      expect(stats.hasLogging).toBe(false);
      expect(stats.mediaVariablesCount).toBe(0);
    });

    it('должен правильно подсчитать кнопки', () => {
      const botDataWithButtons: BotData = {
        nodes: [
          {
            ...mockNodes[0],
            data: {
              ...mockNodes[0].data,
              buttons: [
                { id: 'btn1', text: 'Кнопка 1', action: 'goto' },
                { id: 'btn2', text: 'Кнопка 2', action: 'goto' }
              ]
            }
          }
        ],
        connections: []
      };

      const context = GenerationContextBuilder.createFromBotData(botDataWithButtons, mockOptions);
      const stats = GenerationContextBuilder.getContextStats(context);

      expect(stats.totalButtons).toBe(2);
    });
  });
});

describe('GenerationContextFactory', () => {
  describe('createTestContext', () => {
    it('должен создать минимальный тестовый контекст', () => {
      const context = GenerationContextFactory.createTestContext();

      expect(context.botName).toBe('test_bot');
      expect(context.nodes).toHaveLength(0);
      expect(context.connections).toHaveLength(0);
      expect(context.groups).toHaveLength(0);
      expect(context.userDatabaseEnabled).toBe(false);
      expect(context.enableLogging).toBe(false);
      expect(context.projectId).toBe(null);
    });

    it('должен применить переопределения', () => {
      const context = GenerationContextFactory.createTestContext({
        botName: 'custom_bot',
        enableLogging: true
      });

      expect(context.botName).toBe('custom_bot');
      expect(context.enableLogging).toBe(true);
    });
  });

  describe('createBasicContext', () => {
    it('должен создать базовый контекст с узлами', () => {
      const nodes: Node[] = [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { messageText: 'Старт', buttons: [] }
        }
      ];

      const context = GenerationContextFactory.createBasicContext('my_bot', nodes);

      expect(context.botName).toBe('my_bot');
      expect(context.nodes).toHaveLength(1);
      expect(context.nodes[0].id).toBe('start-1');
      expect(context.allNodeIds).toEqual(['start-1']);
    });
  });
});