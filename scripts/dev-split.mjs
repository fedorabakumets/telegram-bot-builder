/**
 * @fileoverview Раздельный запуск разработки с общим завершением только собственных процессов.
 */
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { config } from 'dotenv';

/** Корень приложения не зависит от каталога вызова команды. */
const root = fileURLToPath(new URL('../', import.meta.url));
config({ path: resolve(root, '.env'), quiet: true });
/** Дочерние процессы запускаются напрямую, без оболочки npm. */
const children = new Set();
let stopping = false;
/** Останавливает собственную группу процессов, включая дочерний процесс tsx watch. */
function stopChild(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], () => {});
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
}
/** Завершает оба сервиса при сигнале, ошибке или выходе одного сервиса. */
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) stopChild(child);
  const timer = setTimeout(() => {
    for (const child of children) {
      if (process.platform !== 'win32' && child.pid) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      }
    }
    process.exit(code);
  }, 5000);
  timer.unref();
}
/** Запускает один сервис с изолированными параметрами окружения. */
function launch(args, env) {
  const child = spawn(process.execPath, args, {
    cwd: root, stdio: 'inherit', detached: process.platform !== 'win32',
    env: { ...process.env, ...env },
  });
  children.add(child);
  child.on('error', () => stop(1));
  child.on('exit', (code) => {
    if (!stopping) stop(code || 1);
    children.delete(child);
  });
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
/** IPC ��������� �������� �� Windows ��������� ������� ���������� ������ TerminateProcess. */
process.on('message', (message) => {
  if (message?.type === 'shutdown') {
    stop(0);
    if (process.connected) process.disconnect();
  }
});
const backendPort = process.env.BACKEND_PORT || process.env.PORT || '5000';
const frontendPort = process.env.FRONTEND_PORT || '5173';
if (backendPort === frontendPort) throw new Error('Порты frontend и backend должны отличаться');
launch(['node_modules/tsx/dist/cli.mjs', 'watch', '--tsconfig', 'tsconfig.node.json', 'server/index.ts'], {
  NODE_ENV: 'development', APP_MODE: 'backend', PORT: backendPort,
});
launch(['node_modules/vite/bin/vite.js', '--config', 'vite.config.ts'], {
  NODE_ENV: 'development', SPLIT_FRONTEND: '1', FRONTEND_PORT: frontendPort,
  BACKEND_URL: process.env.BACKEND_URL || `http://127.0.0.1:${backendPort}`,
});
