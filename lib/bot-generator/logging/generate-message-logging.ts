/**
 * @fileoverview Утилита для генерации кода логирования сообщений в базу данных
 *
 * @module generateMessageLoggingCode
 */

import { renderPartialTemplate } from '../../templates/template-renderer';
import { callback_query_logging_middleware } from './callback_query_logging_middleware';

/**
 * Генерирует код для логирования сообщений в базу данных
 * @param userDatabaseEnabled - Флаг включения пользовательской базы данных
 * @param hasInlineButtonsValue - Результат вызова hasInlineButtons
 * @param projectId - ID проекта для сохранения в базу данных
 * @returns Сгенерированный код для логирования сообщений
 */
export function generateMessageLoggingCode(
  userDatabaseEnabled: boolean,
  hasInlineButtonsValue: boolean,
  projectId: number | null
): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  // Компактный middleware из Jinja2 шаблона
  let code = renderPartialTemplate('middleware/middleware.py.jinja2', { userDatabaseEnabled });

  // Callback middleware только если есть inline кнопки
  if (hasInlineButtonsValue) {
    const cbLines: string[] = [];
    callback_query_logging_middleware(true, cbLines);
    code += cbLines.join('\n');
  }

  return code;
}
