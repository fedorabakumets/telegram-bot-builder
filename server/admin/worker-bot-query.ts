/** @fileoverview Ограниченная пакетная выборка режимов ботов без секретов и запросов на каждую строку. */
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { botEnvVariables, botInstances, botProjects, botTokens } from '@shared/schema';
import { db } from '../database/db';
import { runtimeEnv } from '../services/runtime-overlay';
import type { WorkerBotListQuery } from './worker-bot-request';

/** Читает страницу, общее количество и одну пакетную выборку последних экземпляров. */
export async function queryWorkerBots(query: WorkerBotListQuery) {
  const ownMode = sql<string | null>`(select value from bot_env_variables where token_id = ${botTokens.id}
    and key = 'BOT_POLLING_MODE' order by id desc limit 1)`;
  const inherited = runtimeEnv('BOT_POLLING_MODE') || 'direct';
  const selected = (runtimeEnv('BOT_ON_DEMAND_TOKEN_IDS') || '').split(',').map(value => value.trim()).filter(Boolean);
  const fallback = selected.length
    ? sql`case when ${botTokens.id}::text in (${sql.join(selected.map(value => sql`${value}`), sql`, `)}) then ${inherited} else 'direct' end`
    : sql`${inherited}`;
  const effective = sql`coalesce(${ownMode}, ${fallback})`;
  const pattern = `%${query.search.replace(/[\\%_]/g, '\\$&')}%`;
  /** Последний экземпляр определяет включение без исключения спящих сценариев. */
  const enabled = sql`coalesce((select desired_status = 'running' or status in ('running', 'starting')
    from bot_instances where token_id = ${botTokens.id} order by id desc limit 1), false)`;
  const filter = and(query.activity === 'all' ? undefined : enabled, query.search ? or(ilike(botTokens.name, pattern), ilike(botTokens.botFirstName, pattern),
    ilike(botTokens.botUsername, pattern), ilike(botProjects.name, pattern)) : undefined,
    query.mode === 'all' ? undefined : sql`${effective} = ${query.mode}`);
  const [totals, rows] = await Promise.all([
    db.select({ total: count() }).from(botTokens).innerJoin(botProjects, eq(botTokens.projectId, botProjects.id)).where(filter),
    db.select({ tokenId: botTokens.id, projectId: botProjects.id, projectName: botProjects.name,
      ownerId: botProjects.ownerId, botName: sql<string>`coalesce(${botTokens.botFirstName}, ${botTokens.name})`,
      botUsername: botTokens.botUsername, launchMode: botTokens.launchMode, configuredMode: ownMode })
      .from(botTokens).innerJoin(botProjects, eq(botTokens.projectId, botProjects.id)).where(filter)
      .orderBy(asc(botTokens.id)).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
  ]);
  const ids = rows.map(row => row.tokenId);
  const instances = ids.length ? await db.selectDistinctOn([botInstances.tokenId], {
    tokenId: botInstances.tokenId, status: botInstances.status, desiredStatus: botInstances.desiredStatus,
  }).from(botInstances).where(inArray(botInstances.tokenId, ids))
    .orderBy(botInstances.tokenId, desc(botInstances.id)) : [];
  const byToken = new Map(instances.map(row => [row.tokenId, row]));
  return { total: totals[0]?.total ?? 0, rows: rows.map(row => ({ ...row,
    status: byToken.get(row.tokenId)?.status ?? 'stopped', desiredStatus: byToken.get(row.tokenId)?.desiredStatus ?? null })) };
}
