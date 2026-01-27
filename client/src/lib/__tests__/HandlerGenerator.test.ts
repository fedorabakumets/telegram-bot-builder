/**
 * Unit тесты для HandlerGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HandlerGenerator } from '../Generators/HandlerGenerator';
import { GenerationContext } from '../Core/types';
import { Node, BotData } from '../../../../shared/schema';

describe('HandlerGenerator', () => {
  let handlerGenerator: HandlerGenerator;
  let mockContext: GenerationContext;

  beforeEach(() => {
    handlerGenerator = new HandlerGenerator();
    
    // Создаем базовый контекст для тестов
    mockContext = {
      botData: {} as BotData,
      botName: 'TestBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false,
      nodes: [],
      connections: [],
      mediaVariablesMap: new Map(),
      allNodeIds: []
    };
  });

  describe('generateMessageHandlers', () => {
    it('should generate command handlers for start nodes', () => {
      const startNode: Node = {
        id: 'start_node',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Добро пожаловать!',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [startNode];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      expect(result).toContain('# Обработчики команд');
      expect(result).toContain('@@NODE_START:start_node@@');
      expect(result).toContain('@@NODE_END:start_node@@');
      expect(result).toContain('@dp.message(CommandStart())');
    });

    it('should generate command handlers for command nodes', () => {
      const commandNode: Node = {
        id: 'help_node',
        type: 'command',
        position: { x: 0, y: 0 },
        data: {
          command: '/help',
          messageText: 'Помощь по боту',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [commandNode];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      expect(result).toContain('# Обработчики команд');
      expect(result).toContain('@@NODE_START:help_node@@');
      expect(result).toContain('@@NODE_END:help_node@@');
      expect(result).toContain('@dp.message(Command("help"))');
    });

    it('should generate synonym handlers', () => {
      const nodeWithSynonyms: Node = {
        id: 'node_with_synonyms',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          synonyms: ['привет', 'здравствуй'],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [nodeWithSynonyms];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      expect(result).toContain('# Обработчики синонимов');
      expect(result).toContain('@@NODE_START:node_with_synonyms@@');
      expect(result).toContain('@@NODE_END:node_with_synonyms@@');
    });

    it('should return empty string when no command nodes exist', () => {
      const messageNode: Node = {
        id: 'message_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Обычное сообщение',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [messageNode];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      expect(result).not.toContain('# Обработчики команд');
      // Synonym handlers section may be empty but still present
      expect(result).toBe(''); // Should be empty when no synonyms exist
    });
  });

  describe('generateCallbackHandlers', () => {
    it('should generate inline button handlers', () => {
      const inlineNode: Node = {
        id: 'inline_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Выберите опцию',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_1',
              text: 'Кнопка 1',
              action: 'goto',
              target: 'target_node_1'
            }
          ]
        }
      };

      const targetNode: Node = {
        id: 'target_node_1',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Целевое сообщение'
        }
      };

      mockContext.nodes = [inlineNode, targetNode];
      mockContext.connections = [];
      
      const result = handlerGenerator.generateCallbackHandlers(mockContext);
      
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('@dp.callback_query(lambda c: c.data == "target_node_1"');
      expect(result).toContain('async def handle_callback_target_node_1');
    });

    it('should generate auto-transition handlers when no inline buttons exist', () => {
      const autoTransitionNode: Node = {
        id: 'auto_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Автопереход',
          enableAutoTransition: true,
          autoTransitionTo: 'next_node'
        }
      };

      mockContext.nodes = [autoTransitionNode];
      mockContext.connections = [{ source: 'auto_node', target: 'next_node' }];
      
      const result = handlerGenerator.generateCallbackHandlers(mockContext);
      
      expect(result).toContain('# Обработчики автопереходов');
    });

    it('should handle multi-select nodes with continue button', () => {
      const multiSelectNode: Node = {
        id: 'multi_select_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Выберите несколько опций',
          keyboardType: 'inline',
          allowMultipleSelection: true,
          continueButtonTarget: 'continue_node',
          buttons: [
            {
              id: 'btn_multi',
              text: 'Опция 1',
              action: 'goto',
              target: 'multi_select_node'
            }
          ]
        }
      };

      mockContext.nodes = [multiSelectNode];
      mockContext.allNodeIds = ['multi_select_node'];
      
      const result = handlerGenerator.generateCallbackHandlers(mockContext);
      
      expect(result).toContain('multi_select_done_');
    });
  });

  describe('generateMultiSelectHandlers', () => {
    it('should generate multi-select handlers for nodes with allowMultipleSelection', () => {
      const multiSelectNode: Node = {
        id: 'interests_selection',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Выберите интересы',
          allowMultipleSelection: true,
          continueButtonTarget: 'results_node',
          buttons: [
            {
              id: 'interest_1',
              text: 'Спорт',
              action: 'selection'
            },
            {
              id: 'interest_2', 
              text: 'Музыка',
              action: 'selection'
            }
          ]
        }
      };

      mockContext.nodes = [multiSelectNode];
      mockContext.allNodeIds = ['interests_selection'];
      
      const result = handlerGenerator.generateMultiSelectHandlers(mockContext);
      
      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('@dp.callback_query(lambda c: c.data.startswith("multi_select_"))');
      expect(result).toContain('async def handle_multi_select_callback');
      expect(result).toContain('multi_select_done_');
    });

    it('should return empty string when no multi-select nodes exist', () => {
      const regularNode: Node = {
        id: 'regular_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Обычное сообщение',
          allowMultipleSelection: false
        }
      };

      mockContext.nodes = [regularNode];
      
      const result = handlerGenerator.generateMultiSelectHandlers(mockContext);
      
      expect(result).toBe('');
    });
  });

  describe('generateMediaHandlers', () => {
    it('should generate sticker handler', () => {
      const stickerNode: Node = {
        id: 'sticker_node',
        type: 'sticker',
        position: { x: 0, y: 0 },
        data: {
          message: 'Стикер получен'
        }
      };

      mockContext.nodes = [stickerNode];
      
      const result = handlerGenerator.generateMediaHandlers(mockContext);
      
      expect(result).toContain('# Обработчики медиа');
      expect(result).toContain('@@NODE_START:sticker_node@@');
      expect(result).toContain('@@NODE_END:sticker_node@@');
    });

    it('should generate voice handler', () => {
      const voiceNode: Node = {
        id: 'voice_node',
        type: 'voice',
        position: { x: 0, y: 0 },
        data: {
          message: 'Голосовое сообщение получено'
        }
      };

      mockContext.nodes = [voiceNode];
      
      const result = handlerGenerator.generateMediaHandlers(mockContext);
      
      expect(result).toContain('# Обработчики медиа');
      expect(result).toContain('@@NODE_START:voice_node@@');
      expect(result).toContain('@@NODE_END:voice_node@@');
    });

    it('should generate multiple media handlers', () => {
      const stickerNode: Node = {
        id: 'sticker_node',
        type: 'sticker',
        position: { x: 0, y: 0 },
        data: { message: 'Стикер' }
      };

      const voiceNode: Node = {
        id: 'voice_node',
        type: 'voice',
        position: { x: 0, y: 0 },
        data: { message: 'Голос' }
      };

      const animationNode: Node = {
        id: 'animation_node',
        type: 'animation',
        position: { x: 0, y: 0 },
        data: { message: 'Анимация' }
      };

      mockContext.nodes = [stickerNode, voiceNode, animationNode];
      
      const result = handlerGenerator.generateMediaHandlers(mockContext);
      
      expect(result).toContain('@@NODE_START:sticker_node@@');
      expect(result).toContain('@@NODE_START:voice_node@@');
      expect(result).toContain('@@NODE_START:animation_node@@');
    });

    it('should return empty string when no media nodes exist', () => {
      const messageNode: Node = {
        id: 'message_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Обычное сообщение'
        }
      };

      mockContext.nodes = [messageNode];
      
      const result = handlerGenerator.generateMediaHandlers(mockContext);
      
      expect(result).toBe('');
    });
  });

  describe('integration tests', () => {
    it('should handle complex bot with multiple handler types', () => {
      const startNode: Node = {
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          message: 'Добро пожаловать!'
        }
      };

      const inlineNode: Node = {
        id: 'menu',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Главное меню',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_settings',
              text: 'Настройки',
              action: 'goto',
              target: 'settings'
            }
          ]
        }
      };

      const stickerNode: Node = {
        id: 'sticker_handler',
        type: 'sticker',
        position: { x: 0, y: 0 },
        data: {
          message: 'Стикер получен'
        }
      };

      mockContext.nodes = [startNode, inlineNode, stickerNode];
      mockContext.connections = [
        { source: 'start', target: 'menu' },
        { source: 'menu', target: 'settings' }
      ];
      
      const messageHandlers = handlerGenerator.generateMessageHandlers(mockContext);
      const callbackHandlers = handlerGenerator.generateCallbackHandlers(mockContext);
      const mediaHandlers = handlerGenerator.generateMediaHandlers(mockContext);
      
      // Проверяем, что все типы обработчиков сгенерированы
      expect(messageHandlers).toContain('# Обработчики команд');
      expect(callbackHandlers).toContain('# Обработчики inline кнопок');
      expect(mediaHandlers).toContain('# Обработчики медиа');
      
      // Проверяем специфичные элементы
      expect(messageHandlers).toContain('@@NODE_START:start@@');
      expect(callbackHandlers).toContain('handle_callback_settings');
      expect(mediaHandlers).toContain('@@NODE_START:sticker_handler@@');
    });

    it('should handle empty context gracefully', () => {
      const emptyContext: GenerationContext = {
        ...mockContext,
        nodes: [],
        connections: []
      };
      
      const messageHandlers = handlerGenerator.generateMessageHandlers(emptyContext);
      const callbackHandlers = handlerGenerator.generateCallbackHandlers(emptyContext);
      const multiSelectHandlers = handlerGenerator.generateMultiSelectHandlers(emptyContext);
      const mediaHandlers = handlerGenerator.generateMediaHandlers(emptyContext);
      
      // Все должны возвращать пустые строки или минимальный контент
      expect(messageHandlers).not.toContain('@@NODE_START:');
      expect(callbackHandlers).toBe('');
      expect(multiSelectHandlers).toBe('');
      expect(mediaHandlers).toBe('');
    });
  });
});