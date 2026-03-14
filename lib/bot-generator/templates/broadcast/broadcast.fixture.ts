/**
 * @fileoverview Тестовые данные для шаблона рассылки
 * @module templates/broadcast/broadcast.fixture
 */

import type { BroadcastTemplateParams } from './broadcast.params';

/** Валидные параметры: рассылка через бота */
export const validParamsBotBroadcast: BroadcastTemplateParams = {
  nodeId: 'broadcast_1',
  broadcastApiType: 'bot',
  broadcastTargetNode: 'target_1',
  enableBroadcast: true,
  enableConfirmation: false,
  confirmationText: 'Подтвердите рассылку',
  successMessage: 'Рассылка выполнена успешно',
  errorMessage: 'Произошла ошибка',
  idSourceType: 'bot_users',
  messageText: 'Привет, это рассылка!',
};

/** Валидные параметры: рассылка через клиента */
export const validParamsClientBroadcast: BroadcastTemplateParams = {
  nodeId: 'broadcast_2',
  broadcastApiType: 'client',
  broadcastTargetNode: 'target_2',
  enableBroadcast: true,
  enableConfirmation: true,
  confirmationText: 'Вы уверены?',
  successMessage: 'Готово',
  errorMessage: 'Ошибка',
  idSourceType: 'user_ids',
  messageText: 'Клиентская рассылка',
};

/** Валидные параметры: оба источника ID */
export const validParamsBothSources: BroadcastTemplateParams = {
  nodeId: 'broadcast_3',
  broadcastApiType: 'bot',
  broadcastTargetNode: '',
  enableBroadcast: true,
  enableConfirmation: false,
  confirmationText: '',
  successMessage: '',
  errorMessage: '',
  idSourceType: 'both',
  messageText: 'Рассылка всем',
};

/** Валидные параметры: рассылка отключена */
export const validParamsDisabled: BroadcastTemplateParams = {
  nodeId: 'broadcast_4',
  broadcastApiType: 'bot',
  broadcastTargetNode: '',
  enableBroadcast: false,
  enableConfirmation: false,
  confirmationText: '',
  successMessage: '',
  errorMessage: '',
  idSourceType: 'bot_users',
  messageText: '',
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  broadcastApiType: 'bot',
  // отсутствует nodeId
};

/** Ожидаемый вывод: рассылка через бота */
export const expectedOutputBotBroadcast = `
@dp.message(Command("broadcast_broadcast_1"))
async def handle_broadcast_broadcast_1(message: types.Message):
    """Обработчик рассылки сообщений для узла broadcast_1"""
    user_id = message.from_user.id

    {# Получение списка пользователей для рассылки #}
    target_users = []

    {# Получение bot_users из базы данных #}
    if db_pool:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT user_id FROM users WHERE is_bot = TRUE")
            target_users.extend([row['user_id'] for row in rows])

    {# Текст рассылки #}
    broadcast_text = "Привет, это рассылка!" if node.data.get("messageText") else "Рассылка сообщений"

    {# Замена переменных #}
    all_user_vars = await init_all_user_vars(user_id)
    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    broadcast_text = replace_variables_in_text(broadcast_text, all_user_vars, variable_filters)

    {# Отправка сообщений #}
    success_count = 0
    error_count = 0

    {# Рассылка через бота #}
    for target_user_id in target_users:
        try:
            await bot.send_message(target_user_id, broadcast_text)
            success_count += 1
        except Exception as e:
            logging.error(f"Ошибка отправки пользователю {target_user_id}: {e}")
            error_count += 1
        await asyncio.sleep(0.1)  # Задержка для избежания лимитов

    {# Сообщение о результатах #}
    result_text = f"✅ Рассылка завершена\\nУспешно: {success_count}\\nОшибок: {error_count}"
    await message.answer(result_text)
`.trim();

/** Ожидаемый вывод: рассылка отключена */
export const expectedOutputDisabled = `
@dp.message(Command("broadcast_broadcast_4"))
async def handle_broadcast_broadcast_4(message: types.Message):
    """Обработчик рассылки (отключен) для узла broadcast_4"""
    await message.answer("Рассылка отключена")
`.trim();
