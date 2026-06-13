/**
 * @fileoverview Zod схема валидации параметров userbot_message
 * @module templates/userbot-message/userbot-message.schema
 */

import { z } from 'zod';

/** Схема валидации параметров userbot-сообщения */
export const userbotMessageParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Текст сообщения */
  messageText: z.string().optional().default(''),
  /** Режим форматирования */
  formatMode: z.enum(['html', 'markdown', 'none']).optional().default('html'),
  /** Отключить превью ссылок */
  disableLinkPreview: z.boolean().optional().default(false),
  /** Entity получателя */
  userbotEntity: z.string().optional().default(''),
  /** Список получателей (если несколько) */
  userbotRecipients: z.array(z.string()).optional().default([]),
  /** Прикреплённые медиафайлы */
  attachedMedia: z.array(z.string()).optional().default([]),
  /** Переменная для сохранения ID сообщения */
  saveMessageIdTo: z.string().optional(),
  /** Переменная для сохранения ID ответа от получателя */
  saveResponseIdTo: z.string().optional(),
  /** Переменная для сохранения текста ответа от получателя */
  saveResponseTextTo: z.string().optional(),
  /** Переменная для сохранения кнопок ответа (JSON) */
  saveButtonsTo: z.string().optional(),
  /** Время ожидания ответа в секундах */
  responseWaitSeconds: z.number().optional().default(3),
  /** Стратегия выбора ответа */
  responseStrategy: z.enum(['first', 'longest', 'regex_match', 'last']).optional().default('longest'),
  /** Regex для фильтрации ответа */
  responseFilterRegex: z.string().optional().default(''),
  /** Переменная с id сообщения бота — учитывать edit этого msg (Vortex и др.) */
  responseFloorMessageIdVar: z.string().optional().default(''),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional(),
  /** ID проекта */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров (выведен из схемы) */
export type UserbotMessageParams = z.infer<typeof userbotMessageParamsSchema>;
