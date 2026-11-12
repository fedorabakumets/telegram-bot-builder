/** @fileoverview Защита активных сборок и ожидающих подтверждения перезапусков от очистки кеша. */

/** Отпечатки зарегистрированных ботов, включая спящих ondemand. */
export class RunnerBuildPins {
  /** Подтверждённые сборки по токену. */
  private readonly active = new Map<number, string>();
  /** Подготовленные сборки до подтверждения запуска. */
  private readonly pending = new Map<number, string[]>();

  /**
   * Удерживает новую сборку, сохраняя предыдущую до завершения перезапуска.
   * @param tokenId - Идентификатор бота.
   * @param fingerprint - Отпечаток подготовленной сборки.
   */
  prepare(tokenId: number, fingerprint: string): void {
    const pins = this.pending.get(tokenId) ?? [];
    pins.push(fingerprint);
    this.pending.set(tokenId, pins);
  }

  /**
   * Подтверждает очередной запуск, сохраняя следующие подготовленные перезапуски.
   * @param tokenId - Идентификатор запущенного бота.
   */
  started(tokenId: number): void {
    const pins = this.pending.get(tokenId);
    const fingerprint = pins?.shift();
    if (fingerprint) this.active.set(tokenId, fingerprint);
    if (!pins?.length) this.pending.delete(tokenId);
  }

  /**
   * Снимает завершённую сборку, сохраняя неподтверждённый перезапуск от старого stop.
   * @param tokenId - Идентификатор завершённого бота.
   * @param error - Завершился ли неподтверждённый запуск ошибкой.
   */
  stopped(tokenId: number, error = false): void {
    const wasActive = this.active.delete(tokenId);
    if (error && !wasActive) {
      const pins = this.pending.get(tokenId);
      pins?.shift();
      if (!pins?.length) this.pending.delete(tokenId);
    }
  }

  /** Возвращает все защищённые отпечатки без раскрытия токенов. @returns Отпечатки защищённых версий. */
  values(): string[] { return [...this.active.values(), ...[...this.pending.values()].flatMap((pins) => [...pins])]; }

  /** Число удерживаемых версий сборок. */
  get size(): number { return this.values().length; }
}
