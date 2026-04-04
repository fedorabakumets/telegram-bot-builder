/**
 * @fileoverview Тестовые данные для шаблона middleware триггера входящего callback_query
 * @module templates/incoming-callback-trigger/incoming-callback-trigger.fixture
 */

import type { IncomingCallbackTriggerTemplateParams } from './incoming-callback-trigger.params';
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

// ─── Низкоуровневые фикстуры (IncomingCallbackTriggerTemplateParams) ──────────

/** Пустой массив триггеров */
export const validParamsEmpty: IncomingCallbackTriggerTemplateParams = {
  entries: [],
};

/** Один триггер входящего callback_query */
export const validParamsSingle: IncomingCallbackTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_1',
      targetNodeId: 'msg_hello',
      targetNodeType: 'message',
    },
  ],
};

/** Несколько триггеров входящих callback_query */
export const validParamsMultiple: IncomingCallbackTriggerTemplateParams = {
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

// ─── Высокоуровневые фикстуры (Node[]) для collectIncomingCallbackTriggerEntries ─

/** Один incoming_callback_trigger узел */
export const nodesWithTrigger: Node[] = [
  makeNode('trigger_1', 'incoming_callback_trigger', {
    autoTransitionTo: 'msg_hello',
  }),
  makeNode('msg_hello', 'message', { messageText: 'Привет!' }),
];

/** incoming_callback_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('trigger_bad', 'incoming_callback_trigger', {
    autoTransitionTo: '',
  }),
];

/** Узлы без incoming_callback_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('trigger_1', 'incoming_callback_trigger', {
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', {}),
];
