/**
 * @fileoverview Определение узла параллельного запуска для сайдбара редактора
 *
 * Узел `parallel_split` — fan-out: одновременный запуск нескольких
 * независимых веток сценария (каждая ветка — отдельная asyncio-задача).
 *
 * @module components/editor/sidebar/massive/logic/parallel-split-node
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла параллельного запуска для сайдбара
 */
export const parallelSplitNode: ComponentDefinition = {
  id: 'parallel-split-node',
  name: 'Параллельная группа',
  description: 'Одновременный запуск нескольких веток',
  icon: 'fas fa-sitemap',
  color: 'bg-rose-100 text-rose-600',
  type: 'parallel_split' as any,
  defaultData: {
    /** Ветки параллельного запуска */
    parallelBranches: [
      { id: 'pbranch_1', label: 'Ветка 1', target: '' },
      { id: 'pbranch_2', label: 'Ветка 2', target: '' },
    ],
    /** Лимит одновременных веток */
    maxConcurrent: 5,
    /** Не ждать завершения веток */
    awaitAll: false,
    /** Защита от двойного запуска */
    skipIfRunning: true,
  },
};
