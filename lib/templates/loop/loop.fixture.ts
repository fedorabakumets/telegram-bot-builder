/**
 * @fileoverview Тестовые данные для шаблона узла loop
 * @module templates/loop/loop.fixture
 */

import type { LoopEntry } from './loop.params';
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

// ─── Низкоуровневые фикстуры (LoopEntry) ─────────────────────────────────────

/** Loop без sourceVariable (пустой) */
export const validParamsEmpty: LoopEntry = {
  nodeId: 'loop_1',
  safeName: 'loop_1',
  sourceVariable: '',
  itemVariable: 'item',
  indexVariable: 'index',
  parallel: false,
  delaySeconds: 0,
  maxIterations: 0,
  autoTransitionTo: '',
  autoTransitionToSafe: '',
  autoTransitionTargetExists: false,
  afterLoopTo: '',
  afterLoopToSafe: '',
  afterLoopTargetExists: false,
};

/** Один loop с sourceVariable, itemVariable, autoTransitionTo */
export const validParamsSingle: LoopEntry = {
  nodeId: 'loop_2',
  safeName: 'loop_2',
  sourceVariable: 'users_list',
  itemVariable: 'current_user',
  indexVariable: 'i',
  parallel: false,
  delaySeconds: 1,
  maxIterations: 100,
  autoTransitionTo: 'msg_body',
  autoTransitionToSafe: 'msg_body',
  autoTransitionTargetExists: true,
  afterLoopTo: 'msg_done',
  afterLoopToSafe: 'msg_done',
  afterLoopTargetExists: true,
};

/** Loop с parallel: true */
export const validParamsParallel: LoopEntry = {
  nodeId: 'loop_3',
  safeName: 'loop_3',
  sourceVariable: 'tasks',
  itemVariable: 'task',
  indexVariable: 'idx',
  parallel: true,
  delaySeconds: 0,
  maxIterations: 50,
  autoTransitionTo: 'process_task',
  autoTransitionToSafe: 'process_task',
  autoTransitionTargetExists: true,
  afterLoopTo: 'finish',
  afterLoopToSafe: 'finish',
  afterLoopTargetExists: true,
};

// ─── Высокоуровневые фикстуры (Node[]) для collectLoopEntries ─────────────────

/** Массив узлов с loop-нодой и целевой нодой */
export const nodesWithLoop: Node[] = [
  makeNode('loop_1', 'loop', {
    sourceVariable: 'items',
    itemVariable: 'item',
    indexVariable: 'index',
    parallel: false,
    delaySeconds: 2,
    maxIterations: 10,
    autoTransitionTo: 'msg_body',
    afterLoopTo: 'msg_done',
  }),
  makeNode('msg_body', 'message', { messageText: 'Элемент: {item}' }),
  makeNode('msg_done', 'message', { messageText: 'Готово!' }),
];

/** Массив без loop */
export const nodesWithoutLoop: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null + loop + message */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('loop_1', 'loop', {
    sourceVariable: 'data',
    itemVariable: 'row',
    indexVariable: 'i',
    parallel: false,
    delaySeconds: 0,
    maxIterations: 0,
    autoTransitionTo: 'msg_1',
    afterLoopTo: '',
  }),
  makeNode('msg_1', 'message', { messageText: 'Текст' }),
];
