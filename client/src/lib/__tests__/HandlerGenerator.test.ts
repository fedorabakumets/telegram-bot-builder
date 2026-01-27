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
      // Но должен содержать обработчик узла сообщения
      expect(result).toContain('# Обработчики узлов сообщений');
      expect(result).toContain('message_node_handler');
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

  describe('generateGroupHandlers', () => {
    it('should generate group handlers when groups are present', () => {
      mockContext.groups = [
        {
          id: 1,
          name: 'Test Group',
          description: 'Test group description',
          url: 'https://t.me/testgroup',
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: 1,
          groupId: 'test_group',
          isAdmin: 1,
          chatId: -123456789,
          title: 'Test Group',
          type: 'supergroup',
          username: 'testgroup',
          inviteLink: 'https://t.me/testgroup',
          memberCount: 100,
          isActive: 1,
          lastActivity: new Date(),
          settings: {},
          permissions: {},
          notes: 'Test notes'
        }
      ];

      const result = handlerGenerator.generateGroupHandlers(mockContext);

      expect(result).toContain('# Обработчики для работы с группами');
      expect(result).toContain('@dp.message(F.chat.type.in_(["group", "supergroup"]))');
      expect(result).toContain('async def handle_group_message(message: types.Message):');
      expect(result).toContain('@dp.callback_query(lambda c: c.message and c.message.chat.type in ["group", "supergroup"])');
      expect(result).toContain('async def handle_group_callback(callback_query: types.CallbackQuery):');
    });

    it('should not generate group handlers when no groups present', () => {
      mockContext.groups = [];

      const result = handlerGenerator.generateGroupHandlers(mockContext);

      expect(result).toBe('');
    });

    it('should include database saving in group handlers when database is enabled', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.groups = [
        {
          id: 1,
          name: 'Test Group',
          description: 'Test group description',
          url: 'https://t.me/testgroup',
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: 1,
          groupId: 'test_group',
          isAdmin: 1,
          chatId: -123456789,
          title: 'Test Group',
          type: 'supergroup',
          username: 'testgroup',
          inviteLink: 'https://t.me/testgroup',
          memberCount: 100,
          isActive: 1,
          lastActivity: new Date(),
          settings: {},
          permissions: {},
          notes: 'Test notes'
        }
      ];

      const result = handlerGenerator.generateGroupHandlers(mockContext);

      expect(result).toContain('await save_message_to_api(');
      expect(result).toContain('message_type="group_message"');
      expect(result).toContain('message_type="group_callback"');
    });
  });

  describe('private methods coverage', () => {
    it('should handle conditional messages in nodes', () => {
      const nodeWithConditionalMessages: Node = {
        id: 'conditional_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Base message',
          conditionalMessages: [
            {
              condition: 'user_type',
              value: 'premium',
              text: 'Premium user message'
            }
          ],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [nodeWithConditionalMessages];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('conditional_node_handler');
      expect(result).toContain('# Обработка условных сообщений (conditionalMessages)');
    });

    it('should handle input nodes', () => {
      const inputNode: Node = {
        id: 'input_node',
        type: 'input',
        position: { x: 0, y: 0 },
        data: {
          message: 'Введите данные',
          variableName: 'user_input',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [inputNode];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('# Обработчики ввода данных');
      expect(result).toContain('handle_input_input_node');
      expect(result).toContain('user_data[user_id]["user_input"] = user_input');
    });

    it('should handle conditional nodes', () => {
      const conditionalNode: Node = {
        id: 'conditional_logic',
        type: 'conditional',
        position: { x: 0, y: 0 },
        data: {
          conditions: [
            {
              variable: 'age',
              operator: '>',
              value: '18',
              target: 'adult_node'
            }
          ],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [conditionalNode];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('# Обработчики условной логики');
      expect(result).toContain('handle_conditional_conditional_logic');
    });

    it('should handle admin command nodes', () => {
      const banUserNode: Node = {
        id: 'ban_user_cmd',
        type: 'ban_user',
        position: { x: 0, y: 0 },
        data: {
          command: '/ban',
          text: 'Пользователь забанен',
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [banUserNode];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('ban_user_handler');
      expect(result).toContain('@dp.message(Command("ban"))');
      expect(result).toContain('if not await is_admin(user_id):');
    });

    it('should handle nodes with attachedMedia', () => {
      const nodeWithMedia: Node = {
        id: 'media_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Message with media',
          attachedMedia: [
            {
              type: 'photo',
              url: 'https://example.com/photo.jpg'
            }
          ],
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [nodeWithMedia];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('# Отправка прикрепленных медиа (attachedMedia)');
      expect(result).toContain('URLInputFile(photo_url)');
    });

    it('should handle auto-transition nodes', () => {
      const autoTransitionNode: Node = {
        id: 'auto_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Auto transition message',
          autoTransitionTo: 'next_node',
          autoTransitionDelay: 5,
          keyboardType: 'none',
          buttons: [],
          options: []
        }
      };

      mockContext.nodes = [autoTransitionNode];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('# Автопереход через 5 секунд к узлу next_node');
      expect(result).toContain('await asyncio.sleep(5)');
      expect(result).toContain('await safe_edit_or_send');
    });

    it('should handle nodes with different button types', () => {
      const nodeWithUrlButton: Node = {
        id: 'url_button_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Choose option',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'url_btn',
              text: 'Visit Website',
              action: 'url',
              url: 'https://example.com'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [nodeWithUrlButton];

      const result = handlerGenerator.generateMessageHandlers(mockContext);

      expect(result).toContain('InlineKeyboardButton(text="Visit Website", url="https://example.com")');
    });

    it('should collect referenced node IDs from various sources', () => {
      const nodeWithComplexReferences: Node = {
        id: 'complex_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Complex node',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'goto_btn',
              text: 'Go to target',
              action: 'goto',
              target: 'target_node'
            }
          ],
          conditionalMessages: [
            {
              condition: 'status',
              value: 'active',
              text: 'Active message',
              buttons: [
                {
                  id: 'conditional_btn',
                  text: 'Conditional button',
                  action: 'goto',
                  target: 'conditional_target'
                }
              ]
            }
          ],
          inputTargetNodeId: 'input_target',
          enableAutoTransition: true,
          autoTransitionTo: 'auto_target',
          continueButtonTarget: 'continue_target',
          options: []
        }
      };

      mockContext.nodes = [nodeWithComplexReferences];
      mockContext.connections = [
        { source: 'complex_node', target: 'connection_target' }
      ];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('handle_callback_target_node');
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

    it('should handle complex multi-select scenario', () => {
      const multiSelectNode: Node = {
        id: 'complex_multi_select',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Select multiple options',
          allowMultipleSelection: true,
          continueButtonTarget: 'results_node',
          continueButtonText: 'Continue',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'option1',
              text: 'Option 1',
              action: 'selection'
            },
            {
              id: 'option2',
              text: 'Option 2',
              action: 'selection'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [multiSelectNode];
      mockContext.allNodeIds = ['complex_multi_select', 'results_node'];

      const result = handlerGenerator.generateMultiSelectHandlers(mockContext);

      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('selected_options = {}');
      expect(result).toContain('handle_multi_select_callback');
      expect(result).toContain('multi_select_done_');
      expect(result).toContain('# continue_button для узла complex_multi_select: "Continue"');
    });

    it('should handle all media types', () => {
      const mediaNodes: Node[] = [
        {
          id: 'photo_node',
          type: 'photo',
          position: { x: 0, y: 0 },
          data: { message: 'Photo received' }
        },
        {
          id: 'location_node',
          type: 'location',
          position: { x: 0, y: 0 },
          data: { message: 'Location received' }
        },
        {
          id: 'contact_node',
          type: 'contact',
          position: { x: 0, y: 0 },
          data: { message: 'Contact received' }
        }
      ];

      mockContext.nodes = mediaNodes;

      const result = handlerGenerator.generateMediaHandlers(mockContext);

      expect(result).toContain('@@NODE_START:photo_node@@');
      expect(result).toContain('@@NODE_START:location_node@@');
      expect(result).toContain('@@NODE_START:contact_node@@');
      expect(result).toContain('@dp.message(F.photo)');
      expect(result).toContain('@dp.message(F.location)');
      expect(result).toContain('@dp.message(F.contact)');
    });

    it('should handle callback handlers with different scenarios', () => {
      const nodeWithCallback: Node = {
        id: 'callback_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Choose option',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'callback_btn',
              text: 'Callback Button',
              callbackData: 'custom_callback'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [nodeWithCallback];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('handle_callback_custom_callback');
      expect(result).toContain('lambda c: c.data == "custom_callback"');
    });

    it('should handle callback handlers without target node', () => {
      const nodeWithButtonText: Node = {
        id: 'button_text_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Choose option',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'text_btn',
              text: 'Button Text',
              callbackData: 'no_target_callback'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [nodeWithButtonText];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('handle_callback_no_target_callback');
      expect(result).toContain('Вы выбрали: Button Text');
    });

    it('should handle callback handlers with found node by callbackData', () => {
      const targetNode: Node = {
        id: 'found_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Found node message',
          options: []
        }
      };

      const nodeWithCallback: Node = {
        id: 'callback_source',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Source',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'found_btn',
              text: 'Find Node',
              callbackData: 'found_node'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [nodeWithCallback, targetNode];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('handle_callback_found_node');
      expect(result).toContain('Вы выбрали: Find Node');
    });

    it('should handle callback handlers with start/command/input/conditional node types', () => {
      const startNode: Node = {
        id: 'start_target',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          message: 'Start message',
          options: []
        }
      };

      const nodeWithCallback: Node = {
        id: 'callback_to_start',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Go to start',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'start_btn',
              text: 'Go to Start',
              callbackData: 'start_target'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [nodeWithCallback, startNode];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('handle_callback_start_target');
      expect(result).toContain('Вы выбрали: Go to Start');
    });

    it('should handle user management buttons', () => {
      const nodeWithUserManagement: Node = {
        id: 'admin_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Admin panel',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'ban_btn',
              text: 'Ban User',
              action: 'ban_user'
            }
          ],
          options: []
        }
      };

      mockContext.nodes = [nodeWithUserManagement];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('# Обработчики управления пользователями');
      expect(result).toContain('async def ban_user(chat_id: int, user_id: int) -> bool:');
      expect(result).toContain('async def unban_user(chat_id: int, user_id: int) -> bool:');
      expect(result).toContain('async def mute_user(chat_id: int, user_id: int, until_date=None) -> bool:');
      expect(result).toContain('async def unmute_user(chat_id: int, user_id: int) -> bool:');
    });

    it('should handle auto-transition handlers', () => {
      const autoTransitionNode: Node = {
        id: 'auto_transition_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          message: 'Auto transition',
          autoTransition: {
            enabled: true,
            delay: 3000,
            target: 'next_node'
          },
          options: []
        }
      };

      mockContext.nodes = [autoTransitionNode];

      const result = handlerGenerator.generateCallbackHandlers(mockContext);

      expect(result).toContain('# Обработчики автопереходов');
      expect(result).toContain('async def auto_transition_auto_transition_node(message):');
      expect(result).toContain('await asyncio.sleep(3)');
    });
  });
});