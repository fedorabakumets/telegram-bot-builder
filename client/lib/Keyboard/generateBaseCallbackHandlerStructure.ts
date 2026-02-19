export function generateBaseCallbackHandlerStructure(code: string, safeFunctionName: any) {
    code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
    code += '    # Безопасное получение данных из callback_query\n';
    code += '    callback_data = None  # Инициализируем переменную\n';
    code += '    try:\n';
    code += '        user_id = callback_query.from_user.id\n';
    code += '        callback_data = callback_query.data\n';
    code += `        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
    code += '    except Exception as e:\n';
    code += `        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
    code += '        return\n';
    code += '    \n';
    code += '    # Проверяем флаг hideAfterClick для кнопок\n';
    code += `    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных кнопок\n`;
    code += '    \n';
    code += '    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)\n';
    code += '    try:\n';
    code += '        await callback_query.answer()\n';
    code += '    except Exception:\n';
    code += '        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
    code += '    \n';
    return code;
}
