/**
 * @fileoverview Сверка желаемого состояния ботов с фактом у удалённого исполнителя.
 * @module server/bots/runtime-reconcile
 */

import { storage } from "../storages/storage";
import { RemoteRunnerHub } from "./remoteRunnerHub";
import { getProjectPlacement } from "./botPlacement";
import { resolveRunnerRedisUrl } from "./resolveRunnerRedisUrl";
import { startBot } from "./startBot";
import { stopBot } from "./stopBot";
import { claimBuildLinkRetry, isBuildLinkExpired } from "./claimBuildLinkRetry";
import { HOST_CRASH_PREFIX } from "./workerExitDiagnostic";
import { scheduleBotRestart } from "./scheduleBotRestart";
import { automaticBotStartAllowed } from "./automaticBotStartAllowed";
import { refuseInactiveBotStart } from "./refuse-inactive-bot-start";
import { mapRestoreCandidates } from './restoreGrouping';
import { recoverMemoryWaiters } from './recoverMemoryWaiters';

/** Итог одного прохода сверки. */
export interface ReconcileResult {
  /** Число запущенных ботов. */
  started: number;
  /** Число остановленных ботов. */
  stopped: number;
  /** Число неудачных операций. */
  failed: number;
}

/** Не допускает двух одновременных проходов в одном процессе API. */
let inFlight: Promise<ReconcileResult> | null = null;

/**
 * Запускает регулярную сверку; ошибки не останавливают будущие проходы.
 * @param intervalMs - Интервал между попытками
 * @param beforeReconcile - Привязка к уже работающим воркерам перед сверкой
 * @returns Остановка регулярной сверки
 */
export function scheduleRuntimeReconcile(intervalMs = 5_000, beforeReconcile?: () => Promise<unknown>): () => void {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1_000) throw new Error("Некорректный интервал сверки");
  // Медленная привязка или запуск не должны создавать параллельные проходы таймера.
  let ticking = false;
  const timer = setInterval(() => {
    if (ticking) return;
    ticking = true;
    void (async () => {
      await beforeReconcile?.();
      return reconcileBotDesiredState();
    })().catch((error) => {
      console.error("[RuntimeReconcile] Не удалось сверить состояние ботов:", error);
    }).finally(() => { ticking = false; });
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

/**
 * Сверяет состояние после повторного подключения API или перезапуска runtime.
 * При недоступном runtime выбрасывает ошибку, сохраняя неизвестный статус.
 * @returns Число выполненных операций
 */
export function reconcileBotDesiredState(): Promise<ReconcileResult> {
  if (inFlight) return inFlight;
  inFlight = runReconcile().finally(() => { inFlight = null; });
  return inFlight;
}

/**
 * Выполняет один проход по снимку исполнителя и записям базы данных.
 * @returns Число выполненных операций
 */
async function runReconcile(): Promise<ReconcileResult> {
  const instances = await storage.getAllBotInstances();
  const runnerIds = new Set(instances.map((instance) => getProjectPlacement(instance.projectId).runnerId).filter((id): id is string => !!id));
  const live = new Set<number>();
  const occupied = new Set<number>();
  for (const runnerId of runnerIds) {
    const hub = await RemoteRunnerHub.get(runnerId, resolveRunnerRedisUrl());
    const snapshot = await hub.inspect(5_000);
    for (const worker of snapshot.workers) {
      for (const tokenId of worker.tokenIds) { live.add(tokenId); occupied.add(tokenId); }
      for (const tokenId of worker.pendingTokenIds) occupied.add(tokenId);
    }
  }
  const result: ReconcileResult = { started: 0, stopped: 0, failed: 0 };
  // До пяти кандидатов, включая один проект; startBot задаёт общий интервал и проверяет память.
  await mapRestoreCandidates(instances, async instance => {
    try {
    const tokenId = instance.tokenId;
    if (tokenId == null) return;
    if (!getProjectPlacement(instance.projectId).runnerId) return;
    const desired = instance.desiredStatus ?? (instance.status === "running" ? "running" : "stopped");
    const expiredBuildLink = isBuildLinkExpired(instance.errorMessage);
    // Только доверенный машинный признак общей аварии допускает восстановление непустой ошибки.
    const infrastructure = instance.errorMessage?.startsWith(HOST_CRASH_PREFIX) === true;
    const recoverable = !instance.errorMessage || instance.errorMessage === "__server_restart__" || expiredBuildLink || infrastructure;
    if (desired === "running" && !occupied.has(tokenId) && recoverable) {
      const current = await storage.getBotInstanceByToken(tokenId);
      if (!current || current.desiredGeneration !== instance.desiredGeneration || current.desiredStatus === "stopped" ||
          current.errorMessage !== instance.errorMessage) return;
      if (expiredBuildLink && !await claimBuildLinkRetry(instance.id, instance.desiredGeneration)) return;
      const token = await storage.getBotToken(tokenId);
      if (!token?.token || refuseInactiveBotStart(token.isActive, token.authorizationError) ||
          !await automaticBotStartAllowed(instance.projectId, tokenId)) return;
      if (infrastructure) {
        // Планировщик разделяет общий лимит и очередь с немедленным восстановлением после аварии.
        await scheduleBotRestart(instance.projectId, tokenId, "worker_host_crash", { infrastructure: true });
        return;
      }
      const started = await startBot(instance.projectId, token.token, tokenId, { reuseGeneratedCode: true });
      if (started.success) result.started++;
      else result.failed++;
    } else if (desired === "stopped" && live.has(tokenId)) {
      const current = await storage.getBotInstanceByToken(tokenId);
      if (!current || current.desiredGeneration !== instance.desiredGeneration || current.desiredStatus === "running") return;
      const stopped = await stopBot(instance.projectId, tokenId);
      if (stopped.success) result.stopped++;
      else result.failed++;
    }
    } catch { result.failed++; }
  });
  // Отказы вместимости имеют отдельную очередь, а не аварийные автоповторы.
  await recoverMemoryWaiters(instances, occupied, projectId => !!getProjectPlacement(projectId).runnerId);
  return result;
}
