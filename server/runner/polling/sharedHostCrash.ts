/** @fileoverview Безопасные признаки аварии общего Python и снимок памяти его cgroup. */
import { readFileSync } from "node:fs";

/** Результат завершения реального дочернего процесса. */
export interface SharedHostExit {
  /** Код выхода; при завершении сигналом отсутствует. */
  code: number | null;
  /** Сигнал ОС без предположения, что SIGKILL обязательно означает OOM. */
  signal: string | null;
}

/** Только числовые показатели памяти без окружения, путей и данных ботов. */
export interface SharedHostMemory {
  /** Использование памяти контейнера в байтах. */
  memoryCurrentBytes?: number;
  /** Ограничение памяти в байтах; при max поле отсутствует. */
  memoryMaxBytes?: number;
  /** Накопительный счётчик OOM-убийств во всей cgroup. */
  oomKillCount?: number;
  /** Прирост счётчика за жизнь хоста, не доказательство убийства конкретного PID. */
  oomKillDelta?: number;
}

/** Читает только фиксированные файлы cgroup; отсутствие Linux-метрик не мешает восстановлению. */
export function sharedHostMemory(read: (path: string) => string = path => readFileSync(path, "utf8")): SharedHostMemory {
  /** Разбирает неотрицательное целое, сохраняя неизвестное значение неизвестным. */
  const number = (value: string): number | undefined => {
    if (!/^\d+$/.test(value.trim())) return undefined;
    const result = Number(value.trim());
    return Number.isSafeInteger(result) && result >= 0 ? result : undefined;
  };
  /** Недоступные показатели не подменяются нулями. */
  const safe = (name: string): string => { try { return read(`/sys/fs/cgroup/${name}`); } catch { return ""; } };
  const events = safe("memory.events");
  return {
    memoryCurrentBytes: number(safe("memory.current")), memoryMaxBytes: number(safe("memory.max")),
    oomKillCount: number(/^oom_kill\s+(\d+)$/m.exec(events)?.[1] ?? ""),
  };
}

/** Публикует точную причину до событий выхода, пока принадлежность ботов ещё не удалена. */
export function reportSharedHostCrash(emit: (event: Record<string, unknown>) => void,
  tokenIds: Iterable<number>, result: SharedHostExit, pid: number | undefined, before: SharedHostMemory,
  after: SharedHostMemory = sharedHostMemory()): void {
  const diagnostics = { ...after };
  if (before.oomKillCount !== undefined && diagnostics.oomKillCount !== undefined
    && diagnostics.oomKillCount >= before.oomKillCount) diagnostics.oomKillDelta = diagnostics.oomKillCount - before.oomKillCount;
  const data = { exit_code: result.code, signal: result.signal, pid, diagnostics };
  console.warn("[SharedHostCrash]", JSON.stringify(data));
  for (const token_id of new Set(tokenIds)) emit({ type: "worker_host_crash", token_id, ...data });
}

/** Отделяет синтезированную Node причину от одноимённого недоверенного кадра старого Python. */
export function isChildHostCrashLine(line: string): boolean {
  try { return JSON.parse(line)?.type === "worker_host_crash"; } catch { return false; }
}
