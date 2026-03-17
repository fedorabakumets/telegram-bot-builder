/**
 * @fileoverview Zod схема для валидации параметров шаблона fake-callback
 * @module templates/fake-callback/fake-callback.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров создания fake callback */
export const fakeCallbackParamsSchema = z.object({
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** ID исходного узла */
  sourceNodeId: z.string(),
  /** Безопасное имя функции (без спецсимволов) */
  safeFunctionName: z.string(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type FakeCallbackParams = z.infer<typeof fakeCallbackParamsSchema>;
