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
  /** Незавершённая строка с прошлого куска */
  private tail = "";

  /**
   * Добавляет кусок текста
   * @param chunk - Очередной кусок вывода
   * @returns Завершённые непустые строки
   */
  push(chunk: string): string[] {
    const lines = (this.tail + chunk).split("\n");
    this.tail = lines.pop() ?? "";
    return lines.filter((line) => line.trim() !== "");
  }
}
