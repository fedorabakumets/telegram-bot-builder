/**
 * @fileoverview Тестовые данные для шаблона пересылки сообщения
 * @module templates/forward-message/forward-message.fixture
 */

import type { Node } from '@shared/schema';
import type { ForwardMessageTemplateParams } from './forward-message.params';

/** Базовые параметры: одно ручное назначение */
export const validParamsBasic: ForwardMessageTemplateParams = {
  nodeId: 'forward_1',
  safeName: 'forward_1',
  sourceMessageIdSource: 'current_message',
  sourceMessageNodeId: 'msg_source',
  targetRecipients: [
    {
      id: 'target_manual',
      targetChatIdSource: 'manual',
      targetChatId: '-1001234567890',
    },
  ],
  disableNotification: true,
};

/** Параметры: несколько типов получателей */
export const validParamsMixedTargets: ForwardMessageTemplateParams = {
  nodeId: 'forward_2',
  safeName: 'forward_2',
  sourceMessageIdSource: 'variable',
  sourceMessageVariableName: 'source_message_id',
  targetRecipients: [
    { id: 'admins', targetChatIdSource: 'admin_ids' },
    { id: 'target_variable', targetChatIdSource: 'variable', targetChatVariableName: 'target_chat_id' },
    { id: 'target_manual', targetChatIdSource: 'manual', targetChatId: '@channel_name' },
  ],
  disableNotification: false,
};

/** Параметры: получение последнего сообщения из лога */
export const validParamsLastMessage: ForwardMessageTemplateParams = {
  nodeId: 'forward_3',
  safeName: 'forward_3',
  sourceMessageIdSource: 'last_message',
  sourceMessageNodeId: 'message_source',
  targetRecipients: [
    {
      id: 'target_manual',
      targetChatIdSource: 'manual',
      targetChatId: '-1007777777777',
    },
  ],
  disableNotification: false,
};

/** Узел графа: базовая пересылка */
export const forwardMessageNodeBasic: Node = {
  id: 'forward_1',
  type: 'forward_message',
  position: { x: 0, y: 0 },
  data: {
    sourceMessageIdSource: 'current_message',
    sourceMessageNodeId: 'msg_source',
    targetChatTargets: [
      { id: 'target_manual', targetChatIdSource: 'manual', targetChatId: '-1001234567890' },
    ],
    disableNotification: true,
  } as any,
};

/** Узел графа: legacy-поля назначения */
export const forwardMessageNodeLegacyTargets: Node = {
  id: 'forward_legacy',
  type: 'forward_message',
  position: { x: 0, y: 0 },
  data: {
    sourceMessageIdSource: 'manual',
    sourceMessageId: '12345',
    targetChatIdSource: 'variable',
    targetChatVariableName: 'target_chat_id',
    disableNotification: false,
  } as any,
};

/** Параметры: получатель-группа с числовым ID (без -100 префикса) */
export const validParamsGroupTarget: ForwardMessageTemplateParams = {
  nodeId: 'forward_group',
  safeName: 'forward_group',
  sourceMessageIdSource: 'current_message',
  targetRecipients: [
    {
      id: 'target_group',
      targetChatIdSource: 'manual',
      targetChatId: '2300967595',
      targetChatType: 'group',
    },
  ],
  disableNotification: false,
};

/** Параметры: получатель-пользователь с числовым ID */
export const validParamsUserTarget: ForwardMessageTemplateParams = {
  nodeId: 'forward_user',
  safeName: 'forward_user',
  sourceMessageIdSource: 'current_message',
  targetRecipients: [
    {
      id: 'target_user',
      targetChatIdSource: 'manual',
      targetChatId: '123456789',
      targetChatType: 'user',
    },
  ],
  disableNotification: false,
};

/** Параметры: смешанные типы получателей */
export const validParamsMixedChatTypes: ForwardMessageTemplateParams = {
  nodeId: 'forward_mixed_types',
  safeName: 'forward_mixed_types',
  sourceMessageIdSource: 'current_message',
  targetRecipients: [
    { id: 'r_user', targetChatIdSource: 'manual', targetChatId: '123456789', targetChatType: 'user' },
    { id: 'r_group', targetChatIdSource: 'manual', targetChatId: '2300967595', targetChatType: 'group' },
  ],
  disableNotification: false,
};
