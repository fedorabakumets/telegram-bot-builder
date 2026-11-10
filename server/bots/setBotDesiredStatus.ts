/**
 * @fileoverview Атомарное обновление намерения запуска бота с версией команды.
 */

import { eq, sql } from 'drizzle-orm';
import { botInstances } from '@shared/schema/tables/bot-instances';
import { db } from '../database/db';

/** Желаемое состояние бота. */
export type BotDesiredStatus = 'running' | 'stopped';

/**
 * Записывает новое намерение и увеличивает его версию в одной операции.
 * @param instanceId - Идентификатор экземпляра бота
 * @param desiredStatus - Требуемое состояние
 * @returns Новая версия или null, если экземпляра больше нет
 */
export async function setBotDesiredStatus(
  instanceId: number,
  desiredStatus: BotDesiredStatus,
): Promise<number | null> {
  const [instance] = await db.update(botInstances).set({
    desiredStatus,
    desiredGeneration: sql`${botInstances.desiredGeneration} + 1`,
    desiredUpdatedAt: new Date(),
  }).where(eq(botInstances.id, instanceId)).returning({ generation: botInstances.desiredGeneration });
  return instance?.generation ?? null;
}
