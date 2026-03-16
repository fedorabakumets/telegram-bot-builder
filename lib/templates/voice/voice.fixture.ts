/**
 * @fileoverview Тестовые данные для шаблона голосового сообщения
 * @module templates/voice/voice.fixture
 */

import type { VoiceTemplateParams } from './voice.params';

/** Валидные параметры: голосовое сообщение с подписью и длительностью */
export const validParamsFull: VoiceTemplateParams = {
  nodeId: 'voice_1',
  voiceUrl: 'https://example.com/voice.ogg',
  mediaCaption: 'Привет!',
  mediaDuration: 30,
  disableNotification: false,
};

/** Валидные параметры: только URL */
export const validParamsUrlOnly: VoiceTemplateParams = {
  nodeId: 'voice_2',
  voiceUrl: 'https://example.com/voice2.ogg',
  mediaCaption: '',
  mediaDuration: 0,
  disableNotification: false,
};

/** Валидные параметры: с длительностью без подписи */
export const validParamsWithDuration: VoiceTemplateParams = {
  nodeId: 'voice_3',
  voiceUrl: 'https://example.com/voice3.ogg',
  mediaCaption: '',
  mediaDuration: 60,
  disableNotification: true,
};

/** Валидные параметры: тихая отправка */
export const validParamsSilent: VoiceTemplateParams = {
  nodeId: 'voice_4',
  voiceUrl: 'https://example.com/voice4.ogg',
  mediaCaption: 'Тихое сообщение',
  mediaDuration: 15,
  disableNotification: true,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  voiceUrl: 'https://example.com/voice.ogg',
  // отсутствует nodeId
};

/** Ожидаемый вывод: полное голосовое сообщение */
export const expectedOutputFull = `
@dp.message(Command("voice_voice_1"))
async def handle_voice_voice_1(message: types.Message):
    """Обработчик отправки голосового сообщения для узла voice_1"""
    user_id = message.from_user.id

    voice_url = "https://example.com/voice.ogg"

    caption = "Привет!"

    {# Замена переменных #}
    all_user_vars = await init_all_user_vars(user_id)
    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    caption = replace_variables_in_text(caption, all_user_vars, variable_filters)

    duration = 30

    if not voice_url:
        await message.answer("Голосовое сообщение не настроено")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(voice_url) as resp:
                voice_data = await resp.read()

                await message.answer_voice(
                    voice=voice_data,
                    caption=caption,
                    duration=duration
                )
    except Exception as e:
        logging.error(f"Ошибка отправки голосового сообщения: {e}")
        await message.answer("Произошла ошибка при отправке голосового сообщения")
`.trim();

/** Ожидаемый вывод: только URL */
export const expectedOutputUrlOnly = `
@dp.message(Command("voice_voice_2"))
async def handle_voice_voice_2(message: types.Message):
    """Обработчик отправки голосового сообщения для узла voice_2"""
    user_id = message.from_user.id

    voice_url = "https://example.com/voice2.ogg"

    if not voice_url:
        await message.answer("Голосовое сообщение не настроено")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(voice_url) as resp:
                voice_data = await resp.read()

                await message.answer_voice(
                    voice=voice_data
                )
    except Exception as e:
        logging.error(f"Ошибка отправки голосового сообщения: {e}")
        await message.answer("Произошла ошибка при отправке голосового сообщения")
`.trim();
