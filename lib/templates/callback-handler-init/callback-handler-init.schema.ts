/**
 * @fileoverview Zod схема для валидации параметров шаблона callback-handler-init
 * @module templates/callback-handler-init/callback-handler-init.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров инициализации callback-обработчика */
export const callbackHandlerInitParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Есть ли кнопки с hideAfterClick */
  hasHideAfterClick: z.boolean(),
  /** Нужно ли генерировать синхронизацию FSM через state */
  includeStateSync: z.boolean().optional(),
  /** Фильтры переменных */
  variableFilters: z.record(z.any()).nullable().optional(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type CallbackHandlerInitParams = z.infer<typeof callbackHandlerInitParamsSchema>;
