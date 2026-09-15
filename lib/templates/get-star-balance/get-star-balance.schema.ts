/**
 * @fileoverview Zod-схема параметров get_star_balance
 * @module templates/get-star-balance/get-star-balance.schema
 */

import { z } from 'zod';

/** Схема одного узла */
export const getStarBalanceEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя */
  safeName: z.string().min(1),
  /** Успех */
  targetNodeId: z.string().default(''),
  /** Переменная для amount */
  saveStarBalanceTo: z.string().default('star_balance'),
  /** Игнорировать ошибки */
  ignoreErrors: z.boolean().default(false),
  /** Текст ошибки */
  balanceMsgError: z.string().default('Не удалось получить баланс звёзд'),
  /** Выход ошибки */
  balanceErrorTarget: z.string().default(''),
});

/** Схема параметров шаблона */
export const getStarBalanceParamsSchema = z.object({
  /** Массив узлов */
  entries: z.array(getStarBalanceEntrySchema),
});

/** Тип из схемы */
export type GetStarBalanceParams = z.infer<typeof getStarBalanceParamsSchema>;
