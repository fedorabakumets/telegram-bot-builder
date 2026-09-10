/**
 * @fileoverview Тестовые данные для шаблона обработчиков триггера участника
 * @module templates/member-trigger/member-trigger.fixture
 */

import type { MemberTriggerTemplateParams } from './member-trigger.params';
import type { Node } from '@shared/schema';

/**
 * Создаёт минимальный узел для тестов
 * @param id - ID узла
 * @param type - Тип узла
 * @param data - Данные узла
 * @returns Объект узла
 */
export function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

/** Пустой массив триггеров */
export const validParamsEmpty: MemberTriggerTemplateParams = {
  entries: [],
};

/** Один триггер входа участника */
export const validParamsJoin: MemberTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'member_trigger_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      memberEventType: 'join',
      groupChatIdSource: 'manual',
      saveJoinedUserIdTo: 'joined_user_id',
      saveJoinedUsernameTo: 'joined_username',
      hasGroupChatFilter: false,
    },
  ],
};

/** Один триггер выхода участника с фильтром группы */
export const validParamsLeave: MemberTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'member_trigger_2',
      targetNodeId: 'msg_2',
      targetNodeType: 'message',
      memberEventType: 'leave',
      groupChatId: '2300967595',
      groupChatIdSource: 'manual',
      saveLeftUserIdTo: 'left_user_id',
      saveLeftUsernameTo: 'left_username',
      hasGroupChatFilter: true,
    },
  ],
};

/** Несколько триггеров */
export const validParamsMultiple: MemberTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'member_trigger_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      memberEventType: 'join',
      groupChatIdSource: 'manual',
      saveJoinedUserIdTo: 'joined_user_id',
      hasGroupChatFilter: false,
    },
    {
      nodeId: 'member_trigger_2',
      targetNodeId: 'msg_2',
      targetNodeType: 'message',
      memberEventType: 'both',
      groupChatIdSource: 'variable',
      groupChatVariableName: 'group_chat_id',
      saveJoinedUserIdTo: 'joined_user_id',
      saveLeftUserIdTo: 'left_user_id',
      hasGroupChatFilter: true,
    },
  ],
};

/** Один member_trigger узел с основными полями */
export const nodesWithTrigger: Node[] = [
  makeNode('member_trigger_1', 'member_trigger', {
    autoTransitionTo: 'msg_1',
    memberEventType: 'join',
    saveJoinedUserIdTo: 'joined_user_id',
    saveJoinedUsernameTo: 'joined_username',
    groupChatIdSource: 'manual',
  }),
  makeNode('msg_1', 'message', { messageText: 'Участник вошёл' }),
];

/** member_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('member_bad', 'member_trigger', { autoTransitionTo: '', memberEventType: 'join' }),
];

/** Узлы без member_trigger */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('member_trigger_1', 'member_trigger', {
    autoTransitionTo: 'msg_1',
    memberEventType: 'leave',
    saveLeftUserIdTo: 'left_user_id',
  }),
  makeNode('msg_1', 'message', {}),
];

/** Триггер both с фильтром по переменной группы */
export const nodesWithVariableFilter: Node[] = [
  makeNode('member_filter_1', 'member_trigger', {
    autoTransitionTo: 'msg_1',
    memberEventType: 'both',
    groupChatIdSource: 'variable',
    groupChatVariableName: 'group_chat_id',
    saveJoinedUserIdTo: 'joined_user_id',
    saveLeftUserIdTo: 'left_user_id',
  }),
  makeNode('msg_1', 'message', { messageText: 'Событие участника' }),
];
