/**
 * @fileoverview Zod схема для валидации параметров обработчиков управления сообщениями
 * @module templates/message-handler/message-handler.schema
 */

import { z } from 'zod';

export const messageHandlerNodeTypeSchema = z.enum([
  'pin_message',
  'unpin_message',
  'delete_message',
]);

export const messageHandlerParamsSchema = z.object({
  /** Тип узла */
  nodeType: messageHandlerNodeTypeSchema,
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя функции */
  safeName: z.string(),
  /** Список синонимов-триггеров (min 1) */
  synonyms: z.array(z.string()).min(1),
  /** ID конкретной группы, или '' для всех групп */
  targetGroupId: z.string().optional().default(''),

  // pin_message
  /** Отключить уведомление при закреплении */
  disableNotification: z.boolean().optional().default(false),

  /** Текст сообщения после выполнения действия */
  messageText: z.string().optional().default(''),
});

export type MessageHandlerParams = z.infer<typeof messageHandlerParamsSchema>;
