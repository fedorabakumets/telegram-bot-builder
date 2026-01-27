/**
 * Тесты для типов и интерфейсов модуля Core
 */

import { describe, it, expect, vi } from 'vitest';
import {
  GenerationContext,
  GenerationOptions,
  GenerationResult,
  GenerationError,
  GenerationErrorType,
  IImportsGenerator,
  IPythonCodeGenerator,
  IHandlerGenerator,
  IMainLoopGenerator,
  ICodeGenerator
} from '../Core/types';
import { BotData, Node, BotGroup } from '../../../../shared/schema';

describe('Core Types', () => {
  describe('GenerationContext', () => {
    it('should have all required properties', () => {
      const mockBotData: BotData = {
        id: 1,
        name: 'TestBot',
        token: 'test-token',
        nodes: [],
        connections: []
      } as BotData;

      const mockNodes: Node[] = [];
      const mockGroups: BotGroup[] = [];
      const mockConnections: any[] = [];
      const mockMediaVariablesMap = new Map<string, any>();
      const mockAllNodeIds: string[] = [];

      const context: GenerationContext = {
        botData: mockBotData,
        botName: 'TestBot',
        groups: mockGroups,
        userDatabaseEnabled: true,
        projectId: 1,
        enableLogging: true,
        nodes: mockNodes,
        connections: mockConnections,
        mediaVariablesMap: mockMediaVariablesMap,
        allNodeIds: mockAllNodeIds
      };

      expect(context.botData).toBe(mockBotData);
      expect(context.botName).toBe('TestBot');
      expect(context.groups).toBe(mockGroups);
      expect(context.userDatabaseEnabled).toBe(true);
      expect(context.projectId).toBe(1);
      expect(context.enableLogging).toBe(true);
      expect(context.nodes).toBe(mockNodes);
      expect(context.connections).toBe(mockConnections);
      expect(context.mediaVariablesMap).toBe(mockMediaVariablesMap);
      expect(context.allNodeIds).toBe(mockAllNodeIds);
    });

    it('should allow null projectId', () => {
      const context: Partial<GenerationContext> = {
        projectId: null
      };

      expect(context.projectId).toBeNull();
    });
  });

  describe('GenerationOptions', () => {
    it('should have all required properties', () => {
      const mockGroups: BotGroup[] = [];

      const options: GenerationOptions = {
        botName: 'TestBot',
        groups: mockGroups,
        userDatabaseEnabled: false,
        projectId: null,
        enableLogging: false
      };

      expect(options.botName).toBe('TestBot');
      expect(options.groups).toBe(mockGroups);
      expect(options.userDatabaseEnabled).toBe(false);
      expect(options.projectId).toBeNull();
      expect(options.enableLogging).toBe(false);
    });

    it('should allow optional templateOverrides', () => {
      const options: GenerationOptions = {
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled: true,
        projectId: 1,
        enableLogging: true,
        templateOverrides: {
          'main': 'custom main template',
          'imports': 'custom imports template'
        }
      };

      expect(options.templateOverrides).toEqual({
        'main': 'custom main template',
        'imports': 'custom imports template'
      });
    });
  });

  describe('GenerationResult', () => {
    it('should support successful result', () => {
      const result: GenerationResult = {
        success: true,
        code: 'print("Hello, World!")',
        metadata: {
          linesGenerated: 1,
          handlersCount: 0,
          nodesProcessed: 0
        }
      };

      expect(result.success).toBe(true);
      expect(result.code).toBe('print("Hello, World!")');
      expect(result.metadata?.linesGenerated).toBe(1);
    });

    it('should support error result', () => {
      const result: GenerationResult = {
        success: false,
        errors: ['Validation failed', 'Missing required field'],
        warnings: ['Deprecated feature used']
      };

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Validation failed', 'Missing required field']);
      expect(result.warnings).toEqual(['Deprecated feature used']);
    });
  });

  describe('GenerationErrorType', () => {
    it('should have all expected error types', () => {
      expect(GenerationErrorType.VALIDATION_ERROR).toBe('validation_error');
      expect(GenerationErrorType.TEMPLATE_ERROR).toBe('template_error');
      expect(GenerationErrorType.HANDLER_GENERATION_ERROR).toBe('handler_generation_error');
      expect(GenerationErrorType.IMPORT_ERROR).toBe('import_error');
      expect(GenerationErrorType.UNKNOWN_ERROR).toBe('unknown_error');
    });
  });

  describe('GenerationError', () => {
    it('should have all required properties', () => {
      const error: GenerationError = {
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'Invalid bot data',
        module: 'CoreValidator'
      };

      expect(error.type).toBe(GenerationErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid bot data');
      expect(error.module).toBe('CoreValidator');
    });

    it('should allow optional context', () => {
      const error: GenerationError = {
        type: GenerationErrorType.TEMPLATE_ERROR,
        message: 'Template not found',
        module: 'TemplateEngine',
        context: {
          templateName: 'main.py',
          availableTemplates: ['base.py', 'handler.py']
        }
      };

      expect(error.context).toEqual({
        templateName: 'main.py',
        availableTemplates: ['base.py', 'handler.py']
      });
    });
  });
});

describe('Generator Interfaces', () => {
  describe('IImportsGenerator', () => {
    it('should have correct method signatures', () => {
      // Создаем mock реализацию для проверки интерфейса
      const mockGenerator: IImportsGenerator = {
        generateImports: vi.fn().mockReturnValue('import asyncio'),
        generateEncodingSetup: vi.fn().mockReturnValue('# -*- coding: utf-8 -*-'),
        generateBotFatherCommands: vi.fn().mockReturnValue('/start - Start bot')
      };

      expect(typeof mockGenerator.generateImports).toBe('function');
      expect(typeof mockGenerator.generateEncodingSetup).toBe('function');
      expect(typeof mockGenerator.generateBotFatherCommands).toBe('function');

      // Проверяем, что методы возвращают строки
      const mockContext = {} as GenerationContext;
      const mockNodes = [] as Node[];

      expect(typeof mockGenerator.generateImports(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateEncodingSetup()).toBe('string');
      expect(typeof mockGenerator.generateBotFatherCommands(mockNodes)).toBe('string');
    });
  });

  describe('IPythonCodeGenerator', () => {
    it('should have correct method signatures', () => {
      const mockGenerator: IPythonCodeGenerator = {
        generateBotInitialization: vi.fn().mockReturnValue('bot = Bot(token)'),
        generateGlobalVariables: vi.fn().mockReturnValue('API_BASE_URL = "http://localhost"'),
        generateUtilityFunctions: vi.fn().mockReturnValue('def safe_edit_or_send(): pass')
      };

      expect(typeof mockGenerator.generateBotInitialization).toBe('function');
      expect(typeof mockGenerator.generateGlobalVariables).toBe('function');
      expect(typeof mockGenerator.generateUtilityFunctions).toBe('function');

      const mockContext = {} as GenerationContext;

      expect(typeof mockGenerator.generateBotInitialization(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateGlobalVariables(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateUtilityFunctions(mockContext)).toBe('string');
    });
  });

  describe('IHandlerGenerator', () => {
    it('should have correct method signatures', () => {
      const mockGenerator: IHandlerGenerator = {
        generateMessageHandlers: vi.fn().mockReturnValue('@dp.message()'),
        generateCallbackHandlers: vi.fn().mockReturnValue('@dp.callback_query()'),
        generateMultiSelectHandlers: vi.fn().mockReturnValue('# Multi-select handlers'),
        generateMediaHandlers: vi.fn().mockReturnValue('@dp.message(F.photo)')
      };

      expect(typeof mockGenerator.generateMessageHandlers).toBe('function');
      expect(typeof mockGenerator.generateCallbackHandlers).toBe('function');
      expect(typeof mockGenerator.generateMultiSelectHandlers).toBe('function');
      expect(typeof mockGenerator.generateMediaHandlers).toBe('function');

      const mockContext = {} as GenerationContext;

      expect(typeof mockGenerator.generateMessageHandlers(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateCallbackHandlers(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateMultiSelectHandlers(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateMediaHandlers(mockContext)).toBe('string');
    });
  });

  describe('IMainLoopGenerator', () => {
    it('should have correct method signatures', () => {
      const mockGenerator: IMainLoopGenerator = {
        generateMainFunction: vi.fn().mockReturnValue('async def main():'),
        generateBotStartup: vi.fn().mockReturnValue('await dp.start_polling(bot)'),
        generateBotShutdown: vi.fn().mockReturnValue('await bot.session.close()')
      };

      expect(typeof mockGenerator.generateMainFunction).toBe('function');
      expect(typeof mockGenerator.generateBotStartup).toBe('function');
      expect(typeof mockGenerator.generateBotShutdown).toBe('function');

      const mockContext = {} as GenerationContext;

      expect(typeof mockGenerator.generateMainFunction(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateBotStartup(mockContext)).toBe('string');
      expect(typeof mockGenerator.generateBotShutdown(mockContext)).toBe('string');
    });
  });

  describe('ICodeGenerator', () => {
    it('should have correct method signature', () => {
      const mockResult: GenerationResult = {
        success: true,
        code: 'generated code'
      };

      const mockGenerator: ICodeGenerator = {
        generate: vi.fn().mockReturnValue(mockResult)
      };

      expect(typeof mockGenerator.generate).toBe('function');

      const mockContext = {} as GenerationContext;
      const result = mockGenerator.generate(mockContext);

      expect(result).toBe(mockResult);
      expect(result.success).toBe(true);
      expect(result.code).toBe('generated code');
    });
  });
});

describe('Type Validation', () => {
  describe('GenerationContext validation', () => {
    it('should validate required properties exist', () => {
      const createValidContext = (): GenerationContext => ({
        botData: {} as BotData,
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled: true,
        projectId: 1,
        enableLogging: true,
        nodes: [],
        connections: [],
        mediaVariablesMap: new Map(),
        allNodeIds: []
      });

      expect(() => createValidContext()).not.toThrow();

      const context = createValidContext();
      expect(context.botName).toBeDefined();
      expect(context.groups).toBeDefined();
      expect(context.nodes).toBeDefined();
      expect(context.connections).toBeDefined();
      expect(context.mediaVariablesMap).toBeDefined();
      expect(context.allNodeIds).toBeDefined();
    });

    it('should handle Map type correctly', () => {
      const mediaMap = new Map<string, any>();
      mediaMap.set('image1', { type: 'photo', url: 'test.jpg' });

      const context: Partial<GenerationContext> = {
        mediaVariablesMap: mediaMap
      };

      expect(context.mediaVariablesMap).toBeInstanceOf(Map);
      expect(context.mediaVariablesMap?.get('image1')).toEqual({
        type: 'photo',
        url: 'test.jpg'
      });
    });
  });

  describe('Interface compatibility', () => {
    it('should ensure all generator interfaces are compatible', () => {
      // Проверяем, что все интерфейсы генераторов принимают GenerationContext
      const mockContext = {} as GenerationContext;
      const mockNodes = [] as Node[];

      // Эти функции должны компилироваться без ошибок типов
      const testImportsGenerator = (gen: IImportsGenerator) => {
        gen.generateImports(mockContext);
        gen.generateEncodingSetup();
        gen.generateBotFatherCommands(mockNodes);
      };

      const testPythonGenerator = (gen: IPythonCodeGenerator) => {
        gen.generateBotInitialization(mockContext);
        gen.generateGlobalVariables(mockContext);
        gen.generateUtilityFunctions(mockContext);
      };

      const testHandlerGenerator = (gen: IHandlerGenerator) => {
        gen.generateMessageHandlers(mockContext);
        gen.generateCallbackHandlers(mockContext);
        gen.generateMultiSelectHandlers(mockContext);
        gen.generateMediaHandlers(mockContext);
      };

      const testMainLoopGenerator = (gen: IMainLoopGenerator) => {
        gen.generateMainFunction(mockContext);
        gen.generateBotStartup(mockContext);
        gen.generateBotShutdown(mockContext);
      };

      const testCodeGenerator = (gen: ICodeGenerator) => {
        gen.generate(mockContext);
      };

      // Если код компилируется, тесты проходят
      expect(testImportsGenerator).toBeDefined();
      expect(testPythonGenerator).toBeDefined();
      expect(testHandlerGenerator).toBeDefined();
      expect(testMainLoopGenerator).toBeDefined();
      expect(testCodeGenerator).toBeDefined();
    });
  });
});