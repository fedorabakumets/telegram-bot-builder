/**
 * @fileoverview Исполнитель ботов: команды Redis, процессы Python и защита актуальности команд.
 * Читает команды панели из Redis Streams, запускает worker.py на своей машине
 * и отправляет обратно его вывод. Запуск: `npm run runner`.
 * @module server/runner
 */

import "dotenv/config";
import { appendToStream, connectStreamRedis, followCommandStream,
  runnerCommandStream, runnerEventStream, type RunnerEvent } from "../redis/workerStreams";
import { publishRunnerSiteInfo, readRunnerSiteInfo } from "../redis/runnerSiteInfo";
import { watchRuntimeLease } from "../bots/runtime-lease";
import { waitRuntimeLease } from "./waitRuntimeLease";
import { loadRunnerConfig } from "./runnerConfig";
import { RunnerWorkers } from "./runnerWorkers";
import { closeBotCommandFence, commandFenceCounters } from "./runnerCommandFence";
import { redisQueueLength, startRunnerMemoryMonitor } from "./runnerMemoryMonitor";
import { startRunnerHeapProfile } from "./runnerHeapProfile";
import { createRunnerEventPublisher } from "./runnerEventPublisher";
import { startRunnerWebhookServer } from "./runnerWebhookServer";
import { startTelegramBrokerProcess } from './telegram-broker-process';
import { createRunnerStartupCleanup } from './runner-startup-cleanup';

/** Неполный запуск также закрывает потребителей раньше общего Telegram-клиента. */
const startupCleanup = createRunnerStartupCleanup();

/**
 * Подключается к Redis, принимает команды и останавливает воркеры по сигналу
 * @returns промис, завершающийся после остановки
 */
