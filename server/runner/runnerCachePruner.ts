/** @fileoverview Объединяет очистки кеша и исключает удаление сборок во время подготовки команд. */

/** Планировщик одной очистки после серии запусков. */
export class RunnerCachePruner {
  /** Таймер объединения запросов. */
  private timer?: ReturnType<typeof setTimeout>;
  /** Выполняемая очистка. */
  private running?: Promise<void>;
  /** Число подготовок, удерживающих кеш. */
  private preparing = 0;
  /** Нужна ли новая очистка. */
  private requested = false;

  /** @param prune - Очистка с актуальными защищёнными сборками. @param delay - Задержка объединения в миллисекундах. */
  constructor(private readonly prune: () => Promise<void>, private readonly delay = 250) {}

  /**
   * Выполняет подготовку при отсутствии очистки; параллельные подготовки не блокируют друг друга.
   * @param prepare - Подготовка команды с удержанием используемых сборок.
   * @returns Результат подготовки.
   */
  async protect<T>(prepare: () => Promise<T>): Promise<T> {
    while (this.running) await this.running;
    this.preparing++;
    try { return await prepare(); }
    finally { this.preparing--; this.request(); }
  }

  /** Объединяет запросы, откладывая проход до окончания подготовок. */
  request(): void {
    this.requested = true;
    if (this.timer || this.running || this.preparing) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (this.preparing) return;
      this.requested = false;
      this.running = this.prune().catch(() => undefined).finally(() => {
        this.running = undefined;
        if (this.requested) this.request();
      });
    }, this.delay);
    this.timer.unref?.();
  }

  /** Отменяет отложенный проход при остановке исполнителя. */
  cancel(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.requested = false;
  }
}
