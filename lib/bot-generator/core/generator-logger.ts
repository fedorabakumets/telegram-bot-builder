/**
 * @fileoverview Централизованное логирование генератора ботов
 * 
 * Модуль предоставляет унифицированный интерфейс для логирования
 * в процессе генерации Python-кода бота.
 * 
 * @module bot-generator/core/generator-logger
 */

/**
 * Уровень логирования
 * 
 * @example
 * const level: LogLevel = 'debug';
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'flow';

/**
 * Интерфейс логгера генератора
 * 
 * @example
 * const logger: GeneratorLogger = {
 *   debug: (msg) => console.log(`[DEBUG] ${msg}`),
 *   info: (msg) => console.info(`[INFO] ${msg}`),
 *   warn: (msg) => console.warn(`[WARN] ${msg}`),
 *   error: (msg) => console.error(`[ERROR] ${msg}`),
 *   flow: (msg) => console.log(`[FLOW] ${msg}`)
 * };
 */
export interface GeneratorLogger {
  /** Отладочные сообщения */
  debug(msg: string, data?: any): void;
  /** Информационные сообщения */
  info(msg: string): void;
  /** Предупреждения */
  warn(msg: string): void;
  /** Ошибки */
  error(msg: string, error?: Error): void;
  /** Сообщения о потоке генерации */
  flow(msg: string): void;
}

/**
 * Опции для создания логгера
 * 
 * @example
 * const options: LoggerOptions = { enabled: true, level: 'info' };
 */
export interface LoggerOptions {
  /** Включить логирование */
  enabled?: boolean;
  /** Минимальный уровень логирования */
  level?: LogLevel;
}

/**
 * Создаёт логгер с заданными опциями
 * 
 * @param options - Опции логгера
 * @returns Логгер генератора
 * 
 * @example
 * const logger = createLogger({ enabled: true, level: 'info' });
 */
export function createLogger(options: LoggerOptions = {}): GeneratorLogger {
  const { enabled = true, level = 'info' } = options;

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const minLevelIndex = levels.indexOf(level);

  const shouldLog = (logLevel: LogLevel): boolean => {
    if (!enabled) return false;
    return levels.indexOf(logLevel) >= minLevelIndex;
  };

  return {
    debug: (msg, data) => {
      if (shouldLog('debug')) {
        console.log(`🔍 [DEBUG] ${msg}`, data ?? '');
      }
    },
    info: (msg) => {
      if (shouldLog('info')) {
        console.info(`ℹ️ [INFO] ${msg}`);
      }
    },
    warn: (msg) => {
      if (shouldLog('warn')) {
        console.warn(`⚠️ [WARN] ${msg}`);
      }
    },
    error: (msg, error) => {
      if (shouldLog('error')) {
        console.error(`❌ [ERROR] ${msg}`, error ?? '');
      }
    },
    flow: (msg) => {
      if (shouldLog('error')) {
        console.log(`🔄 [FLOW] ${msg}`);
      }
    },
  };
}

/**
 * Логгер по умолчанию (включён, уровень error)
 *
 * @example
 * generatorLogger.info('Генерация началась');
 */
export const generatorLogger: GeneratorLogger = createLogger({
  enabled: true,
  level: 'error',
});
