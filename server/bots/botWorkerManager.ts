/**
 * @fileoverview Менеджер воркеров ботов — управляет Python worker процессами
 * Модель: 1 проект = 1 воркер = N ботов внутри одного asyncio event loop
 * @module server/bots/botWorkerManager
 */

import { spawn, ChildProcess, execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EventEmitter } from "node:events";
import { parseWorkerSystemMessage } from "./parseWorkerSystemMessage";
import {
  waitForWorkerBotStop,
  WORKER_STOP_CONFIRM_TIMEOUT_MS,
} from "./waitForWorkerBotStop";
import {
  waitForWorkerBotStart,
  WORKER_START_CONFIRM_TIMEOUT_MS,
} from "./waitForWorkerBotStart";
import { formatBotRuntimeErrorShort } from "./formatBotRuntimeError";

/** Задержка перед killWorker когда activeBots пуст (мс) */
const WORKER_DRAIN_MS = 2_000;

/** Эквивалент __dirname для ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Сообщение от воркера (stdout JSON) */
interface WorkerMessage {
  /** ID токена бота (для маршрутизации логов) */
  token_id?: number;
  /** Тип сообщения: stdout, stderr, system, status */
  type: string;
  /** Содержимое сообщения */
  content?: string;
  /** Данные статуса (для type=status) */
  data?: any;
}

/** Команда для отправки воркеру через stdin */
interface WorkerCommand {
  /** Тип команды */
  cmd: "start_bot" | "stop_bot" | "status" | "shutdown";
  /** Токен бота */
  token?: string;
  /** ID токена */
  token_id?: number;
  /** Путь к файлу бота */
  bot_file?: string;
}

/** Контекст воркера проекта */
interface ProjectWorker {
  /** ID проекта */
  projectId: number;
  /** Python процесс воркера */
  process: ChildProcess;
  /** Множество активных tokenId внутри воркера */
  activeBots: Set<number>;
  /** Статус воркера */
  status: "starting" | "ready" | "error" | "stopped";
  /** Время создания */
  createdAt: Date;
}

/**
 * Менеджер воркеров — управляет жизненным циклом Python worker процессов.
 * Один воркер на проект, все боты проекта работают внутри одного процесса.
 */
class BotWorkerManager extends EventEmitter {
  /** Карта воркеров: projectId → ProjectWorker */
  private workers = new Map<number, ProjectWorker>();

  /** Очередь lifecycle per projectId:tokenId */
  private tokenLocks = new Map<string, Promise<unknown>>();

  /** Отложенный killWorker при пустом activeBots */
  private drainTimers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Путь к Python worker скрипту */
  private workerScript: string;

  /** Путь к Python интерпретатору */
  private pythonPath: string;

  /** Последняя stderr-ошибка бота для errorMessage в БД */
  private lastBotErrors = new Map<number, string>();

  /** projectId, для которых killWorker/shutdownAll намеренно гасят воркер */
  private intentionalKills = new Set<number>();

  /** Подробные логи stdout воркера (JSON) */
  private workerVerbose = process.env.WORKER_POOL_VERBOSE === "true";

  constructor() {
    super();
    this.workerScript = join(__dirname, "..", "python", "worker.py");
    this.pythonPath =
      process.env.PYTHON_PATH ||
      (process.platform === "win32" ? "python" : "python3");
  }

  /**
   * Сериализует start/stop одного токена.
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @param fn - Операция
   */
  private async withTokenLock<T>(
    projectId: number,
    tokenId: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = `${projectId}:${tokenId}`;
    const prev = this.tokenLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const chained = prev.then(() => gate);
    this.tokenLocks.set(key, chained);
    await prev.catch(() => undefined);
    try {
      return await fn();
    } finally {
      release();
      if (this.tokenLocks.get(key) === chained) {
        this.tokenLocks.delete(key);
      }
    }
  }

  /** Отменяет отложенный kill воркера */
  private cancelWorkerDrain(projectId: number): void {
    const t = this.drainTimers.get(projectId);
    if (t) {
      clearTimeout(t);
      this.drainTimers.delete(projectId);
    }
  }

