/** @fileoverview Единый срок ожидания готовности Python-воркера при запуске и подписке. */

/** Признаки среды запуска воркера. */
interface WorkerReadyEnvironment {
  /** Воркер запускается в контейнере. */
  docker?: boolean;
  /** Воркер запускается удалённым исполнителем. */
  remote?: boolean;
}

/**
 * Учитывает медленный холодный импорт Python на Windows, запуск контейнера и сеть.
 * @param worker - Среда запуска; отсутствие означает обычный локальный процесс.
 * @param platform - Платформа панели, по умолчанию текущая.
 * @returns Срок ожидания в миллисекундах.
 */
export function workerReadyTimeout(
  worker?: WorkerReadyEnvironment,
  platform: NodeJS.Platform = process.platform,
): number {
  return platform === "win32" || worker?.docker || worker?.remote ? 60_000 : 10_000;
}
