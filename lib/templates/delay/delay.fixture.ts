/**
 * @fileoverview Тестовые данные для шаблона delay
 * @module templates/delay/delay.fixture
 */

import type { DelayEntry } from './delay.params';

/** Пустой массив */
export const validParamsEmpty = { delayEntries: [] };

/** Один blocking delay */
export const validParamsSingle = {
  delayEntries: [{
    nodeId: 'delay_1',
    seconds: '3',
    unit: 'seconds',
    mode: 'blocking' as const,
    autoTransitionTo: 'msg_1',
    targetNodeType: 'message',
  }],
};

/** Background delay */
export const validParamsBackground = {
  delayEntries: [{
    nodeId: 'delay_bg',
    seconds: '90',
    unit: 'seconds',
    mode: 'background' as const,
    autoTransitionTo: 'msg_notify',
    targetNodeType: 'message',
  }],
};

/** Delay с переменной */
export const validParamsVariable = {
  delayEntries: [{
    nodeId: 'delay_var',
    seconds: '{cooldown_time}',
    unit: 'minutes',
    mode: 'blocking' as const,
    autoTransitionTo: 'msg_1',
    targetNodeType: 'message',
  }],
};

/** Узлы для collectDelayEntries */
export const nodesWithDelay: any[] = [
  { id: 'delay_1', type: 'delay', position: { x: 0, y: 0 }, data: { seconds: '5', unit: 'seconds', mode: 'blocking', autoTransitionTo: 'msg_1', enableAutoTransition: true } },
  { id: 'msg_1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Done', buttons: [], keyboardType: 'none' } },
];

export const nodesWithoutDelay: any[] = [
  { id: 'msg_1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Hello', buttons: [], keyboardType: 'none' } },
];
