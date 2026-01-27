/**
 * Integration тесты для CodeGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGenerator, CodeGeneratorFactory } from '../Core/CodeGenerator';
import { GenerationContextFactory } from '../Core/GenerationContext';
import { GenerationContext, GenerationErrorType } from '../Core/types';
import { Node } from '../../../shared/schema';

describe('CodeGenerator', () => {
  let codeGenerator: CodeGenerator;
  let validContext: GenerationContext;

  beforeEach(() => {
    codeGenerator = CodeGeneratorFactory.createWithMocks();
    
    const nodes: Node[] = [
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

    validContext = GenerationContextFactory.createBasicContext('test_bot', nodes);
  });

  describe('generate', () => {
    it('должен успешно сгенерировать код для валидного контекста', () => {
      const result = codeGenerator.generate(validContext);

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code).toContain('# -*- coding: utf-8 -*-');
      expect(result.code).toContain('# Mock imports');
      expect(result.code).toContain('# Mock bot initialization');
      expect(result.code).toContain('# Mock global variables');
      expect(result.code).toContain('# Mock utility functions');
      expect(result.code).toContain('# Mock message handlers');
      expect(result.code).toContain('# Mock callback handlers');
      expect(result.code).toContain('# Mock multiselect handlers');
      expect(result.code).toContain('# Mock media handlers');
      expect(result.code).toContain('# Mock main function');
      expect(result.code).toContain('# Mock bot startup');
      expect(result.errors).toEqual([]);
    });

    it('должен вернуть метаданные генерации', () => {
      const result = codeGenerator.generate(validContext);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.linesGenerated).toBeGreaterThan(0);
      expect(result.metadata!.handlersCount).toBeGreaterThanOrEqual(0);
      expect(result.metadata!.nodesProcessed).toBe(2);
    });

    it('должен вернуть ошибку для пустого контекста', () => {
      const result = codeGenerator.generate(null as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Контекст генерации не предоставлен');
    });

    it('должен вернуть ошибку для контекста без имени бота', () => {
      const invalidContext = { ...validContext, botName: '' };
      const result = codeGenerator.generate(invalidContext);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Имя бота не может быть пустым');
    });

    it('должен обрабатывать контекст без узлов (генерировать базовый код)', () => {
      const invalidContext = { ...validContext, nodes: [] };
      const result = codeGenerator.generate(invalidContext);

      // Новое поведение: генерируем базовый код для пустых ботов
      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code).toContain('# Mock imports');
    });

    it('должен обрабатывать контекст без стартового узла (использовать первый узел)', () => {
      const noStartNodes: Node[] = [
        {
          id: 'message-1',
          type: 'message',
          position: { x: 0, y: 0 },
          data: { messageText: 'Сообщение', buttons: [] }
        }
      ];
      const invalidContext = { ...validContext, nodes: noStartNodes };
      const result = codeGenerator.generate(invalidContext);

      // Новое поведение: используем первый узел как стартовый
      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code).toContain('# Mock message handlers');
    });

    it('должен включить команды BotFather в сгенерированный код', () => {
      const result = codeGenerator.generate(validContext);

      expect(result.success).toBe(true);
      expect(result.code).toContain('# Команды для BotFather:');
      expect(result.code).toContain('# Mock BotFather commands');
    });

    it('должен обработать предупреждения без прерывания генерации', () => {
      // Создаем генератор с ошибкой в BotFather командах
      const mockImportsGenerator = {
        generateImports: () => '# Mock imports',
        generateEncodingSetup: () => '# -*- coding: utf-8 -*-',
        generateBotFatherCommands: () => { throw new Error('BotFather error'); }
      };

      const mockPythonCodeGenerator = {
        generateBotInitialization: () => '# Mock bot initialization',
        generateGlobalVariables: () => '# Mock global variables',
        generateUtilityFunctions: () => '# Mock utility functions',
        generateGroupsConfiguration: () => '# Mock groups configuration'
      };

      const mockHandlerGenerator = {
        generateMessageHandlers: () => '# Mock message handlers',
        generateCallbackHandlers: () => '# Mock callback handlers',
        generateMultiSelectHandlers: () => '# Mock multiselect handlers',
        generateMediaHandlers: () => '# Mock media handlers',
        generateGroupHandlers: () => '# Mock group handlers'
      };

      const mockMainLoopGenerator = {
        generateMainFunction: () => '# Mock main function',
        generateBotStartup: () => '# Mock bot startup',
        generateBotShutdown: () => '# Mock bot shutdown'
      };

      const generatorWithError = new CodeGenerator(
        mockImportsGenerator,
        mockPythonCodeGenerator,
        mockHandlerGenerator,
        mockMainLoopGenerator
      );

      const result = generatorWithError.generate(validContext);

      expect(result.success).toBe(true); // Генерация должна быть успешной
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings![0]).toContain('BotFather');
    });
  });

  describe('CodeGeneratorFactory', () => {
    describe('createWithMocks', () => {
      it('должен создать CodeGenerator с рабочими заглушками', () => {
        const generator = CodeGeneratorFactory.createWithMocks();
        expect(generator).toBeInstanceOf(CodeGenerator);

        const result = generator.generate(validContext);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
      });
    });
  });

  describe('интеграция с GenerationContext', () => {
    it('должен работать с контекстом, созданным через GenerationContextFactory', () => {
      const testContext = GenerationContextFactory.createTestContext({
        botName: 'integration_test_bot',
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            position: { x: 0, y: 0 },
            data: { messageText: 'Старт', buttons: [] }
          }
        ]
      });

      const result = codeGenerator.generate(testContext);

      expect(result.success).toBe(true);
      expect(result.metadata!.nodesProcessed).toBe(1);
    });

    it('должен обрабатывать сложные контексты с множественными узлами', () => {
      const complexNodes: Node[] = [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { messageText: 'Старт', buttons: [] }
        },
        {
          id: 'command-1',
          type: 'command',
          position: { x: 100, y: 0 },
          data: { command: '/help', description: 'Помощь', buttons: [] }
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 200, y: 0 },
          data: { messageText: 'Сообщение', buttons: [] }
        }
      ];

      const complexContext = GenerationContextFactory.createBasicContext('complex_bot', complexNodes);
      const result = codeGenerator.generate(complexContext);

      expect(result.success).toBe(true);
      expect(result.metadata!.nodesProcessed).toBe(3);
    });
  });
});