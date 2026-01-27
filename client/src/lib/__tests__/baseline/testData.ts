/**
 * Тестовые данные для baseline и regression тестирования
 * 
 * Этот файл содержит различные конфигурации ботов для тестирования
 * всех возможных сценариев генерации кода.
 */

import { BotData, Node, BotGroup } from '../../../../../shared/schema';

/**
 * Создает простого бота с базовой функциональностью
 */
export function createSimpleBotData(): BotData {
  const nodes: Node[] = [
    {
      id: 'start',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Добро пожаловать! Это простой бот.',
        buttons: [
          {
            text: 'Начать',
            action: 'message',
            target: 'menu'
          }
        ],
        keyboardType: 'reply'
      }
    },
    {
      id: 'menu',
      type: 'message',
      position: { x: 300, y: 100 },
      data: {
        text: 'Главное меню',
        buttons: [
          {
            text: 'Помощь',
            action: 'message',
            target: 'help'
          },
          {
            text: 'О боте',
            action: 'message',
            target: 'about'
          }
        ],
        keyboardType: 'reply'
      }
    },
    {
      id: 'help',
      type: 'message',
      position: { x: 500, y: 50 },
      data: {
        text: 'Это справка по боту. Используйте кнопки для навигации.'
      }
    },
    {
      id: 'about',
      type: 'message',
      position: { x: 500, y: 150 },
      data: {
        text: 'Этот бот создан с помощью TelegramBot Builder.'
      }
    }
  ];

  const connections = [
    { source: 'start', target: 'menu' },
    { source: 'menu', target: 'help' },
    { source: 'menu', target: 'about' }
  ];

  return { nodes, connections };
}

/**
 * Создает сложного бота с множественной функциональностью
 */
export function createComplexBotData(): BotData {
  const nodes: Node[] = [
    {
      id: 'start',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Добро пожаловать в сложный бот! 🤖',
        buttons: [
          {
            text: '📋 Меню',
            action: 'message',
            target: 'main_menu'
          }
        ],
        keyboardType: 'reply'
      }
    },
    {
      id: 'main_menu',
      type: 'message',
      position: { x: 300, y: 100 },
      data: {
        text: 'Выберите действие:',
        buttons: [
          {
            text: '📊 Статистика',
            action: 'message',
            target: 'stats'
          },
          {
            text: '⚙️ Настройки',
            action: 'message',
            target: 'settings'
          },
          {
            text: '📞 Контакты',
            action: 'contact',
            target: 'contact_handler'
          },
          {
            text: '📍 Локация',
            action: 'location',
            target: 'location_handler'
          }
        ],
        keyboardType: 'reply'
      }
    },
    {
      id: 'stats',
      type: 'message',
      position: { x: 500, y: 50 },
      data: {
        text: 'Статистика бота:\n• Пользователей: {user_count}\n• Сообщений: {message_count}',
        variables: ['user_count', 'message_count']
      }
    },
    {
      id: 'settings',
      type: 'message',
      position: { x: 500, y: 150 },
      data: {
        text: 'Настройки бота',
        buttons: [
          {
            text: '🔔 Уведомления',
            action: 'message',
            target: 'notifications'
          },
          {
            text: '🌐 Язык',
            action: 'message',
            target: 'language'
          }
        ],
        keyboardType: 'inline'
      }
    },
    {
      id: 'contact_handler',
      type: 'contact',
      position: { x: 500, y: 250 },
      data: {
        text: 'Спасибо за контакт! Номер: {contact_phone}'
      }
    },
    {
      id: 'location_handler',
      type: 'location',
      position: { x: 500, y: 350 },
      data: {
        text: 'Получена локация: {location_lat}, {location_lon}'
      }
    }
  ];

  const connections = [
    { source: 'start', target: 'main_menu' },
    { source: 'main_menu', target: 'stats' },
    { source: 'main_menu', target: 'settings' },
    { source: 'main_menu', target: 'contact_handler' },
    { source: 'main_menu', target: 'location_handler' }
  ];

  return { nodes, connections };
}

/**
 * Создает бота с inline кнопками
 */
