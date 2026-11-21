/** @fileoverview План локального запуска четырёх сервисов без побочных действий при импорте. */
import { join } from 'node:path';

/** Проверяет порт до запуска любого процесса. */
function port(value, fallback) {
  const result = value?.trim() || fallback;
  if (!/^\d+$/.test(result) || Number(result) < 1 || Number(result) > 65535) {
    throw new Error('Порт разработки должен быть числом от 1 до 65535');
  }
  return result;
}

/**
 * Формирует согласованное окружение API, исполнителя, интерфейса и брокера.
 * @param env - Исходное окружение разработки.
 * @param root - Абсолютный корень репозитория.
 * @returns План процессов, который сам ничего не запускает.
 */
export function createDevServicePlan(env, root) {
  const backendPort = port(env.BACKEND_PORT, '5001');
  const frontendPort = port(env.FRONTEND_PORT, '5000');
  const brokerUrl = new URL(env.TELETHON_BROKER_URL?.trim() || 'http://127.0.0.1:8765');
  if (brokerUrl.protocol !== 'http:' || brokerUrl.hostname !== '127.0.0.1'
      || brokerUrl.username || brokerUrl.password || brokerUrl.pathname !== '/') {
    throw new Error('Локальному брокеру нужен адрес http://127.0.0.1:<порт>');
  }
  const brokerPort = port(brokerUrl.port, '80');
  if (new Set([backendPort, frontendPort, brokerPort]).size !== 3) {
    throw new Error('Порты frontend, API и брокера должны отличаться');
  }
  const runnerId = env.WORKER_RUNNER_ID?.trim() || env.RUNNER_ID?.trim() || 'default';
  const python = env.RUNNER_PYTHON?.trim() || env.PYTHON_PATH?.trim()
    || (process.platform === 'win32' ? 'python' : 'python3');
  const shared = {
    NODE_ENV: 'development', WORKER_RUNNER_ID: runnerId, RUNNER_ID: runnerId,
    PROJECT_TELEGRAM_API_BASE: `http://127.0.0.1:${backendPort}`,
    TELETHON_BROKER_URL: brokerUrl.origin,
    TELETHON_BROKER_HOST: '127.0.0.1', TELETHON_BROKER_PORT: brokerPort,
    TELETHON_BROKER_LOCK_FILE: env.TELETHON_BROKER_LOCK_FILE?.trim()
      || join(root, '.local', 'telethon-broker.lock'),
  };
  /** Без watch авария API или runtime видна управляющей группе, а не скрыта живым наблюдателем. */
  const tsx = ['node_modules/tsx/dist/cli.mjs', '--tsconfig', 'tsconfig.node.json'];
  return [
    { name: 'broker', command: python, args: ['server/python/telethon_account_broker.py'], env: shared },
    { name: 'api', command: process.execPath, args: [...tsx, 'server/index.ts'], env: {
      ...shared, PORT: backendPort, APP_MODE: 'backend', BOT_RUNTIME_MODE: 'api', WORKER_RUNTIME: 'remote',
    } },
    { name: 'runtime', command: process.execPath, args: [...tsx, 'server/runner/index.ts'], env: {
      ...shared, RUNNER_REQUIRE_FENCE: 'true',
    } },
    { name: 'frontend', command: process.execPath, args: ['node_modules/vite/bin/vite.js', '--config', 'vite.config.ts'], env: {
      ...shared, SPLIT_FRONTEND: '1', FRONTEND_PORT: frontendPort,
      BACKEND_URL: `http://127.0.0.1:${backendPort}`,
    } },
  ];
}
