/**
 * @fileoverview Zod схема для валидации параметров шаблона parse-mode
 * @module templates/parse-mode/parse-mode.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров выбора parse_mode */
export const parseModeParamsSchema = z.object({
  /** Режим форматирования */
  formatMode: z.string().optional(),
  /** Флаг markdown (устаревший) */
  markdown: z.boolean().optional(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type ParseModeParams = z.infer<typeof parseModeParamsSchema>;
