/** @fileoverview Фиксация способа получения обновлений у запущенного экземпляра. */

import { and, eq } from 'drizzle-orm';
import { botInstances } from '@shared/schema';
import type { BotLaunchMode } from '@shared/bot-launch-mode';
import { db } from '../database/db';
import { storage } from '../storages/storage';
import type { BotCommandFence } from './botWorkerManager';

/** Параметры экземпляра для записи до запуска и после подтверждения. */
interface BotInstanceLaunch {
  /** Идентификатор проекта. */
  projectId: number;
  /** Идентификатор токена. */
  tokenId: number;
  /** Токен Telegram. */
  token: string;
  /** Режим, переданный исполнителю. */
  launchMode: BotLaunchMode;
  /** Этап запуска. */
  status: 'starting' | 'running';
  /** Идентификатор процесса после запуска. */
  processId?: string;
}

/**
 * Сохраняет режим до регистрации webhook и защищает версию удалённой команды.
 * @param launch - Параметры экземпляра.
 * @param fence - Версия команды запуска для удалённого исполнителя.
 * @returns Идентификатор экземпляра.
 */
export async function recordBotInstanceLaunch(launch: BotInstanceLaunch, fence?: BotCommandFence): Promise<number> {
  const update = { ...launch, errorMessage: null, stoppedAt: null, startedAt: new Date() };
  if (fence) {
    const [instance] = await db.update(botInstances).set(update).where(and(
      eq(botInstances.id, fence.instanceId),
      eq(botInstances.desiredGeneration, fence.desiredGeneration),
      eq(botInstances.desiredStatus, 'running'),
    )).returning({ id: botInstances.id });
    if (!instance) throw new Error('Запуск бота отменён новым намерением');
    return instance.id;
  }

  const existing = await storage.getBotInstanceByToken(launch.tokenId);
  if (existing) {
    await storage.updateBotInstance(existing.id, update);
    return existing.id;
  }
  return (await storage.createBotInstance(update)).id;
}

/**
 * Закрывает незавершённый запуск, сохраняя более новое намерение и результат исполнителя.
 * @param instanceId - Идентификатор запускаемого экземпляра.
 * @param fence - Версия команды запуска для удалённого исполнителя.
 * @param errorMessage - Причина сбоя запуска.
 * @returns Обещание записи результата.
 */
export async function recordBotInstanceLaunchFailure(
  instanceId: number, fence: BotCommandFence | undefined, errorMessage: string,
): Promise<void> {
  await db.update(botInstances).set({ status: 'error', stoppedAt: new Date(), errorMessage }).where(and(
    eq(botInstances.id, instanceId),
    eq(botInstances.status, 'starting'),
    fence ? eq(botInstances.desiredGeneration, fence.desiredGeneration) : undefined,
  ));
}
