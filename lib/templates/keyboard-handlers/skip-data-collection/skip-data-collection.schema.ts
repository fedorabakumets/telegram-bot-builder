/**
 * @fileoverview Zod схема для валидации параметров шаблона skip-data-collection
 * @module templates/skip-data-collection/skip-data-collection.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров проверки skipDataCollection */
export const skipDataCollectionParamsSchema = z.object({
  /** Имя переменной для сохранения */
  variableName: z.string(),
  /** Выражение значения переменной */
  variableValue: z.string(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type SkipDataCollectionParams = z.infer<typeof skipDataCollectionParamsSchema>;
