/**
 * @fileoverview Тестовые данные для шаблона рассылки Client API
 * @module templates/broadcast-client/broadcast-client.fixture
 */

import type { BroadcastClientTemplateParams } from './broadcast-client.params';

const sampleNodes = [
  {
    id: 'msg_1',
    text: 'Привет, это рассылка через Userbot!',
    formatMode: 'none',
    imageUrl: '',
    audioUrl: '',
    videoUrl: '',
    documentUrl: '',
    attachedMedia: [],
    autoTransitionTo: '',
  },
];

export const validParamsBotUsers: BroadcastClientTemplateParams = {
  nodeId: 'broadcast_1',
  idSourceType: 'bot_users',
  successMessage: 'Рассылка выполнена успешно',
  errorMessage: 'Произошла ошибка',
  broadcastNodes: sampleNodes,
};

export const validParamsUserIds: BroadcastClientTemplateParams = {
  nodeId: 'broadcast_2',
  idSourceType: 'user_ids',
  broadcastNodes: sampleNodes,
};

export const validParamsBoth: BroadcastClientTemplateParams = {
  nodeId: 'broadcast_3',
  idSourceType: 'both',
  broadcastNodes: sampleNodes,
};

export const validParamsEmpty: BroadcastClientTemplateParams = {
  nodeId: 'broadcast_4',
  idSourceType: 'bot_users',
  broadcastNodes: [],
};

export const validParamsWithMedia: BroadcastClientTemplateParams = {
  nodeId: 'broadcast_5',
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

export const validParamsWithAutoTransition: BroadcastClientTemplateParams = {
  nodeId: 'broadcast_6',
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
export const invalidParamsMissingField = { idSourceType: 'bot_users' };
