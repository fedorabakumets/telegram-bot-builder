/**
 * @fileoverview Тестовые данные для шаблона узла stop_processing
 * @module templates/stop-processing/stop-processing.fixture
 */

import type { Node } from '@shared/schema';
import type { StopProcessingTemplateParams } from './stop-processing.params';

/** Создаёт узел графа */
function makeNode(id: string, type: string, data: Record<string, unknown>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

/** Пустые параметры */
export const validParamsEmpty: StopProcessingTemplateParams = {
  stopProcessingEntries: [],
};

/** Один узел stop_processing */
export const validParamsSingle: StopProcessingTemplateParams = {
  stopProcessingEntries: [{ nodeId: 'stop1', autoTransitionTo: 'msg1' }],
};

/** Узлы графа с stop_processing */
export const nodesWithStopProcessing: Node[] = [
  makeNode('stop1', 'stop_processing', { autoTransitionTo: 'msg1' }),
  makeNode('msg1', 'message', { messageText: 'Далее' }),
];
