/**
 * @fileoverview Атомарный лимит повторов запуска после истечения ссылки на сборку.
 * @module server/bots/claimBuildLinkRetry
 */

import { and, eq, or, sql } from "drizzle-orm";
import { botInstances } from "@shared/schema/tables/bot-instances";
import { db } from "../database/db";

/** Машинный признак ошибки загрузки временной ссылки, установленный исполнителем. */
export const BUILD_LINK_EXPIRED_MARKER = "TBB_BUILD_LINK_EXPIRED:";

/** Максимум повторных ссылок на одно намерение пользователя. */
const MAX_RETRIES = 2;

/**
 * Проверяет, относится ли ошибка именно к загрузке временной ссылки сборки.
 * @param errorMessage - Сохранённая ошибка бота
 * @returns true только для помеченной ошибки исполнителя
 */
export function isBuildLinkExpired(errorMessage: string | null | undefined): boolean {
  return errorMessage?.includes(BUILD_LINK_EXPIRED_MARKER) === true;
}

/**
 * Атомарно выделяет одну попытку для текущего поколения намерения.
 * Конкурирующие процессы API не получат одну и ту же попытку одновременно.
 * @param instanceId - Идентификатор экземпляра бота
 * @param generation - Проверяемое поколение намерения
 * @returns true, если попытка выделена
 */
export async function claimBuildLinkRetry(instanceId: number, generation: number): Promise<boolean> {
  const fresh = sql`${botInstances.buildRetryGeneration} <> ${generation}`;
  const count = sql`CASE WHEN ${fresh} THEN 1 ELSE ${botInstances.buildRetryCount} + 1 END`;
  const [claimed] = await db.update(botInstances).set({
    buildRetryGeneration: generation,
    buildRetryCount: count,
    buildRetryAfter: sql`CURRENT_TIMESTAMP + CASE WHEN ${fresh} THEN INTERVAL '30 seconds' ELSE INTERVAL '2 minutes' END`,
  }).where(and(
    eq(botInstances.id, instanceId),
    eq(botInstances.desiredGeneration, generation),
    eq(botInstances.desiredStatus, "running"),
    sql`${botInstances.errorMessage} LIKE ${`%${BUILD_LINK_EXPIRED_MARKER}%`}`,
    or(fresh, sql`${botInstances.buildRetryCount} < ${MAX_RETRIES}`),
    or(fresh, sql`${botInstances.buildRetryAfter} IS NULL`, sql`${botInstances.buildRetryAfter} <= CURRENT_TIMESTAMP`),
  )).returning({ id: botInstances.id });
  return !!claimed;
}
