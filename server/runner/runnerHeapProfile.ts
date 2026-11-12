/** @fileoverview Однократный ограниченный сеанс профилирования выделений V8 без сетевого отладчика. */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { summarizeHeapProfile } from "./runnerHeapProfileReport";

/**
 * Ограничивает числовую настройку допустимым диапазоном.
 * @param value - Значение настройки
 * @param fallback - Значение по умолчанию
 * @param minimum - Минимальное значение
 * @param maximum - Максимальное значение
 * @returns Конечное целое число в допустимом диапазоне
 */
function bounded(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const number = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? Math.floor(Math.max(minimum, Math.min(maximum, number))) : fallback;
}

/**
 * Читает настройки короткого сеанса, оставляя профилирование отключённым по умолчанию.
 * @param env - Окружение исполнителя
 * @returns Параметры записи выборочного профиля
 */
export function heapProfileSettings(env: NodeJS.ProcessEnv) {
  return { enabled: env.RUNNER_HEAP_PROFILE?.trim().toLowerCase() === "true",
    durationMs: bounded(env.RUNNER_HEAP_PROFILE_SECONDS, 60, 1, 300) * 1000,
    samplingInterval: bounded(env.RUNNER_HEAP_PROFILE_INTERVAL_BYTES, 32768, 16384, 1048576),
    directory: resolve(env.RUNNER_HEAP_PROFILE_DIR?.trim() || "output/runner-memory-profiles") };
}

/**
 * Запускает один сеанс; сохраняет профиль по таймеру либо при штатной остановке runtime.
 * @param env - Окружение исполнителя
 * @param log - Получатель структурированных сообщений, по умолчанию stdout
 * @returns Идемпотентная функция завершения и сохранения; ошибки не останавливают ботов
 */
export async function startRunnerHeapProfile(
  env: NodeJS.ProcessEnv = process.env,
  log: (message: unknown) => void = (message) => console.log(JSON.stringify(message)),
): Promise<() => Promise<void>> {
  const settings = heapProfileSettings(env);
  if (!settings.enabled) return async () => undefined;
  const { Session } = await import("node:inspector/promises");
  const session = new Session();
  const started = Date.now();
  try {
    await mkdir(settings.directory, { recursive: true, mode: 0o700 });
    session.connect();
    await session.post("HeapProfiler.startSampling", { samplingInterval: settings.samplingInterval });
  } catch {
    session.disconnect();
    console.error("[runner-heap-profile] Не удалось начать профилирование V8");
    return async () => undefined;
  }
  let finishing: Promise<void> | undefined;
  /** Завершает сеанс только один раз, даже при совпадении таймера и сигнала остановки. */
  const finish = (): Promise<void> => {
    if (finishing) return finishing;
    clearTimeout(timer);
    finishing = (async () => {
      try {
        const { profile } = await session.post("HeapProfiler.stopSampling");
        const file = join(settings.directory, `runner-${process.pid}-${started}.heapprofile`);
        await writeFile(file, JSON.stringify(profile), { flag: "wx", mode: 0o600 });
        log({ type: "runner_heap_profile", schemaVersion: 1, pid: process.pid,
          startedAt: new Date(started).toISOString(), durationMs: Date.now() - started,
          samplingIntervalBytes: settings.samplingInterval, file, ...summarizeHeapProfile(profile) });
      } catch {
        console.error("[runner-heap-profile] Не удалось сохранить профиль V8");
      } finally { session.disconnect(); }
    })();
    return finishing;
  };
  const timer = setTimeout(() => void finish(), settings.durationMs);
  timer.unref();
  log({ type: "runner_heap_profile_started", pid: process.pid,
    durationMs: settings.durationMs, samplingIntervalBytes: settings.samplingInterval });
  return finish;
}
