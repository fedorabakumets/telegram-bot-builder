/**
 * @fileoverview Фильтрация и разбивка ошибок доставки рассылки
 * @module client/components/editor/broadcast/utils/delivery-error-stats
 */

import { formatDeliveryErrorReason } from './format-delivery-error-reason';
import { isBotUnauthorizedResult } from '@shared/broadcast-unauthorized';
import type { BroadcastResult } from '../types';

/** Счётчики по типам проблем доставки */
export interface DeliveryErrorBreakdown {
  /** Заблокировали бота */
  blocked: number;
  /** Аккаунт удалён / не найден */
  deleted: number;
  /** Прочие ошибки (не блок и не удаление) */
  failed: number;
}

/**
 * Фильтрует ошибки доставки по User ID и тексту причины
 * @param results - Список результатов рассылки
 * @param query - Строка поиска
 * @returns Отфильтрованный список
 */
export function filterDeliveryErrors(
  results: BroadcastResult[],
  query: string,
): BroadcastResult[] {
  const users = results.filter((r) => !isBotUnauthorizedResult(r.userId));
  const normalized = query.trim().toLowerCase();
  if (!normalized) return users;
  return users.filter((r) => {
    const reason = formatDeliveryErrorReason(r.status, r.errorMessage).toLowerCase();
    return r.userId.toLowerCase().includes(normalized) || reason.includes(normalized);
  });
}

/**
 * Считает разбивку ошибок по статусам
 * @param results - Список результатов с ошибками
 * @returns Счётчики blocked / deleted / failed
 */
export function countDeliveryErrorBreakdown(
  results: BroadcastResult[],
): DeliveryErrorBreakdown {
  let blocked = 0;
  let deleted = 0;
  let failed = 0;
  for (const r of results) {
    if (isBotUnauthorizedResult(r.userId)) continue;
    if (r.status === 'blocked') blocked += 1;
    else if (r.status === 'not_found') deleted += 1;
    else failed += 1;
  }
  return { blocked, deleted, failed };
}

/**
 * Есть ли служебная запись «токен не авторизован»
 * @param results - Результаты рассылки
 * @returns true, если рассылка остановлена из‑за токена
 */
export function hasUnauthorizedBotResult(results: BroadcastResult[]): boolean {
  return results.some((r) => isBotUnauthorizedResult(r.userId));
}
