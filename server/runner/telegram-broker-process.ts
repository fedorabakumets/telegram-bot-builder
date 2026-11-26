/** @fileoverview Один долгоживущий Python-брокер на весь исполнитель в режиме embedded. */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { stopTelegramBrokerProcess } from './telegram-broker-process-stop';
import { telegramBrokerProcessEnv } from './telegram-broker-process-env';
import type { TelegramBrokerProcess, TelegramBrokerProcessOptions } from './telegram-broker-process-types';
export type { TelegramBrokerProcess, TelegramBrokerProcessOptions } from './telegram-broker-process-types';

/**
 * Дожидается реальной готовности брокера до приёма команд ботов исполнителем.
 * @param options - Окружение, интерпретатор и обработчик потери брокера.
 * @returns Идемпотентное закрытие, которое вызывается после остановки потребителей.
 */
export async function startTelegramBrokerProcess(options: TelegramBrokerProcessOptions): Promise<TelegramBrokerProcess> {
  const env = options.env ?? process.env;
  const mode = env.TELETHON_BROKER_MODE?.trim() || 'external';
  if (mode === 'external') return { close: async () => {} };
  if (mode !== 'embedded') throw new Error('TELETHON_BROKER_MODE должен быть external или embedded');
  if (!env.REDIS_URL?.trim() || !env.TELETHON_BROKER_LOCK_FILE?.trim()
    || Buffer.byteLength(env.TELETHON_BROKER_SECRET?.trim() ?? '') < 32) {
    throw new Error('Встроенному брокеру нужны REDIS_URL, TELETHON_BROKER_LOCK_FILE и внутренний секрет от 32 байт');
  }
  if (options.signal?.aborted) throw new Error('Подготовка встроенного брокера отменена');
  const script = env.TELETHON_BROKER_SCRIPT?.trim() || join(dirname(options.workerScript), 'telethon_account_broker.py');
  const child = (options.spawnProcess ?? spawn)(options.pythonPath, ['-u', script], {
    windowsHide: true, stdio: ['pipe', 'pipe', 'inherit'],
    env: telegramBrokerProcessEnv(env),
  });
  let exited = false, terminated = false, closing = false, ready = false, notified = false;
  let finish!: () => void;
  const finished = new Promise<void>(resolve => { finish = resolve; });
  let resolveReady!: () => void, rejectReady!: (error: Error) => void;
  const readiness = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  let closePromise: Promise<void> | undefined;
  /** Запрещает повторный shutdown и объявляет ожидаемым завершение только этого процесса. */
  const close = () => {
    closing = true;
    return closePromise ??= stopTelegramBrokerProcess(child, finished, () => exited, options);
  };
  /** Не перезапускает брокер с той же сессией после неопределённого отказа. */
  const failed = (error: Error) => {
    if (!ready) rejectReady(error);
    else if (!closing && !notified) { notified = true; options.onUnexpectedExit(error); }
  };
  child.stdin?.on('error', () => { /** Завершение дочернего процесса подтверждает обработчик exit. */ });
  child.once('error', () => {
    terminated = true;
    failed(new Error('Не удалось запустить встроенный брокер Telegram'));
  });
  child.once('exit', (code, signal) => {
    terminated = true;
    failed(new Error(`Встроенный брокер Telegram завершился: ${code ?? signal ?? 'неизвестно'}`));
  });
  /** Закрытие stdout подтверждает выход также дочернего Python за Windows venv-launcher. */
  child.once('close', () => { exited = true; finish(); });
  let pendingLine = '';
  child.stdout?.on('data', chunk => {
    pendingLine = (pendingLine + chunk.toString()).slice(-16_384);
    const lines = pendingLine.split('\n');
    pendingLine = lines.pop() ?? '';
    if (!terminated && !closing && lines.some(line => line.trim() === 'TELETHON_BROKER_READY')) {
      ready = true; resolveReady();
    }
  });
  /** Abort относится только к подготовке; последующая остановка должна сначала закрыть потребителей. */
  const abort = () => rejectReady(new Error('Подготовка встроенного брокера отменена'));
  options.signal?.addEventListener('abort', abort, { once: true });
  const startupTimer = setTimeout(() => rejectReady(new Error('Встроенный брокер не подтвердил готовность за отведённое время')),
    options.startupTimeoutMs ?? 30_000);
  try {
    await readiness;
    if (terminated || options.signal?.aborted) throw new Error('Встроенный брокер потерян во время подготовки');
    return { close };
  } catch (error) {
    await close();
    throw error;
  } finally {
    clearTimeout(startupTimer);
    options.signal?.removeEventListener('abort', abort);
  }
}
