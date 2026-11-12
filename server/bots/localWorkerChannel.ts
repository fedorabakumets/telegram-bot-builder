/**
 * @fileoverview Канал до воркера — дочерний процесс на этой машине (python или docker CLI).
 * @module server/bots/localWorkerChannel
 */

import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { LineSplitter, type WorkerChannel } from "./workerChannel";

/** Как запустить процесс воркера */
export interface LocalWorkerSpawn {
  /** Исполняемый файл: python или docker */
  command: string;
  /** Аргументы */
  args: string[];
  /** Окружение процесса */
  env: NodeJS.ProcessEnv;
}

/**
 * Воркер — дочерний процесс; stdout делится на строки JSON.
 */
export class LocalWorkerChannel extends EventEmitter implements WorkerChannel {
  /** Процесс воркера */
  private readonly child: ChildProcess;
  /** Разделитель stdout, доступный для измерения незавершённой строки. */
  private readonly splitter = new LineSplitter();

  /**
   * Запускает процесс воркера
   * @param launch - Команда, аргументы и окружение
   */
  constructor(launch: LocalWorkerSpawn) {
    super();
    this.child = spawn(launch.command, launch.args, { stdio: ["pipe", "pipe", "pipe"], env: launch.env });
    this.child.stdin?.on("error", (error: Error) => this.emit("stderr", `Ошибка ввода воркера: ${error.message}`));
    this.child.stdout?.setEncoding("utf8");
    this.child.stdout?.on("data", (chunk: string) => {
      for (const line of this.splitter.push(chunk)) this.emit("line", line);
    });
    this.child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8").trim();
      if (text) this.emit("stderr", text);
    });
    this.child.on("exit", (code, signal) => this.emit("exit", code, signal));
    this.child.on("error", (err) => this.emit("error", err));
  }

  /** PID процесса воркера */
  get pid(): number | undefined {
    return this.child.pid;
  }

  /** Возвращает длины очередей потоков; эти числа не являются отдельными слагаемыми RSS. */
  memoryCounters() {
    return { stdinWritableBytes: this.child.stdin?.writableLength ?? 0,
      stdoutReadableBytes: this.child.stdout?.readableLength ?? 0,
      stderrReadableBytes: this.child.stderr?.readableLength ?? 0,
      stdoutTailUtf8Bytes: this.splitter.bufferedBytes };
  }

  /**
   * Приостанавливает чтение вывода без отбрасывания строк: давление передаётся процессу через канал ОС.
   * @param paused - Требуется ли остановить чтение до освобождения очереди получателя
   */
  pauseOutput(paused: boolean): void {
    for (const output of [this.child.stdout, this.child.stderr]) {
      if (paused) output?.pause();
      else output?.resume();
    }
  }

  /**
   * Пишет строку в stdin воркера
   * @param line - Строка JSON без перевода строки
   * @returns false, если stdin недоступен
   */
  send(line: string): boolean {
    if (!this.child.stdin || this.child.stdin.destroyed || this.child.stdin.writableEnded) return false;
    try {
      this.child.stdin.write(line + "\n", "utf-8");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Дожидается сброса команды в поток, позволяя вызывающему коду ограничивать очередь через await.
   * @param line - Полная строка команды без завершающего перевода строки
   * @returns Завершение записи; ошибка означает неопределённость доставки, повторять команду автоматически нельзя
   */
  async sendAsync(line: string): Promise<void> {
    const input = this.child.stdin;
    if (!input || input.destroyed || input.writableEnded) throw new Error("Ввод воркера закрыт");
    await new Promise<void>((resolve, reject) => {
      let written = false;
      let drained = false;
      let accepted = false;
      /** Удаляет временные подписки после доставки либо ошибки. */
      const cleanup = () => { input.off("drain", onDrain); input.off("error", onError); input.off("close", onClose); };
      /** Завершает ожидание только после записи и освобождения буфера. */
      const complete = () => { if (written && (accepted || drained)) { cleanup(); resolve(); } };
      /** Отмечает освобождение внутренней очереди потока. */
      const onDrain = () => { drained = true; complete(); };
      /** Останавливает ожидание при ошибке потока. */
      const onError = (error: Error) => { cleanup(); reject(error); };
      /** Не оставляет команду ожидающей drain после закрытия потока. */
      const onClose = () => onError(new Error("Ввод воркера закрыт до завершения записи"));
      input.once("drain", onDrain);
      input.once("error", onError);
      input.once("close", onClose);
      try {
        accepted = input.write(line + "\n", "utf8", (error) => {
          if (error) onError(error);
          else { written = true; complete(); }
        });
      } catch (error) { onError(error instanceof Error ? error : new Error(String(error))); }
    });
  }

  /** Убивает процесс воркера (SIGKILL) */
  kill(): void {
    try {
      this.child.kill("SIGKILL");
    } catch {
      // Процесс уже завершён
    }
  }
}
