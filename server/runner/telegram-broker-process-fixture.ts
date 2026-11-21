/** @fileoverview Управляемый дочерний процесс для тестов супервизора без Python и Telegram. */
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ChildProcess, spawn } from 'node:child_process';
import type { TelegramBrokerProcessOptions } from './telegram-broker-process-types';

/** Имитирует только собственный дочерний процесс исполнителя. */
export class FakeTelegramBrokerChild extends EventEmitter {
  /** Канал команды штатного закрытия. */ stdin = new PassThrough();
  /** Канал маркера готовности. */ stdout = new PassThrough();
  /** Полученные сигналы для проверки эскалации. */ signals: string[] = [];
  /** Проверяемая команда stdin. */ input = '';
  /** Завершать ли процесс после штатной команды. */ exitOnShutdown = true;
  /** Сигнал, после которого имитируется завершение. */ exitOnSignal?: string;
  /**
   * Подготавливает синтетические каналы без системных процессов.
   */
  constructor() {
    super();
    this.on('exit', (code, signal) => { queueMicrotask(() => this.emit('close', code, signal)); });
    this.stdin.on('data', chunk => { this.input += chunk.toString(); });
    this.stdin.on('finish', () => { if (this.exitOnShutdown) this.emit('exit', 0, null); });
  }
  /**
   * Запоминает сигнал и при необходимости подтверждает завершение.
   * @param signal - Запрошенный сигнал.
   * @returns Сигнал принят синтетическим процессом.
   */
  kill(signal: string) {
    this.signals.push(signal);
    if (signal === this.exitOnSignal) this.emit('exit', null, signal);
    return true;
  }
}

/**
 * Создаёт параметры и журнал запуска для одного синтетического брокера.
 * @returns Дочерний процесс, параметры и обнаруженные отказы.
 */
export function telegramBrokerFixture() {
  const child = new FakeTelegramBrokerChild();
  const calls: unknown[][] = [], failures: Error[] = [];
  const options: TelegramBrokerProcessOptions = {
    pythonPath: 'synthetic-python', workerScript: '/synthetic/python/worker.py',
    env: { TELETHON_BROKER_MODE: 'embedded', REDIS_URL: 'redis://synthetic.invalid',
      TELETHON_BROKER_SECRET: 'synthetic-internal-secret-at-least-32', TELETHON_BROKER_LOCK_FILE: '/synthetic/broker.lock' },
    onUnexpectedExit: error => { failures.push(error); },
    spawnProcess: ((...args: unknown[]) => { calls.push(args); return child as unknown as ChildProcess; }) as typeof spawn,
    startupTimeoutMs: 100, shutdownTimeoutMs: 2, terminateTimeoutMs: 2, killTimeoutMs: 2,
  };
  return { child, calls, failures, options };
}
