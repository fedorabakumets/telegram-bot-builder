/**
 * @fileoverview Эмит WS-события token-updated после изменения настроек токена
 * @module server/terminal/emitTokenUpdated
 */

import { storage } from '../storages/storage';
import { broadcastProjectEvent } from './broadcastProjectEvent';
import {
  pickChangedSettings,
  toTokenUpdatedPayload,
  type TokenLikeForUpdatedPayload,
  type TokenUpdatedSource,
} from './ProjectEvent';

/**
 * Параметры эмита token-updated
 */
export interface EmitTokenUpdatedParams {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Явный список изменённых полей (если не передан — вычислим из before/after) */
  changedFields?: string[];
  /** Состояние до update (для авто-diff) */
  before?: TokenLikeForUpdatedPayload | null;
  /** Источник изменения */
  source?: TokenUpdatedSource;
}

/**
 * Читает токен и рассылает безопасное событие token-updated
 * @param params - Параметры эмита
 */
export async function emitTokenUpdated(params: EmitTokenUpdatedParams): Promise<void> {
  const { projectId, tokenId, before, source = 'api' } = params;
  const token = await storage.getBotToken(tokenId);
  if (!token || token.projectId !== projectId) {
    console.warn(`[emitTokenUpdated] Токен ${tokenId} не найден в проекте ${projectId}`);
    return;
  }

  const changedFields =
    params.changedFields
    ?? pickChangedSettings(before ?? null, token);

  if (changedFields.length === 0) {
    return;
  }

  await broadcastProjectEvent(projectId, {
    type: 'token-updated',
    projectId,
    tokenId,
    timestamp: new Date().toISOString(),
    data: {
      changedFields,
      token: toTokenUpdatedPayload(token),
      source,
    },
  });
}
