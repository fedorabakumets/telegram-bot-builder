/**
 * @fileoverview Тестовые данные для шаблона user-handler
 * @module templates/user-handler/user-handler.fixture
 */

import type { UserHandlerTemplateParams } from './user-handler.params';

export const fixtureBanUser: UserHandlerTemplateParams = {
  nodeType: 'ban_user',
  nodeId: 'ban_node_1',
  safeName: 'ban_node_1',
  synonyms: ['бан', 'забанить'],
  reason: 'Спам',
  untilDate: 0,
};

export const fixtureBanUserTimed: UserHandlerTemplateParams = {
  nodeType: 'ban_user',
  nodeId: 'ban_node_2',
  safeName: 'ban_node_2',
  synonyms: ['бан24'],
  reason: 'Нарушение',
  untilDate: 1700000000,
};

export const fixtureUnbanUser: UserHandlerTemplateParams = {
  nodeType: 'unban_user',
  nodeId: 'unban_node_1',
  safeName: 'unban_node_1',
  synonyms: ['разбан', 'разблокировать'],
};

export const fixtureKickUser: UserHandlerTemplateParams = {
  nodeType: 'kick_user',
  nodeId: 'kick_node_1',
  safeName: 'kick_node_1',
  synonyms: ['кик', 'исключить'],
  reason: 'Нарушение правил',
};

export const fixtureKickUserTargetGroup: UserHandlerTemplateParams = {
  nodeType: 'kick_user',
  nodeId: 'kick_node_2',
  safeName: 'kick_node_2',
  synonyms: ['кик'],
  targetGroupId: '-1001234567890',
};

export const fixtureMuteUser: UserHandlerTemplateParams = {
  nodeType: 'mute_user',
  nodeId: 'mute_node_1',
  safeName: 'mute_node_1',
  synonyms: ['мут', 'замутить'],
  duration: 3600,
  reason: 'Флуд',
  canSendMessages: false,
  canSendMediaMessages: false,
};

export const fixtureUnmuteUser: UserHandlerTemplateParams = {
  nodeType: 'unmute_user',
  nodeId: 'unmute_node_1',
  safeName: 'unmute_node_1',
  synonyms: ['размут'],
};

export const fixturePromoteUser: UserHandlerTemplateParams = {
  nodeType: 'promote_user',
  nodeId: 'promote_node_1',
  safeName: 'promote_node_1',
  synonyms: ['повысить', 'назначить'],
  canDeleteMessages: true,
  canInviteUsers: true,
  canPinMessages: true,
  canManageTopics: true,
};

export const fixtureDemoteUser: UserHandlerTemplateParams = {
  nodeType: 'demote_user',
  nodeId: 'demote_node_1',
  safeName: 'demote_node_1',
  synonyms: ['понизить'],
};
