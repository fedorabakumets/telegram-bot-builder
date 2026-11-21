/** @fileoverview Общая очередь запусков: не более пяти одновременно и пауза между допусками. */
import { performance } from "node:perf_hooks";

/** Запрос места без токенов ботов и пользовательских данных. */
interface StartWaiter {
  /** Передаёт владельцу идемпотентное освобождение места. */
  resolve(release: () => void): void;
}

/** Очередь всех проектов текущего API-процесса без отдельной блокировки проекта. */
export class BotStartupLimiter {
  /** Порядок поступления ещё не допущенных запусков. */
  private readonly waiting: StartWaiter[] = [];
  /** Число занятых глобальных мест, включая запуски одного проекта. */
  private active = 0;
  /** Монотонное время последнего допуска, не завершения запуска. */
  private lastAdmission?: number;
  /** Единственный таймер следующего глобального допуска. */
  private timer?: ReturnType<typeof setTimeout>;

  /** @param maximum - Глобальный предел. @param startGapMs - Минимальная пауза между началами запусков. */
  constructor(private readonly maximum = 5, private readonly startGapMs = 250) {
    if (!Number.isSafeInteger(maximum) || maximum < 1 || !Number.isFinite(startGapMs) || startGapMs < 0)
      throw new Error("Некорректные ограничения очереди запуска");
  }

  /** Ожидает допуск; вызывающий освобождает место в finally при любом исходе запуска. */
  acquire(projectId: number): Promise<() => void> {
    if (!Number.isSafeInteger(projectId) || projectId < 1) return Promise.reject(new Error("Некорректный проект запуска"));
    return new Promise(resolve => { this.waiting.push({ resolve }); this.pump(); });
  }

  /** Допускает очередь по двум независимым условиям: вместимость и интервал между началами. */
  private pump(): void {
    clearTimeout(this.timer); this.timer = undefined;
    while (this.waiting.length && this.active < this.maximum) {
      const now = performance.now();
      const remaining = this.lastAdmission === undefined ? 0 : this.lastAdmission + this.startGapMs - now;
      if (remaining > 0) {
        // Таймер не занимает одно из пяти мест и не зависит от окончания прошлого запуска.
        this.timer = setTimeout(() => this.pump(), Math.max(1, remaining));
        return;
      }
      const waiter = this.waiting.shift()!;
      this.active++; this.lastAdmission = now;
      let released = false;
      waiter.resolve(() => {
        if (released) return;
        released = true; this.active--; this.pump();
      });
    }
  }
}

/** Единый экземпляр ручных запусков, восстановления, reconcile и массового рестарта. */
export const botStartupLimiter = new BotStartupLimiter();
