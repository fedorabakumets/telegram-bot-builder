/**
 * Генерирует код универсальной замены переменных с инициализацией.
 * Генерирует безопасный Python-код, который проверяет наличие
 * 'message' или 'callback_query' в локальной области видимости,
 * прежде чем пытаться получить доступ к ним.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @param useDirectAccess - использовать прямой доступ к переменной message (для контекстов, где message гарантированно доступен)
 * @returns строка с Python кодом.
 */
export function generateUniversalVariableReplacement(indentLevel: string, useDirectAccess: boolean = false): string {
  let code = '';

  code += `${indentLevel}# Инициализируем базовые переменные пользователя если их нет\n`;
  code += `${indentLevel}# Получаем объект пользователя из сообщения или callback\n`;
  code += `${indentLevel}user_obj = None\n`;

  if (useDirectAccess) {
    // В контексте, где message гарантированно доступен как параметр функции
    code += `${indentLevel}# Используем прямой доступ к message (гарантированно доступен как параметр функции)\n`;
    code += `${indentLevel}user_obj = message.from_user\n`;
  } else {
    // Универсальный код для безопасной проверки наличия message или callback_query
    code += `${indentLevel}# Безопасно проверяем наличие message (для message handlers)\n`;
    code += `${indentLevel}if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):\n`;
    code += `${indentLevel}    user_obj = locals().get('message').from_user\n`;
    code += `${indentLevel}# Безопасно проверяем наличие callback_query (для callback handlers)\n`;
    code += `${indentLevel}elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):\n`;
    code += `${indentLevel}    user_obj = locals().get('callback_query').from_user\n`;
  }

  code += `\n`;
  code += `${indentLevel}if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):\n`;
  code += `${indentLevel}    # Проверяем, что user_obj определен и инициализируем переменные пользователя\n`;
  code += `${indentLevel}    if user_obj is not None:\n`;
  code += `${indentLevel}        init_user_variables(user_id, user_obj)\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Подставляем все доступные переменные пользователя в текст\n`;
  code += `${indentLevel}user_vars = await get_user_from_db(user_id)\n`;
  code += `${indentLevel}if not user_vars:\n`;
  code += `${indentLevel}    user_vars = user_data.get(user_id, {})\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# get_user_from_db теперь возвращает уже обработанные user_data\n`;
  code += `${indentLevel}if not isinstance(user_vars, dict):\n`;
  code += `${indentLevel}    user_vars = user_data.get(user_id, {})\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Создаем объединенный словарь переменных из базы данных и локального хранилища\n`;
  code += `${indentLevel}all_user_vars = {}\n`;
  code += `${indentLevel}# Добавляем переменные из базы данных\n`;
  code += `${indentLevel}if user_vars and isinstance(user_vars, dict):\n`;
  code += `${indentLevel}    all_user_vars.update(user_vars)\n`;
  code += `${indentLevel}# Добавляем переменные из локального хранилища\n`;
  code += `${indentLevel}local_user_vars = user_data.get(user_id, {})\n`;
  code += `${indentLevel}if isinstance(local_user_vars, dict):\n`;
  code += `${indentLevel}    all_user_vars.update(local_user_vars)\n`;
  code += `${indentLevel}\n`;

  return code;
}

/**
 * Генерирует код определения глобальной функции check_user_variable_inline.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом функции.
 */
export function generateGlobalCheckUserVariableFunction(): string {
  let code = '';

  // Определяем функцию глобально в начале файла
  code += '# Функция для проверки переменных пользователя (глобально)\n';
  code += 'def check_user_variable_inline(var_name, user_data_dict):\n';
  code += '    if "user_data" in user_data_dict and user_data_dict["user_data"]:\n';
  code += '        try:\n';
  code += '            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n';
  code += '            if var_name in parsed_data:\n';
  code += '                raw_value = parsed_data[var_name]\n';
  code += '                if isinstance(raw_value, dict) and "value" in raw_value:\n';
  code += '                    var_value = raw_value["value"]\n';
  code += '                    if var_value is not None and str(var_value).strip() != "":\n';
  code += '                        return True, str(var_value)\n';
  code += '                else:\n';
  code += '                    if raw_value is not None and str(raw_value).strip() != "":\n';
  code += '                        return True, str(raw_value)\n';
  code += '        except (json.JSONDecodeError, TypeError):\n';
  code += '            pass\n';
  code += '    if var_name in user_data_dict:\n';
  code += '        variable_data = user_data_dict.get(var_name)\n';
  code += '        if isinstance(variable_data, dict) and "value" in variable_data:\n';
  code += '            var_value = variable_data["value"]\n';
  code += '            if var_value is not None and str(var_value).strip() != "":\n';
  code += '                return True, str(var_value)\n';
  code += '        elif variable_data is not None and str(variable_data).strip() != "":\n';
  code += '            return True, str(variable_data)\n';
  code += '    return False, None\n\n';

  return code;
}

/**
 * Генерирует код определения функции check_user_variable_inline для использования внутри других функций.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом функции.
 */
export function generateCheckUserVariableFunction(indentLevel: string): string {
  // Не генерируем внутреннюю функцию, так как глобальная функция уже определена
  // Вместо этого, просто возвращаем пустую строку или комментарий
  return `${indentLevel}# Используем глобально определенную функцию check_user_variable_inline\n`;
}