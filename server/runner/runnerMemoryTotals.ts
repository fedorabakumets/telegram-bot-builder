/** @fileoverview Суммирование памяти общего Python и временных обработчиков смешанной группы. */

/** Независимые источники не должны перезаписывать показания друг друга. */
export class RunnerMemoryTotals {
  /** Последние измерения двух источников в КиБ. */
  private readonly values = { legacy: 0, polling: 0 };

  /** Возвращает последний RSS двух независимых источников Python, учтённых по одному разу. */
  snapshot() { return { ...this.values, total: this.values.legacy + this.values.polling }; }

  /**
   * Объединяет только служебные числовые измерения, сохраняя прочие строки протокола.
   * @param line - Строка события воркера
   * @param source - Источник измерения
   * @returns Событие с суммарным RSS Python, без включения памяти Node
   */
  observe(line: string, source: 'legacy' | 'polling'): string {
    if (!line.includes('memory_kb:')) return line;
    try {
      const event = JSON.parse(line);
      const match = event.type === 'system' && typeof event.content === 'string'
        ? /^memory_kb:(\d+)$/.exec(event.content) : null;
      if (!match || !Number.isSafeInteger(Number(match[1]))) return line;
      this.values[source] = Number(match[1]);
      return JSON.stringify({ ...event, content: `memory_kb:${this.values.legacy + this.values.polling}` });
    } catch { return line; }
  }
}
