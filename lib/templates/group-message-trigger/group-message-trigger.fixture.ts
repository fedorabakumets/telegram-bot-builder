/**
 * @fileoverview Тестовые данные для шаблона триггера сообщения в топике группы
 * @module templates/group-message-trigger/group-message-trigger.fixture
 */

import type { GroupMessageTriggerTemplateParams } from './group-message-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (GroupMessageTriggerTemplateParams) ──────────────

/** Пустой массив триггеров */
export const validParamsEmpty: GroupMessageTriggerTemplateParams = {
  entries: [],
};

/** Один триггер с manual groupChatIdSource */
export const validParamsSingleManual: GroupMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'gmt_1',
      safeName: 'gmt_1',
      groupChatId: '2300967595',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      threadIdVariable: 'support_thread_id',
      resolvedUserIdVariable: 'resolved_user_id',
      targetNodeId: 'msg_reply',
      targetNodeType: 'message',
    },
  ],
};

/** Один триггер с variable groupChatIdSource */
export const validParamsSingleVariable: GroupMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'gmt_2',
      safeName: 'gmt_2',
      groupChatId: '',
      groupChatIdSource: 'variable',
      groupChatVariableName: 'group_chat_id',
      threadIdVariable: 'support_thread_id',
      resolvedUserIdVariable: 'resolved_user_id',
      targetNodeId: 'msg_reply',
      targetNodeType: 'message',
    },
  ],
};

/** Несколько триггеров */
export const validParamsMultiple: GroupMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'gmt_1',
      safeName: 'gmt_1',
      groupChatId: '2300967595',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      threadIdVariable: 'support_thread_id',
      resolvedUserIdVariable: 'resolved_user_id',
      targetNodeId: 'msg_reply_1',
      targetNodeType: 'message',
    },
    {
      nodeId: 'gmt_2',
      safeName: 'gmt_2',
      groupChatId: '9876543210',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      threadIdVariable: 'sales_thread_id',
      resolvedUserIdVariable: 'resolved_sales_user_id',
      targetNodeId: 'msg_reply_2',
      targetNodeType: 'message',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectGroupMessageTriggerEntries ──

/** Один group_message_trigger узел */
export const nodesWithTrigger: Node[] = [
  makeNode('gmt_1', 'group_message_trigger', {
    groupChatId: '2300967595',
    groupChatIdSource: 'manual',
    groupChatVariableName: '',
    threadIdVariable: 'support_thread_id',
    resolvedUserIdVariable: 'resolved_user_id',
    autoTransitionTo: 'msg_reply',
  }),
  makeNode('msg_reply', 'message', { messageText: 'Ответ оператора' }),
];

/** group_message_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('gmt_bad', 'group_message_trigger', {
    groupChatId: '2300967595',
    groupChatIdSource: 'manual',
    threadIdVariable: 'support_thread_id',
    resolvedUserIdVariable: 'resolved_user_id',
    autoTransitionTo: '',
  }),
];

/** Узлы без group_message_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('gmt_1', 'group_message_trigger', {
    groupChatId: '2300967595',
    groupChatIdSource: 'manual',
    threadIdVariable: 'support_thread_id',
    resolvedUserIdVariable: 'resolved_user_id',
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', {}),
];

/** Триггер с variable источником */
export const nodesWithVariableSource: Node[] = [
  makeNode('gmt_var', 'group_message_trigger', {
    groupChatId: '',
    groupChatIdSource: 'variable',
    groupChatVariableName: 'my_group_id',
    threadIdVariable: 'support_thread_id',
    resolvedUserIdVariable: 'resolved_user_id',
    autoTransitionTo: 'msg_reply',
  }),
  makeNode('msg_reply', 'message', {}),
];