export function createBotWithInlineButtons(): BotData {
  const nodes: Node[] = [
    {
      id: 'start',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Выберите опцию:',
        buttons: [
          {
            text: '✅ Да',
            action: 'message',
            target: 'yes_response',
            callbackData: 'yes'
          },
          {
            text: '❌ Нет',
            action: 'message',
            target: 'no_response',
            callbackData: 'no'
          },
          {
            text: '🌐 Сайт',
            action: 'url',
            url: 'https://example.com'
          }
        ],
        keyboardType: 'inline'
      }
    },
    {
      id: 'yes_response',
      type: 'message',
      position: { x: 300, y: 50 },
      data: {
        text: 'Отлично! Вы выбрали "Да"'
      }
    },
    {
      id: 'no_response',
      type: 'message',
      position: { x: 300, y: 150 },
      data: {
        text: 'Понятно, вы выбрали "Нет"'
      }
    }
  ];

  const connections = [
    { source: 'start', target: 'yes_response' },
    { source: 'start', target: 'no_response' }
  ];

  return { nodes, connections };
}

/**
 * Создает бота с медиа обработчиками
 */
export function createBotWithMediaHandlers(): BotData {
  const nodes: Node[] = [
    {
      id: 'start',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Отправьте мне фото, голосовое сообщение или стикер!'
      }
    },
    {
      id: 'photo_handler',
      type: 'photo',
      position: { x: 300, y: 50 },
      data: {
        text: 'Красивое фото! 📸'
      }
    },
    {
      id: 'voice_handler',
      type: 'voice',
      position: { x: 300, y: 150 },
      data: {
        text: 'Интересное голосовое сообщение! 🎤'
      }
    },
    {
      id: 'sticker_handler',
      type: 'sticker',
      position: { x: 300, y: 250 },
      data: {
        text: 'Классный стикер! 😄'
      }
    },
    {
      id: 'animation_handler',
      type: 'animation',
      position: { x: 300, y: 350 },
      data: {
        text: 'Забавная анимация! 🎬'
      }
    }
  ];

  const connections = [
    { source: 'start', target: 'photo_handler' },
    { source: 'start', target: 'voice_handler' },
    { source: 'start', target: 'sticker_handler' },
    { source: 'start', target: 'animation_handler' }
  ];

  return { nodes, connections };
}

/**
 * Создает бота с функциями управления пользователями
 */
export function createBotWithUserManagement(): BotData {
  const nodes: Node[] = [
    {
      id: 'start',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Админ панель',
        buttons: [
          {
            text: '🚫 Забанить',
            action: 'ban_user',
            target: 'ban_confirm'
          },
          {
            text: '✅ Разбанить',
            action: 'unban_user',
            target: 'unban_confirm'
          },
          {
            text: '🔇 Замутить',
            action: 'mute_user',
            target: 'mute_confirm'
          },
          {
            text: '🔊 Размутить',
            action: 'unmute_user',
            target: 'unmute_confirm'
          }
        ],
        keyboardType: 'inline'
      }
    },
    {
      id: 'ban_confirm',
      type: 'message',
      position: { x: 300, y: 50 },
      data: {
        text: 'Пользователь забанен'
      }
    },
    {
      id: 'unban_confirm',
      type: 'message',
      position: { x: 300, y: 150 },
      data: {
        text: 'Пользователь разбанен'
      }
    },
    {
      id: 'mute_confirm',
      type: 'message',
      position: { x: 300, y: 250 },
      data: {
        text: 'Пользователь замучен'
      }
    },
    {
      id: 'unmute_confirm',
      type: 'message',
      position: { x: 300, y: 350 },
      data: {
        text: 'Пользователь размучен'
      }
    }
  ];

  const connections = [
    { source: 'start', target: 'ban_confirm' },
    { source: 'start', target: 'unban_confirm' },
    { source: 'start', target: 'mute_confirm' },
    { source: 'start', target: 'unmute_confirm' }
  ];

  return { nodes, connections };
}

/**
 * Создает бота с мультиселектом
 */
export function createBotWithMultiSelect(): BotData {
  const nodes: Node[] = [
    {
      id: 'interests',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Выберите ваши интересы (можно несколько):',
        allowMultipleSelection: true,
        buttons: [
          {
            text: '🎵 Музыка',
            action: 'select',
            value: 'music'
          },
          {
            text: '🎬 Фильмы',
            action: 'select',
            value: 'movies'
          },
          {
            text: '📚 Книги',
            action: 'select',
            value: 'books'
          },
          {
            text: '⚽ Спорт',
            action: 'select',
            value: 'sports'
          }
        ],
        continueButtonText: 'Продолжить',
        continueButtonTarget: 'interests_result',
        keyboardType: 'inline'
      }
    },
    {
      id: 'interests_result',
      type: 'message',
      position: { x: 300, y: 100 },
      data: {
        text: 'Ваши интересы: {selected_interests}'
      }
    }
  ];

  const connections = [
    { source: 'interests', target: 'interests_result' }
  ];

  return { nodes, connections };
}

