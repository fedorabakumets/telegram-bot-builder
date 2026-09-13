/**
 * @fileoverview Zod схема для валидации параметров узла rate_counter
 * @module templates/rate-counter/rate-counter.schema
 */

import { z } from 'zod';

/** Схема одного узла rate_counter */
export const rateCounterEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Ключ счётчика */
  counterKey: z.string().default(''),
  /** Размер окна в секундах */
  windowSeconds: z.string().default('60'),
  /** Имя переменной для результата */
  saveResultTo: z.string().default('rate_count'),
  /** ID следующего узла */
  autoTransitionTo: z.string().default(''),
});

/** Схема параметров шаблона rate_counter */
export const rateCounterParamsSchema = z.object({
  /** Массив узлов */
  rateCounterEntries: z.array(rateCounterEntrySchema),
});

export type RateCounterParams = z.infer<typeof rateCounterParamsSchema>;
