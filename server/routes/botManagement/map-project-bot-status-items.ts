/**
 * @fileoverview Собирает публичные статусы токенов проекта без секрета token
 * @module botManagement/map-project-bot-status-items
 */

import { toPublicBotInstance } from '../botTokens/to-public-bot-token';
import { formatBotStatusLabel } from '../../bots/resolveStoppedErrorMessage';

/** Публичный элемент списка статусов */
export interface ProjectBotStatusItem {
  /** ID токена */
  tokenId: number;
  /** Live-статус */
  status: 'running' | 'stopped' | 'error';
  /** true если токен ждёт restore после рестарта */
  restorePending?: boolean;
  /** Экземпляр без поля token или null */
  instance: Record<string, unknown> | null;
}

/**
 * Строит ответ по списку токенов: нет инстанса → stopped + instance null.
 *
 * @param tokenIds - ID токенов проекта (порядок ответа)
 * @param instanceByTokenId - Экземпляры из БД
 * @param liveStatus - Live-статус по tokenId
 * @returns Элементы для JSON без секретов
 */
export function mapProjectBotStatusItems(
  tokenIds: number[],
  instanceByTokenId: Map<number, { token?: string | null; status?: string }>,
  liveStatus: (tokenId: number) => 'running' | 'stopped' | 'error',
  restorePending: (tokenId: number) => boolean = () => false,
): ProjectBotStatusItem[] {
  return tokenIds.map((tokenId) => {
    const instance = instanceByTokenId.get(tokenId);
    const status = liveStatus(tokenId);
    const pending = restorePending(tokenId);
    const publicInstance = instance ? toPublicBotInstance(instance) : null;
    return {
      tokenId,
      status,
      restorePending: pending,
      instance: publicInstance
        ? {
            ...publicInstance,
            statusLabel: formatBotStatusLabel(status, pending),
            restorePending: pending,
          }
        : null,
    };
  });
}
