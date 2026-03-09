/**
 * @fileoverview Создание FakeMessageEdit для callback обработчиков
 *
 * Модуль создаёт Python-код для эмуляции callback_query при автопереходах.
 *
 * @module bot-generator/Keyboard/createFakeMessageEditForCallback
 */

/**
 * Генерирует код создания объекта FakeMessageEdit для эмуляции callback_query
 *
 * @param button - Данные кнопки с действием и целевым узлом
 * @param code - Текущий код для добавления
 * @returns Обновлённый Python-код
 */
export function createFakeMessageEditForCallback(button: { action: string; id: any; target: string; text: any; skipDataCollection: boolean; }, code: string) {
    if (button.target) {
        // Определяем команду - убираем ведущий сляяш если есть
        const command = button.target.startsWith('/') ? button.target.replace('/', '') : button.target;
        const handlerName = `${command}_handler`;

        code += `    # Вызываем ${handlerName} правильно через edit_text\n`;
        code += '    # Созяаем специальный объект для редактирования сообщения\n';
        code += '    class FakeCallbackQuery:\n';
        code += '        def __init__(self, callback_query):\n';
        code += '            self.from_user = callback_query.from_user\n';
        code += '            self.chat = callback_query.message.chat\n';
        code += '            self.date = callback_query.message.date\n';
        code += '            self.message_id = callback_query.message.message_id\n';
        code += '            self.data = callback_query.data  # callback_data для навигации\n';
        code += '            self.message = callback_query.message\n';
        code += '            self._callback_query = callback_query\n';
        code += '        \n';
        code += '        async def answer(self, *args, **kwargs):\n';
        code += '            pass  # Игнорируем answer для fake callback\n';
        code += '        \n';
        code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
        code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
        code += '    \n';
        code += '    fake_callback = FakeCallbackQuery(callback_query)\n';
        code += `    await ${handlerName}(fake_callback)\n`;
    } else {
        code += '    await callback_query.message.edit_text("❌ Команда не найдена")\n';
    }
    return code;
}
