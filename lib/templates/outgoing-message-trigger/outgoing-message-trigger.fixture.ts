/**
 * @fileoverview Тестовые данные для шаблона обработчиков триггеров исходящих сообщений
 * @module templates/outgoing-message-trigger/outgoing-message-trigger.fixture
 */

import type { OutgoingMessageTriggerTemplateParams } from './outgoing-message-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

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

// ─── Низкоуровневые фикстуры (OutgoingMessageTriggerTemplateParams) ───────────

/** Пустой массив триггеров */
export const validParamsEmpty: OutgoingMessageTriggerTemplateParams = {
  entries: [],
};

/** Один триггер исходящего сообщения */
export const validParamsSingle: OutgoingMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'omt_trigger_1',
      targetNodeId: 'fwd_to_admin',
      targetNodeType: 'forward_message',
    },
  ],
};

/** Несколько триггеров исходящих сообщений */
export const validParamsMultiple: OutgoingMessageTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'omt_trigger_1',
      targetNodeId: 'fwd_to_admin',
      targetNodeType: 'forward_message',
    },
    {
      nodeId: 'omt_trigger_2',
      targetNodeId: 'msg_log',
      targetNodeType: 'message',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectOutgoingMessageTriggerEntries ─

/** Один outgoing_message_trigger узел */
export const nodesWithTrigger: Node[] = [
  makeNode('omt_trigger_1', 'outgoing_message_trigger', {
    autoTransitionTo: 'fwd_to_admin',
  }),
  makeNode('fwd_to_admin', 'forward_message', { targetChatId: '123456' }),
];

/** outgoing_message_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('omt_bad', 'outgoing_message_trigger', {
    autoTransitionTo: '',
  }),
];

/** Узлы без outgoing_message_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('omt_trigger_1', 'outgoing_message_trigger', {
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', {}),
];
