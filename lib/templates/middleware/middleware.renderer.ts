/**
 * @fileoverview Renderer для генерации кода middleware Telegram бота
 *
 * Генерирует:
 * - `register_user_middleware` — авторегистрация пользователей при первом обращении
 * - `message_logging_middleware` — логирование входящих сообщений (только при БД)
 * - `callback_query_logging_middleware` — логирование нажатий кнопок (только при БД + inline)
 *
 * @module templates/middleware/middleware.renderer
 */

import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует код middleware: авторегистрация пользователей, логирование сообщений,
 * обёртки send/answer и save_message_to_api.
 *
 * `register_user_middleware` генерируется независимо от `userDatabaseEnabled` —
 * он нужен для инициализации `user_data` при любом входящем сообщении.
 *
 * @param userDatabaseEnabled - Включить логирование через БД
 * @param hasInlineButtonsValue - Генерировать callback_query_logging_middleware
 * @param projectId - ID проекта для save_message_to_api
 * @param autoRegisterUsers - Генерировать register_user_middleware (по умолчанию true)
 * @param saveIncomingMedia - Генерировать логику скачивания входящих фото (по умолчанию false)
 */
export function generateMessageLoggingCode(
  userDatabaseEnabled: boolean,
  hasInlineButtonsValue: boolean,
  projectId: number | null,
  autoRegisterUsers: boolean = true,
  saveIncomingMedia: boolean = false
): string {
  let code = '';

  // register_user_middleware генерируется всегда (не зависит от БД)
  code += renderPartialTemplate('middleware/middleware.py.jinja2', {
    userDatabaseEnabled,
    hasInlineButtons: hasInlineButtonsValue,
    autoRegisterUsers,
    saveIncomingMedia,
  });

  if (userDatabaseEnabled) {
    code += renderPartialTemplate('middleware/save-message-to-api.py.jinja2', { projectId, saveIncomingMedia });
    code += renderPartialTemplate('middleware/answer-with-logging.py.jinja2', {});
    code += renderPartialTemplate('middleware/send-message-with-logging.py.jinja2', {});
    code += renderPartialTemplate('middleware/send-photo-with-logging.py.jinja2', {});
    code += renderPartialTemplate('middleware/wrap-bot-answer.py.jinja2', {});
  }

  return code;
}

/**
 * Обёртка для обратной совместимости с тестами
 */
export function generateMiddleware(params: { userDatabaseEnabled: boolean; autoRegisterUsers?: boolean }): string {
  return generateMessageLoggingCode(params.userDatabaseEnabled, false, null, params.autoRegisterUsers ?? true);
}
