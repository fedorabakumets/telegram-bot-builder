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

  /**
   * Запускает процесс воркера
   * @param launch - Команда, аргументы и окружение
   */
  constructor(launch: LocalWorkerSpawn) {
    super();
    this.child = spawn(launch.command, launch.args, { stdio: ["pipe", "pipe", "pipe"], env: launch.env });
    const splitter = new LineSplitter();
    this.child.stdout?.on("data", (chunk: Buffer) => {
      for (const line of splitter.push(chunk.toString("utf-8"))) this.emit("line", line);
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

  /**
   * Пишет строку в stdin воркера
   * @param line - Строка JSON без перевода строки
   * @returns false, если stdin недоступен
   */
  send(line: string): boolean {
    if (!this.child.stdin) return false;
    try {
      this.child.stdin.write(line + "\n", "utf-8");
      return true;
    } catch {
      return false;
    }
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
