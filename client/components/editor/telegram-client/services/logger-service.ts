/**
 * @fileoverview Сервис логирования
 *
 * Централизованное логирование с уровнями и поддержкой транспортов.
 *
 * @module LoggerService
 */

/** Уровень логирования */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Транспорт для логирования
 *
 * @example
 * ```typescript
 * const serverTransport: LoggerTransport = {
 *   log: (level, message, data) => fetch('/api/log', { method: 'POST', body: { level, message, data } })
 * };
 * ```
 */
export interface LoggerTransport {
  /**
   * Метод отправки лога
   *
   * @param {LogLevel} level - Уровень лога
   * @param {string} message - Сообщение
   * @param {unknown} [data] - Дополнительные данные
   */
  log(level: LogLevel, message: string, data?: unknown): void;
}

/** Опции логгера */
export interface LoggerOptions {
  /** Префикс для логов */
  prefix?: string;
  /** Минимальный уровень логирования */
  minLevel?: LogLevel;
  /** Транспорты для отправки логов */
  transports?: LoggerTransport[];
}

/**
 * Сервис логирования с уровнями и транспортами
 *
 * @example
 * ```typescript
 * const logger = createLogger({ prefix: '[MyModule]' });
 * logger.info('Сообщение', { data: 123 });
 * ```
 */
export class LoggerService {
  private prefix: string;
  private minLevel: LogLevel;
  private transports: LoggerTransport[];
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ?? '[App]';
    this.minLevel = options.minLevel ?? 'info';
    this.transports = options.transports ?? [];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.prefix} [${level.toUpperCase()}] ${timestamp}: ${message}`;
  }

  private logToTransports(level: LogLevel, message: string, data?: unknown) {
    this.transports.forEach(transport => transport.log(level, message, data));
  }

  debug(message: string, ...data: unknown[]): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      console.debug(formatted, ...data);
      this.logToTransports('debug', formatted, data);
    }
  }

  info(message: string, ...data: unknown[]): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      console.info(formatted, ...data);
      this.logToTransports('info', formatted, data);
    }
  }

  warn(message: string, ...data: unknown[]): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      console.warn(formatted, ...data);
      this.logToTransports('warn', formatted, data);
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message);
      if (error instanceof Error) {
        console.error(formatted, {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        this.logToTransports('error', formatted, { name: error.name, message: error.message, stack: error.stack });
      } else {
        console.error(formatted, error);
        this.logToTransports('error', formatted, error);
      }
    }
  }

  /**
   * Добавить транспорт
   *
   * @param {LoggerTransport} transport - Транспорт для добавления
   */
  addTransport(transport: LoggerTransport): void {
    this.transports.push(transport);
  }

  /**
   * Удалить транспорт
   *
   * @param {LoggerTransport} transport - Транспорт для удаления
   */
  removeTransport(transport: LoggerTransport): void {
    this.transports = this.transports.filter(t => t !== transport);
  }
}

/**
 * Создать экземпляр логгера
 *
 * @param {LoggerOptions} options - Опции логгера
 * @returns {LoggerService} Экземпляр логгера
 */
export function createLogger(options: LoggerOptions = {}): LoggerService {
  return new LoggerService(options);
}
