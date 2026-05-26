/**
 * @fileoverview Тестовые фикстуры для шаблона kick_user
 * @module templates/kick-user/kick-user.fixture
 */

import type { KickUserTemplateParams } from './kick-user.params';

/** Фикстура: пустой массив entries */
export const fixtureKickUserEmpty: KickUserTemplateParams = {
  entries: [],
};

/** Фикстура: исключение текущего пользователя из текущего чата */
export const fixtureKickUserCurrentUser: KickUserTemplateParams = {
  entries: [{
    nodeId: 'kick_current_1',
    safeName: 'kick_current_1',
    targetNodeId: 'next_node_1',
    targetNodeType: 'message',
    userIdSource: 'current_user',
    userIdManual: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
  }],
};

/** Фикстура: исключение пользователя из reply */
export const fixtureKickUserReplyUser: KickUserTemplateParams = {
  entries: [{
    nodeId: 'kick_reply_1',
    safeName: 'kick_reply_1',
    targetNodeId: '',
    targetNodeType: '',
    userIdSource: 'reply_user',
    userIdManual: '',
    chatIdSource: 'current_chat',
    chatIdManual: '',
    ignoreErrors: true,
  }],
};

/** Фикстура: исключение пользователя по custom ID из custom чата */
export const fixtureKickUserCustom: KickUserTemplateParams = {
  entries: [{
    nodeId: 'kick_custom_1',
    safeName: 'kick_custom_1',
    targetNodeId: 'next_node_2',
    targetNodeType: 'message',
    userIdSource: 'custom',
    userIdManual: '{target_user_id}',
    chatIdSource: 'custom',
    chatIdManual: '-1001234567890',
    ignoreErrors: false,
  }],
};
