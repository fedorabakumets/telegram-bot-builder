/**
 * @fileoverview Zod схема для валидации параметров шаблона csv-safe
 * @module templates/csv-safe/csv-safe.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров безопасной работы с CSV */
export const csvSafeParamsSchema = z.object({
  /** Операция: запись или чтение */
  operation: z.enum(['write', 'read']),
  /** Имя переменной с путём к файлу */
  csvFileVar: z.string(),
  /** Имя переменной с данными (для write) */
  dataVar: z.string().optional(),
  /** Имя переменной для результата (для read) */
  resultVar: z.string().optional(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type CsvSafeParams = z.infer<typeof csvSafeParamsSchema>;
