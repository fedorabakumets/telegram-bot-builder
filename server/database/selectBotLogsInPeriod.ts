/**
 * @fileoverview Выборка сохранённых логов по времени с устойчивой пагинацией по идентификатору.
 */
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { botLogs, type BotLog } from '@shared/schema';
import type { db } from './db';

/**
 * Загружает страницу логов одного токена и проекта из всех сохранённых запусков.
 * @param database - Подключение хранилища
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param from - Начало периода включительно
 * @param to - Окончание периода исключительно
 * @param limit - Максимум строк страницы
 * @param beforeId - Исключительная граница идентификатора для следующей страницы
 * @returns Строки страницы в порядке времени
 */
export async function selectBotLogsInPeriod(
  database: typeof db, projectId: number, tokenId: number,
  from: Date, to: Date, limit: number, beforeId?: number,
): Promise<BotLog[]> {
  const rows = await database.select().from(botLogs).where(and(
    eq(botLogs.projectId, projectId), eq(botLogs.tokenId, tokenId),
    gte(botLogs.timestamp, from), lt(botLogs.timestamp, to),
    beforeId === undefined ? undefined : lt(botLogs.id, beforeId),
  )).orderBy(desc(botLogs.id)).limit(limit);
  return rows.sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0) || a.id - b.id);
}
