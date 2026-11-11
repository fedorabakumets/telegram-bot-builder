/**
 * @fileoverview Исполнитель ботов: команды Redis, процессы Python и защита актуальности команд.
 * Читает команды панели из Redis Streams, запускает worker.py на своей машине
 * и отправляет обратно его вывод. Запуск: `npm run runner`.
 * @module server/runner
 */

import "dotenv/config";
import {
  appendToStream,
  connectStreamRedis,
  followCommandStream,
  runnerCommandStream,
  runnerEventStream,
  type RunnerEvent,
} from "../redis/workerStreams";
import { publishRunnerSiteInfo, readRunnerSiteInfo } from "../redis/runnerSiteInfo";
import { watchRuntimeLease } from "../bots/runtime-lease";
import { waitRuntimeLease } from "./waitRuntimeLease";
import { loadRunnerConfig } from "./runnerConfig";
import { RunnerWorkers } from "./runnerWorkers";
import { closeBotCommandFence } from "./runnerCommandFence";

/**
 * Подключается к Redis, принимает команды и останавливает воркеры по сигналу
 * @returns промис, завершающийся после остановки
 */
async function main(): Promise<void> {
  const config = loadRunnerConfig();
  const [writer, reader, leaseRedis] = await Promise.all([
    connectStreamRedis(config.redisUrl), connectStreamRedis(config.redisUrl), connectStreamRedis(config.redisUrl),
  ]);
  /** Остановка во время смены контейнеров отменяет ожидание до чтения команд. */
  const startup = new AbortController();
  /** Отменяет запуск по сигналу платформы. */
  const cancelStartup = () => startup.abort();
  process.once("SIGINT", cancelStartup);
  process.once("SIGTERM", cancelStartup);
  const lease = await waitRuntimeLease(leaseRedis, config.runnerId, startup.signal).finally(() => {
    process.removeListener("SIGINT", cancelStartup);
    process.removeListener("SIGTERM", cancelStartup);
  });
  let onLeaseLost: (error?: unknown) => void = (error?: unknown) => {
    console.error("🛰️ Аренда исполнителя потеряна до запуска:", error);
    process.exit(1);
  };
  const stopWatching = watchRuntimeLease(lease, 3_000, (error) => onLeaseLost(error), 9_000);
  const eventStream = runnerEventStream(config.runnerId);
  const workers = new RunnerWorkers(config, (event: RunnerEvent) => {
    appendToStream(writer, eventStream, event).catch((error) => {
      console.error(`🛰️ Событие ${event.k} воркера ${event.w} не отправлено:`, error?.message ?? error);
    });
  });
  const follower = followCommandStream(reader, runnerCommandStream(config.runnerId), (fields) => workers.handle(fields));
  await follower.ready;
  await publishRunnerSiteInfo(writer, readRunnerSiteInfo(config.runnerId));
  // Панель считает воркеры прошлого запуска исполнителя завершёнными
  await appendToStream(writer, eventStream, { k: "hello", w: "", i: "" } satisfies RunnerEvent);
  console.log(`🛰️ Исполнитель ${config.runnerId} готов: python=${config.pythonPath}, worker=${config.workerScript}, кеш=${config.cacheDir}`);

  let stopping = false;
  const stop = async (signal: string, lost = false) => {
    if (stopping) return;
    stopping = true;
    stopWatching();
    console.log(`🛰️ ${signal}: останавливаем воркеры (${workers.size})`);
    follower.stop();
    if (lost) workers.killAll();
    else await workers.shutdown();
    await closeBotCommandFence();
    if (!lost) await lease.release().catch(() => undefined);
    leaseRedis.disconnect();
    // Даём событиям exit уйти в Redis до закрытия соединения
    if (!lost) await writer.quit().catch(() => writer.disconnect());
    process.exit(lost ? 1 : 0);
  };
  onLeaseLost = (error) => {
    console.error("🛰️ Аренда исполнителя потеряна:", error);
    void stop("LEASE_LOST", true);
  };
  process.on("SIGINT", () => void stop("SIGINT"));
  process.on("SIGTERM", () => void stop("SIGTERM"));
}

main().catch((error) => {
  console.error("🛰️ Исполнитель не запустился:", error instanceof Error ? error.message : error);
  process.exit(1);
});
