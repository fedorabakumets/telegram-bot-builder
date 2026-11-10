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
  /** Суммарный RSS процессов в МиБ */
  memoryMb: number;
  /** Боты, работающие по прежнему правилу группировки */
  pendingBots: number;
  /** Связь с исполнителем: null, если проверка недоступна или не нужна */
  runnerConnected: boolean | null;
  /** Время снимка */
  checkedAt: string;
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
    if (item.workerKey === item.projectId) return 'project';
    if (item.workerKey === (owners.get(item.projectId) ?? null)) return 'owner';
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
  return { grouping, activeGrouping, runtime, workers: stats.workers, bots: stats.totalBots,
    memoryMb: stats.totalMemoryMb, pendingBots, runnerConnected, checkedAt: new Date().toISOString() };
}
