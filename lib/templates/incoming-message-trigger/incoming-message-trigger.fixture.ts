/**
 * @fileoverview Тестовые данные для шаблона middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.fixture
 */

import type { IncomingMessageTriggerTemplateParams } from './incoming-message-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (IncomingMessageTriggerTemplateParams) ───────────

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
    },
    {
      nodeId: 'trigger_2',
      targetNodeId: 'msg_welcome',
      targetNodeType: 'message',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectIncomingMessageTriggerEntries ─

/** Один incoming_message_trigger узел */
export const nodesWithTrigger: Node[] = [
  makeNode('trigger_1', 'incoming_message_trigger', {
    autoTransitionTo: 'msg_hello',
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
  }),
  makeNode('msg_1', 'message', {}),
];
