/**
 * @fileoverview Сбор статистики Worker Pool: RSS процессов и разбивка по проектам.
 * Общий воркер (WORKER_GROUPING=shared) раскладывается на записи по проектам,
 * память делится пропорционально числу ботов проекта.
 * @module server/bots/workerStats
 */

import { execSync } from "node:child_process";
import { SHARED_WORKER_KEY } from "./workerGrouping";

/** Минимальные данные воркера для статистики */
export interface WorkerStatsSource {
  /** Ключ воркера: ID проекта или ключ общего воркера */
  projectId: number;
  /** ID токенов запущенных ботов */
  activeBots: Set<number>;
  /** Процесс воркера */
  process: { pid?: number };
}

/** Строка статистики по проекту */
export interface WorkerStatsDetail {
  /** ID проекта */
  projectId: number;
  /** Количество ботов проекта в воркере */
  botsCount: number;
  /** Память в МБ: RSS воркера или доля проекта в общем воркере */
  memoryMb: number;
  /** PID процесса воркера */
  pid: number | undefined;
  /** Ключ воркера (одинаковый у проектов общего воркера) */
  workerKey: number;
  /** true, если воркер общий для нескольких проектов */
  shared: boolean;
}

/** Агрегированная статистика Worker Pool */
export interface WorkerPoolStats {
  /** Количество процессов воркеров */
  workers: number;
  /** Общее число ботов */
  totalBots: number;
  /** Суммарный RSS воркеров в МБ */
  totalMemoryMb: number;
  /** Разбивка по проектам */
  details: WorkerStatsDetail[];
}

/**
 * Читает RSS процесса
 * @param pid - PID процесса
 * @returns память в МБ или 0, если процесс недоступен
 */
export function readProcessMemoryMb(pid: number | undefined): number {
  if (!pid) return 0;
  try {
    if (process.platform === "win32") {
      // Формат: "python.exe","1492","Console","9","29 916 КБ" — память в последнем поле
      const output = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV`, { encoding: "utf8" }).trim();
      const line = output.split("\n").find((l) => l.includes(`"${pid}"`));
      const fields = line?.match(/"[^"]*"/g);
      const digits = fields && fields.length >= 5 ? fields[fields.length - 1].replace(/[^\d]/g, "") : "";
      return digits ? Math.round(parseInt(digits, 10) / 1024) : 0;
    }
    const output = execSync(`ps -o rss= -p ${pid}`, { encoding: "utf8" }).trim();
    const kb = parseInt(output, 10);
    return Number.isFinite(kb) ? Math.round(kb / 1024) : 0;
  } catch {
    return 0;
  }
}

/**
 * Делит память воркера между проектами пропорционально числу ботов (сумма долей = memoryMb)
 * @param memoryMb - RSS воркера
 * @param botsByProject - Число ботов по проектам
 * @returns доля памяти по проектам
 */
export function splitMemoryByBots(memoryMb: number, botsByProject: Map<number, number>): Map<number, number> {
  const total = [...botsByProject.values()].reduce((sum, n) => sum + n, 0);
  const shares = new Map<number, number>();
  if (total === 0) return shares;
  let rest = memoryMb;
  const entries = [...botsByProject.entries()];
  entries.forEach(([projectId, count], index) => {
    const share = index === entries.length - 1 ? rest : Math.round((memoryMb * count) / total);
    shares.set(projectId, share);
    rest -= share;
  });
  return shares;
}

/**
 * Собирает статистику по воркерам
 * @param workers - Воркеры менеджера
 * @param projectOf - Проект токена по ID токена и ключу воркера
 * @param readMemory - Чтение RSS по PID (подменяется в тестах)
 * @returns агрегаты и разбивка по проектам
 */
export function collectWorkerStats(
  workers: Iterable<WorkerStatsSource>,
  projectOf: (tokenId: number, workerKey: number) => number,
  readMemory: (pid: number | undefined) => number = readProcessMemoryMb,
): WorkerPoolStats {
  const stats: WorkerPoolStats = { workers: 0, totalBots: 0, totalMemoryMb: 0, details: [] };
  for (const worker of workers) {
    const workerKey = worker.projectId;
    const pid = worker.process.pid;
    const memoryMb = readMemory(pid);
    stats.workers++;
    stats.totalBots += worker.activeBots.size;
    stats.totalMemoryMb += memoryMb;

    const botsByProject = new Map<number, number>();
    for (const tokenId of worker.activeBots) {
      const projectId = projectOf(tokenId, workerKey);
      botsByProject.set(projectId, (botsByProject.get(projectId) ?? 0) + 1);
    }
    const shared = workerKey === SHARED_WORKER_KEY || botsByProject.size > 1;
    if (!shared) {
      stats.details.push({ projectId: workerKey, botsCount: worker.activeBots.size, memoryMb, pid, workerKey, shared });
      continue;
    }
    for (const [projectId, share] of splitMemoryByBots(memoryMb, botsByProject)) {
      stats.details.push({ projectId, botsCount: botsByProject.get(projectId) ?? 0, memoryMb: share, pid, workerKey, shared });
    }
  }
  return stats;
}
