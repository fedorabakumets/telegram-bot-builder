/**
 * Regression тестовые данные для функции generatePythonCode
 * Задача 8.1: Подготовка к рефакторингу
 * 
 * Эти данные представляют сложные сценарии использования для проверки
 * того, что рефакторинг не нарушит существующую функциональность.
 */

import { BotData, Node, BotGroup } from '../../../../../shared/schema';

// Комплексный бот с множественными функциями
export const complexBot: BotData = {
  nodes: [
    {
      id: 'start_complex',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        text: 'Добро пожаловать в комплексный бот!',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'btn_menu',
            text: '📋 Главное меню',
            target: 'main_menu'
          },
          {
            id: 'btn_settings',
            text: '⚙️ Настройки',
            target: 'settings_menu'
          }
        ]
      }
    },
    {
      id: 'main_menu',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        text: 'Главное меню:',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'btn_survey',
            text: '📝 Опрос',
            target: 'survey_start'
          },
          {
            id: 'btn_media',
            text: '🖼️ Медиа',
            target: 'media_menu'
          },
          {
            id: 'btn_back_start',
            text: '🔙 Назад',
            target: 'start_complex'
          }
        ]
      }
    },
    {
      id: 'survey_start',
      type: 'message',
      position: { x: 400, y: 0 },
      data: {
        text: 'Выберите ваши интересы:',
        keyboardType: 'inline',
        allowMultipleSelection: true,
        multiSelectVariable: 'user_interests',
        continueButtonTarget: 'survey_result',
        buttons: [
          {
            id: 'interest_tech',
            text: '💻 Технологии',
            target: 'survey_start'
          },
          {
            id: 'interest_sport',
            text: '⚽ Спорт',
            target: 'survey_start'
          },
          {
            id: 'interest_music',
            text: '🎵 Музыка',
            target: 'survey_start'
          },
          {
            id: 'interest_travel',
            text: '✈️ Путешествия',
            target: 'survey_start'
          }
        ]
      }
    },
    {
      id: 'survey_result',
      type: 'message',
      position: { x: 600, y: 0 },
      data: {
        text: 'Ваши интересы: {user_interests}',
        conditionalMessages: [
          {
            condition: 'user_interests',
            value: 'Технологии',
            text: 'Отлично! Вы интересуетесь технологиями. Ваши интересы: {user_interests}'
          },
          {
            condition: 'user_interests',
            value: 'Спорт',
            text: 'Здорово! Спорт - это жизнь. Ваши интересы: {user_interests}'
          }
        ],
        autoTransitionTo: 'survey_thanks',
        autoTransitionDelay: 5,
        buttons: []
      }
    },
    {
      id: 'survey_thanks',
      type: 'message',
      position: { x: 800, y: 0 },
      data: {
        text: 'Спасибо за участие в опросе!',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'btn_back_menu',
            text: '🔙 В главное меню',
            target: 'main_menu'
          }
        ]
      }
    },
    {
      id: 'media_menu',
      type: 'message',
      position: { x: 400, y: 200 },
      data: {
        text: 'Медиа контент:',
        attachedMedia: [
          {
            type: 'photo',
            url: 'https://example.com/menu-photo.jpg'
          }
        ],
        keyboardType: 'reply',
        buttons: [
          {
            id: 'media_photo',
            text: '📷 Фото',
            target: 'show_photo'
          },
          {
            id: 'media_video',
            text: '🎥 Видео',
            target: 'show_video'
          },
          {
            id: 'media_back',
            text: '🔙 Назад',
            target: 'main_menu'
          }
        ]
      }
    },
    {
      id: 'show_photo',
      type: 'message',
      position: { x: 600, y: 200 },
      data: {
        text: 'Вот красивое фото:',
        attachedMedia: [
          {
            type: 'photo',
            url: 'https://example.com/beautiful-photo.jpg'
          }
        ],
        buttons: []
      }
    },
    {
      id: 'show_video',
      type: 'message',
      position: { x: 600, y: 300 },
      data: {
        text: 'Интересное видео:',
        attachedMedia: [
          {
            type: 'video',
            url: 'https://example.com/interesting-video.mp4'
          }
        ],
        buttons: []
      }
    },
    {
      id: 'settings_menu',
      type: 'message',
      position: { x: 200, y: 400 },
      data: {
        text: 'Настройки:',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'btn_profile',
            text: '👤 Профиль',
            target: 'profile_input'
          },
          {
            id: 'btn_notifications',
            text: '🔔 Уведомления',
            target: 'notifications_settings'
          }
        ]
      }
    },
    {
      id: 'profile_input',
      type: 'input',
      position: { x: 400, y: 400 },
      data: {
        text: 'Введите ваше имя:',
        inputVariable: 'user_name',
        inputTargetNodeId: 'profile_result',
        buttons: []
      }
    },
    {
      id: 'profile_result',
      type: 'message',
      position: { x: 600, y: 400 },
      data: {
        text: 'Привет, {user_name}! Ваш профиль обновлен.',
        buttons: []
      }
    },
    {
      id: 'notifications_settings',
      type: 'message',
      position: { x: 400, y: 500 },
      data: {
        text: 'Настройки уведомлений:',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'notif_on',
            text: '🔔 Включить',
            target: 'notif_enabled'
          },
          {
            id: 'notif_off',
            text: '🔕 Выключить',
            target: 'notif_disabled'
          }
        ]
      }
    },
    {
      id: 'notif_enabled',
      type: 'message',
      position: { x: 600, y: 500 },
      data: {
        text: 'Уведомления включены ✅',
        buttons: []
      }
    },
    {
      id: 'notif_disabled',
      type: 'message',
      position: { x: 600, y: 600 },
      data: {
        text: 'Уведомления выключены ❌',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'start_complex', target: 'main_menu' },
    { source: 'start_complex', target: 'settings_menu' },
    { source: 'main_menu', target: 'survey_start' },
    { source: 'main_menu', target: 'media_menu' },
    { source: 'main_menu', target: 'start_complex' },
    { source: 'survey_start', target: 'survey_result' },
    { source: 'survey_result', target: 'survey_thanks' },
    { source: 'survey_thanks', target: 'main_menu' },
    { source: 'media_menu', target: 'show_photo' },
    { source: 'media_menu', target: 'show_video' },
    { source: 'media_menu', target: 'main_menu' },
    { source: 'settings_menu', target: 'profile_input' },
    { source: 'settings_menu', target: 'notifications_settings' },
    { source: 'profile_input', target: 'profile_result' },
    { source: 'notifications_settings', target: 'notif_enabled' },
    { source: 'notifications_settings', target: 'notif_disabled' }
  ]
};

