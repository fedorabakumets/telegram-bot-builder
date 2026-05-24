/**
 * @fileoverview Тестовые фикстуры для шаблона delete_message
 * @module templates/delete-message/delete-message.fixture
 */

import type { DeleteMessageTemplateParams } from './delete-message.params';

/** Фикстура: удаление текущего сообщения пользователя */
export const fixtureDeleteCurrentMessage: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_current_1',
    safeName: 'del_current_1',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'current_message',
    messageIdManual: '',
    lastNCount: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: удаление последнего сообщения бота */
export const fixtureDeleteLastBotMessage: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_bot_1',
    safeName: 'del_bot_1',
    targetNodeId: 'next_node_1',
    targetNodeType: 'message',
    messageIdSource: 'last_bot_message',
    messageIdManual: '',
    lastNCount: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: удаление последних N сообщений */
export const fixtureDeleteLastN: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_last_n_1',
    safeName: 'del_last_n_1',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'last_n',
    messageIdManual: '',
    lastNCount: '50',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: удаление последних N из переменной */
export const fixtureDeleteLastNVariable: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_last_n_var',
    safeName: 'del_last_n_var',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'last_n',
    messageIdManual: '',
    lastNCount: '{count}',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: удаление по указанному ID */
export const fixtureDeleteCustomId: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_custom_1',
    safeName: 'del_custom_1',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'custom',
    messageIdManual: '{saved_msg_id}',
    lastNCount: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: массовое удаление из переменной */
export const fixtureDeleteBulk: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_bulk_1',
    safeName: 'del_bulk_1',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'current_message',
    messageIdManual: '',
    lastNCount: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: true,
    bulkMessageIdsVariable: 'old_message_ids',
  }],
};

/** Фикстура: удаление в другом чате */
export const fixtureDeleteCustomChat: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_other_chat',
    safeName: 'del_other_chat',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'custom',
    messageIdManual: '12345',
    lastNCount: '',
    chatIdSource: 'custom',
    chatIdManual: '-1001234567890',
    ignoreErrors: false,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: удаление сообщения из ответа (reply) */
export const fixtureDeleteReplyMessage: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_reply_1',
    safeName: 'del_reply_1',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'reply_message',
    messageIdManual: '',
    lastNCount: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};

/** Фикстура: удаление от reply до текущего (пург) */
export const fixtureDeleteRangeFromReply: DeleteMessageTemplateParams = {
  entries: [{
    nodeId: 'del_purge_1',
    safeName: 'del_purge_1',
    targetNodeId: '',
    targetNodeType: '',
    messageIdSource: 'range_from_reply',
    messageIdManual: '',
    lastNCount: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
    bulkDelete: false,
    bulkMessageIdsVariable: '',
  }],
};
