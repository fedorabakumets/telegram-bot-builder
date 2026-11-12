/** @fileoverview Суммирование последних RSS только живых временных Python-обработчиков. */

/** Регистрация одной активации без сохранения токена и настроек бота. */
export interface ChildMemoryRegistration {
  /** Принимает числовое измерение доверенного guard-протокола. */
  record(memoryKb: unknown): void;
  /** Удаляет измерение после завершения процесса или неуспешного запуска. */
  close(): void;
}

/** Наблюдаемая память одной активации. */
interface ChildMemoryReading {
  /** Идентификатор записи бота для диагностики. */
  tokenId: number;
  /** Последнее измерение RSS в КиБ. */
  memoryKb: number;
}

/** Учитывает независимо параллельные активации и не принимает запоздалые события завершённых. */
export class ChildMemoryLedger {
  /** Активные регистрации; уникальный объект отличает повторные старты одного бота. */
  private readonly readings = new Map<object, ChildMemoryReading>();

  /** @param publish - Получатель суммарного RSS живых обработчиков в КиБ. */
  constructor(private readonly publish: (memoryKb: number) => void) {}

  /** Создаёт регистрацию до запуска, чтобы очистить даже измерение до ошибки готовности. */
  register(tokenId: number): ChildMemoryRegistration {
    const owner = {};
    this.readings.set(owner, { tokenId, memoryKb: 0 });
    return {
      record: (memoryKb) => {
        const reading = this.readings.get(owner);
        if (!reading || typeof memoryKb !== "number" || !Number.isSafeInteger(memoryKb) || memoryKb < 0) return;
        reading.memoryKb = memoryKb;
        this.publish(this.total());
      },
      close: () => {
        if (this.readings.delete(owner)) this.publish(this.total());
      },
    };
  }

  /** Возвращает числовой суммарный RSS без двойного учёта старых завершённых процессов. */
  total(): number {
    let memoryKb = 0;
    for (const reading of this.readings.values()) memoryKb += reading.memoryKb;
    return memoryKb;
  }

  /** Возвращает копии текущих измерений без секретов и внутренних владельцев. */
  snapshot(): ChildMemoryReading[] {
    return [...this.readings.values()].map(reading => ({ ...reading }));
  }
}
