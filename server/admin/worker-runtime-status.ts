/**
 * @fileoverview Текущее состояние воркеров для административной вкладки.
 */
import { inArray } from 'drizzle-orm';
import { botProjects } from '@shared/schema';
import { workerManager } from '../bots/botWorkerManager';
import { getWorkerGroupingMode } from '../bots/workerGrouping';
import { getWorkerRunnerId, getWorkerRuntime } from '../bots/workerRuntime';
import { db } from '../database/db';
import { getRedisPublisher } from '../redis/redisClient';
import { getWorkerRuntimeMetrics } from './worker-runtime-metrics';
import type { WorkerMetrics } from '../../shared/worker-metrics';
import type { WorkerRuntimeGroup } from '../../shared/worker-runtime-group';

/** Сводка действующих процессов и сохранённого правила. */
export interface WorkerRuntimeStatus {
  /** Сохранённая группировка */
  grouping: string;
  /** Группировка работающих ботов или null, если их нет */
  activeGrouping: string | null;
  /** Способ запуска */
  runtime: string;
  /** Число процессов */
  workers: number;
  /** Число запущенных ботов */
  bots: number;
  /** Прежний показатель RSS Python в МиБ; полный Node+Python доступен в metrics. */
  memoryMb: number;
  /** Боты, работающие по прежнему правилу группировки */
  pendingBots: number;
  /** Связь с исполнителем: null, если проверка недоступна или не нужна */
  runnerConnected: boolean | null;
  /** Время снимка */
  checkedAt: string;
  /** Фактические замеры Node/Python и ограниченная история наблюдения. */
  metrics: WorkerMetrics;
  /** Группы исполнителя либо null, если живой снимок недоступен. */
  groups: WorkerRuntimeGroup[] | null;
}

/** Действующий бот, которому нужна новая группировка. */
export interface PendingWorkerBot {
  /** Проект бота */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
}

/** Возвращает ключ воркера, ожидаемый для проекта при данном режиме. */
function expectedKey(grouping: string, projectId: number, ownerId: number | null): number {
  if (grouping === 'shared') return 0;
  if (grouping === 'owner') return ownerId && ownerId > 0 ? ownerId : -projectId;
  return projectId;
}

/** Находит точные токены в воркерах прежней группировки. */
export async function listPendingWorkerBots(): Promise<PendingWorkerBot[]> {
  const active = workerManager.listActiveBots();
  if (!active.length) return [];
  const ids = [...new Set(active.map((item) => item.projectId))];
  const projects = await db.select({ id: botProjects.id, ownerId: botProjects.ownerId })
    .from(botProjects).where(inArray(botProjects.id, ids));
  const owners = new Map(projects.map((project) => [project.id, project.ownerId]));
  const grouping = getWorkerGroupingMode();
  return active.filter((item) => item.workerKey !== expectedKey(
    grouping, item.projectId, owners.get(item.projectId) ?? null,
  )).map(({ projectId, tokenId }) => ({ projectId, tokenId }));
}

/** Собирает состояние без изменения процессов и настроек. */
export async function getWorkerRuntimeStatus(): Promise<WorkerRuntimeStatus> {
  const grouping = getWorkerGroupingMode();
  const runtime = getWorkerRuntime();
  const stats = workerManager.getStats();
  const ids = [...new Set(stats.details.map((item) => item.projectId))];
  const projects = ids.length ? await db.select({ id: botProjects.id, ownerId: botProjects.ownerId })
    .from(botProjects).where(inArray(botProjects.id, ids)) : [];
  const owners = new Map(projects.map((project) => [project.id, project.ownerId]));
  const activeModes = new Set(stats.details.filter((item) => item.botsCount > 0).map((item) => {
    if (item.workerKey === 0) return 'shared';
    const projectMatch = item.workerKey === item.projectId;
    const ownerMatch = item.workerKey === (owners.get(item.projectId) ?? null);
    if (projectMatch && ownerMatch) return 'unknown';
    if (projectMatch) return 'project';
    if (ownerMatch) return 'owner';
    return 'unknown';
  }));
  const activeGrouping = activeModes.size === 0 ? null : activeModes.size === 1 ? [...activeModes][0] : 'mixed';
  const pendingBots = (await listPendingWorkerBots()).length;
  let runnerConnected: boolean | null = null;
  const redis = runtime === 'remote' ? getRedisPublisher() : null;
  if (redis) {
    try { runnerConnected = Boolean(await redis.get(`tbb:runner:${getWorkerRunnerId()}:lease`)); }
    catch { runnerConnected = null; }
  }
  const monitoring = await getWorkerRuntimeMetrics();
  return { grouping, activeGrouping, runtime, workers: stats.workers, bots: stats.totalBots,
    memoryMb: stats.totalMemoryMb, pendingBots, runnerConnected, checkedAt: new Date().toISOString(), ...monitoring };
}
