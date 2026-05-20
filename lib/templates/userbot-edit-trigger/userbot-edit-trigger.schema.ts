/**
 * @fileoverview Zod схема валидации параметров userbot_edit_trigger
 * @module templates/userbot-edit-trigger/userbot-edit-trigger.schema
 */

import { z } from 'zod';

/** Схема валидации параметров триггера редактирования */
export const userbotEditTriggerParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Entity чата */
  userbotEntity: z.string().optional().default(''),
  /** Тип фильтра */
  filterType: z.enum(['any', 'contains', 'regex']).optional().default('any'),
  /** Значение фильтра */
  filterValue: z.string().optional().default(''),
  /** Переменная для текста */
  saveTextTo: z.string().optional().default('edit_text'),
  /** Переменная для ID сообщения */
  saveMessageIdTo: z.string().optional().default('edit_msg_id'),
  /** Переменная для ID чата */
  saveChatIdTo: z.string().optional().default(''),
  /** Переменная для ID отправителя */
  saveSenderIdTo: z.string().optional().default(''),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional(),
  /** ID проекта */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров (выведен из схемы) */
export type UserbotEditTriggerParams = z.infer<typeof userbotEditTriggerParamsSchema>;
