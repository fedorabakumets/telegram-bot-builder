/**
 * Тестовые данные для baseline тестов функции generatePythonCode
 * Задача 8.1: Подготовка к рефакторингу
 */

import { BotData, Node } from '../../../../../shared/schema';

// Пустой бот
export const emptyBot: BotData = {
  nodes: [],
  connections: []
};

// Простой бот со start узлом
export const simpleStartBot: BotData = {
  nodes: [
    {
      id: 'start_1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        text: 'Добро пожаловать!',
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с командой
export const commandBot: BotData = {
  nodes: [
    {
      id: 'help_cmd',
      type: 'command',
      position: { x: 0, y: 0 },
      data: {
        command: 'help',
        text: 'Это команда помощи',
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с обычным сообщением
export const messageBot: BotData = {
  nodes: [
    {
      id: 'msg_1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Это обычное сообщение',
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с inline кнопками
export const inlineButtonBot: BotData = {
  nodes: [
    {
      id: 'inline_msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Выберите опцию:',
        keyboardType: 'inline',
        buttons: [
          {
            id: 'btn_1',
            text: 'Кнопка 1',
            target: 'target_1'
          },
          {
            id: 'btn_2',
            text: 'Кнопка 2',
            target: 'target_2'
          }
        ]
      }
    },
    {
      id: 'target_1',
      type: 'message',
      position: { x: 100, y: 0 },
      data: {
        text: 'Вы выбрали кнопку 1',
        buttons: []
      }
    },
    {
      id: 'target_2',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Вы выбрали кнопку 2',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'inline_msg', target: 'target_1' },
    { source: 'inline_msg', target: 'target_2' }
  ]
};

// Бот с reply кнопками
export const replyButtonBot: BotData = {
  nodes: [
    {
      id: 'reply_msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Выберите опцию:',
        keyboardType: 'reply',
        buttons: [
          {
            id: 'reply_btn_1',
            text: 'Опция 1',
            target: 'reply_target_1'
          },
          {
            id: 'reply_btn_2',
            text: 'Опция 2',
            target: 'reply_target_2'
          }
        ]
      }
    },
    {
      id: 'reply_target_1',
      type: 'message',
      position: { x: 100, y: 0 },
      data: {
        text: 'Вы выбрали опцию 1',
        buttons: []
      }
    },
    {
      id: 'reply_target_2',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Вы выбрали опцию 2',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'reply_msg', target: 'reply_target_1' },
    { source: 'reply_msg', target: 'reply_target_2' }
  ]
};

// Бот с множественным выбором
export const multiSelectBot: BotData = {
  nodes: [
    {
      id: 'multi_select_msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Выберите несколько опций:',
        keyboardType: 'inline',
        allowMultipleSelection: true,
        multiSelectVariable: 'selected_options',
        continueButtonTarget: 'multi_result',
        buttons: [
          {
            id: 'option_1',
            text: 'Опция 1',
            target: 'multi_select_msg'
          },
          {
            id: 'option_2',
            text: 'Опция 2',
            target: 'multi_select_msg'
          },
          {
            id: 'option_3',
            text: 'Опция 3',
            target: 'multi_select_msg'
          }
        ]
      }
    },
    {
      id: 'multi_result',
      type: 'message',
      position: { x: 100, y: 0 },
      data: {
        text: 'Вы выбрали: {selected_options}',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'multi_select_msg', target: 'multi_result' }
  ]
};

// Бот с автопереходом
export const autoTransitionBot: BotData = {
  nodes: [
    {
      id: 'auto_msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Это сообщение с автопереходом',
        autoTransitionTo: 'auto_target',
        autoTransitionDelay: 3,
        buttons: []
      }
    },
    {
      id: 'auto_target',
      type: 'message',
      position: { x: 100, y: 0 },
      data: {
        text: 'Автоматический переход выполнен',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'auto_msg', target: 'auto_target' }
  ]
};

// Бот с условными сообщениями
export const conditionalBot: BotData = {
  nodes: [
    {
      id: 'conditional_msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Базовое сообщение',
        conditionalMessages: [
          {
            condition: 'user_type',
            value: 'premium',
            text: 'Сообщение для премиум пользователей'
          },
          {
            condition: 'user_type',
            value: 'regular',
            text: 'Сообщение для обычных пользователей'
          }
        ],
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с медиа
export const mediaBot: BotData = {
  nodes: [
    {
      id: 'media_msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Сообщение с медиа',
        attachedMedia: [
          {
            type: 'photo',
            url: 'https://example.com/photo.jpg'
          }
        ],
        buttons: []
      }
    }
  ],
  connections: []
};

// Бот с вводом данных
export const inputBot: BotData = {
  nodes: [
    {
      id: 'input_msg',
      type: 'input',
      position: { x: 0, y: 0 },
      data: {
        text: 'Введите ваше имя:',
        inputVariable: 'user_name',
        inputTargetNodeId: 'input_result',
        buttons: []
      }
    },
    {
      id: 'input_result',
      type: 'message',
      position: { x: 100, y: 0 },
      data: {
        text: 'Привет, {user_name}!',
        buttons: []
      }
    }
  ],
  connections: [
    { source: 'input_msg', target: 'input_result' }
  ]
};

// Экспорт всех тестовых данных
export const baselineTestData = {
  emptyBot,
  simpleStartBot,
  commandBot,
  messageBot,
  inlineButtonBot,
  replyButtonBot,
  multiSelectBot,
  autoTransitionBot,
  conditionalBot,
  mediaBot,
  inputBot
};