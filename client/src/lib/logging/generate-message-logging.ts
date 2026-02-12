/**
 * @fileoverview Утилита для генерации кода логирования сообщений в базу данных
 * 
 * Этот модуль предоставляет функции для генерации Python-кода,
 * обеспечивающего логирование сообщений в базу данных через API.
 * 
 * @module generateMessageLoggingCode
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { answer_with_logging } from './answer_with_logging';
import { callback_query_logging_middleware } from './callback_query_logging_middleware';
import { get_api_base_url } from './get_api_base_url';
import { message_logging_middleware } from './message_logging_middleware';
import { save_message_to_api } from './save_message_to_api';
import { send_message_with_logging } from './send_message_with_logging';
import { send_photo_with_logging } from './send_photo_with_logging';

/**
 * Генерирует код для логирования сообщений в базу данных
 * @param {boolean} userDatabaseEnabled - Флаг включения пользовательской базы данных
 * @param {number | null} projectId - ID проекта
 * @param {boolean} hasInlineButtonsValue - Результат вызова hasInlineButtons
 * @returns {string} Сгенерированный код для логирования сообщений
 */
export function generateMessageLoggingCode(userDatabaseEnabled: boolean, projectId: number | null, hasInlineButtonsValue: boolean): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  get_api_base_url(codeLines, projectId);

  save_message_to_api(codeLines);

  message_logging_middleware(codeLines);

  // Добавляем callback_query middleware только если в боте есть inline кнопки
  callback_query_logging_middleware(hasInlineButtonsValue, codeLines);

  send_message_with_logging(codeLines);

  answer_with_logging(codeLines);

  send_photo_with_logging(codeLines);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generate-message-logging.ts');

  return commentedCodeLines.join('\n');
}


