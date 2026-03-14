/**
 * @fileoverview Тестовые данные и фикстуры для тестирования
 *
 * Модуль предоставляет примеры валидных и невалидных узлов,
 * данные ботов с различными конфигурациями и mock данные.
 *
 * @module lib/tests/helpers/test-fixtures
 */

import type { EnhancedNode } from '../../bot-generator/types/enhanced-node.types';
import type { GenerationOptions } from '../../bot-generator/core/generation-options.types';
import type { BotData, BotGroup } from '@shared/schema';

// ============================================================================
// ВАЛИДНЫЕ УЗЛЫ (EnhancedNode)
// ============================================================================

/**
 * Простой валидный узел типа start
 */
export const validStartNode: EnhancedNode = {
  id: 'start_1',
  type: 'start',
  position: { x: 100, y: 100 },
  data: {
    text: 'Привет! Добро пожаловать в бота.',
    buttons: [
      {
        id: 'btn_1',
        text: 'Начать',
        action: 'goto',
        target: 'message_1',
        skipDataCollection: false,
        hideAfterClick: false,
      },
    ],
    command: '/start',
    showInMenu: true,
  },
} as EnhancedNode;

/**
 * Валидный узел типа message с кнопками
 */
export const validMessageNode: EnhancedNode = {
  id: 'message_1',
  type: 'message',
  position: { x: 200, y: 200 },
  data: {
    text: 'Выберите опцию:',
    buttons: [
      {
        id: 'btn_option1',
        text: 'Опция 1',
        action: 'goto',
        target: 'message_2',
        skipDataCollection: false,
      },
      {
        id: 'btn_option2',
        text: 'Опция 2',
        action: 'goto',
        target: 'message_3',
        skipDataCollection: false,
      },
    ],
    responseType: 'buttons',
    responseOptions: ['Опция 1', 'Опция 2'],
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел типа command
 */
export const validCommandNode: EnhancedNode = {
  id: 'command_1',
  type: 'command',
  position: { x: 300, y: 300 },
  data: {
    text: 'Команда выполнена',
    command: '/help',
    showInMenu: true,
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел с автопереходом
 */
export const validAutoTransitionNode: EnhancedNode = {
  id: 'auto_1',
  type: 'message',
  position: { x: 400, y: 400 },
  data: {
    text: 'Автоматический переход',
    enableAutoTransition: true,
    autoTransitionTo: 'message_2',
    autoTransitionDelay: 2,
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел с сбором пользовательского ввода
 */
export const validInputNode: EnhancedNode = {
  id: 'input_1',
  type: 'message',
  position: { x: 500, y: 500 },
  data: {
    text: 'Введите ваше имя:',
    collectUserInput: true,
    inputTargetNodeId: 'message_after_input',
    responseType: 'text',
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел с inline кнопками
 */
export const validInlineNode: EnhancedNode = {
  id: 'inline_1',
  type: 'message',
  position: { x: 600, y: 600 },
  data: {
    text: 'Выберите из inline кнопок:',
    buttons: [
      {
        id: 'inline_btn_1',
        text: 'Inline кнопка 1',
        action: 'inline',
        target: 'message_2',
        skipDataCollection: false,
      },
      {
        id: 'inline_btn_2',
        text: 'Inline кнопка 2',
        action: 'inline',
        target: 'message_3',
        skipDataCollection: false,
      },
    ],
    responseType: 'inline_buttons',
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел с множественным выбором
 */
export const validMultiSelectNode: EnhancedNode = {
  id: 'multiselect_1',
  type: 'message',
  position: { x: 700, y: 700 },
  data: {
    text: 'Выберите несколько опций:',
    buttons: [
      {
        id: 'ms_btn_1',
        text: 'Опция A',
        action: 'multiselect',
        target: 'multiselect_1',
        skipDataCollection: false,
      },
      {
        id: 'ms_btn_2',
        text: 'Опция B',
        action: 'multiselect',
        target: 'multiselect_1',
        skipDataCollection: false,
      },
    ],
    responseType: 'multiselect',
    multiSelect: true,
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел с медиа
 */
export const validMediaNode: EnhancedNode = {
  id: 'media_1',
  type: 'message',
  position: { x: 800, y: 800 },
  data: {
    text: 'Сообщение с медиа',
    mediaType: 'photo',
    mediaUrl: 'https://example.com/image.jpg',
    attachedMedia: [
      {
        id: 'media_item_1',
        type: 'photo',
        url: 'https://example.com/image.jpg',
        fileId: 'AgADAgAD',
      },
    ],
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Валидный узел с условными кнопками
 */
export const validConditionalNode: EnhancedNode = {
  id: 'conditional_1',
  type: 'message',
  position: { x: 900, y: 900 },
  data: {
    text: 'Условное сообщение',
    enableConditionalMessages: true,
    conditionalVariable: 'user_status',
    conditionalValue: 'premium',
    conditionalText: 'Текст для премиум пользователей',
    buttons: [
      {
        id: 'cond_btn_1',
        text: 'Премиум опция',
        action: 'goto',
        target: 'premium_message',
        skipDataCollection: false,
        conditionalValue: 'premium',
      },
    ],
  },
} as unknown as EnhancedNode;

// ============================================================================
// НЕВАЛИДНЫЕ УЗЛЫ
// ============================================================================

/**
 * Невалидный узел без id
 */
export const invalidNodeNoId: EnhancedNode = {
  id: '',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {
    text: 'Сообщение',
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Невалидный узел без типа
 */
export const invalidNodeNoType: EnhancedNode = {
  id: 'node_1',
  type: '',
  position: { x: 100, y: 100 },
  data: {
    text: 'Сообщение',
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Невалидный узел без позиции
 */
export const invalidNodeNoPosition: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 0, y: 0 },
  data: {
    text: 'Сообщение',
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Невалидный узел с некорректной позицией
 */
export const invalidNodeInvalidPosition: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 'invalid' as any, y: 'invalid' as any },
  data: {
    text: 'Сообщение',
    buttons: [],
  },
} as unknown as EnhancedNode;

/**
 * Невалидный узел без данных
 */
export const invalidNodeNoData: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {} as any,
} as EnhancedNode;

/**
 * Невалидный узел с кнопками без id
 */
export const invalidNodeButtonNoId: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {
    text: 'Сообщение',
    buttons: [
      {
        id: '',
        text: 'Кнопка',
        action: 'goto',
        target: 'message_1',
      },
    ],
  },
} as EnhancedNode;

/**
 * Невалидный узел с кнопками без текста
 */
export const invalidNodeButtonNoText: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {
    text: 'Сообщение',
    buttons: [
      {
        id: 'btn_1',
        text: '',
        action: 'goto',
        target: 'message_1',
      },
    ],
  },
} as EnhancedNode;

/**
 * Невалидный узел с кнопками без action
 */
export const invalidNodeButtonNoAction: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {
    text: 'Сообщение',
    buttons: [
      {
        id: 'btn_1',
        text: 'Кнопка',
        action: '',
        target: 'message_1',
      },
    ],
  },
} as unknown as EnhancedNode;

/**
 * Невалидный узел с автопереходом без цели
 */
export const invalidNodeAutoTransitionNoTarget: EnhancedNode = {
  id: 'node_1',
  type: 'message',
  position: { x: 100, y: 100 },
  data: {
    text: 'Сообщение',
    enableAutoTransition: true,
    autoTransitionTo: '',
    buttons: [],
  },
} as unknown as EnhancedNode;

// ============================================================================
// МАССИВЫ УЗЛОВ
// ============================================================================

/**
 * Массив валидных узлов для простого бота
 */
export const validSimpleBotNodes: EnhancedNode[] = [
  validStartNode,
  validMessageNode,
  validCommandNode,
];

/**
 * Массив валидных узлов для сложного бота
 */
export const validComplexBotNodes: EnhancedNode[] = [
  validStartNode,
  validMessageNode,
  validCommandNode,
  validAutoTransitionNode,
  validInputNode,
  validInlineNode,
  validMultiSelectNode,
  validMediaNode,
  validConditionalNode,
];

/**
 * Массив невалидных узлов
 */
export const invalidNodes: EnhancedNode[] = [
  invalidNodeNoId,
  invalidNodeNoType,
  invalidNodeNoPosition,
  invalidNodeInvalidPosition,
  invalidNodeNoData,
  invalidNodeButtonNoId,
  invalidNodeButtonNoText,
  invalidNodeButtonNoAction,
  invalidNodeAutoTransitionNoTarget,
];

// ============================================================================
// ДАННЫЕ БОТА (BotData)
// ============================================================================

/**
 * Простые валидные данные бота
 */
export const validSimpleBotData: BotData = {
  id: 1,
  projectId: 1,
  nodes: [
    {
      id: 'start_1',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        text: 'Привет!',
        buttons: [],
        command: '/start',
        showInMenu: true,
      },
    },
    {
      id: 'message_1',
      type: 'message',
      position: { x: 200, y: 200 },
      data: {
        text: 'Выберите опцию:',
        buttons: [
          {
            id: 'btn_1',
            text: 'Опция 1',
            action: 'goto',
            target: 'start_1',
          },
        ],
      },
    },
  ],
} as unknown as BotData;

/**
 * Сложные данные бота с различными типами узлов
 */
export const validComplexBotData: BotData = {
  id: 2,
  projectId: 2,
  nodes: [
    {
      id: 'start_1',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        text: 'Добро пожаловать!',
        buttons: [
          {
            id: 'btn_start',
            text: 'Начать',
            action: 'goto',
            target: 'message_1',
          },
        ],
        command: '/start',
        showInMenu: true,
      },
    },
    {
      id: 'message_1',
      type: 'message',
      position: { x: 200, y: 200 },
      data: {
        text: 'Главное меню',
        buttons: [
          {
            id: 'btn_help',
            text: 'Помощь',
            action: 'goto',
            target: 'command_1',
          },
          {
            id: 'btn_inline',
            text: 'Inline кнопки',
            action: 'goto',
            target: 'inline_1',
          },
        ],
        responseType: 'buttons',
      },
    },
    {
      id: 'command_1',
      type: 'command',
      position: { x: 300, y: 300 },
      data: {
        text: 'Помощь',
        command: '/help',
        showInMenu: true,
        buttons: [],
      },
    },
    {
      id: 'inline_1',
      type: 'message',
      position: { x: 400, y: 400 },
      data: {
        text: 'Inline кнопки',
        buttons: [
          {
            id: 'inline_btn_1',
            text: 'Кнопка 1',
            action: 'inline',
            target: 'message_1',
          },
        ],
        responseType: 'inline_buttons',
      },
    },
    {
      id: 'input_1',
      type: 'message',
      position: { x: 500, y: 500 },
      data: {
        text: 'Введите имя:',
        collectUserInput: true,
        inputTargetNodeId: 'message_after_input',
        responseType: 'text',
        buttons: [],
      },
    },
    {
      id: 'message_after_input',
      type: 'message',
      position: { x: 600, y: 600 },
      data: {
        text: 'Спасибо!',
        buttons: [],
      },
    },
  ],
} as unknown as BotData;

/**
 * Данные бота с медиа
 */
export const validMediaBotData: BotData = {
  id: 3,
  projectId: 3,
  nodes: [
    {
      id: 'media_start',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        text: 'Бот с медиа',
        mediaType: 'photo',
        mediaUrl: 'https://example.com/image.jpg',
        buttons: [],
        command: '/start',
      },
    },
  ],
} as unknown as BotData;

/**
 * Данные бота с множественным выбором
 */
export const validMultiSelectBotData: BotData = {
  id: 4,
  projectId: 4,
  nodes: [
    {
      id: 'multiselect_start',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Выберите опции:',
        buttons: [
          {
            id: 'ms_btn_1',
            text: 'Опция 1',
            action: 'multiselect',
            target: 'multiselect_start',
          },
          {
            id: 'ms_btn_2',
            text: 'Опция 2',
            action: 'multiselect',
            target: 'multiselect_start',
          },
          {
            id: 'ms_btn_done',
            text: 'Готово',
            action: 'multiselect_done',
            target: 'multiselect_done',
          },
        ],
        responseType: 'multiselect',
        multiSelect: true,
      },
    },
    {
      id: 'multiselect_done',
      type: 'message',
      position: { x: 200, y: 200 },
      data: {
        text: 'Выбор сделан!',
        buttons: [],
      },
    },
  ],
} as unknown as BotData;

// ============================================================================
// ГРУППЫ БОТА (BotGroup)
// ============================================================================

/**
 * Простая группа бота
 */
export const simpleBotGroup: BotGroup = {
  id: 1,
  projectId: 1,
  name: 'Основная группа',
  groupId: '-1001234567890',
  enabled: true,
} as unknown as BotGroup;

/**
 * Массив групп бота
 */
export const botGroups: BotGroup[] = [
  simpleBotGroup,
  {
    id: 2,
    projectId: 1,
    name: 'Тестовая группа',
    groupId: '-1009876543210',
    enabled: false,
  } as unknown as BotGroup,
];

// ============================================================================
// ОПЦИИ ГЕНЕРАЦИИ (GenerationOptions)
// ============================================================================

/**
 * Опции генерации по умолчанию
 */
export const defaultGenerationOptions: GenerationOptions = {
  enableLogging: false,
  enableComments: true,
  userDatabaseEnabled: false,
  enableGroupHandlers: false,
  projectId: null,
};

/**
 * Опции генерации с включенным логированием
 */
export const loggingEnabledOptions: GenerationOptions = {
  ...defaultGenerationOptions,
  enableLogging: true,
};

/**
 * Опции генерации с включенной базой данных
 */
export const databaseEnabledOptions: GenerationOptions = {
  ...defaultGenerationOptions,
  userDatabaseEnabled: true,
  enableLogging: true,
};

/**
 * Опции генерации со всеми включенными опциями
 */
export const allEnabledOptions: GenerationOptions = {
  enableLogging: true,
  enableComments: true,
  userDatabaseEnabled: true,
  enableGroupHandlers: true,
  projectId: 1,
};

/**
 * Опции генерации с отключенными комментариями
 */
export const commentsDisabledOptions: GenerationOptions = {
  ...defaultGenerationOptions,
  enableComments: false,
};

// ============================================================================
// MOCK ДАННЫЕ
// ============================================================================

/**
 * Mock функция для создания логгера
 */
export function createMockLogger() {
  const logs: { level: string; message: string; data?: any }[] = [];

  return {
    logs,
    debug: (msg: string, data?: any) => logs.push({ level: 'debug', message: msg, data }),
    info: (msg: string) => logs.push({ level: 'info', message: msg }),
    warn: (msg: string) => logs.push({ level: 'warn', message: msg }),
    error: (msg: string, error?: Error) => logs.push({ level: 'error', message: msg, data: error }),
    flow: (msg: string) => logs.push({ level: 'flow', message: msg }),
    clear: () => { logs.length = 0; },
  };
}

/**
 * Mock данные для Python кода
 */
export const mockPythonCode = `
"""
MyBot - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

# -*- coding: utf-8 -*-

import asyncio
from aiogram import Bot, Dispatcher
from aiogram.filters import Command

TOKEN = "YOUR_BOT_TOKEN"

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def handle_start(message):
    await message.answer("Привет!")

@dp.message(Command("help"))
async def handle_help(message):
    await message.answer("Помощь")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
`;

/**
 * Mock данные для невалидного Python кода
 */
export const invalidPythonCode = `
# Невалидный код без обязательных элементов
def some_function():
    pass
`;

/**
 * Mock данные для состояния генерации
 */
export const mockGenerationState = {
  loggingEnabled: true,
  commentsEnabled: true,
  generatedComponents: new Set(['imports', 'database']),
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Создаёт копию узла с изменёнными данными
 */
export function cloneNodeWithChanges<T extends EnhancedNode>(
  node: T,
  changes: Partial<T>
): T {
  return { ...node, ...changes };
}

/**
 * Создаёт копию BotData с изменёнными узлами
 */
export function cloneBotDataWithNodes(
  botData: BotData,
  nodes: any[]
): BotData {
  return { ...botData, nodes };
}

/**
 * Проверяет, содержит ли массив узлов узел с указанным id
 */
export function hasNodeWithId(nodes: EnhancedNode[], id: string): boolean {
  return nodes.some((node) => node.id === id);
}

/**
 * Подсчитывает количество узлов определённого типа
 */
export function countNodesByType(nodes: EnhancedNode[], type: string): number {
  return nodes.filter((node) => node.type === type).length;
}

/**
 * Извлекает все button id из узлов
 */
export function extractAllButtonIds(nodes: EnhancedNode[]): string[] {
  const buttonIds: string[] = [];
  nodes.forEach((node) => {
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach((btn) => {
        if (btn.id) buttonIds.push(btn.id);
      });
    }
  });
  return buttonIds;
}
