/**
 * @fileoverview Zod схема для валидации параметров заголовка
 * @module templates/header/header.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров заголовка */
export const headerParamsSchema = z.object({
  /** Включена ли база данных пользователей (не используется) */
  userDatabaseEnabled: z.boolean().default(false),
  /** Есть ли inline кнопки (не используется) */
  hasInlineButtons: z.boolean().default(false),
  /** Есть ли узлы с медиа (не используется) */
  hasMediaNodes: z.boolean().default(false),
});

/** Тип параметров заголовка (выведен из схемы) */
export type HeaderParams = z.infer<typeof headerParamsSchema>;
