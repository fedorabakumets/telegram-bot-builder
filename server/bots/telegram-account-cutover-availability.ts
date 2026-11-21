/** @fileoverview Проверка конфигурации среды для переноса с доказанной остановкой воркера. */
import { runtimeEnv } from '../services/runtime-overlay';
import { isWorkerPoolEnabled } from './isWorkerPoolEnabled';

/** Причина, по которой перенос недоступен. */
export type TelegramCutoverAvailabilityReason = 'disabled' | 'unsupported-runtime' | 'broker-unconfigured' | 'worker-unavailable';

/**
 * Проверяет конфигурацию, прежде чем запрашивать доказательство остановки конкретного воркера.
 * @param env - Окружение процесса.
 * @returns Причина отказа или отсутствие ограничений конфигурации.
 */
export function telegramCutoverConfigurationReason(env: NodeJS.ProcessEnv = process.env): TelegramCutoverAvailabilityReason | null {
  if (env.PROJECT_TELEGRAM_ACCOUNT_CUTOVER_ENABLED !== '1') return 'disabled';
  const workerRuntime = runtimeEnv('WORKER_RUNTIME', env)?.toLowerCase() ?? 'process';
  const grouping = runtimeEnv('WORKER_GROUPING', env)?.toLowerCase() ?? 'project';
  const serverMode = env.BOT_RUNTIME_MODE || 'combined';
  /** Раздельный режим обязан проверять версии команд перед началом запуска у исполнителя. */
  const supported = workerRuntime === 'remote'
    ? ['api', 'combined'].includes(serverMode) && !!runtimeEnv('REDIS_URL', env)
    : serverMode === 'combined' && ['process', 'docker'].includes(workerRuntime);
  if (!supported || !isWorkerPoolEnabled(env) || !!runtimeEnv('WORKER_RAILWAY_PROJECTS', env)
    || !['project', 'owner', 'shared'].includes(grouping)) return 'unsupported-runtime';
  let broker: URL;
  try {
    broker = new URL(env.TELETHON_BROKER_URL?.trim() ?? '');
  } catch {
    return 'broker-unconfigured';
  }
  if (!['http:', 'https:'].includes(broker.protocol) || broker.username || broker.password
    || Buffer.byteLength(env.TELETHON_BROKER_SECRET?.trim() ?? '') < 32) return 'broker-unconfigured';
  return null;
}

/**
 * Проверяет, может ли среда предоставить доказательство остановки.
 * @param env - Окружение процесса.
 * @returns Годится ли конфигурация для проверки выбранной группы.
 */
export function isTelegramAccountCutoverAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
  return telegramCutoverConfigurationReason(env) === null;
}
