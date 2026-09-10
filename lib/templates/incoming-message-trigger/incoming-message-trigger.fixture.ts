/**
 * @fileoverview Тестовые данные для шаблона middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.fixture
 */

import type { IncomingMessageTriggerTemplateParams } from './incoming-message-trigger.params';
import type { Node } from '@shared/schema';

/** Создаёт узел графа */
function makeNode(id: string, type: string, data: Record<string, unknown>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

/** Пустой массив триггеров */
export const validParamsEmpty: IncomingMessageTriggerTemplateParams = {
  entries: [],
};

/** Один триггер входящего сообщения */
export const validParamsSingle: IncomingMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_1',
      targetNodeId: 'msg_hello',
      targetNodeType: 'message',
      chatTypeFilter: 'any',
      groupChatId: '',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      stopOnFlag: true,
    },
  ],
};

/** Триггер с фильтром группы */
export const validParamsGroupFilter: IncomingMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_grp',
      targetNodeId: 'msg_hello',
      targetNodeType: 'message',
      chatTypeFilter: 'group',
      groupChatId: '2300967595',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      stopOnFlag: true,
    },
  ],
};

/** Несколько триггеров входящих сообщений */
export const validParamsMultiple: IncomingMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_1',
      targetNodeId: 'msg_hello',
      targetNodeType: 'message',
      chatTypeFilter: 'any',
      groupChatId: '',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      stopOnFlag: true,
    },
    {
      nodeId: 'trigger_2',
      targetNodeId: 'msg_welcome',
      targetNodeType: 'message',
      chatTypeFilter: 'private',
      groupChatId: '',
      groupChatIdSource: 'manual',
      groupChatVariableName: '',
      stopOnFlag: false,
    },
  ],
};

/** Один incoming_message_trigger узел */
export const nodesWithTrigger: Node[] = [
  makeNode('trigger_1', 'incoming_message_trigger', {
    autoTransitionTo: 'msg_hello',
    imtChatTypeFilter: 'any',
    imtStopOnFlag: true,
  }),
  makeNode('msg_hello', 'message', { messageText: 'Привет!' }),
];

/** incoming_message_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('trigger_bad', 'incoming_message_trigger', {
    autoTransitionTo: '',
  }),
];

/** Узлы без incoming_message_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('trigger_1', 'incoming_message_trigger', {
    autoTransitionTo: 'msg_1',
    imtChatTypeFilter: 'group',
    imtGroupChatId: '12345',
    imtGroupChatIdSource: 'manual',
  }),
  makeNode('msg_1', 'message', {}),
];