// Бот с командами и админскими функциями
export const adminBot: BotData = {
  nodes: [
    {
      id: 'start_admin',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        text: 'Админ бот запущен',
        buttons: []
      }
    },
    {
      id: 'help_cmd',
      type: 'command',
      position: { x: 0, y: 100 },
      data: {
        command: 'help',
        text: 'Доступные команды:\n/ban - забанить пользователя\n/unban - разбанить\n/mute - заглушить\n/kick - кикнуть',
        buttons: []
      }
    },
    {
      id: 'ban_cmd',
      type: 'ban_user',
      position: { x: 0, y: 200 },
      data: {
        command: 'ban',
        text: 'Пользователь забанен',
        buttons: []
      }
    },
    {
      id: 'unban_cmd',
      type: 'unban_user',
      position: { x: 0, y: 300 },
      data: {
        command: 'unban',
        text: 'Пользователь разбанен',
        buttons: []
      }
    },
    {
      id: 'mute_cmd',
      type: 'mute_user',
      position: { x: 0, y: 400 },
      data: {
        command: 'mute',
        text: 'Пользователь заглушен',
        buttons: []
      }
    },
    {
      id: 'kick_cmd',
      type: 'kick_user',
      position: { x: 0, y: 500 },
      data: {
        command: 'kick',
        text: 'Пользователь кикнут',
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с медиа обработчиками
export const mediaHandlerBot: BotData = {
  nodes: [
    {
      id: 'sticker_handler',
      type: 'sticker',
      position: { x: 0, y: 0 },
      data: {
        text: 'Получен стикер!',
        buttons: []
      }
    },
    {
      id: 'voice_handler',
      type: 'voice',
      position: { x: 100, y: 0 },
      data: {
        text: 'Получено голосовое сообщение!',
        buttons: []
      }
    },
    {
      id: 'animation_handler',
      type: 'animation',
      position: { x: 200, y: 0 },
      data: {
        text: 'Получена анимация!',
        buttons: []
      }
    },
    {
      id: 'location_handler',
      type: 'location',
      position: { x: 300, y: 0 },
      data: {
        text: 'Получена геолокация!',
        buttons: []
      }
    },
    {
      id: 'contact_handler',
      type: 'contact',
      position: { x: 400, y: 0 },
      data: {
        text: 'Получен контакт!',
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с синонимами
export const synonymBot: BotData = {
  nodes: [
    {
      id: 'synonym_handler',
      type: 'synonym',
      position: { x: 0, y: 0 },
      data: {
        synonyms: ['привет', 'здравствуй', 'добро пожаловать'],
        text: 'Привет! Как дела?',
        target: 'greeting_response',
        buttons: []
      }
    },
    {
      id: 'greeting_response',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        text: 'Рад вас видеть!',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'synonym_handler', target: 'greeting_response' }
  ]
};

// Группы для тестирования
export const testGroups: BotGroup[] = [
  {
    id: 'group_1',
    name: 'Основная группа',
    description: 'Основная группа ботов'
  },
  {
    id: 'group_2',
    name: 'Тестовая группа',
    description: 'Группа для тестирования'
  }
];

// Экспорт всех regression тестовых данных
export const regressionTestData = {
  complexBot,
  adminBot,
  mediaHandlerBot,
  synonymBot,
  testGroups
};