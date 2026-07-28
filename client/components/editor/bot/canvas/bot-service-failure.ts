/**
 * @fileoverview Данные о последнем неудачном запуске для карточки холста
 * @module bot/canvas/bot-service-failure
 */

import type { BotStatusResponse } from '../bot-types';

/** Краткое описание ошибки запуска для UI */
export interface BotServiceFailure {
  /** Когда зафиксирована ошибка */
  at: Date | string;
  /** Текст ошибки (опционально) */
  message?: string;
}

/**
 * Извлекает ошибку последнего запуска из bot-status (если бот не running).
 * @param status - Ответ bot-status
 * @returns Данные ошибки или null
 */
export function getBotServiceFailure(
  status: BotStatusResponse | undefined,
): BotServiceFailure | null {
  if (!status || status.status === 'running') return null;
  const err = status.instance?.errorMessage?.trim();
  if (err === '__server_restart__') return null;
  const isError = status.status === 'error' || !!err;
  if (!isError) return null;
  const at = status.instance?.stoppedAt ?? status.instance?.startedAt;
  if (!at) return null;
  return {
    at,
    message: err || undefined,
  };
}

/**
 * Строит map tokenId → failure из списка статусов.
 * @param statuses - Статусы ботов
 * @returns Карта ошибок
 */
export function buildFailureByTokenId(
  statuses: BotStatusResponse[],
): Record<number, BotServiceFailure> {
  const map: Record<number, BotServiceFailure> = {};
  for (const s of statuses) {
    const id = s.tokenId ?? s.instance?.tokenId;
    if (id == null) continue;
    const failure = getBotServiceFailure(s);
    if (failure) map[id] = failure;
  }
  return map;
}
