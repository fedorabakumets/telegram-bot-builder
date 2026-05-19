/**
 * @fileoverview Zod-схема для валидации параметров delay
 * @module templates/delay/delay.schema
 */

import { z } from 'zod';

/** Схема параметров узла delay */
export const delayParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Значение задержки */
  seconds: z.string(),
  /** Единица измерения */
  unit: z.string().default('seconds'),
  /** Режим */
  mode: z.enum(['blocking', 'background']).default('blocking'),
  /** ID следующего узла */
  autoTransitionTo: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string().default('message'),
});

export type DelayParams = z.infer<typeof delayParamsSchema>;
