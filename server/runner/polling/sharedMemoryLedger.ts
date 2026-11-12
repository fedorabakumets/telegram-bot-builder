/** @fileoverview Учёт RSS общих Python-процессов без повторного сложения по ботам. */

/** Безопасный снимок одного общего процесса без оценки памяти отдельного бота. */
export interface SharedMemoryReading {
  /** Область измерения охватывает весь общий процесс. */
  memoryScope: "shared";
  /** Настоящий PID интерпретатора, сообщённый протоколом готовности. */
  actualPid: number;
  /** Последний измеренный RSS процесса и его защитной оболочки в КиБ. */
  memoryKb: number;
  /** Число загруженных обработчиков в процессе. */
  handlerCount: number;
  /** Номера загруженных ботов в базе, не Telegram-токены. */
  handlerTokenIds: number[];
}

/** Дескриптор одной жизни общего процесса. */
export interface SharedMemoryRegistration {
  /** Обновляет измерение; до получения настоящего PID RSS не публикуется. */
  record(memoryKb: unknown, actualPid?: unknown): void;
  /** Заменяет список реально загруженных обработчиков. */
  setHandlers(tokenIds: readonly number[]): void;
  /** Удаляет процесс, игнорируя последующие запоздалые кадры. */
  close(): void;
}

/** Внутренняя запись с порядком измерения для устранения повторного PID. */
interface Entry {
  /** Настоящий PID до получения готовности может отсутствовать. */
  actualPid?: number;
  /** Последний RSS. */
  memoryKb: number;
  /** Порядок получения последнего измерения. */
  sequence: number;
  /** Номера загруженных обработчиков. */
  handlers: number[];
}

/** Проверяет целое число протокола без неявного преобразования строк. */
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

/** Суммирует общий RSS один раз на настоящий PID и сохраняет честную область измерения. */
export class SharedMemoryLedger {
  /** Уникальный владелец отличает завершённый процесс от его повторного запуска. */
  private readonly entries = new Map<object, Entry>();
  /** Счётчик позволяет выбирать свежее измерение при повторной регистрации одного PID. */
  private sequence = 0;

  /** @param publish - Получатель общего RSS без деления на число ботов. */
  constructor(private readonly publish: (memoryKb: number) => void) {}

  /** Регистрирует процесс; PID можно передать позднее вместе с первым измерением. */
  register(actualPid?: number): SharedMemoryRegistration {
    const owner = {};
    this.entries.set(owner, { actualPid: positiveInteger(actualPid) ? actualPid : undefined,
      memoryKb: 0, sequence: ++this.sequence, handlers: [] });
    return {
      record: (memoryKb, pid) => {
        const entry = this.entries.get(owner);
        if (!entry || typeof memoryKb !== "number" || !Number.isSafeInteger(memoryKb) || memoryKb < 0) return;
        if (pid !== undefined && !positiveInteger(pid)) return;
        if (pid !== undefined) entry.actualPid = pid;
        entry.memoryKb = memoryKb;
        entry.sequence = ++this.sequence;
        this.publish(this.total());
      },
      setHandlers: tokenIds => {
        const entry = this.entries.get(owner);
        if (entry) entry.handlers = [...new Set(tokenIds.filter(positiveInteger))].sort((a, b) => a - b);
      },
      close: () => { if (this.entries.delete(owner)) this.publish(this.total()); },
    };
  }

  /** Возвращает сумму измерений уникальных общих процессов. */
  total(): number {
    return this.snapshot().reduce((sum, entry) => sum + entry.memoryKb, 0);
  }

  /** Возвращает свежие измерения и объединённые номера обработчиков для каждого PID. */
  snapshot(): SharedMemoryReading[] {
    const byPid = new Map<number, { latest: Entry; handlers: Set<number> }>();
    for (const entry of this.entries.values()) {
      if (entry.actualPid === undefined) continue;
      const current = byPid.get(entry.actualPid);
      if (!current) byPid.set(entry.actualPid, { latest: entry, handlers: new Set(entry.handlers) });
      else {
        if (entry.sequence > current.latest.sequence) current.latest = entry;
        for (const tokenId of entry.handlers) current.handlers.add(tokenId);
      }
    }
    return [...byPid].map(([actualPid, { latest, handlers }]) => ({ memoryScope: "shared",
      actualPid, memoryKb: latest.memoryKb, handlerCount: handlers.size,
      handlerTokenIds: [...handlers].sort((a, b) => a - b) }));
  }
}
