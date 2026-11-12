/** @fileoverview Короткий кеш фактического inspect с объединением одновременных запросов. */

/** Объединяет опросы одной панели и ограничивает общее время ожидания исполнителя. */
export class WorkerInspectionCache<T> {
  /** Последний результат одного источника; чужие окружения не смешиваются. */
  private cached: { key: string; at: number; value: T | null } | null = null;
  /** Единственный текущий запрос для защиты от одновременного открытия панелей. */
  private pending: { key: string; promise: Promise<T | null> } | null = null;

  /** Возвращает свежий снимок либо null, не публикуя текст сетевых ошибок. */
  async read(key: string, inspect: () => Promise<T>, timeoutMs = 3_000): Promise<T | null> {
    if (this.cached?.key === key && Date.now() - this.cached.at < 3_000) return this.cached.value;
    if (this.pending?.key === key) return this.pending.promise;
    const promise = this.load(key, inspect, timeoutMs);
    this.pending = { key, promise };
    try { return await promise; }
    finally { if (this.pending?.promise === promise) this.pending = null; }
  }

  /** Завершает ожидание даже при недоступном подключении Redis. */
  private async load(key: string, inspect: () => Promise<T>, timeoutMs: number): Promise<T | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const deadline = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs); });
      const value = await Promise.race([Promise.resolve().then(inspect).catch(() => null), deadline]);
      this.cached = { key, at: Date.now(), value };
      return value;
    } finally { clearTimeout(timer); }
  }
}
