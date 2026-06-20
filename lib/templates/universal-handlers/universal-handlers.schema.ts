/**
 * @fileoverview Zod схема для валидации параметров универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров универсальных обработчиков */
export const universalHandlersParamsSchema = z.object({
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: z.boolean().optional().default(false),
  /** Есть ли в проекте хотя бы одна кнопка с skipDataCollection=true */
  hasSkipDataCollectionButtons: z.boolean().optional(),
  /** Генерировать catch-all обработчики (по умолчанию true) */
  generateCatchAll: z.boolean().optional().default(true),
});

/** Тип параметров (выведен из схемы) */
export type UniversalHandlersParams = z.infer<typeof universalHandlersParamsSchema>;