async function main(): Promise<void> {
  const config = loadRunnerConfig();
  const [writer, reader, leaseRedis] = await Promise.all([
    connectStreamRedis(config.redisUrl), connectStreamRedis(config.redisUrl), connectStreamRedis(config.redisUrl),
  ]);
  startupCleanup.add(() => { writer.disconnect(); reader.disconnect(); leaseRedis.disconnect(); });
  /** Остановка во время смены контейнеров отменяет ожидание до чтения команд. */
  const startup = new AbortController();
  /** Отменяет запуск по сигналу платформы. */
  const cancelStartup = () => startup.abort();
  /** Локальный надзор может отменить запуск до получения маркера готовности. */
  const cancelStartupMessage = (message: unknown) => {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'shutdown') startup.abort();
  };
  process.once("SIGINT", cancelStartup);
  process.once("SIGTERM", cancelStartup);
  process.on('message', cancelStartupMessage);
  const lease = await waitRuntimeLease(leaseRedis, config.runnerId, startup.signal);
  startupCleanup.add(() => lease.release());
  let onLeaseLost: (error?: unknown) => void = (error?: unknown) => {
    startup.abort(error || new Error('Аренда исполнителя потеряна до запуска'));
  };
  const stopWatching = watchRuntimeLease(lease, 3_000, (error) => onLeaseLost(error), 9_000);
  startupCleanup.add(stopWatching);
  let onBrokerLost = (error: Error) => startup.abort(error);
  const telegramBroker = await startTelegramBrokerProcess({ pythonPath: config.pythonPath,
    workerScript: config.workerScript, signal: startup.signal, onUnexpectedExit: error => onBrokerLost(error) });
  startupCleanup.add(() => telegramBroker.close());
  startup.signal.throwIfAborted();
  const eventStream = runnerEventStream(config.runnerId);
  /** Обратное давление сохраняет события и ограничивает одновременные команды Redis. */
  const workers: RunnerWorkers = new RunnerWorkers(config, (event: RunnerEvent) => publisher.publish(event));
  startupCleanup.add(() => workers.shutdown());
  const publisher = createRunnerEventPublisher({
    send: (event) => appendToStream(writer, eventStream, event),
    setPaused: (paused) => workers.pauseOutput(paused),
    onError: (error, event) => {
      console.error(`🛰️ Событие ${event.k} воркера ${event.w} не отправлено:`, error instanceof Error ? error.message : error);
    },
  });
  /** HTTP принимает только подтверждённые регистрации; проверка проекта выполняется публичным API. */
  const webhookServer = await startRunnerWebhookServer((projectId, tokenId) => workers.hasWebhook(projectId, tokenId), process.env,
    (projectId, tokenId, update, secret) => workers.enqueueWebhook(projectId, tokenId, update, secret));
  startupCleanup.add(() => webhookServer?.close());
  startup.signal.throwIfAborted();
  const follower = followCommandStream(reader, runnerCommandStream(config.runnerId), (fields) => workers.handle(fields));
  startupCleanup.add(() => follower.stop());
  await follower.ready;
  startup.signal.throwIfAborted();
  await publishRunnerSiteInfo(writer, readRunnerSiteInfo(config.runnerId));
  // Панель считает воркеры прошлого запуска исполнителя завершёнными
  await appendToStream(writer, eventStream, { k: "hello", w: "", i: "" } satisfies RunnerEvent);
  console.log(`🛰️ Исполнитель ${config.runnerId} готов: python=${config.pythonPath}, worker=${config.workerScript}, кеш=${config.cacheDir}`);
  /** Журнал диагностики идёт напрямую в stdout и не увеличивает очередь событий Redis. */
  const stopMemoryMonitor = startRunnerMemoryMonitor({ intervalMs: process.env.RUNNER_MEMORY_INTERVAL_MS,
    counters: () => ({ events: publisher.snapshot(), fence: commandFenceCounters(),
      ...workers.memoryCounters(), redis: [writer, reader, leaseRedis].map((client, index) => ({
        role: ["writer", "reader", "lease"][index], status: client.status,
        offlineCommands: redisQueueLength(client, "offlineQueue"), pendingCommands: redisQueueLength(client, "commandQueue"),
      })) }),
  });
  /** Сеанс V8 завершается автоматически и не открывает порт отладки. */
  const heapProfile = startRunnerHeapProfile();

  let stopping = false;
  const stop = async (signal: string, lost = false) => {
    if (stopping) return;
    stopping = true;
    webhookServer?.close();
    stopMemoryMonitor();
    stopWatching();
    console.log(`🛰️ ${signal}: останавливаем воркеры (${workers.size})`);
    follower.stop();
    if (lost) workers.killAll();
    await workers.shutdown();
    await telegramBroker.close();
    if (!lost) await (await heapProfile)();
    if (!lost) await publisher.drain();
    await closeBotCommandFence();
    if (!lost) await lease.release().catch(() => undefined);
    leaseRedis.disconnect();
    // Даём событиям exit уйти в Redis до закрытия соединения
    if (!lost) await writer.quit().catch(() => writer.disconnect());
    if (process.connected) process.disconnect();
    process.exit(lost ? 1 : 0);
  };
  /** Неподтверждённое закрытие завершается явной ошибкой, сохраняя защиту владения сессией. */
  const requestStop = (signal: string, lost = false) => void stop(signal, lost).catch(error => {
    console.error('🛰️ Не удалось подтвердить остановку исполнителя:', error);
    workers.killAll(); process.exit(1);
  });
  onLeaseLost = (error) => {
    console.error("🛰️ Аренда исполнителя потеряна:", error);
    requestStop("LEASE_LOST", true);
  };
  onBrokerLost = (error) => { console.error('🛰️ Общий Telegram-брокер завершился:', error); requestStop('TELETHON_BROKER_LOST', true); };
  process.removeListener("SIGINT", cancelStartup);
  process.removeListener("SIGTERM", cancelStartup);
  process.removeListener('message', cancelStartupMessage);
  process.on("SIGINT", () => requestStop("SIGINT"));
  process.on("SIGTERM", () => requestStop("SIGTERM"));
  /** IPC позволяет локальному надзору корректно завершать исполнитель на Windows. */
  process.on("message", (message: unknown) => {
    if (message && typeof message === "object" && "type" in message && message.type === "shutdown") {
      requestStop("IPC_SHUTDOWN");
    }
  });
  startup.signal.throwIfAborted();
  /** Локальный надзор запускает API только после готовности брокера и потребителей runtime. */
  if (process.env.TELETHON_BROKER_MODE === 'embedded') console.log('TELETHON_RUNTIME_READY');
}

main().catch(async (error) => {
  console.error("🛰️ Исполнитель не запустился:", error instanceof Error ? error.message : error);
  await startupCleanup.close().catch(cleanupError => console.error('Ошибка закрытия ресурсов исполнителя:', cleanupError));
  process.exit(1);
});