/**
 * Создает бота с условной логикой
 */
export function createBotWithConditionals(): BotData {
  const nodes: Node[] = [
    {
      id: 'age_question',
      type: 'input',
      position: { x: 100, y: 100 },
      data: {
        text: 'Сколько вам лет?',
        inputType: 'number',
        variableName: 'user_age'
      }
    },
    {
      id: 'age_check',
      type: 'conditional',
      position: { x: 300, y: 100 },
      data: {
        conditions: [
          {
            variable: 'user_age',
            operator: '<',
            value: '18',
            target: 'minor_response'
          },
          {
            variable: 'user_age',
            operator: '>=',
            value: '18',
            target: 'adult_response'
          }
        ]
      }
    },
    {
      id: 'minor_response',
      type: 'message',
      position: { x: 500, y: 50 },
      data: {
        text: 'Вы несовершеннолетний. Некоторые функции недоступны.'
      }
    },
    {
      id: 'adult_response',
      type: 'message',
      position: { x: 500, y: 150 },
      data: {
        text: 'Добро пожаловать! Все функции доступны.'
      }
    }
  ];

  const connections = [
    { source: 'age_question', target: 'age_check' },
    { source: 'age_check', target: 'minor_response' },
    { source: 'age_check', target: 'adult_response' }
  ];

  return { nodes, connections };
}

/**
 * Создает бота с автопереходами
 */
export function createBotWithAutoTransitions(): BotData {
  const nodes: Node[] = [
    {
      id: 'welcome',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Добро пожаловать! Через 3 секунды перейдем к меню...',
        autoTransition: {
          enabled: true,
          delay: 3000,
          target: 'main_menu'
        }
      }
    },
    {
      id: 'main_menu',
      type: 'message',
      position: { x: 300, y: 100 },
      data: {
        text: 'Главное меню',
        buttons: [
          {
            text: 'Информация',
            action: 'message',
            target: 'info'
          }
        ],
        keyboardType: 'reply'
      }
    },
    {
      id: 'info',
      type: 'message',
      position: { x: 500, y: 100 },
      data: {
        text: 'Информация о боте'
      }
    }
  ];

  const connections = [
    { source: 'welcome', target: 'main_menu' },
    { source: 'main_menu', target: 'info' }
  ];

  return { nodes, connections };
}

/**
 * Создает тестовые группы ботов
 */
export function createTestBotGroups(): BotGroup[] {
  return [
    {
      id: 'group1',
      name: 'Основная группа',
      description: 'Основные функции бота'
    },
    {
      id: 'group2',
      name: 'Админ группа',
      description: 'Административные функции'
    }
  ];
}

/**
 * Создает набор тестовых данных для различных сценариев
 */
export function createRegressionTestSuite(): Array<{
  name: string;
  botData: BotData;
  botName: string;
  groups: BotGroup[];
  userDatabaseEnabled: boolean;
  projectId: number | null;
  enableLogging: boolean;
}> {
  return [
    {
      name: 'simple_bot',
      botData: createSimpleBotData(),
      botName: 'SimpleBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false
    },
    {
      name: 'complex_bot_with_db',
      botData: createComplexBotData(),
      botName: 'ComplexBot',
      groups: createTestBotGroups(),
      userDatabaseEnabled: true,
      projectId: 123,
      enableLogging: true
    },
    {
      name: 'inline_buttons_bot',
      botData: createBotWithInlineButtons(),
      botName: 'InlineBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false
    },
    {
      name: 'media_bot',
      botData: createBotWithMediaHandlers(),
      botName: 'MediaBot',
      groups: [],
      userDatabaseEnabled: true,
      projectId: 456,
      enableLogging: false
    },
    {
      name: 'admin_bot',
      botData: createBotWithUserManagement(),
      botName: 'AdminBot',
      groups: createTestBotGroups(),
      userDatabaseEnabled: true,
      projectId: 789,
      enableLogging: true
    },
    {
      name: 'multiselect_bot',
      botData: createBotWithMultiSelect(),
      botName: 'MultiSelectBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false
    },
    {
      name: 'conditional_bot',
      botData: createBotWithConditionals(),
      botName: 'ConditionalBot',
      groups: [],
      userDatabaseEnabled: true,
      projectId: 101,
      enableLogging: false
    },
    {
      name: 'auto_transition_bot',
      botData: createBotWithAutoTransitions(),
      botName: 'AutoBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: true
    }
  ];
}