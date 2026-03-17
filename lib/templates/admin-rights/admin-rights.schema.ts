/**
 * @fileoverview Zod схема для валидации параметров admin-rights
 * @module templates/admin-rights/admin-rights.schema
 */

import { z } from 'zod';

export const adminRightsParamsSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя функции */
  safeName: z.string(),

  // --- Контент ---
  /** Текст сообщения */
  messageText: z.string().default('⚙️ Управление правами администратора'),
  /** Команда (без /) */
  command: z.string().default('admin_rights'),
});

export type AdminRightsParams = z.infer<typeof adminRightsParamsSchema>;
