/**
 * @fileoverview Собирает публичные статусы токенов проекта без секрета token
 * @module botManagement/map-project-bot-status-items
 */

import { toPublicBotInstance } from '../botTokens/to-public-bot-token';

/** Публичный элемент списка статусов */
export interface ProjectBotStatusItem {
  /** ID токена */
  tokenId: number;
  /** Live-статус */
  status: 'running' | 'stopped' | 'error';
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
): ProjectBotStatusItem[] {
  return tokenIds.map((tokenId) => {
    const instance = instanceByTokenId.get(tokenId);
    const status = liveStatus(tokenId);
    return {
      tokenId,
      status,
      instance: instance ? toPublicBotInstance(instance) : null,
    };
  });
}
