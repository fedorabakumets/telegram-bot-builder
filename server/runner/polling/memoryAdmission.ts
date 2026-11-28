/** @fileoverview Допуск новых Python-сценариев по свободной памяти cgroup без остановки работающих ботов. */
import { readContainerMemory } from "../runnerMemoryLinux";

/** Минимальный снимок общей памяти, включая Python и Node. */
export interface AdmissionMemory {
  /** Использование контейнера в байтах. */
  currentBytes: number;
  /** Конечный лимит либо отсутствие ограничения. */
  limitBytes: number | null;
}
/** Освобождение резервирования запуска; обе операции идемпотентны. */
export interface MemoryReservation {
  /** Отменяет резерв после ошибки или остановки. */
  release(): void;
  /** Удерживает резерв на время завершения стартового пика. */
  settled(): void;
}
/** Ожидаемый отказ вместимости, не авария общего Python-процесса. */
export class MemoryPressureError extends Error {
  /** Машинный код для остановки повторов запуска. */
  readonly code = "memory_pressure";
  /** @param diagnostics - Безопасные показатели вместимости. */
  constructor(readonly diagnostics: Record<string, number>) {
    super("Недостаточно свободной памяти исполнителя для безопасного запуска нового бота");
  }
}
/** Распознаёт отказ без зависимости от экземпляра класса между адаптерами. */
export function isMemoryPressure(error: unknown): error is MemoryPressureError {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "memory_pressure");
}
/** Общий допуск сериализует измерение и резерв для всех групп одного исполнителя. */
export class MemoryAdmission {
  /** Очередь коротких измерений, не запусков Python. */
  private queue: Promise<void> = Promise.resolve();
  /** Ещё не отражённые в cgroup стартовые пики. */
  private reservedBytes = 0;
  /** @param read - Источник cgroup. @param env - Настройки резерва и оценки запуска в МиБ. */
  constructor(private readonly read: () => Promise<AdmissionMemory | null> = readContainerMemory,
    private readonly env: NodeJS.ProcessEnv = process.env) {}
  /** Ждёт до 12 секунд только временный стартовый резерв, не занимая очередь измерений. */
  async acquire(): Promise<MemoryReservation> {
    const deadline = Date.now() + 12_000;
    for (;;) {
      try { return await this.acquireOnce(); }
      catch (error) {
        if (!isMemoryPressure(error)) throw error;
        const { currentBytes, limitBytes, reservedBytes, estimatedStartBytes, headroomBytes } = error.diagnostics;
        /** Реальная нехватка памяти не маскируется ожиданием и не ослабляет защитный запас. */
        if (!(reservedBytes > 0) || currentBytes + estimatedStartBytes + headroomBytes > limitBytes
          || Date.now() >= deadline) throw error;
        await new Promise<void>(resolve => setTimeout(resolve, Math.min(250, deadline - Date.now())));
      }
    }
  }
  /** Атомарно проверяет место до запуска процесса или загрузки сценария. */
  private acquireOnce(): Promise<MemoryReservation> {
    const next = this.queue.then(() => this.reserve());
    this.queue = next.then(() => {}, () => {});
    return next;
  }
  /** Читает положительное число МиБ; ноль не отключает защиту по ошибке. */
  private bytes(name: string, fallback: number): number {
    const value = Number(this.env[name]);
    return (Number.isFinite(value) && value > 0 ? value : fallback) * 1024 * 1024;
  }
  /** Выделяет резерв с двойным учётом текущей памяти в пользу безопасности. */
  private async reserve(): Promise<MemoryReservation> {
    const memory = await this.read();
    const estimate = this.bytes("RUNNER_MEMORY_START_MB", 64);
    const limit = memory?.limitBytes;
    if (memory && limit && Number.isFinite(limit) && limit > 0) {
      const headroom = Math.max(this.bytes("RUNNER_MEMORY_HEADROOM_MB", 64), limit * 0.15);
      if (memory.currentBytes + this.reservedBytes + estimate + headroom > limit) {
        throw new MemoryPressureError({ currentBytes: memory.currentBytes, limitBytes: limit,
          reservedBytes: this.reservedBytes, estimatedStartBytes: estimate, headroomBytes: headroom });
      }
    }
    // При неизвестном лимите сохраняем прежнюю работу; неизвестность не подменяется свободной памятью.
    this.reservedBytes += estimate;
    let held = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = () => { if (!held) return; held = false; clearTimeout(timer); this.reservedBytes -= estimate; };
    return { release, settled: () => {
      if (!held || timer) return;
      timer = setTimeout(release, 10_000); timer.unref();
    } };
  }
}
/** Все группы внутри контейнера разделяют резерв стартовых пиков. */
export const runnerMemoryAdmission = new MemoryAdmission();

/** Удерживает резерв асинхронного запуска до готовности и окончательного выхода. */
export async function startWithMemory<T extends { done: Promise<unknown> }>(
  admission: Pick<MemoryAdmission, "acquire">, start: () => Promise<T>): Promise<T> {
  const reservation = await admission.acquire();
  try {
    const child = await start(); reservation.settled();
    void child.done.then(() => reservation.release()); return child;
  } catch (error) { reservation.release(); throw error; }
}
