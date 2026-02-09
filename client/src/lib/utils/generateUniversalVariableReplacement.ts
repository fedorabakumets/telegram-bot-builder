/**
 * Генерирует код универсальной замены переменных с инициализацией.
 * Генерирует безопасный Python-код, который проверяет наличие
 * 'message' или 'callback_query' в локальной области видимости,
 * прежде чем пытаться получить доступ к ним.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом.
 */
export function generateUniversalVariableReplacement(indentLevel: string): string {
  let code = '';

  code += `${indentLevel}# Инициализируем базовые переменные пользователя если их нет\n`;
  code += `${indentLevel}# Получаем объект пользователя из сообщения или callback\n`;
  code += `${indentLevel}user_obj = None\n`;
  code += `${indentLevel}# Безопасно проверяем наличие message (для message handlers)\n`;
  code += `${indentLevel}if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):\n`;
  code += `${indentLevel}    user_obj = locals().get('message').from_user\n`;
  code += `${indentLevel}# Безопасно проверяем наличие callback_query (для callback handlers)\n`;
  code += `${indentLevel}elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):\n`;
  code += `${indentLevel}    user_obj = locals().get('callback_query').from_user\n`;
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
 * Генерирует код определения функции check_user_variable_inline.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом функции.
 */
export function generateCheckUserVariableFunction(indentLevel: string): string {
  let code = '';

  code += `${indentLevel}# Функция для проверки переменных пользователя\n`;
  code += `${indentLevel}def check_user_variable_inline(var_name, user_data_dict):\n`;
  code += `${indentLevel}    if "user_data" in user_data_dict and user_data_dict["user_data"]:\n`;
  code += `${indentLevel}        try:\n`;
  code += `${indentLevel}            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n`;
  code += `${indentLevel}            if var_name in parsed_data:\n`;
  code += `${indentLevel}                raw_value = parsed_data[var_name]\n`;
  code += `${indentLevel}                if isinstance(raw_value, dict) and "value" in raw_value:\n`;
  code += `${indentLevel}                    var_value = raw_value["value"]\n`;
  code += `${indentLevel}                    if var_value is not None and str(var_value).strip() != "":\n`;
  code += `${indentLevel}                        return True, str(var_value)\n`;
  code += `${indentLevel}                else:\n`;
  code += `${indentLevel}                    if raw_value is not None and str(raw_value).strip() != "":\n`;
  code += `${indentLevel}                        return True, str(raw_value)\n`;
  code += `${indentLevel}        except (json.JSONDecodeError, TypeError):\n`;
  code += `${indentLevel}            pass\n`;
  code += `${indentLevel}    if var_name in user_data_dict:\n`;
  code += `${indentLevel}        variable_data = user_data_dict.get(var_name)\n`;
  code += `${indentLevel}        if isinstance(variable_data, dict) and "value" in variable_data:\n`;
  code += `${indentLevel}            var_value = variable_data["value"]\n`;
  code += `${indentLevel}            if var_value is not None and str(var_value).strip() != "":\n`;
  code += `${indentLevel}                return True, str(var_value)\n`;
  code += `${indentLevel}        elif variable_data is not None and str(variable_data).strip() != "":\n`;
  code += `${indentLevel}            return True, str(variable_data)\n`;
  code += `${indentLevel}    return False, None\n`;
  code += `${indentLevel}\n`;

  return code;
}