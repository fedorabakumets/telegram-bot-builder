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
 * @returns Остановка регулярной сверки
 */
export function scheduleRuntimeReconcile(intervalMs = 30_000): () => void {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1_000) throw new Error("Некорректный интервал сверки");
  const timer = setInterval(() => {
    void reconcileBotDesiredState().catch((error) => {
      console.error("[RuntimeReconcile] Не удалось сверить состояние ботов:", error);
    });
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
  for (const instance of instances) {
    const tokenId = instance.tokenId;
    if (tokenId == null) continue;
    if (!getProjectPlacement(instance.projectId).runnerId) continue;
    const desired = instance.desiredStatus ?? (instance.status === "running" ? "running" : "stopped");
    const expiredBuildLink = isBuildLinkExpired(instance.errorMessage);
    const recoverable = !instance.errorMessage || instance.errorMessage === "__server_restart__" || expiredBuildLink;
    if (desired === "running" && !occupied.has(tokenId) && recoverable) {
      const current = await storage.getBotInstanceByToken(tokenId);
      if (!current || current.desiredGeneration !== instance.desiredGeneration || current.desiredStatus === "stopped") continue;
      if (expiredBuildLink && !await claimBuildLinkRetry(instance.id, instance.desiredGeneration)) continue;
      const token = await storage.getBotToken(tokenId);
      if (!token?.token || token.isActive === 0) continue;
      const started = await startBot(instance.projectId, token.token, tokenId, { reuseGeneratedCode: true });
      if (started.success) result.started++;
      else result.failed++;
    } else if (desired === "stopped" && live.has(tokenId)) {
      const current = await storage.getBotInstanceByToken(tokenId);
      if (!current || current.desiredGeneration !== instance.desiredGeneration || current.desiredStatus === "running") continue;
      const stopped = await stopBot(instance.projectId, tokenId);
      if (stopped.success) result.stopped++;
      else result.failed++;
    }
  }
  return result;
}
