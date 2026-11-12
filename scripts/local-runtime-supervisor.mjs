/** @fileoverview Локальный надзор за исполнителем: восстановление после потери аренды без отключения защиты. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Корень приложения и дочерний процесс принадлежат только этому запуску. */
const root = fileURLToPath(new URL('../', import.meta.url));
let child;
let stopping = false;
let retry;

/** Запускает исполнитель заново; повторный захват аренды выполняет сам исполнитель. */
function launch() {
  if (stopping) return;
  console.log(`${new Date().toISOString()} Запуск локального исполнителя`);
  child = spawn(process.execPath, [resolve(root, 'node_modules/tsx/dist/cli.mjs'),
    '--tsconfig', resolve(root, 'tsconfig.node.json'), resolve(root, 'server/runner/index.ts')], {
    cwd: root, stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    env: { ...process.env, RUNNER_REQUIRE_FENCE: 'true' },
    windowsHide: true,
  });
  child.on('error', error => console.error('Ошибка запуска исполнителя:', error.message));
  child.once('exit', (code, signal) => {
    console.log(`${new Date().toISOString()} Исполнитель завершился: ${code ?? signal}`);
    if (!stopping) retry = setTimeout(launch, 2000);
  });
}

/** Передаёт явную остановку дочернему процессу и запрещает его повторный запуск. */
function stop() {
  stopping = true;
  clearTimeout(retry);
  if (child?.connected) child.send({ type: 'shutdown' });
  else child?.kill('SIGTERM');
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
launch();
