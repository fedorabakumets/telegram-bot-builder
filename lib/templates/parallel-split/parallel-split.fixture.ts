/**
 * @fileoverview Тестовые данные для шаблона узла parallel_split
 * @module templates/parallel-split/parallel-split.fixture
 */

import type { ParallelSplitEntry } from './parallel-split.params';
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

// ─── Низкоуровневые фикстуры (ParallelSplitEntry) ────────────────────────────

/** Split без веток (пустой) */
export const validParamsEmpty: ParallelSplitEntry = {
  nodeId: 'split_1',
  safeName: 'split_1',
  branches: [],
  maxConcurrent: 5,
  awaitAll: false,
  skipIfRunning: true,
};

/** Split с одной веткой */
export const validParamsSingle: ParallelSplitEntry = {
  nodeId: 'split_2',
  safeName: 'split_2',
  branches: [
    {
      id: 'br_1',
      label: 'Погода',
      target: 'http_weather',
      targetSafe: 'http_weather',
      onErrorTarget: '',
      onErrorTargetSafe: '',
      onErrorTargetExists: false,
    },
  ],
  maxConcurrent: 5,
  awaitAll: false,
  skipIfRunning: true,
};

/** Split с тремя ветками, одна с фоллбеком, awaitAll=true */
export const validParamsMultiple: ParallelSplitEntry = {
  nodeId: 'split_3',
  safeName: 'split_3',
  branches: [
    {
      id: 'br_1',
      label: 'Погода',
      target: 'http_weather',
      targetSafe: 'http_weather',
      onErrorTarget: '',
      onErrorTargetSafe: '',
      onErrorTargetExists: false,
    },
    {
      id: 'br_2',
      label: 'Курсы',
      target: 'http_rates',
      targetSafe: 'http_rates',
      onErrorTarget: 'setv_rates_failed',
      onErrorTargetSafe: 'setv_rates_failed',
      onErrorTargetExists: true,
    },
    {
      id: 'br_3',
      label: 'Статистика',
      target: 'psql_stats',
      targetSafe: 'psql_stats',
      onErrorTarget: '',
      onErrorTargetSafe: '',
      onErrorTargetExists: false,
    },
  ],
  maxConcurrent: 2,
  awaitAll: true,
  skipIfRunning: true,
};

/** Split без защиты от двойного запуска и без лимита */
export const validParamsNoGuards: ParallelSplitEntry = {
  nodeId: 'split_4',
  safeName: 'split_4',
  branches: [
    {
      id: 'br_1',
      label: 'Канал',
      target: 'msg_channel',
      targetSafe: 'msg_channel',
      onErrorTarget: '',
      onErrorTargetSafe: '',
      onErrorTargetExists: false,
    },
  ],
  maxConcurrent: 0,
  awaitAll: false,
  skipIfRunning: false,
};

// ─── Высокоуровневые фикстуры (Node[]) для collectParallelSplitEntries ───────

/** Массив узлов со split-нодой и целевыми нодами */
export const nodesWithParallelSplit: Node[] = [
  makeNode('split_1', 'parallel_split', {
    parallelBranches: [
      { id: 'br_1', label: 'Ветка 1', target: 'msg_1' },
      { id: 'br_2', label: 'Ветка 2', target: 'msg_2', onErrorTarget: 'msg_err' },
    ],
    maxConcurrent: 3,
    awaitAll: false,
    skipIfRunning: true,
  }),
  makeNode('msg_1', 'message', { messageText: 'Ветка 1' }),
  makeNode('msg_2', 'message', { messageText: 'Ветка 2' }),
  makeNode('msg_err', 'message', { messageText: 'Ошибка' }),
];

/** Split с веткой на несуществующую ноду */
export const nodesWithMissingTarget: Node[] = [
  makeNode('split_1', 'parallel_split', {
    parallelBranches: [
      { id: 'br_1', label: 'Живая', target: 'msg_1' },
      { id: 'br_2', label: 'Битая', target: 'missing_node' },
    ],
    maxConcurrent: 5,
  }),
  makeNode('msg_1', 'message', { messageText: 'Текст' }),
];

/** Массив без parallel_split */
export const nodesWithoutParallelSplit: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null + split + message */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('split_1', 'parallel_split', {
    parallelBranches: [{ id: 'br_1', label: '', target: 'msg_1' }],
    maxConcurrent: 5,
  }),
  makeNode('msg_1', 'message', { messageText: 'Текст' }),
];
