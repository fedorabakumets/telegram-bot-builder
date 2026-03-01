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
import { message_logging_middleware } from './message_logging_middleware';
import { save_message_to_api } from './save_message_to_api';
import { send_message_with_logging } from './send_message_with_logging';
import { send_photo_with_logging } from './send_photo_with_logging';

/**
 * Генерирует код для логирования сообщений в базу данных
 * @param userDatabaseEnabled - Флаг включения пользовательской базы данных
 * @param hasInlineButtonsValue - Результат вызова hasInlineButtons
 * @returns Сгенерированный код для логирования сообщений
 */
export function generateMessageLoggingCode(
  userDatabaseEnabled: boolean,
  hasInlineButtonsValue: boolean
): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Примечание: get_api_base_url уже сгенерирован в generateApiConfig
  // Здесь генерируем только функции для работы с API

  // Сохранение сообщения в API
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │      Сохранение сообщения в API         │');
  codeLines.push('# └─────────────────────────────────────────┘');
  save_message_to_api(codeLines);

  // Middleware для логирования сообщений
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │   Middleware для логирования сообщений  │');
  codeLines.push('# └─────────────────────────────────────────┘');
  message_logging_middleware(codeLines);

  // Middleware для логирования callback_query
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │ Middleware для логирования callback_query│');
  codeLines.push('# │        (если есть inline кнопки)        │');
  codeLines.push('# └─────────────────────────────────────────┘');
  // Добавляем callback_query middleware только если в боте есть inline кнопки
  callback_query_logging_middleware(hasInlineButtonsValue, codeLines);

  // Отправка сообщения с логированием
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │    Отправка сообщения с логированием    │');
  codeLines.push('# └─────────────────────────────────────────┘');
  send_message_with_logging(codeLines);

  // Ответ с логированием
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │         Ответ с логированием            │');
  codeLines.push('# └─────────────────────────────────────────┘');
  answer_with_logging(codeLines);

  // Отправка фото с логированием
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │      Отправка фото с логированием       │');
  codeLines.push('# └─────────────────────────────────────────┘');
  send_photo_with_logging(codeLines);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generate-message-logging.ts');

  return commentedCodeLines.join('\n');
}

