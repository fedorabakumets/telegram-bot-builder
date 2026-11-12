/** @fileoverview Необязательные снимки памяти исполнителя в журнал без передачи токенов и текстов команд. */
import { getHeapSpaceStatistics } from "node:v8";
import { readContainerMemory, readProcessMemory } from "./runnerMemoryLinux";
import type { RunnerEvent } from "../redis/workerStreams";

/** Параметры диагностического наблюдения. */
interface MemoryMonitorOptions {
  /** Интервал снимков; ноль или отсутствие отключают сбор. */
  intervalMs?: string;
  /** Счётчики очередей и воркеров без секретных данных. */
  counters: () => unknown;
  /** Получатель снимков, по умолчанию журнал процесса. */
  log?: (snapshot: unknown) => void;
}

/**
 * Проверяет настройку интервала и не допускает слишком частого чтения procfs.
 * @param value - Значение RUNNER_MEMORY_INTERVAL_MS
 * @returns Интервал от пяти секунд либо ноль при отключённой диагностике
 */
export function memoryInterval(value?: string): number {
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? Math.max(5_000, Math.min(ms, 3_600_000)) : 0;
}

/**
 * Читает только длину внутренней очереди клиента, не обходя команды и их аргументы.
 * @param client - Клиент Redis
 * @param key - Имя диагностируемой очереди
 * @returns Количество команд либо null, если версия клиента не предоставляет очередь
 */
export function redisQueueLength(client: object, key: "offlineQueue" | "commandQueue"): number | null {
  const queue: unknown = Reflect.get(client, key);
  if (!queue || typeof queue !== "object") return null;
  const length: unknown = Reflect.get(queue, "length");
  return typeof length === "number" && Number.isFinite(length) && length >= 0 ? length : null;
}

/**
 * Считает незавершённые отправки событий; хранит только числовые счётчики.
 * @returns Обёртка отправки и её счётчики
 */
export function createEventMemoryTracker() {
  let pendingCount = 0, pendingJsonBytes = 0, peakJsonBytes = 0;
  return {
    /** Возвращает размеры полезной нагрузки, которые не равны размеру объектов JS. */
    snapshot: () => ({ pendingCount, pendingJsonBytes, peakJsonBytes }),
    /**
     * Учитывает полезную нагрузку до подтверждения либо ошибки отправки.
     * @param event - Событие без сохранения его содержимого в диагностике
     * @param send - Реальная отправка
     * @returns Результат исходной отправки
     */
    async send(event: RunnerEvent, send: () => Promise<void>): Promise<void> {
      const bytes = Buffer.byteLength(JSON.stringify(event));
      pendingCount++; pendingJsonBytes += bytes;
      peakJsonBytes = Math.max(peakJsonBytes, pendingJsonBytes);
      try { await send(); }
      finally { pendingCount--; pendingJsonBytes -= bytes; }
    },
  };
}

/**
 * Включает последовательные снимки без перекрывающихся обходов и принудительного GC.
 * @param options - Интервал и источники счётчиков
 * @returns Функция остановки наблюдения
 */
export function startRunnerMemoryMonitor(options: MemoryMonitorOptions): () => void {
  const interval = memoryInterval(options.intervalMs);
  if (!interval) return () => undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const log = options.log ?? ((snapshot) => console.log(JSON.stringify(snapshot)));
  /** Собирает один снимок и планирует следующий только после завершения текущего. */
  const sample = async () => {
    const started = Date.now();
    try {
      const node = process.memoryUsage();
      const [linux, container] = await Promise.all([readProcessMemory(process.pid), readContainerMemory()]);
      if (!stopped) log({ type: "runner_memory", schemaVersion: 1, timestamp: new Date(started).toISOString(),
        durationMs: Date.now() - started, pid: process.pid, uptimeSeconds: process.uptime(),
        node, heapSpaces: getHeapSpaceStatistics(), linux, container, counters: options.counters() });
    } catch (error) {
      if (!stopped) console.error("[runner-memory] Не удалось собрать снимок:", error instanceof Error ? error.message : "ошибка измерения");
    } finally {
      if (!stopped) { timer = setTimeout(() => void sample(), interval); timer.unref(); }
    }
  };
  void sample();
  return () => { stopped = true; clearTimeout(timer); };
}
