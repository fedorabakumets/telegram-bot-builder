/**
 * @fileoverview Тестовые данные для шаблона стикера
 * @module templates/sticker/sticker.fixture
 */

import type { StickerTemplateParams } from './sticker.params';

/** Валидные параметры: стикер по file_id */
export const validParamsFileId: StickerTemplateParams = {
  nodeId: 'sticker_1',
  stickerUrl: '',
  stickerFileId: 'CAACAgQAAxkBAAIC',
  stickerSetName: '',
  mediaCaption: 'Привет!',
  disableNotification: false,
};

/** Валидные параметры: стикер по URL */
export const validParamsUrl: StickerTemplateParams = {
  nodeId: 'sticker_2',
  stickerUrl: 'https://example.com/sticker.webp',
  stickerFileId: '',
  stickerSetName: '',
  mediaCaption: '',
  disableNotification: true,
};

/** Валидные параметры: стикер из набора */
export const validParamsSetName: StickerTemplateParams = {
  nodeId: 'sticker_3',
  stickerUrl: '',
  stickerFileId: '',
  stickerSetName: 'MyStickerPack',
  mediaCaption: 'Из набора',
  disableNotification: false,
};

/** Валидные параметры: без подписи и уведомлений */
export const validParamsSilent: StickerTemplateParams = {
  nodeId: 'sticker_4',
  stickerUrl: '',
  stickerFileId: 'CAACAgQAAxkBAAID',
  stickerSetName: '',
  mediaCaption: '',
  disableNotification: true,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  stickerFileId: 'CAAC',
  // отсутствует nodeId
};

/** Ожидаемый вывод: стикер по file_id */
export const expectedOutputFileId = `
@dp.message(Command("sticker_sticker_1"))
async def handle_sticker_sticker_1(message: types.Message):
    """Обработчик отправки стикера для узла sticker_1"""
    user_id = message.from_user.id

    {# Отправка по file_id #}
    sticker_file_id = "CAACAgQAAxkBAAIC"

    caption = "Привет!"

    {# Замена переменных #}
    all_user_vars = await init_all_user_vars(user_id)
    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    caption = replace_variables_in_text(caption, all_user_vars, variable_filters)

    try:
        await message.answer_sticker(
            sticker=sticker_file_id,
            caption=caption
        )
    except Exception as e:
        logging.error(f"Ошибка отправки стикера: {e}")
        await message.answer("Произошла ошибка при отправке стикера")
`.trim();

/** Ожидаемый вывод: стикер по URL */
export const expectedOutputUrl = `
@dp.message(Command("sticker_sticker_2"))
async def handle_sticker_sticker_2(message: types.Message):
    """Обработчик отправки стикера для узла sticker_2"""
    user_id = message.from_user.id

    {# Отправка по URL #}
    sticker_url = "https://example.com/sticker.webp"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(sticker_url) as resp:
                sticker_data = await resp.read()
                await message.answer_sticker(
                    sticker=sticker_data,
                    disable_notification=True
                )
    except Exception as e:
        logging.error(f"Ошибка отправки стикера: {e}")
        await message.answer("Произошла ошибка при отправке стикера")
`.trim();
