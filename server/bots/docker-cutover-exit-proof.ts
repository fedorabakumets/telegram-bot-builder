/** @fileoverview Подтверждает остановку контейнера у Docker, а не выход присоединённого CLI. */
import { execFile } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';

const execute = promisify(execFile);

/**
 * Запускает команду ограниченного времени от имени первоначального Docker CLI.
 * @param args - Аргументы Docker.
 * @param env - Контекст и окружение, использованные для запуска контейнера.
 * @returns Вывод успешной команды.
 */
async function runDocker(args: string[], env: NodeJS.ProcessEnv): Promise<string> {
  return (await execute('docker', args, { env, timeout: 2_000, maxBuffer: 4096 })).stdout.trim();
}

/** Сохраняет точный ID контейнера даже после выхода Docker CLI. */
export class DockerCutoverExitProof {
  /** Идентификатор, записанный Docker при запуске. */
  private id?: string;

  /**
   * Привязывает подтверждение к одному экземпляру контейнера.
   * @param cidFile - Уникальный файл идентификатора процесса.
   * @param env - Окружение Docker CLI.
   * @param run - Исполняет команды Docker; заменяется в тестах.
   */
  constructor(private readonly cidFile: string, private readonly env: NodeJS.ProcessEnv,
    private readonly run: typeof runDocker = runDocker) {}

  /** Загружает полный ID, отказываясь использовать изменяемое имя контейнера. */
  private captureId(): string | undefined {
    if (this.id) return this.id;
    try {
      const value = readFileSync(this.cidFile, 'utf8').trim();
      if (/^[a-f0-9]{64}$/.test(value)) this.id = value;
    } catch { /* Наличие контейнера не подтверждено. */ }
    return this.id;
  }

  /** Запоминает идентификатор перед удалением временного файла. */
  onCliClose(): void {
    this.captureId();
    try { rmSync(this.cidFile, { force: true }); } catch { /* Файл не содержит секретов. */ }
  }

  /**
   * Запускает штатную остановку, затем при необходимости убивает именно контейнер.
   * @param requestShutdown - Отправляет запрос завершения Python.
   * @param timeoutMs - Бюджет одной фазы, до и после принудительной остановки.
   * @returns Подтверждение от Docker, что контейнер завершён или удалён.
   */
  async confirm(requestShutdown: () => boolean, timeoutMs: number): Promise<boolean> {
    const id = this.captureId();
    if (!id) return false;
    const started = Date.now();
    const forceAfter = requestShutdown() ? started + timeoutMs : started;
    let forced = false;
    while (Date.now() < started + 2 * timeoutMs) {
      try {
        const state = (await this.run(
          ['container', 'ls', '--all', '--no-trunc', '--filter', `id=${id}`, '--format', '{{.ID}}\t{{.State}}'],
          this.env,
        )).trim();
        if (state === '' || state === `${id}\texited` || state === `${id}\tdead`) return true;
      } catch { /* Неудачный запрос состояния ничего не доказывает. */ }
      if (!forced && Date.now() >= forceAfter) {
        forced = true;
        try { await this.run(['container', 'kill', id], this.env); } catch { /* Повторно сверяем состояние. */ }
      }
      await sleep(Math.min(100, Math.max(1, timeoutMs)));
    }
    return false;
  }
}
