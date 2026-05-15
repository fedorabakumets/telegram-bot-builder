/**
 * @fileoverview Менеджер воркеров ботов — управляет Python worker процессами
 * Модель: 1 проект = 1 воркер = N ботов внутри одного asyncio event loop
 * @module server/bots/botWorkerManager
 */

import { spawn, ChildProcess } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EventEmitter } from "node:events";

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

  /** Путь к Python worker скрипту */
  private workerScript: string;

  /** Путь к Python интерпретатору */
  private pythonPath: string;

  constructor() {
    super();
    this.workerScript = join(__dirname, "..", "python", "worker.py");
    this.pythonPath =
      process.platform === "win32"
        ? "C:\\Users\\1\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"
        : "python3";
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
      const workerProcess = spawn(this.pythonPath, ["-u", this.workerScript], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          PROJECT_ID: projectId.toString(),
        },
      });

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
          reject(new Error(`Воркер проекта ${projectId} не запустился за 10 секунд`));
        }
      }, 10000);

      // Парсим stdout (JSON протокол)
      let buffer = "";
      workerProcess.stdout?.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf-8");
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
            // Не JSON — пробрасываем как есть
            this.emit("raw-output", projectId, line);
          }
        }
      });

      // stderr воркера — системные ошибки
      workerProcess.stderr?.on("data", (chunk: Buffer) => {
        const content = chunk.toString("utf-8").trim();
        if (content) {
          this.emit("worker-error", projectId, content);
        }
      });

      // Процесс завершился
      workerProcess.on("exit", (code, signal) => {
        clearTimeout(timeout);
        const wasReady = worker.status === "ready";
        worker.status = "stopped";

        // Уведомляем о завершении каждого бота
        for (const tokenId of worker.activeBots) {
          this.emit("bot-exited", projectId, tokenId, code);
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
    if (msg.token_id !== undefined) {
      this.emit("bot-log", projectId, msg.token_id, msg.type, msg.content || "");
    }
  }

  /**
   * Обрабатывает системные сообщения воркера
   * @param projectId - ID проекта
   * @param content - Содержимое системного сообщения
   */
  private handleSystemMessage(projectId: number, content: string): void {
    if (content.startsWith("bot_exited:") || content.startsWith("bot_stopped:")) {
      const parts = content.split(":");
      const tokenId = parseInt(parts[1]);
      const status = parts[2] || "stopped";

      const worker = this.workers.get(projectId);
      if (worker) {
        worker.activeBots.delete(tokenId);
      }

      this.emit("bot-exited", projectId, tokenId, status);
    } else if (content === "stdin_closed" || content === "worker_exited") {
      // Воркер завершается
    } else if (content === "shutting_down") {
      // Воркер начал shutdown
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
   * Запускает бота в воркере проекта
   * @param projectId - ID проекта
   * @param token - Токен бота
   * @param tokenId - ID токена
   * @param botFile - Путь к сгенерированному bot.py
   */
  async startBot(projectId: number, token: string, tokenId: number, botFile: string): Promise<void> {
    const worker = await this.getOrCreateWorker(projectId);

    this.sendCommand(projectId, {
      cmd: "start_bot",
      token,
      token_id: tokenId,
      bot_file: botFile,
    });

    worker.activeBots.add(tokenId);
  }

  /**
   * Останавливает бота в воркере
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   */
  async stopBot(projectId: number, tokenId: number): Promise<void> {
    const worker = this.workers.get(projectId);
    if (!worker) return;

    this.sendCommand(projectId, {
      cmd: "stop_bot",
      token_id: tokenId,
    });

    worker.activeBots.delete(tokenId);

    // Если последний бот — убиваем воркер
    if (worker.activeBots.size === 0) {
      await this.killWorker(projectId);
    }
  }

  /**
   * Убивает воркер проекта
   * @param projectId - ID проекта
   */
  async killWorker(projectId: number): Promise<void> {
    const worker = this.workers.get(projectId);
    if (!worker) return;

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
   * Возвращает общую статистику по всем воркерам
   */
  getStats(): { workers: number; totalBots: number } {
    let totalBots = 0;
    for (const worker of this.workers.values()) {
      totalBots += worker.activeBots.size;
    }
    return { workers: this.workers.size, totalBots };
  }
}

/** Синглтон менеджера воркеров */
export const workerManager = new BotWorkerManager();
