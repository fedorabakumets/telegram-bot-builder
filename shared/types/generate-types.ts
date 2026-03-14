/**
 * @fileoverview Типы для API генерации кода
 * 
 * @module shared/types/generate-types
 */

/**
 * Параметры для генерации кода бота
 * 
 * @typedef {Object} GenerateCodeParams
 * @property {boolean} [userDatabaseEnabled=false] - Включена ли база данных пользователей
 * @property {boolean} [enableComments=true] - Включить ли комментарии в коде
 * @property {boolean} [enableLogging=false] - Включить ли логирование
 */
export interface GenerateCodeParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Включить ли комментарии в коде */
  enableComments?: boolean;
  /** Включить ли логирование */
  enableLogging?: boolean;
}

/**
 * Ответ API с сгенерированным кодом
 * 
 * @typedef {Object} GenerateCodeResponse
 * @property {string} code - Сгенерированный Python код
 * @property {number} lines - Количество строк кода
 * @property {number} generatedAt - Timestamp генерации
 */
export interface GenerateCodeResponse {
  /** Сгенерированный Python код */
  code: string;
  /** Количество строк кода */
  lines: number;
  /** Timestamp генерации */
  generatedAt: number;
}

/**
 * Ошибка генерации кода
 * 
 * @typedef {Object} GenerateCodeError
 * @property {string} error - Тип ошибки
 * @property {string} message - Сообщение об ошибке
 */
export interface GenerateCodeError {
  /** Тип ошибки */
  error: string;
  /** Сообщение об ошибке */
  message: string;
}
