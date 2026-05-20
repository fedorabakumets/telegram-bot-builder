/**
 * @fileoverview Zod схема валидации параметров userbot_click_button
 * @module templates/userbot-click-button/userbot-click-button.schema
 */

import { z } from 'zod';

/** Схема валидации параметров нажатия кнопки через юзербот */
export const userbotClickButtonParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Entity чата */
  userbotEntity: z.string().optional().default(''),
  /** ID сообщения */
  messageId: z.string().optional().default(''),
  /** Источник сообщения */
  messageIdSource: z.enum(['manual', 'last']).optional().default('manual'),
  /** Способ поиска кнопки */
  clickMode: z.enum(['text', 'data', 'index']).optional().default('text'),
  /** Значение для поиска */
  clickValue: z.string().optional().default(''),
  /** Переменная для alert */
  saveAlertTo: z.string().optional(),
  /** Переменная для текста */
  saveResultTo: z.string().optional(),
  /** Переменная для кнопок JSON */
  saveButtonsTo: z.string().optional(),
  /** Переменная для флага медиа */
  saveHasMediaTo: z.string().optional(),
  /** Переменная для медиа-объекта */
  saveMediaTo: z.string().optional(),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional(),
  /** ID проекта */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров (выведен из схемы) */
export type UserbotClickButtonParams = z.infer<typeof userbotClickButtonParamsSchema>;
