/** @fileoverview Объединение страницы настроек ботов с единым кешированным снимком исполнителя. */
import type { WorkerBotRuntimePage } from '../../shared/worker-bot-runtime';
import { toWorkerBotRuntimeRow, type WorkerBotActualMode } from './worker-bot-mode-model';
import { queryWorkerBots } from './worker-bot-query';
import type { WorkerBotListQuery } from './worker-bot-request';
import { getWorkerInspectionSnapshot } from './worker-runtime-metrics';

/** Загружает настройки и фактические режимы без дополнительных inspect на каждого бота. */
export async function listWorkerBots(query: WorkerBotListQuery): Promise<WorkerBotRuntimePage> {
  const [page, snapshot] = await Promise.all([queryWorkerBots(query), getWorkerInspectionSnapshot()]);
  const actual = new Map<number, WorkerBotActualMode>();
  for (const worker of snapshot?.workers ?? []) for (const bot of worker.bots ?? []) {
    actual.set(bot.tokenId, { mode: bot.mode, activity: bot.activity, workerKey: worker.workerKey,
      running: worker.tokenIds.includes(bot.tokenId) });
  }
  return { rows: page.rows.map(row => toWorkerBotRuntimeRow(row, actual.get(row.tokenId))),
    total: page.total, page: query.page, pageSize: query.pageSize,
    sampledAt: snapshot ? new Date().toISOString() : null, runtimeAvailable: snapshot !== null };
}
