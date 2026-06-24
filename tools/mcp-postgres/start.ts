/**
 * @fileoverview Обёртка для запуска PostgreSQL MCP с DATABASE_URL из .env
 * @module tools/mcp-postgres/start
 */

import { spawn } from 'node:child_process';

/** Путь к npx на Windows */
const NPX_WIN = 'C:\\Program Files\\nodejs\\npx.cmd';

/**
 * Запускает @sarmadparvez/postgresql-mcp с connection string из DATABASE_URL
 * @returns Ничего не возвращает; завершает процесс с кодом дочернего MCP
 */
function main(): void {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    console.error(
      'DATABASE_URL не задан. Добавьте его в .env и укажите envFile в .cursor/mcp.json.',
    );
    process.exit(1);
  }

  const args = ['-y', '@sarmadparvez/postgresql-mcp', databaseUrl];

  const child =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/c', NPX_WIN, ...args], { stdio: 'inherit', cwd: process.cwd() })
      : spawn('npx', args, { stdio: 'inherit', cwd: process.cwd() });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main();
