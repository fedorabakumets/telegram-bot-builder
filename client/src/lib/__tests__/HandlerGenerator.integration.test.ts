/**
 * Integration тесты для HandlerGenerator
 * Тестируют взаимодействие с существующими модулями
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HandlerGenerator } from '../Generators/HandlerGenerator';
import { GenerationContext } from '../Core/types';
import { Node, BotData } from '../../../../shared/schema';

describe('HandlerGenerator Integration Tests', () => {
  let handlerGenerator: HandlerGenerator;
  let mockContext: GenerationContext;

  beforeEach(() => {
    handlerGenerator = new HandlerGenerator();
    
    mockContext = {
      botData: {} as BotData,
      botName: 'IntegrationTestBot',
      groups: [],
      userDatabaseEnabled: true,
      projectId: 123,
      enableLogging: true,
      nodes: [],
      connections: [],
      mediaVariablesMap: new Map(),
      allNodeIds: []
    };
  });

  describe('Integration with CommandHandler module', () => {
    it('should properly integrate with generateStartHandler', () => {
      const startNode: Node = {
        id: 'start_integration',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Добро пожаловать в интеграционный тест!',
          adminOnly: false,
          isPrivateOnly: false,
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [startNode];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      // Проверяем, что используется правильная функция из CommandHandler
      expect(result).toContain('@dp.message(CommandStart())');
      expect(result).toContain('async def start_handler');
      expect(result).toContain('@@NODE_START:start_integration@@');
      expect(result).toContain('@@NODE_END:start_integration@@');
      
      // Проверяем, что есть базовая логика регистрации пользователя
      expect(result).toContain('user_id = message.from_user.id');
    });

    it('should properly integrate with generateCommandHandler', () => {
      const helpNode: Node = {
        id: 'help_integration',
        type: 'command',
        position: { x: 0, y: 0 },
        data: {
          command: '/help',
          messageText: 'Помощь по интеграционному тесту',
          adminOnly: true,
          isPrivateOnly: true,
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [helpNode];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      // Проверяем интеграцию с CommandHandler
      expect(result).toContain('@dp.message(Command("help"))');
      expect(result).toContain('async def help_handler');
      expect(result).toContain('@@NODE_START:help_integration@@');
      expect(result).toContain('@@NODE_END:help_integration@@');
      
      // Проверяем, что обрабатываются флаги adminOnly и isPrivateOnly
      expect(result).toContain('is_admin');
      expect(result).toContain('is_private_chat');
    });
  });

  describe('Integration with MediaHandler module', () => {
    it('should properly integrate with media handlers', () => {
      const stickerNode: Node = {
        id: 'sticker_integration',
        type: 'sticker',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Стикер получен в интеграционном тесте',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      const voiceNode: Node = {
        id: 'voice_integration',
        type: 'voice',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Голосовое сообщение получено',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [stickerNode, voiceNode];
      
      const result = handlerGenerator.generateMediaHandlers(mockContext);
      
      // Проверяем интеграцию с MediaHandler модулями
      expect(result).toContain('# Обработчики медиа');
      expect(result).toContain('@@NODE_START:sticker_integration@@');
      expect(result).toContain('@@NODE_START:voice_integration@@');
      expect(result).toContain('# Обработчик стикера для узла sticker_integration');
      expect(result).toContain('# Обработчик голосового сообщения для узла voice_integration');
    });
  });

  describe('Integration with Keyboard module', () => {
    it('should properly integrate with generateInlineKeyboardCode', () => {
      const inlineNode: Node = {
        id: 'inline_integration',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Выберите опцию',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_option1',
              text: 'Опция 1',
              action: 'goto',
              target: 'target1',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            },
            {
              id: 'btn_option2',
              text: 'Опция 2',
              action: 'goto',
              target: 'target2',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }
          ],
          options: []
        }
      };

      const targetNode1: Node = {
        id: 'target1',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Вы выбрали опцию 1',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [inlineNode, targetNode1];
      mockContext.allNodeIds = ['inline_integration', 'target1', 'target2'];
      
      const result = handlerGenerator.generateCallbackHandlers(mockContext);
      
      // Проверяем интеграцию с Keyboard модулем
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('handle_callback_target1');
      expect(result).toContain('@dp.callback_query');
    });

    it('should properly integrate with generateReplyKeyboardCode', () => {
      const replyNode: Node = {
        id: 'reply_integration',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Выберите из меню',
          keyboardType: 'reply',
          buttons: [
            {
              id: 'btn_menu1',
              text: 'Меню 1',
              action: 'goto',
              target: 'menu1',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [replyNode];
      mockContext.connections = [{ source: 'reply_integration', target: 'menu1' }];
      
      const result = handlerGenerator.generateCallbackHandlers(mockContext);
      
      // Reply клавиатуры создают обработчики через connections
      expect(result).toContain('# Обработчики автопереходов');
    });
  });

  describe('Integration with Synonyms module', () => {
    it('should properly integrate with synonym handlers', () => {
      const nodeWithSynonyms: Node = {
        id: 'synonyms_integration',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          synonyms: ['привет', 'здравствуй', 'добро пожаловать'],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [nodeWithSynonyms];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      // Проверяем интеграцию с Synonyms модулем
      expect(result).toContain('# Обработчики синонимов');
      expect(result).toContain('start_synonym_привет_handler');
      expect(result).toContain('start_synonym_здравствуй_handler');
      expect(result).toContain('start_synonym_добро_пожаловать_handler');
    });

    it('should handle user management synonyms', () => {
      const banNode: Node = {
        id: 'ban_integration',
        type: 'ban_user',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Пользователь заблокирован',
          synonyms: ['бан', 'заблокировать', 'кик'],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [banNode];
      
      const result = handlerGenerator.generateMessageHandlers(mockContext);
      
      // Проверяем интеграцию с UserHandler синонимами
      expect(result).toContain('# Обработчики синонимов');
      expect(result).toContain('ban_user_ban_integration_synonym_бан_handler');
    });
  });

  describe('Integration with Conditional module', () => {
    it('should properly integrate with conditional message logic', () => {
      const conditionalNode: Node = {
        id: 'conditional_integration',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Базовое сообщение',
          conditionalMessages: [
            {
              id: 'adult_condition',
              condition: 'user_data_exists',
              messageText: 'Сообщение для взрослых',
              keyboardType: 'inline',
              buttons: [
                {
                  id: 'adult_btn',
                  text: 'Продолжить',
                  action: 'goto',
                  target: 'adult_content',
                  buttonType: 'normal',
                  skipDataCollection: false,
                  hideAfterClick: false
                }
              ]
            }
          ],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [conditionalNode];
      mockContext.connections = [{ source: 'conditional_integration', target: 'adult_content' }];
      
      const result = handlerGenerator.generateCallbackHandlers(mockContext);
      
      // Проверяем интеграцию с Conditional модулем - создается обработчик для автопереходов
      expect(result).toContain('# Обработчики автопереходов');
    });
  });

  describe('Complex integration scenarios', () => {
    it('should handle bot with all handler types integrated', () => {
      const startNode: Node = {
        id: 'complex_start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Комплексный бот запущен',
          synonyms: ['старт', 'начать'],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      const menuNode: Node = {
        id: 'complex_menu',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Главное меню',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'settings_btn',
              text: 'Настройки',
              action: 'goto',
              target: 'settings',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            },
            {
              id: 'help_btn',
              text: 'Помощь',
              action: 'goto',
              target: 'help',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }
          ],
          options: []
        }
      };

      const multiSelectNode: Node = {
        id: 'interests',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Выберите интересы',
          allowMultipleSelection: true,
          continueButtonTarget: 'results',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'sport_btn',
              text: 'Спорт',
              action: 'selection',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            },
            {
              id: 'music_btn',
              text: 'Музыка',
              action: 'selection',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }
          ],
          options: []
        }
      };

      const stickerNode: Node = {
        id: 'sticker_complex',
        type: 'sticker',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Стикер в комплексном боте',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [startNode, menuNode, multiSelectNode, stickerNode];
      mockContext.allNodeIds = ['complex_start', 'complex_menu', 'interests', 'sticker_complex', 'settings', 'help', 'results'];
      mockContext.connections = [
        { source: 'complex_start', target: 'complex_menu' },
        { source: 'complex_menu', target: 'settings' },
        { source: 'complex_menu', target: 'help' },
        { source: 'interests', target: 'results' }
      ];
      
      const messageHandlers = handlerGenerator.generateMessageHandlers(mockContext);
      const callbackHandlers = handlerGenerator.generateCallbackHandlers(mockContext);
      const multiSelectHandlers = handlerGenerator.generateMultiSelectHandlers(mockContext);
      const mediaHandlers = handlerGenerator.generateMediaHandlers(mockContext);
      
      // Проверяем, что все модули интегрированы корректно
      expect(messageHandlers).toContain('CommandStart()');
      expect(messageHandlers).toContain('# Обработчики синонимов');
      expect(callbackHandlers).toContain('handle_callback_settings');
      expect(multiSelectHandlers).toContain('multi_select_done_');
      expect(mediaHandlers).toContain('# Обработчик стикера для узла sticker_complex');
      
      // Проверяем, что нет конфликтов между модулями (основные проверки)
      expect(messageHandlers).toContain('# Обработчики команд');
      expect(callbackHandlers).toContain('handle_callback_settings');
      expect(multiSelectHandlers).toContain('multi_select_done_');
      expect(mediaHandlers).toContain('# Обработчик стикера для узла sticker_complex');
    });
  });
});