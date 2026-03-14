/**
 * @fileoverview Тесты для модуля create-generation-context
 * @module lib/tests/unit/core/generation-context.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  createGenerationContext,
  createGenerationContextFromNodes,
} from '../../../bot-generator/core/create-generation-context';
import type { GenerationContext } from '../../../bot-generator/core/generation-context';
import type { GenerationOptions } from '../../../bot-generator/core/generation-options.types';
import type { BotData, BotGroup } from '@shared/schema';
import {
  validSimpleBotData,
  validComplexBotData,
  validStartNode,
  validMessageNode,
  defaultGenerationOptions,
  loggingEnabledOptions,
  databaseEnabledOptions,
  allEnabledOptions,
} from '../../helpers/test-fixtures';

describe('GenerationContext', () => {
  describe('createGenerationContext', () => {
    it('должен создавать контекст с базовыми параметрами', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.ok(context);
      assert.strictEqual(context.botName, botName);
      assert.ok(Array.isArray(context.nodes));
      assert.ok(Array.isArray(context.allNodeIds));
    });

    it('должен конвертировать узлы из botData в EnhancedNode[]', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.nodes.length, botData.nodes.length);
      assert.strictEqual(context.nodes[0].id, botData.nodes[0].id);
      assert.strictEqual(context.nodes[1].id, botData.nodes[1].id);
    });

    it('должен извлекать все Node IDs из узлов', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.allNodeIds.length, botData.nodes.length);
      assert.ok(context.allNodeIds.includes('start_1'));
      assert.ok(context.allNodeIds.includes('message_1'));
    });

    it('должен создавать mediaVariablesMap', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.ok(context.mediaVariablesMap);
      assert.ok(typeof context.mediaVariablesMap === 'object');
    });

    it('должен устанавливать projectId из options', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = { projectId: 42 };

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.projectId, 42);
    });

    it('должен устанавливать projectId в null по умолчанию', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.projectId, null);
    });

    it('должен сохранять groups', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [
        { id: 1, projectId: 1, name: 'Group 1', groupId: '-100123', enabled: true },
        { id: 2, projectId: 1, name: 'Group 2', groupId: '-100456', enabled: false },
      ] as BotGroup[];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.groups.length, 2);
      assert.strictEqual(context.groups[0].name, 'Group 1');
      assert.strictEqual(context.groups[1].name, 'Group 2');
    });

    it('должен создавать пустой массив groups по умолчанию', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.ok(Array.isArray(context.groups));
      assert.strictEqual(context.groups.length, 0);
    });

    it('должен создавать state с опциями по умолчанию', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.ok(context.state);
      assert.strictEqual(context.state.loggingEnabled, false);
      assert.strictEqual(context.state.commentsEnabled, true);
    });

    it('должен создавать state с включенным логированием', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = { enableLogging: true };

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.state.loggingEnabled, true);
    });

    it('должен создавать state с отключенными комментариями', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = { enableComments: false };

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.state.commentsEnabled, false);
    });

    it('должен сохранять options в контексте', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {
        enableLogging: true,
        enableComments: false,
        userDatabaseEnabled: true,
      };

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.ok(context.options);
      assert.strictEqual(context.options.enableLogging, true);
      assert.strictEqual(context.options.enableComments, false);
      assert.strictEqual(context.options.userDatabaseEnabled, true);
    });
  });

  describe('createGenerationContextFromNodes', () => {
    it('должен создавать контекст из массива EnhancedNode[]', () => {
      // Arrange
      const nodes = [validStartNode, validMessageNode];
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, groups, options);

      // Assert
      assert.ok(context);
      assert.strictEqual(context.nodes.length, 2);
      assert.strictEqual(context.nodes[0].id, 'start_1');
      assert.strictEqual(context.nodes[1].id, 'message_1');
    });

    it('должен извлекать все Node IDs из массива узлов', () => {
      // Arrange
      const nodes = [validStartNode, validMessageNode];
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, groups, options);

      // Assert
      assert.strictEqual(context.allNodeIds.length, 2);
      assert.ok(context.allNodeIds.includes('start_1'));
      assert.ok(context.allNodeIds.includes('message_1'));
    });

    it('должен создавать mediaVariablesMap', () => {
      // Arrange
      const nodes = [validStartNode, validMessageNode];
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, groups, options);

      // Assert
      assert.ok(context.mediaVariablesMap);
    });

    it('должен использовать пустой массив groups по умолчанию', () => {
      // Arrange
      const nodes = [validStartNode];
      const botName = 'TestBot';
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, undefined as any, options);

      // Assert
      assert.ok(Array.isArray(context.groups));
      assert.strictEqual(context.groups.length, 0);
    });

    it('должен использовать пустые options по умолчанию', () => {
      // Arrange
      const nodes = [validStartNode];
      const botName = 'TestBot';
      const groups: BotGroup[] = [];

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, groups);

      // Assert
      assert.ok(context.options);
      assert.strictEqual(context.state.loggingEnabled, false);
      assert.strictEqual(context.state.commentsEnabled, true);
    });

    it('должен устанавливать projectId из options', () => {
      // Arrange
      const nodes = [validStartNode];
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = { projectId: 99 };

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, groups, options);

      // Assert
      assert.strictEqual(context.projectId, 99);
    });

    it('должен устанавливать projectId в null по умолчанию', () => {
      // Arrange
      const nodes = [validStartNode];
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContextFromNodes(nodes, botName, groups, options);

      // Assert
      assert.strictEqual(context.projectId, null);
    });
  });

  describe('GenerationContext with complex bot data', () => {
    it('должен создавать контекст для сложного бота', () => {
      // Arrange
      const botData = validComplexBotData;
      const botName = 'ComplexBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = { enableLogging: true };

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.nodes.length, 6);
      assert.strictEqual(context.botName, 'ComplexBot');
      assert.strictEqual(context.state.loggingEnabled, true);
    });

    it('должен извлекать все Node IDs для сложного бота', () => {
      // Arrange
      const botData = validComplexBotData;
      const botName = 'ComplexBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.allNodeIds.length, 6);
      assert.ok(context.allNodeIds.includes('start_1'));
      assert.ok(context.allNodeIds.includes('message_1'));
      assert.ok(context.allNodeIds.includes('command_1'));
      assert.ok(context.allNodeIds.includes('inline_1'));
      assert.ok(context.allNodeIds.includes('input_1'));
      assert.ok(context.allNodeIds.includes('message_after_input'));
    });
  });

  describe('GenerationContext with all options enabled', () => {
    it('должен создавать контекст со всеми включенными опциями', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'FullBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = allEnabledOptions;

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.state.loggingEnabled, true);
      assert.strictEqual(context.state.commentsEnabled, true);
      assert.strictEqual(context.options.userDatabaseEnabled, true);
      assert.strictEqual(context.options.enableGroupHandlers, true);
      assert.strictEqual(context.projectId, 1);
    });
  });

  describe('GenerationContext type', () => {
    it('должен иметь все требуемые поля', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'TestBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.ok('nodes' in context);
      assert.ok('allNodeIds' in context);
      assert.ok('mediaVariablesMap' in context);
      assert.ok('botName' in context);
      assert.ok('groups' in context);
      assert.ok('options' in context);
      assert.ok('state' in context);
      assert.ok('projectId' in context);
    });
  });

  describe('Edge cases', () => {
    it('должен обрабатывать botData с пустым массивом nodes', () => {
      // Arrange
      const botData = { id: 1, projectId: 1, nodes: [] } as BotData;
      const botName = 'EmptyBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.nodes.length, 0);
      assert.strictEqual(context.allNodeIds.length, 0);
    });

    it('должен обрабатывать botData с undefined nodes', () => {
      // Arrange
      const botData = { id: 1, projectId: 1, nodes: undefined } as any;
      const botName = 'EmptyBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.nodes.length, 0);
    });

    it('должен обрабатывать очень длинное имя бота', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'A'.repeat(1000);
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.botName.length, 1000);
    });

    it('должен обрабатывать unicode в имени бота', () => {
      // Arrange
      const botData = validSimpleBotData;
      const botName = 'Бот 🤖';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.botName, 'Бот 🤖');
    });

    it('должен обрабатывать большое количество узлов', () => {
      // Arrange
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node_${i}`,
        type: 'message' as const,
        position: { x: i * 100, y: i * 100 },
        data: { text: `Message ${i}`, buttons: [] },
      }));
      const botData = { id: 1, projectId: 1, nodes } as BotData;
      const botName = 'BigBot';
      const groups: BotGroup[] = [];
      const options: GenerationOptions = {};

      // Act
      const context = createGenerationContext(botData, botName, groups, options);

      // Assert
      assert.strictEqual(context.nodes.length, 100);
      assert.strictEqual(context.allNodeIds.length, 100);
    });
  });
});
