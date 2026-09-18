/**
 * @fileoverview Zod-схема параметров edit_star_subscription
 * @module templates/edit-star-subscription/edit-star-subscription.schema
 */

import { z } from 'zod';

/** Схема источника user_id */
export const subscriptionUserSourceSchema = z.enum(['current_user', 'custom']);

/** Схема действия */
export const subscriptionActionSchema = z.enum(['cancel', 'enable']);

/** Схема одного узла */
export const editStarSubscriptionEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя */
  safeName: z.string().min(1),
  /** Успех */
  targetNodeId: z.string().default(''),
  /** Источник user_id */
  subscriptionUserSource: subscriptionUserSourceSchema.default('current_user'),
  /** ID при custom */
  subscriptionUserId: z.string().default(''),
  /** Код покупки */
  subscriptionChargeId: z.string().default(''),
  /** Действие */
  subscriptionAction: subscriptionActionSchema.default('cancel'),
  /** Игнорировать ошибки */
  ignoreErrors: z.boolean().default(false),
  /** Текст пустого кода */
  subscriptionMsgEmpty: z.string().default('Укажите код покупки подписки'),
  /** Текст ошибки */
  subscriptionMsgError: z.string().default(
    'Не удалось изменить автопродление. Проверьте код покупки.',
  ),
  /** Выход пустого кода */
  subscriptionEmptyTarget: z.string().default(''),
  /** Выход ошибки */
  subscriptionErrorTarget: z.string().default(''),
});

/** Схема параметров шаблона */
export const editStarSubscriptionParamsSchema = z.object({
  /** Массив узлов */
  entries: z.array(editStarSubscriptionEntrySchema),
});

/** Тип из схемы */
export type EditStarSubscriptionParams = z.infer<typeof editStarSubscriptionParamsSchema>;
