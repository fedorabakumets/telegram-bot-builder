/**
 * @fileoverview Исполнитель ботов: отдельный процесс без доступа к БД панели.
 * Читает команды панели из Redis Streams, запускает worker.py на своей машине
 * и отправляет обратно его вывод. Запуск: `npm run runner`.
 * @module server/runner
 */

import "dotenv/config";
import {
  appendToStream,
  connectStreamRedis,
  followStream,
  runnerCommandStream,
  runnerEventStream,
  type RunnerEvent,
} from "../redis/workerStreams";
import { publishRunnerSiteInfo, readRunnerSiteInfo } from "../redis/runnerSiteInfo";
import { loadRunnerConfig } from "./runnerConfig";
import { RunnerWorkers } from "./runnerWorkers";

/**
 * Подключается к Redis, принимает команды и останавливает воркеры по сигналу
 * @returns промис, завершающийся после остановки
 */
async function main(): Promise<void> {
  const config = loadRunnerConfig();
  const [writer, reader] = await Promise.all([connectStreamRedis(config.redisUrl), connectStreamRedis(config.redisUrl)]);
  const eventStream = runnerEventStream(config.runnerId);
  const workers = new RunnerWorkers(config, (event: RunnerEvent) => {
    appendToStream(writer, eventStream, event).catch((error) => {
      console.error(`🛰️ Событие ${event.k} воркера ${event.w} не отправлено:`, error?.message ?? error);
    });
  });
  const follower = followStream(reader, runnerCommandStream(config.runnerId), (fields) => workers.handle(fields));
  await follower.ready;
  await publishRunnerSiteInfo(writer, readRunnerSiteInfo(config.runnerId));
  // Панель считает воркеры прошлого запуска исполнителя завершёнными
  await appendToStream(writer, eventStream, { k: "hello", w: "", i: "" } satisfies RunnerEvent);
  console.log(`🛰️ Исполнитель ${config.runnerId} готов: python=${config.pythonPath}, worker=${config.workerScript}, кеш=${config.cacheDir}`);

  let stopping = false;
  const stop = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`🛰️ ${signal}: останавливаем воркеры (${workers.size})`);
    follower.stop();
    await workers.shutdown();
    // Даём событиям exit уйти в Redis до закрытия соединения
    await writer.quit().catch(() => writer.disconnect());
    process.exit(0);
  };
  process.on("SIGINT", () => void stop("SIGINT"));
  process.on("SIGTERM", () => void stop("SIGTERM"));
}

main().catch((error) => {
  console.error("🛰️ Исполнитель не запустился:", error instanceof Error ? error.message : error);
  process.exit(1);
});
