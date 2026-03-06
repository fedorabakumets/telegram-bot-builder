/**
 * @fileoverview Типы для валидации путей файлов
 * @module server/telegram/types/path-validation.ts
 */

/**
 * Результат валидации пути к файлу
 */
export interface PathValidationResult {
  /** Нормализованный абсолютный путь к файлу */
  normalizedPath: string;

  /** Относительный путь от базовой директории */
  relativePath: string;

  /** Флаг валидности пути (true = путь безопасен) */
  isValid: boolean;
}
