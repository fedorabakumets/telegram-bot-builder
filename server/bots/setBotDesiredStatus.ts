/**
 * @fileoverview Атомарное обновление намерения запуска бота с версией команды.
 */

import { and, eq, sql } from 'drizzle-orm';
import { botInstances } from '@shared/schema/tables/bot-instances';
import { db } from '../database/db';

/** Желаемое состояние бота. */
export type BotDesiredStatus = 'running' | 'stopped';

/**
 * Записывает новое намерение и увеличивает его версию в одной операции.
 * @param instanceId - Идентификатор экземпляра бота
 * @param desiredStatus - Требуемое состояние
 * @param expectedGeneration - При задании исключает изменение более нового намерения.
 * @returns Новая версия или null, если экземпляра больше нет
 */
export async function setBotDesiredStatus(
  instanceId: number,
  desiredStatus: BotDesiredStatus,
  expectedGeneration?: number,
): Promise<number | null> {
  const [instance] = await db.update(botInstances).set({
    desiredStatus,
    desiredGeneration: sql`${botInstances.desiredGeneration} + 1`,
    desiredUpdatedAt: new Date(),
  }).where(and(eq(botInstances.id, instanceId), expectedGeneration === undefined
    ? undefined : eq(botInstances.desiredGeneration, expectedGeneration))).returning({ generation: botInstances.desiredGeneration });
  return instance?.generation ?? null;
}
