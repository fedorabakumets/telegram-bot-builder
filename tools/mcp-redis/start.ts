/**
 * @fileoverview Обёртка для запуска официального Redis MCP с REDIS_URL из .env
 * @module tools/mcp-redis/start
 */

import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Исполняемый Python (можно переопределить через PYTHON в окружении) */
const PYTHON = process.env.PYTHON ?? 'python';

/**
 * Находит redis-mcp-server.exe / redis-mcp-server рядом с Python Scripts
 * @returns Абсолютный путь к CLI или имя команды из PATH
 */
function resolveRedisMcpServer(): string {
  try {
    const scriptsDir = execFileSync(
      PYTHON,
      ['-c', 'import sysconfig; print(sysconfig.get_path("scripts"))'],
      { encoding: 'utf8' },
    ).trim();

    const executable =
      process.platform === 'win32'
        ? path.join(scriptsDir, 'redis-mcp-server.exe')
        : path.join(scriptsDir, 'redis-mcp-server');

    if (existsSync(executable)) {
      return executable;
    }
  } catch {
    // fallback ниже
  }

  return process.platform === 'win32' ? 'redis-mcp-server.exe' : 'redis-mcp-server';
}

/**
 * Запускает официальный redis-mcp-server с URL из REDIS_URL
 * @returns Ничего не возвращает; завершает процесс с кодом дочернего MCP
 */
function main(): void {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    console.error(
      'REDIS_URL не задан. Добавьте его в .env и укажите envFile в .cursor/mcp.json.',
    );
    process.exit(1);
  }

  const serverBin = resolveRedisMcpServer();
  const args = ['--url', redisUrl];

  const child = spawn(serverBin, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: false,
  });

  child.on('error', (error) => {
    console.error(
      `Не удалось запустить redis-mcp-server (${serverBin}). Установите: python -m pip install redis-mcp-server`,
    );
    console.error(error.message);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main();
