/**
 * @fileoverview Тестовые данные для шаблона универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.fixture
 */

import type { UniversalHandlersTemplateParams } from './universal-handlers.params';

/** Валидные параметры: БД включена */
export const validParamsEnabled: UniversalHandlersTemplateParams = {
  userDatabaseEnabled: true,
};

/** Валидные параметры: БД выключена */
export const validParamsDisabled: UniversalHandlersTemplateParams = {
  userDatabaseEnabled: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};

/** Ожидаемый вывод: обработчики */
export const expectedOutput = `
@dp.message(F.text)
async def fallback_text_handler(message: types.Message):
    """
    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.
    """
    logging.info(f"📩 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")


@dp.message(F.photo)
async def handle_unhandled_photo(message: types.Message):
    """
    Обрабатывает фотографии, которые не были обработаны другими обработчиками.
    """
    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")
`.trim();
