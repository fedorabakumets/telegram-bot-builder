/**
 * @fileoverview Zod-схема параметров refund_stars
 * @module templates/refund-stars/refund-stars.schema
 */

import { z } from 'zod';

/** Схема источника user_id */
export const refundUserSourceSchema = z.enum(['current_user', 'custom']);

/** Схема одного узла возврата */
export const refundStarsEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя функции */
  safeName: z.string().min(1),
  /** ID следующего узла */
  targetNodeId: z.string().default(''),
  /** Тип следующего узла */
  targetNodeType: z.string().default(''),
  /** Источник user_id */
  refundUserSource: refundUserSourceSchema.default('current_user'),
  /** ID пользователя при custom */
  refundUserId: z.string().default(''),
  /** Код покупки */
  refundChargeId: z.string().default(''),
  /** Игнорировать ошибки */
  ignoreErrors: z.boolean().default(false),
});

/** Схема параметров шаблона */
export const refundStarsParamsSchema = z.object({
  /** Массив узлов возврата */
  entries: z.array(refundStarsEntrySchema),
});

/** Тип параметров из схемы */
export type RefundStarsParams = z.infer<typeof refundStarsParamsSchema>;
