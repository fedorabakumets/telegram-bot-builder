/**
 * @fileoverview Zod-схема для валидации параметров шаблона parallel_split
 * @module templates/parallel-split/parallel-split.schema
 */

import { z } from 'zod';

/** Схема одной ветки параллельного запуска */
export const parallelSplitBranchSchema = z.object({
  /** ID ветки (порта) */
  id: z.string(),
  /** Подпись ветки для логов */
  label: z.string(),
  /** ID целевой ноды ветки */
  target: z.string(),
  /** Безопасное имя целевой ноды */
  targetSafe: z.string(),
  /** ID ноды-фоллбека при ошибке */
  onErrorTarget: z.string(),
  /** Безопасное имя ноды-фоллбека */
  onErrorTargetSafe: z.string(),
  /** Существует ли нода-фоллбек */
  onErrorTargetExists: z.boolean(),
});

/** Схема для валидации параметров узла parallel_split */
export const parallelSplitEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя для Python функции */
  safeName: z.string(),
  /** Ветки с существующими целевыми нодами */
  branches: z.array(parallelSplitBranchSchema),
  /** Лимит одновременных веток (0 = без лимита) */
  maxConcurrent: z.number(),
  /** Ждать завершения всех веток */
  awaitAll: z.boolean(),
  /** Защита от двойного запуска */
  skipIfRunning: z.boolean(),
});

/** Тип параметров, выведенный из схемы */
export type ParallelSplitEntrySchema = z.infer<typeof parallelSplitEntrySchema>;
