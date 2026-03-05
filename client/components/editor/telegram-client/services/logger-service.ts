/**
 * @fileoverview Сервис логирования
 *
 * Централизованное логирование с уровнями.
 *
 * @module LoggerService
 */

/** Уровень логирования */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Опции логгера */
export interface LoggerOptions {
  /** Префикс для логов */
  prefix?: string;
  /** Минимальный уровень логирования */
  minLevel?: LogLevel;
}

/** Сервис логирования */
export class LoggerService {
  private prefix: string;
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ?? '[App]';
    this.minLevel = options.minLevel ?? 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.prefix} [${level.toUpperCase()}] ${timestamp}: ${message}`;
  }

  debug(message: string, ...data: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...data);
    }
  }

  info(message: string, ...data: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...data);
    }
  }

  warn(message: string, ...data: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...data);
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('error', message);
      if (error instanceof Error) {
        console.error(formattedMessage, {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error(formattedMessage, error);
      }
    }
  }
}

/** Создать экземпляр логгера */
export function createLogger(options: LoggerOptions = {}): LoggerService {
  return new LoggerService(options);
}
