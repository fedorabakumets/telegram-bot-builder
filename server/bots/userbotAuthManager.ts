/**
 * @fileoverview Менеджер авторизации Telethon userbot.
 * Запускает Python-скрипт и общается с ним через stdin/stdout JSON-протокол.
 * @module server/bots/userbotAuthManager
 */

import { spawn, ChildProcess } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Активные сессии авторизации (ключ — tokenId) */
const authSessions = new Map<number, ChildProcess>();

/** Ожидающие ответа промисы (ключ — tokenId) */
const pendingResolvers = new Map<number, (value: any) => void>();

/**
 * Получает путь к скрипту авторизации
 * @returns Абсолютный путь к userbotAuth.py
 */
function getAuthScriptPath(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return join(currentDir, 'userbotAuth.py');
}

/**
 * Запускает процесс авторизации для токена
 * @param tokenId - ID токена бота
 * @returns Дочерний процесс
 */
function startAuthProcess(tokenId: number): ChildProcess {
  const existing = authSessions.get(tokenId);
  if (existing && !existing.killed) {
    existing.kill();
  }

  const pythonPath = process.env.PYTHON_PATH ||
    (process.platform === 'win32' ? 'python' : 'python3');

  const proc = spawn(pythonPath, ['-u', getAuthScriptPath()], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';

  proc.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response = JSON.parse(line);
        const resolver = pendingResolvers.get(tokenId);
        if (resolver) {
          pendingResolvers.delete(tokenId);
          resolver(response);
        }
      } catch {
        console.warn(`[UserbotAuth] Не удалось распарсить ответ: ${line}`);
      }
    }
  });

  proc.stderr?.on('data', (chunk: Buffer) => {
    console.warn(`[UserbotAuth stderr] ${chunk.toString()}`);
  });

  proc.on('exit', () => {
    authSessions.delete(tokenId);
    const resolver = pendingResolvers.get(tokenId);
    if (resolver) {
      pendingResolvers.delete(tokenId);
      resolver({ ok: false, error: 'process_exit', message: 'Процесс завершился' });
    }
  });

  authSessions.set(tokenId, proc);
  return proc;
}

/**
 * Отправляет команду процессу авторизации и ждёт ответ
 * @param tokenId - ID токена
 * @param action - Действие (send_code, sign_in, sign_in_2fa, disconnect)
 * @param data - Данные для действия
 * @returns Ответ от Python-скрипта
 */
export async function sendAuthCommand(
  tokenId: number,
  action: string,
  data: Record<string, string> = {},
): Promise<any> {
  let proc = authSessions.get(tokenId);

  if (!proc || proc.killed) {
    if (action === 'disconnect') {
      return { ok: true };
    }
    proc = startAuthProcess(tokenId);
  }

  const message = JSON.stringify({ action, data }) + '\n';

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingResolvers.delete(tokenId);
      resolve({ ok: false, error: 'timeout', message: 'Таймаут ответа (30с)' });
    }, 30000);

    pendingResolvers.set(tokenId, (response) => {
      clearTimeout(timeout);
      resolve(response);
    });

    proc!.stdin?.write(message);
  });
}

/**
 * Завершает сессию авторизации
 * @param tokenId - ID токена
 */
export function killAuthSession(tokenId: number): void {
  const proc = authSessions.get(tokenId);
  if (proc && !proc.killed) {
    proc.kill();
  }
  authSessions.delete(tokenId);
  pendingResolvers.delete(tokenId);
}
