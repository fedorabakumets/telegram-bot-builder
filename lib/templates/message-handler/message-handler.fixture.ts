/**
 * @fileoverview Тестовые данные для шаблона обработчиков управления сообщениями
 * @module templates/message-handler/message-handler.fixture
 */

import type { MessageHandlerTemplateParams } from './message-handler.params';

export const validParamsPinMessage: MessageHandlerTemplateParams = {
  nodeType: 'pin_message',
  nodeId: 'pin_1',
  safeName: 'pin_1',
  synonyms: ['закрепить', 'прикрепить'],
  targetGroupId: '',
  disableNotification: false,
  messageText: '✅ Сообщение закреплено',
};

export const validParamsUnpinMessage: MessageHandlerTemplateParams = {
  nodeType: 'unpin_message',
  nodeId: 'unpin_1',
  safeName: 'unpin_1',
  synonyms: ['открепить', 'отцепить'],
  targetGroupId: '',
  disableNotification: false,
  messageText: '',
};

export const validParamsDeleteMessage: MessageHandlerTemplateParams = {
  nodeType: 'delete_message',
  nodeId: 'delete_1',
  safeName: 'delete_1',
  synonyms: ['удалить', 'стереть'],
  targetGroupId: '',
  disableNotification: false,
  messageText: '🗑️ Сообщение успешно удалено!',
};

export const validParamsPinWithGroup: MessageHandlerTemplateParams = {
  nodeType: 'pin_message',
  nodeId: 'pin_2',
  safeName: 'pin_2',
  synonyms: ['закрепить'],
  targetGroupId: '-1001234567890',
  disableNotification: true,
  messageText: '',
};

export const invalidParamsWrongType = {
  nodeId: 123,
};

export const invalidParamsMissingField = {
  nodeType: 'pin_message',
};
