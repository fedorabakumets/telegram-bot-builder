/**
 * Контекст генерации кода - управляет данными и состоянием процесса генерации
 */

import { BotData, Node, BotGroup, Connection } from '../../../../shared/schema';
import { GenerationContext, GenerationError, GenerationErrorType } from './types';
import { extractNodesAndConnections } from '../format/extractNodesAndConnections';
import { collectMediaVariables } from '../variable/collectMediaVariables';

/**
 * Класс для создания и управления контекстом генерации
 */
export class GenerationContextBuilder {
  /**
   * Создает контекст генерации из данных бота
   */
  static createFromBotData(
    botData: BotData,
    options: {
      botName: string;
      groups: BotGroup[];
      userDatabaseEnabled: boolean;
      projectId: number | null;
      enableLogging: boolean;
    }
  ): GenerationContext {
    // Извлекаем узлы и соединения из данных бота
    const { nodes, connections } = extractNodesAndConnections(botData);
    
    // Собираем медиа переменные
    const mediaVariablesMap = collectMediaVariables(nodes);
    
    // Получаем все ID узлов
    const allNodeIds = nodes.map(node => node.id);
    
    return {
      botData,
      botName: options.botName,
      groups: options.groups,
      userDatabaseEnabled: options.userDatabaseEnabled,
      projectId: options.projectId,
      enableLogging: options.enableLogging,
      nodes,
      connections,
      mediaVariablesMap,
      allNodeIds
    };
  }

  /**
   * Валидирует контекст генерации
   */
  static validateContext(context: GenerationContext): GenerationError[] {
    const errors: GenerationError[] = [];

    // Проверяем обязательные поля
    if (!context.botName || context.botName.trim() === '') {
      errors.push({
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'Имя бота не может быть пустым',
        module: 'GenerationContext'
      });
    }

    if (!context.botData) {
      errors.push({
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'Данные бота отсутствуют',
        module: 'GenerationContext'
      });
    }

    if (!context.nodes || context.nodes.length === 0) {
      errors.push({
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'Бот должен содержать хотя бы один узел',
        module: 'GenerationContext'
      });
    }

    // Проверяем наличие стартового узла
    const hasStartNode = context.nodes?.some(node => node.type === 'start');
    if (!hasStartNode) {
      errors.push({
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'Бот должен содержать стартовый узел',
        module: 'GenerationContext'
      });
    }

    // Проверяем корректность имени бота (только латинские буквы, цифры и подчеркивания)
    const botNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!botNameRegex.test(context.botName)) {
      errors.push({
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'Имя бота должно содержать только латинские буквы, цифры и подчеркивания, и начинаться с буквы или подчеркивания',
        module: 'GenerationContext'
      });
    }

    // Проверяем уникальность ID узлов
    const nodeIds = context.nodes?.map(node => node.id) || [];
    const uniqueNodeIds = new Set(nodeIds);
    if (nodeIds.length !== uniqueNodeIds.size) {
      errors.push({
        type: GenerationErrorType.VALIDATION_ERROR,
        message: 'ID узлов должны быть уникальными',
        module: 'GenerationContext'
      });
    }

    return errors;
  }

  /**
   * Создает копию контекста с измененными параметрами
   */
  static cloneWithChanges(
    context: GenerationContext,
    changes: Partial<GenerationContext>
  ): GenerationContext {
    return {
      ...context,
      ...changes
    };
  }

  /**
   * Получает статистику контекста
   */
  static getContextStats(context: GenerationContext) {
    const nodesByType = context.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalButtons = context.nodes.reduce((acc, node) => {
      return acc + (node.data.buttons?.length || 0);
    }, 0);

    return {
      totalNodes: context.nodes.length,
      totalConnections: context.connections.length,
      totalButtons,
      nodesByType,
      hasGroups: context.groups.length > 0,
      hasDatabaseEnabled: context.userDatabaseEnabled,
      hasLogging: context.enableLogging,
      mediaVariablesCount: context.mediaVariablesMap.size
    };
  }
}

/**
 * Фабричные методы для создания контекста
 */
export class GenerationContextFactory {
  /**
   * Создает минимальный контекст для тестирования
   */
  static createTestContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
    const defaultContext: GenerationContext = {
      botData: { nodes: [], connections: [] },
      botName: 'test_bot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false,
      nodes: [],
      connections: [],
      mediaVariablesMap: new Map(),
      allNodeIds: []
    };

    return { ...defaultContext, ...overrides };
  }

  /**
   * Создает контекст с базовой конфигурацией
   */
  static createBasicContext(
    botName: string,
    nodes: Node[],
    connections: Connection[] = []
  ): GenerationContext {
    const botData: BotData = { nodes, connections };
    const mediaVariablesMap = collectMediaVariables(nodes);
    const allNodeIds = nodes.map(node => node.id);

    return {
      botData,
      botName,
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false,
      nodes,
      connections,
      mediaVariablesMap,
      allNodeIds
    };
  }
}