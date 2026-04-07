/**
 * @fileoverview Тестовые данные для шаблона обработчиков узла answer_callback_query
 * @module templates/answer-callback-query/answer-callback-query.fixture
 */

import type { AnswerCallbackQueryTemplateParams } from './answer-callback-query.params';
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

// ─── Низкоуровневые фикстуры (AnswerCallbackQueryTemplateParams) ──────────────

/** Пустой массив узлов */
export const validParamsEmpty: AnswerCallbackQueryTemplateParams = {
  entries: [],
};

/** Один узел answer_callback_query с текстом */
export const validParamsSingle: AnswerCallbackQueryTemplateParams = {
  entries: [
    {
      nodeId: 'node_id_123',
      targetNodeId: 'next_node',
      targetNodeType: 'message',
      notificationText: 'Готово!',
      showAlert: false,
      cacheTime: 0,
    },
  ],
};

/** Несколько узлов answer_callback_query */
export const validParamsMultiple: AnswerCallbackQueryTemplateParams = {
  entries: [
    {
      nodeId: 'acq_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      notificationText: 'Принято',
      showAlert: false,
      cacheTime: 0,
    },
    {
      nodeId: 'acq_2',
      targetNodeId: 'msg_2',
      targetNodeType: 'message',
      notificationText: 'Внимание!',
      showAlert: true,
      cacheTime: 5,
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) ────────────────────────────────────────

/** Один узел answer_callback_query с autoTransitionTo */
export const nodesWithNode: Node[] = [
  makeNode('acq_1', 'answer_callback_query', {
    autoTransitionTo: 'msg_1',
    callbackNotificationText: 'Готово!',
    callbackShowAlert: false,
    callbackCacheTime: 0,
  }),
  makeNode('msg_1', 'message', { messageText: 'Следующий шаг' }),
];

/** answer_callback_query без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('acq_bad', 'answer_callback_query', {
    autoTransitionTo: '',
    callbackNotificationText: 'Текст',
    callbackShowAlert: false,
    callbackCacheTime: 0,
  }),
];

/** Узлы без answer_callback_query */
export const nodesWithoutNodes: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('acq_1', 'answer_callback_query', {
    autoTransitionTo: 'msg_1',
    callbackNotificationText: 'OK',
    callbackShowAlert: false,
    callbackCacheTime: 0,
  }),
  makeNode('msg_1', 'message', {}),
];
