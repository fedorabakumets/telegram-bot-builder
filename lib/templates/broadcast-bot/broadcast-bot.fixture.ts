/**
 * @fileoverview Тестовые данные для шаблона рассылки Bot API
 * @module templates/broadcast-bot/broadcast-bot.fixture
 */

import type { BroadcastBotTemplateParams } from './broadcast-bot.params';

const sampleNodes = [
  {
    id: 'msg_1',
    text: 'Привет, это рассылка!',
    formatMode: 'none',
    imageUrl: '',
    audioUrl: '',
    videoUrl: '',
    documentUrl: '',
    attachedMedia: [],
    autoTransitionTo: '',
  },
];

/** Валидные параметры с получателями из bot_users */
export const validParamsBotUsers: BroadcastBotTemplateParams = {
  nodeId: 'broadcast_1',
  successMessage: 'Рассылка выполнена успешно',
  errorMessage: 'Произошла ошибка',
  broadcastNodes: sampleNodes,
};

/** Валидные параметры с пустым списком сообщений */
export const validParamsEmpty: BroadcastBotTemplateParams = {
  nodeId: 'broadcast_4',
  broadcastNodes: [],
};

/** Валидные параметры с медиа */
export const validParamsWithMedia: BroadcastBotTemplateParams = {
  nodeId: 'broadcast_5',
  broadcastNodes: [
    {
      id: 'msg_media',
      text: 'Смотри фото!',
      formatMode: 'html',
      imageUrl: 'https://example.com/photo.jpg',
      audioUrl: '',
      videoUrl: '',
      documentUrl: '',
      attachedMedia: [],
      autoTransitionTo: '',
    },
  ],
};

/** Валидные параметры с автопереходом */
export const validParamsWithAutoTransition: BroadcastBotTemplateParams = {
  nodeId: 'broadcast_6',
  broadcastNodes: [
    {
      id: 'msg_a',
      text: 'Первое сообщение',
      formatMode: 'none',
      imageUrl: '',
      audioUrl: '',
      videoUrl: '',
      documentUrl: '',
      attachedMedia: [],
      autoTransitionTo: 'msg_b',
    },
    {
      id: 'msg_b',
      text: 'Второе сообщение',
      formatMode: 'none',
      imageUrl: '',
      audioUrl: '',
      videoUrl: '',
      documentUrl: '',
      attachedMedia: [],
      autoTransitionTo: '',
    },
  ],
};

/** Невалидные параметры: nodeId не строка */
export const invalidParamsWrongType = { nodeId: 123 };
/** Невалидные параметры: отсутствует nodeId */
export const invalidParamsMissingField = { successMessage: 'test' };
