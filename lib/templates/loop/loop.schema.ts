/**
 * @fileoverview Zod-схема для валидации параметров шаблона loop
 * @module templates/loop/loop.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров узла loop */
export const loopEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя для Python функции */
  safeName: z.string(),
  /** Имя переменной с массивом */
  sourceVariable: z.string(),
  /** Имя переменной для текущего элемента */
  itemVariable: z.string(),
  /** Имя переменной для индекса */
  indexVariable: z.string(),
  /** Параллельное выполнение */
  parallel: z.boolean(),
  /** Задержка между итерациями (секунды) */
  delaySeconds: z.number(),
  /** Максимум итераций (0 = без лимита) */
  maxIterations: z.number(),
  /** ID ноды тела цикла */
  autoTransitionTo: z.string(),
  /** Безопасное имя целевой ноды тела */
  autoTransitionToSafe: z.string(),
  /** Существует ли целевая нода тела */
  autoTransitionTargetExists: z.boolean(),
  /** ID ноды после цикла */
  afterLoopTo: z.string(),
  /** Безопасное имя целевой ноды после цикла */
  afterLoopToSafe: z.string(),
  /** Существует ли целевая нода после цикла */
  afterLoopTargetExists: z.boolean(),
});

/** Тип параметров, выведенный из схемы */
export type LoopEntrySchema = z.infer<typeof loopEntrySchema>;
