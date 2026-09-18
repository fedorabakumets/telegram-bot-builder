/**
 * @fileoverview Фикстуры триггера успешной оплаты
 * @module templates/successful-payment-trigger/successful-payment-trigger.fixture
 */

import type { Node } from '@shared/schema';
import type { SuccessfulPaymentTriggerTemplateParams } from './successful-payment-trigger.params';

/**
 * Минимальный узел для тестов
 * @param id - ID
 * @param type - Тип
 * @param data - Данные
 * @returns Узел
 */
export function makeNode(id: string, type: string, data: Record<string, unknown>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

/** Пустой список */
export const validParamsEmpty: SuccessfulPaymentTriggerTemplateParams = {
  entries: [],
};

/** Один триггер all */
export const validParamsSingle: SuccessfulPaymentTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'spt_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      payloadFilter: 'all',
      payloadValue: '',
      savePaymentAmountTo: 'payment_amount',
      savePaymentChargeIdTo: 'payment_charge_id',
    },
  ],
};

/** Узлы с триггером exact */
export const nodesWithExactTrigger: Node[] = [
  makeNode('spt_exact', 'successful_payment_trigger', {
    payloadFilter: 'exact',
    payloadValue: 'donate_1',
    savePaymentAmountTo: 'amt',
    savePaymentChargeIdTo: 'chg',
    autoTransitionTo: 'msg_ok',
    enableAutoTransition: true,
  }),
  makeNode('msg_ok', 'message', { messageText: 'ok', buttons: [], keyboardType: 'none' }),
];

/** Узлы с несколькими фильтрами (для проверки порядка) */
export const nodesWithMixedFilters: Node[] = [
  makeNode('spt_all', 'successful_payment_trigger', {
    payloadFilter: 'all',
    payloadValue: '',
    savePaymentAmountTo: 'a',
    savePaymentChargeIdTo: 'c',
    autoTransitionTo: 'msg_all',
  }),
  makeNode('spt_pref', 'successful_payment_trigger', {
    payloadFilter: 'starts_with',
    payloadValue: 'donate_',
    savePaymentAmountTo: 'a',
    savePaymentChargeIdTo: 'c',
    autoTransitionTo: 'msg_pref',
  }),
  makeNode('spt_ex', 'successful_payment_trigger', {
    payloadFilter: 'exact',
    payloadValue: 'donate_1',
    savePaymentAmountTo: 'a',
    savePaymentChargeIdTo: 'c',
    autoTransitionTo: 'msg_ex',
  }),
  makeNode('msg_all', 'message', { messageText: 'all', buttons: [], keyboardType: 'none' }),
  makeNode('msg_pref', 'message', { messageText: 'pref', buttons: [], keyboardType: 'none' }),
  makeNode('msg_ex', 'message', { messageText: 'ex', buttons: [], keyboardType: 'none' }),
];

/** Без триггеров */
export const nodesWithoutTriggers: Node[] = [
  makeNode('msg_1', 'message', { messageText: 'hi', buttons: [], keyboardType: 'none' }),
];
