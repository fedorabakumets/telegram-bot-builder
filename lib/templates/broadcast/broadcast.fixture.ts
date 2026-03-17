/**
 * @fileoverview Тестовые данные для шаблона рассылки
 * @module templates/broadcast/broadcast.fixture
 */

import type { BroadcastTemplateParams } from './broadcast.params';

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

/** Bot API, bot_users */
export const validParamsBotBroadcast: BroadcastTemplateParams = {
  nodeId: 'broadcast_1',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
  successMessage: 'Рассылка выполнена успешно',
  errorMessage: 'Произошла ошибка',
  broadcastNodes: sampleNodes,
};

/** Client API, user_ids */
export const validParamsClientBroadcast: BroadcastTemplateParams = {
  nodeId: 'broadcast_2',
  broadcastApiType: 'client',
  idSourceType: 'user_ids',
  successMessage: 'Готово',
  errorMessage: 'Ошибка',
  broadcastNodes: sampleNodes,
};

/** Оба источника */
export const validParamsBothSources: BroadcastTemplateParams = {
  nodeId: 'broadcast_3',
  broadcastApiType: 'bot',
  idSourceType: 'both',
  broadcastNodes: sampleNodes,
};

/** Нет сообщений */
export const validParamsEmpty: BroadcastTemplateParams = {
  nodeId: 'broadcast_4',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
  broadcastNodes: [],
};

/** С медиа */
export const validParamsWithMedia: BroadcastTemplateParams = {
  nodeId: 'broadcast_5',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
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

/** С автопереходом */
export const validParamsWithAutoTransition: BroadcastTemplateParams = {
  nodeId: 'broadcast_6',
  broadcastApiType: 'bot',
  idSourceType: 'bot_users',
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

export const invalidParamsWrongType = { nodeId: 123 };
export const invalidParamsMissingField = { broadcastApiType: 'bot' };
