/**
 * @fileoverview Тестовые данные для шаблона узла rate_counter
 * @module templates/rate-counter/rate-counter.fixture
 */

import type { Node } from '@shared/schema';
import type { RateCounterTemplateParams } from './rate-counter.params';

/** Создаёт узел графа */
function makeNode(id: string, type: string, data: Record<string, unknown>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

/** Пустые параметры */
export const validParamsEmpty: RateCounterTemplateParams = {
  rateCounterEntries: [],
};

/** Один узел rate_counter */
export const validParamsSingle: RateCounterTemplateParams = {
  rateCounterEntries: [{
    nodeId: 'rc1',
    counterKey: 'user_messages',
    windowSeconds: '60',
    saveResultTo: 'msg_rate',
    autoTransitionTo: 'msg1',
  }],
};

/** Узлы графа с rate_counter */
export const nodesWithRateCounter: Node[] = [
  makeNode('rc1', 'rate_counter', {
    counterKey: 'spam_key',
    windowSeconds: '30',
    saveResultTo: 'spam_count',
    autoTransitionTo: 'msg1',
  }),
  makeNode('msg1', 'message', { messageText: 'OK' }),
];
