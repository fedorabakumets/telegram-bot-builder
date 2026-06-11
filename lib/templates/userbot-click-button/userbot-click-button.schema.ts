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
  /** Стратегия ожидания ответа: edit или new_message */
  responseStrategy: z.enum(['edit', 'new_message']).optional().default('edit'),
  /** Таймаут ожидания edit/new (сек), по умолчанию 5 без regex и 14 с regex */
  responseWaitSeconds: z.number().optional(),
  /** Regex для текста edit-сообщения (как poll_need в scrape) */
  responseFilterRegex: z.string().optional(),
  /** Способ отправки клика: fire_and_forget — в фоне, await — ждать ответ Telegram */
  clickDelivery: z.enum(['fire_and_forget', 'await']).optional().default('fire_and_forget'),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional(),
  /** ID проекта */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров (выведен из схемы) */
export type UserbotClickButtonParams = z.infer<typeof userbotClickButtonParamsSchema>;
