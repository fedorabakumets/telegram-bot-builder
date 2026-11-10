/**
 * @fileoverview Фиксация версии намерения перед отправкой команды удалённому исполнителю.
 */

import { storage } from '../storages/storage';
import type { BotCommandFence } from './botWorkerManager';
import { resolveBotRuntimeMode } from '../runtime/bot-runtime-mode';

/**
 * Читает версию команды до долгой подготовки сборки или ожидания воркера.
 * @param tokenId - Идентификатор токена бота
 * @param operation - Запуск или остановка
 * @returns Версия команды либо undefined в совместном режиме
 */
export async function resolveBotCommandFence(
  tokenId: number,
  operation: 'start' | 'stop',
): Promise<BotCommandFence | undefined> {
  if (resolveBotRuntimeMode() !== 'api') return undefined;
  const instance = await storage.getBotInstanceByToken(tokenId);
  if (!instance || !instance.desiredStatus) {
    throw new Error(`Для бота ${tokenId} не записано желаемое состояние`);
  }
  if (operation === 'start' && instance.desiredStatus !== 'running') {
    throw new Error(`Запуск бота ${tokenId} отменён новым намерением`);
  }
  return { instanceId: instance.id, desiredGeneration: instance.desiredGeneration };
}
