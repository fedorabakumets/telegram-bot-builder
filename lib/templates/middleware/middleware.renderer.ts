/**
 * @fileoverview Renderer для генерации кода логирования сообщений
 * @module templates/middleware/middleware.renderer
 */

import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует код логирования: middleware, обёртки send/answer, save_message_to_api
 * @alias generateMiddleware
 */
export function generateMessageLoggingCode(
  userDatabaseEnabled: boolean,
  hasInlineButtonsValue: boolean,
  projectId: number | null
): string {
  if (!userDatabaseEnabled) return '';

  let code = '';
  code += renderPartialTemplate('middleware/save-message-to-api.py.jinja2', { projectId });
  code += renderPartialTemplate('middleware/middleware.py.jinja2', {
    userDatabaseEnabled,
    hasInlineButtons: hasInlineButtonsValue,
  });
  code += renderPartialTemplate('middleware/answer-with-logging.py.jinja2', {});
  code += renderPartialTemplate('middleware/send-message-with-logging.py.jinja2', {});
  code += renderPartialTemplate('middleware/send-photo-with-logging.py.jinja2', {});
  return code;
}

/**
 * Обёртка для обратной совместимости с тестами
 */
export function generateMiddleware(params: { userDatabaseEnabled: boolean }): string {
  return generateMessageLoggingCode(params.userDatabaseEnabled, false, null);
}
