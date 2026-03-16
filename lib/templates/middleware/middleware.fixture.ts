/**
 * @fileoverview Тестовые данные для шаблона middleware
 * @module templates/middleware/middleware.fixture
 */

import type { MiddlewareTemplateParams } from './middleware.params';

/** Валидные параметры: БД включена */
export const validParamsEnabled: MiddlewareTemplateParams = {
  userDatabaseEnabled: true,
};

/** Валидные параметры: БД выключена */
export const validParamsDisabled: MiddlewareTemplateParams = {
  userDatabaseEnabled: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};

/** Ожидаемый вывод: middleware */
export const expectedOutput = `
async def message_logging_middleware(handler, event: types.Message, data: dict):
    """Middleware для автоматического сохранения входящих сообщений"""
    try:
        user_id = str(event.from_user.id)
        message_text = event.text or event.caption or "[медиа]"

        await save_message_to_api(
            user_id=user_id,
            message_type="user",
            message_text=message_text,
        )
    except Exception as e:
        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")

    return await handler(event, data)
`.trim();
