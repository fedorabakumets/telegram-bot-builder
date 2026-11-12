/**
 * @fileoverview Канал до Python-воркера: через что панель отправляет команды и получает ответы.
 * Протокол один (строки JSON), способ доставки разный: дочерний процесс или удалённый исполнитель.
 * @module server/bots/workerChannel
 */

import { EventEmitter } from "node:events";

/**
 * События канала:
 * - "line" (line: string) — строка stdout воркера (без перевода строки);
 * - "stderr" (text: string) — вывод stderr воркера;
 * - "exit" (code: number | null, signal: string | null) — воркер завершился;
 * - "error" (err: Error) — воркер не удалось запустить.
 */
export interface WorkerChannel extends EventEmitter {
  /** PID процесса воркера на этой машине; undefined для удалённого воркера */
  readonly pid: number | undefined;
  /**
   * Отправляет строку в stdin воркера
   * @param line - Строка JSON без перевода строки
   * @returns false, если отправить не удалось
   */
  send(line: string): boolean;
  /** Немедленно завершает воркер */
  kill(): void;
}

/**
 * Делит поток текста на строки, удерживая незавершённый хвост до следующего куска
 */
export class LineSplitter {
  /** Части незавершённой строки без повторного копирования всего хвоста. */
  private fragments: string[] = [];
  /** Размер незавершённой строки в байтах UTF-8. */
  private bytes = 0;

  /** Размер незавершённой строки в UTF-8, а не размер строки в куче JavaScript. */
  get bufferedBytes(): number { return this.bytes; }

  /**
   * Добавляет кусок текста
   * @param chunk - Очередной кусок вывода
   * @returns Завершённые непустые строки
   */
  push(chunk: string): string[] {
    const lines: string[] = [];
    let start = 0;
    for (let end = chunk.indexOf("\n"); end !== -1; end = chunk.indexOf("\n", start)) {
      this.fragments.push(chunk.slice(start, end));
      const line = this.fragments.join("");
      this.fragments = [];
      this.bytes = 0;
      if (line.trim() !== "") lines.push(line);
      start = end + 1;
    }
    const tail = chunk.slice(start);
    if (tail) {
      this.fragments.push(tail);
      this.bytes += Buffer.byteLength(tail);
    }
    return lines;
  }
}
