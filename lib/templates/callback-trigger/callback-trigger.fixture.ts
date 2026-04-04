/**
 * @fileoverview Тестовые данные для шаблона обработчиков триггеров inline-кнопок
 * @module templates/callback-trigger/callback-trigger.fixture
 */

import type { CallbackTriggerTemplateParams } from './callback-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

/**
 * Создаёт узел с заданными параметрами
 * @param id - Идентификатор узла
 * @param type - Тип узла
 * @param data - Данные узла
 * @returns Объект узла
 */
export function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (CallbackTriggerTemplateParams) ─────────────────

/** Пустой массив триггеров */
export const validParamsEmpty: CallbackTriggerTemplateParams = { entries: [] };

/** Один триггер с exact-совпадением */
export const validParamsExact: CallbackTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_confirm',
      callbackData: 'confirm_order',
      matchType: 'exact',
      targetNodeId: 'msg_confirmed',
      targetNodeType: 'message',
    },
  ],
};

/** Один триггер с startswith-совпадением */
export const validParamsStartswith: CallbackTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_order',
      callbackData: 'order_',
      matchType: 'startswith',
      targetNodeId: 'msg_order',
      targetNodeType: 'message',
    },
  ],
};

/** Триггер с adminOnly */
export const validParamsAdminOnly: CallbackTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_admin',
      callbackData: 'admin_action',
      matchType: 'exact',
      targetNodeId: 'msg_admin',
      targetNodeType: 'message',
      adminOnly: true,
    },
  ],
};

/** Триггер с requiresAuth */
export const validParamsRequiresAuth: CallbackTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_profile',
      callbackData: 'view_profile',
      matchType: 'exact',
      targetNodeId: 'msg_profile',
      targetNodeType: 'message',
      requiresAuth: true,
    },
  ],
};

/** Несколько триггеров */
export const validParamsMultiple: CallbackTriggerTemplateParams = {
  entries: [
    { nodeId: 'trigger_a', callbackData: 'action_a', matchType: 'exact', targetNodeId: 'msg_a', targetNodeType: 'message' },
    { nodeId: 'trigger_b', callbackData: 'btn_', matchType: 'startswith', targetNodeId: 'msg_b', targetNodeType: 'message' },
    { nodeId: 'trigger_c', callbackData: 'action_c', matchType: 'exact', targetNodeId: 'msg_c', targetNodeType: 'message' },
  ],
};

/** Невалидные параметры — пустой callbackData */
export const invalidParamsMissingCallbackData = {
  entries: [{ nodeId: 'trigger_bad', callbackData: '', matchType: 'exact', targetNodeId: 'msg_1', targetNodeType: 'message' }],
};

// ─── Высокоуровневые фикстуры (Node[]) ───────────────────────────────────────

/** Один callback_trigger узел с exact */
export const nodesWithCallbackTriggerExact: Node[] = [
  makeNode('trigger_confirm', 'callback_trigger', {
    callbackData: 'confirm_order',
    matchType: 'exact',
    autoTransitionTo: 'msg_confirmed',
  }),
  makeNode('msg_confirmed', 'message', { messageText: 'Заказ подтверждён!' }),
];

/** Один callback_trigger узел с startswith */
export const nodesWithCallbackTriggerStartswith: Node[] = [
  makeNode('trigger_order', 'callback_trigger', {
    callbackData: 'order_',
    matchType: 'startswith',
    autoTransitionTo: 'msg_order',
  }),
  makeNode('msg_order', 'message', { messageText: 'Обработка заказа...' }),
];

/** callback_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('trigger_bad', 'callback_trigger', { callbackData: 'some_data', matchType: 'exact', autoTransitionTo: '' }),
];

/** callback_trigger с пустым callbackData — должен быть пропущен */
export const nodesWithEmptyCallbackData: Node[] = [
  makeNode('trigger_empty', 'callback_trigger', { callbackData: '', matchType: 'exact', autoTransitionTo: 'msg_1' }),
];

/** Узлы без callback_trigger — должны быть пропущены */
export const nodesWithoutCallbackTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('trigger_confirm', 'callback_trigger', { callbackData: 'confirm', matchType: 'exact', autoTransitionTo: 'msg_1' }),
  makeNode('msg_1', 'message', {}),
];

/** Узлы с adminOnly */
export const nodesWithAdminOnly: Node[] = [
  makeNode('trigger_admin', 'callback_trigger', {
    callbackData: 'admin_action',
    matchType: 'exact',
    autoTransitionTo: 'msg_admin',
    adminOnly: true,
  }),
  makeNode('msg_admin', 'message', {}),
];

/** Узлы с requiresAuth */
export const nodesWithRequiresAuth: Node[] = [
  makeNode('trigger_profile', 'callback_trigger', {
    callbackData: 'view_profile',
    matchType: 'exact',
    autoTransitionTo: 'msg_profile',
    requiresAuth: true,
  }),
  makeNode('msg_profile', 'message', {}),
];

// ─── Фикстуры для виртуальных триггеров из customCallbackData ────────────────

/** Узлы с кнопками имеющими customCallbackData — должны генерировать виртуальные триггеры */
export const nodesWithCustomCallbackButtons: Node[] = [
  makeNode('msg_src', 'message', {
    messageText: 'Выберите:',
    keyboardType: 'inline',
    buttons: [
      { id: 'btn_yes', text: 'Да', action: 'goto', target: 'msg_answer', customCallbackData: 'yes', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn_no', text: 'Нет', action: 'goto', target: 'msg_answer', customCallbackData: 'no', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ],
  }),
  makeNode('msg_answer', 'message', { messageText: 'Ответ: {button_text}' }),
];

/** Узлы с одной кнопкой с customCallbackData */
export const nodesWithSingleCustomCallback: Node[] = [
  makeNode('msg_src', 'message', {
    messageText: 'Подтвердить?',
    keyboardType: 'inline',
    buttons: [
      { id: 'btn_confirm', text: 'Подтвердить', action: 'goto', target: 'msg_confirmed', customCallbackData: 'confirm_action', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ],
  }),
  makeNode('msg_confirmed', 'message', { messageText: 'Подтверждено!' }),
];
