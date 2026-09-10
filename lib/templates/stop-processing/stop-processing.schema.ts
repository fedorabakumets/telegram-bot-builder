/**
 * @fileoverview Zod схема для валидации параметров узла stop_processing
 * @module templates/stop-processing/stop-processing.schema
 */

import { z } from 'zod';

/** Схема одного узла stop_processing */
export const stopProcessingEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** ID следующего узла */
  autoTransitionTo: z.string().default(''),
});

/** Схема параметров шаблона stop_processing */
export const stopProcessingParamsSchema = z.object({
  /** Массив узлов */
  stopProcessingEntries: z.array(stopProcessingEntrySchema),
});

export type StopProcessingParams = z.infer<typeof stopProcessingParamsSchema>;
