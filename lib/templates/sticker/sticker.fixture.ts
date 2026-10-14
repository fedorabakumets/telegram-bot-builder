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

/** Ожидаемый вывод: стикер по file_id, без подписи и без команды */
export const expectedOutputFileId = `
@dp.callback_query(lambda c: c.data == "sticker_1")
async def handle_callback_sticker_1(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Отправка стикера при входе в узел sticker_1"""
`.trim();

/** Ожидаемый вывод: стикер по URL */
export const expectedOutputUrl = `
sticker_url = "https://example.com/sticker.webp"
async with aiohttp.ClientSession() as session:
`.trim();
