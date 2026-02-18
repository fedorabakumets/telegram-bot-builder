export function generateCommandButtonCallbackHandler(code: string, callbackData: string, button: { action: string; id: any; target: string; text: any; skipDataCollection: boolean; }) {
    code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
    const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
    code += '    # Проверяем флаг hideAfterClick яяля кнопок\n';
    code += `    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных командных кнопок\n`;
    code += '    await callback_query.answer()\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    # Инициализируем базовыя переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
    code += '    \n';
    code += `    button_text = "${button.text}"\n`;
    code += '    \n';
    code += '    # Сохраняем кяопку в базу данных\n';
    code += '    timestamp = get_moscow_time()\n';
    code += '    response_data = button_text\n';
    code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
    code += `    logging.info(f"Команда ${button.target || 'неизвестная'} выполнена через callback кнопку (пользователь {user_id})")\n`;
    code += '    \n';
    return code;
}