  /** Планирует killWorker через WORKER_DRAIN_MS если activeBots пуст */
  private scheduleWorkerDrain(projectId: number): void {
    this.cancelWorkerDrain(projectId);
    const timer = setTimeout(() => {
      this.drainTimers.delete(projectId);
      const w = this.workers.get(projectId);
      if (w && w.activeBots.size === 0 && w.status === "ready") {
        void this.killWorker(projectId);
      }
    }, WORKER_DRAIN_MS);
    this.drainTimers.set(projectId, timer);
  }

  /**
   * Получает или создаёт воркер для проекта
   * @param projectId - ID проекта
   * @returns Промис с воркером в состоянии ready
   */
  async getOrCreateWorker(projectId: number): Promise<ProjectWorker> {
    const existing = this.workers.get(projectId);
    if (existing && existing.status === "ready") {
      return existing;
    }

    // Если воркер в процессе запуска — ждём
    if (existing && existing.status === "starting") {
      return this.waitForReady(projectId);
    }

    // Создаём новый воркер
    return this.createWorker(projectId);
  }

  /**
   * Создаёт новый Python worker процесс для проекта
   * @param projectId - ID проекта
   * @returns Промис с воркером в состоянии ready
   */
  private createWorker(projectId: number): Promise<ProjectWorker> {
    return new Promise((resolve, reject) => {
      console.log(`🏭 [WorkerPool] Создаём воркер для проекта ${projectId}`);
      console.log(`🏭 [WorkerPool] Python: ${this.pythonPath}`);
      console.log(`🏭 [WorkerPool] Script: ${this.workerScript}`);

      const workerProcess = spawn(this.pythonPath, ["-u", this.workerScript], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          PROJECT_ID: projectId.toString(),
        },
      });

      console.log(`🏭 [WorkerPool] Процесс воркера создан, PID: ${workerProcess.pid}`);

      const worker: ProjectWorker = {
        projectId,
        process: workerProcess,
        activeBots: new Set(),
        status: "starting",
        createdAt: new Date(),
      };

      this.workers.set(projectId, worker);

      // Таймаут на запуск
      const timeout = setTimeout(() => {
        if (worker.status === "starting") {
          worker.status = "error";
          console.error(`🏭 [WorkerPool] Таймаут: воркер проекта ${projectId} не запустился за 10 секунд`);
          reject(new Error(`Воркер проекта ${projectId} не запустился за 10 секунд`));
        }
      }, 10000);

      // Парсим stdout (JSON протокол)
      let buffer = "";
      workerProcess.stdout?.on("data", (chunk: Buffer) => {
        const raw = chunk.toString("utf-8");
        if (this.workerVerbose) {
          console.log(`🏭 [WorkerPool:${projectId}] stdout: ${raw.trim().substring(0, 200)}`);
        }
        buffer += raw;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: WorkerMessage = JSON.parse(line);
            this.handleWorkerMessage(projectId, msg);

            // Воркер готов
            if (msg.type === "system" && msg.content === "worker_ready") {
              clearTimeout(timeout);
              worker.status = "ready";
              this.emit("worker-ready", projectId);
              resolve(worker);
            }
          } catch {
            // Не JSON — не фан-аутим на все боты (ломало изоляцию логов)
            console.warn(
              `[WorkerPool:${projectId}] Raw non-JSON stdout (игнор fanout): "${line.slice(0, 80)}"`,
            );
          }
        }
      });

      // stderr воркера — системные ошибки
      workerProcess.stderr?.on("data", (chunk: Buffer) => {
        const content = chunk.toString("utf-8").trim();
        if (content) {
          console.error(`🏭 [WorkerPool:${projectId}] stderr: ${content.substring(0, 300)}`);
          this.emit("worker-error", projectId, content);
        }
      });

      // Процесс завершился
      workerProcess.on("exit", (code, signal) => {
        console.log(`🏭 [WorkerPool:${projectId}] Воркер завершился: code=${code}, signal=${signal}`);
        clearTimeout(timeout);
        const wasReady = worker.status === "ready";
        worker.status = "stopped";

        const intentional = this.intentionalKills.has(projectId);
        this.intentionalKills.delete(projectId);
        // Неожиданная смерть процесса (OOM/cgroup/kill -9), не кнопка Стоп и не shutdown
        const unexpected = !intentional;

        // Уведомляем о завершении каждого бота
        for (const tokenId of worker.activeBots) {
          this.emit("bot-exited", projectId, tokenId, code, undefined, unexpected);
        }
        worker.activeBots.clear();
        this.workers.delete(projectId);

        this.emit("worker-exited", projectId, code, signal);

        if (!wasReady && worker.status !== "ready") {
          reject(new Error(`Воркер проекта ${projectId} завершился с кодом ${code}`));
        }
      });

      workerProcess.on("error", (err) => {
        clearTimeout(timeout);
        worker.status = "error";
        this.workers.delete(projectId);
        reject(err);
      });
    });
  }

  /**
   * Ожидает готовности воркера который уже запускается
   * @param projectId - ID проекта
   */
  private waitForReady(projectId: number): Promise<ProjectWorker> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Таймаут ожидания воркера проекта ${projectId}`));
      }, 10000);

      const handler = (readyProjectId: number) => {
        if (readyProjectId === projectId) {
          clearTimeout(timeout);
          this.removeListener("worker-ready", handler);
          const worker = this.workers.get(projectId);
          if (worker) resolve(worker);
          else reject(new Error("Воркер не найден после ready"));
        }
      };

      this.on("worker-ready", handler);
    });
  }

  /**
   * Обрабатывает JSON-сообщение от воркера
   * @param projectId - ID проекта
   * @param msg - Распарсенное сообщение
   */
  private handleWorkerMessage(projectId: number, msg: WorkerMessage): void {
    if (msg.type === "system") {
      this.handleSystemMessage(projectId, msg.content || "");
      return;
    }

    if (msg.type === "status") {
      this.emit("worker-status", projectId, msg.data);
      return;
    }

    // Логи бота — маршрутизируем по token_id
    if (msg.token_id !== undefined && msg.token_id > 0) {
      const content = msg.content || "";
      if (msg.type === "stderr") {
        this.lastBotErrors.set(msg.token_id, content);
        const preview = content.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "").split("\n")[0];
        console.error(`🏭 [WorkerPool:${projectId}] бот ${msg.token_id} ошибка: ${preview}`);
      }
      this.emit("bot-log", projectId, msg.token_id, msg.type, content);
    } else if (msg.token_id !== undefined && msg.token_id === 0) {
      // Системные asyncio-логи без контекста бота — не маршрутизируем
    } else {
      console.warn(`[WorkerPool] ⚠️ Сообщение без token_id от проекта ${projectId}: type=${msg.type}, content="${(msg.content || "").slice(0, 60)}"`);
    }
  }

  /**
   * Обрабатывает системные сообщения воркера
   * @param projectId - ID проекта
   * @param content - Содержимое системного сообщения
   */
  private handleSystemMessage(projectId: number, content: string): void {
    const ev = parseWorkerSystemMessage(content);
    const worker = this.workers.get(projectId);

    if (ev.kind === "bot_started" && ev.tokenId !== undefined) {
      this.lastBotErrors.delete(ev.tokenId);
      worker?.activeBots.add(ev.tokenId);
      console.log(`🏭 [WorkerPool:${projectId}] бот ${ev.tokenId} запущен`);
      this.emit("bot-started", projectId, ev.tokenId);
      return;
    }

    if ((ev.kind === "bot_exited" || ev.kind === "bot_stopped") && ev.tokenId !== undefined) {
      worker?.activeBots.delete(ev.tokenId);
      const status = ev.status || "stopped";
      const runtimeError = this.lastBotErrors.get(ev.tokenId);
      this.lastBotErrors.delete(ev.tokenId);
      if (status === "error") {
        const short = runtimeError
          ? formatBotRuntimeErrorShort(runtimeError)
          : "Бот завершился с ошибкой";
        console.error(`🏭 [WorkerPool:${projectId}] бот ${ev.tokenId} остановлен: ${short}`);
      } else {
        console.log(`🏭 [WorkerPool:${projectId}] бот ${ev.tokenId} остановлен`);
      }
      this.emit("bot-exited", projectId, ev.tokenId, status, runtimeError, false);
      // Drain: не убиваем воркер мгновенно (гонка с restart)
      if (worker && worker.activeBots.size === 0 && worker.status === "ready") {
        this.scheduleWorkerDrain(projectId);
      }
      return;
    }

    if (content === "stdin_closed" || content === "worker_exited" || content === "shutting_down") {
      return;
    }
  }

  /**
   * Отправляет команду воркеру через stdin
   * @param projectId - ID проекта
   * @param command - Команда для отправки
   */
  sendCommand(projectId: number, command: WorkerCommand): boolean {
    const worker = this.workers.get(projectId);
    if (!worker || worker.status !== "ready") {
      return false;
    }

    const line = JSON.stringify(command) + "\n";
    try {
      worker.process.stdin?.write(line, "utf-8");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Запускает бота в воркере и ждёт bot_started.
   * @param projectId - ID проекта
   * @param token - Токен бота
   * @param tokenId - ID токена
   * @param botFile - Путь к сгенерированному bot.py
   */
  async startBot(projectId: number, token: string, tokenId: number, botFile: string, webhook?: { webhookUrl: string; webhookPort: number }): Promise<void> {
    return this.withTokenLock(projectId, tokenId, async () => {
      this.cancelWorkerDrain(projectId);
      const worker = await this.getOrCreateWorker(projectId);

      const started = waitForWorkerBotStart(
        this,
        projectId,
        tokenId,
        WORKER_START_CONFIRM_TIMEOUT_MS,
      );

      const sent = this.sendCommand(projectId, {
        cmd: "start_bot",
        token,
        token_id: tokenId,
        bot_file: botFile,
        ...(webhook ? { webhook_url: webhook.webhookUrl, webhook_port: webhook.webhookPort } : {}),
      });
      if (!sent) {
        throw new Error(`Не удалось отправить start_bot project=${projectId} token=${tokenId}`);
      }

      worker.activeBots.add(tokenId);
      const ok = await started;
      if (!ok) {
        // Не killWorker сразу: Python ещё грузит bot.py — стопаем задачу, потом drain
        console.warn(
          `🏭 [WorkerPool] Таймаут bot_started project=${projectId} token=${tokenId} — stop in-flight`,
        );
        const stopWait = waitForWorkerBotStop(
          this,
          projectId,
          tokenId,
          WORKER_STOP_CONFIRM_TIMEOUT_MS,
        );
        this.sendCommand(projectId, { cmd: "stop_bot", token_id: tokenId });
        await stopWait;
        worker.activeBots.delete(tokenId);
        if (worker.activeBots.size === 0) {
          this.scheduleWorkerDrain(projectId);
        }
        throw new Error(`Таймаут bot_started project=${projectId} token=${tokenId}`);
      }
    });
  }

  /**
   * Останавливает бота в воркере и ждёт bot_exited/bot_stopped.
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns true если Python подтвердил выход, false при таймауте
   */
  async stopBot(projectId: number, tokenId: number): Promise<boolean> {
    return this.withTokenLock(projectId, tokenId, async () => {
      const worker = this.workers.get(projectId);
      if (!worker) return true;

      const confirmed = waitForWorkerBotStop(
        this,
        projectId,
        tokenId,
        WORKER_STOP_CONFIRM_TIMEOUT_MS,
      );

      const sent = this.sendCommand(projectId, {
        cmd: "stop_bot",
        token_id: tokenId,
      });
      if (!sent) {
        this.emit("bot-exited", projectId, tokenId, "stopped", undefined, false);
        return true;
      }

      const ok = await confirmed;
      if (!ok) {
        const w = this.workers.get(projectId);
        if (w?.activeBots.has(tokenId)) {
          console.warn(
            `[WorkerPool:${projectId}] stop timeout token=${tokenId} — снимаем из activeBots без fake exit`,
          );
          w.activeBots.delete(tokenId);
          if (w.activeBots.size === 0 && w.status === "ready") {
            this.scheduleWorkerDrain(projectId);
          }
        }
      }
      return ok;
    });
  }

  /**
   * Убивает воркер проекта
   * @param projectId - ID проекта
   */
  async killWorker(projectId: number): Promise<void> {
    this.cancelWorkerDrain(projectId);
    const worker = this.workers.get(projectId);
    if (!worker) return;

    // Чтобы exit-handler не принял наш kill за OOM
    this.intentionalKills.add(projectId);

    // Пытаемся graceful shutdown
    const sent = this.sendCommand(projectId, { cmd: "shutdown" });

    if (sent) {
      // Ждём завершения до 5 секунд
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          try {
            worker.process.kill("SIGKILL");
          } catch { /* уже завершён */ }
          resolve();
        }, 5000);

        worker.process.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    } else {
      try {
        worker.process.kill("SIGKILL");
      } catch { /* уже завершён */ }
    }

    this.workers.delete(projectId);
  }

  /**
   * Останавливает все воркеры (graceful shutdown)
   */
  async shutdownAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const projectId of this.workers.keys()) {
      promises.push(this.killWorker(projectId));
    }
    await Promise.all(promises);
  }

  /**
   * Проверяет, запущен ли бот в воркере
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   */
  isBotRunning(projectId: number, tokenId: number): boolean {
    const worker = this.workers.get(projectId);
    return worker?.activeBots.has(tokenId) ?? false;
  }

  /**
   * Проверяет, есть ли активный воркер для проекта
   * @param projectId - ID проекта
   */
  hasWorker(projectId: number): boolean {
    const worker = this.workers.get(projectId);
    return worker?.status === "ready";
  }

  /**
   * Возвращает количество активных ботов в воркере проекта
   * @param projectId - ID проекта
   */
  getBotsCount(projectId: number): number {
    return this.workers.get(projectId)?.activeBots.size ?? 0;
  }

  /**
   * Возвращает общую статистику по всем воркерам, включая RAM
   */
  getStats(): { workers: number; totalBots: number; totalMemoryMb: number; details: Array<{ projectId: number; botsCount: number; memoryMb: number; pid: number | undefined }> } {
    let totalBots = 0;
    let totalMemoryMb = 0;
    const details: Array<{ projectId: number; botsCount: number; memoryMb: number; pid: number | undefined }> = [];

    for (const worker of this.workers.values()) {
      const botsCount = worker.activeBots.size;
      totalBots += botsCount;

      // Получаем RSS памяти процесса воркера
      let memoryMb = 0;
      if (worker.process.pid) {
        try {
          if (process.platform === "win32") {
            const output = execSync(`tasklist /FI "PID eq ${worker.process.pid}" /FO CSV`, { encoding: "utf8" }).trim();
            // Формат: "python.exe","1492","Console","9","29 916 КБ"
            // Извлекаем все цифры из последнего CSV-поля (память в КБ)
            const lines = output.split("\n").filter(l => l.includes(`"${worker.process.pid}"`));
            if (lines.length > 0) {
              const fields = lines[0].match(/"[^"]*"/g);
              if (fields && fields.length >= 5) {
                const memField = fields[fields.length - 1]; // последнее поле — память
                const digits = memField.replace(/[^\d]/g, ""); // только цифры
                if (digits) {
                  memoryMb = Math.round(parseInt(digits) / 1024);
                }
              }
            }
          } else {
            const output = execSync(`ps -o rss= -p ${worker.process.pid}`, { encoding: "utf8" }).trim();
            memoryMb = Math.round(parseInt(output) / 1024);
          }
        } catch {
          // Процесс мог завершиться
        }
      }

      totalMemoryMb += memoryMb;
      details.push({ projectId: worker.projectId, botsCount, memoryMb, pid: worker.process.pid });
    }

    return { workers: this.workers.size, totalBots, totalMemoryMb, details };
  }
}

/** Синглтон менеджера воркеров */
export const workerManager = new BotWorkerManager();
