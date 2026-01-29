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
  code += `${indentLevel}if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):\n`;
  code += `${indentLevel}    # Получаем объект пользователя из сообщения или callback\n`;
  code += `${indentLevel}    user_obj = None\n`;
  code += `${indentLevel}    # Безопасно проверяем наличие message (для message handlers)\n`;
  code += `${indentLevel}    if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):\n`;
  code += `${indentLevel}        user_obj = locals().get('message').from_user\n`;
  code += `${indentLevel}    # Безопасно проверяем наличие callback_query (для callback handlers)\n`;
  code += `${indentLevel}    elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):\n`;
  code += `${indentLevel}        user_obj = locals().get('callback_query').from_user\n`;
  code += `\n`;
  code += `${indentLevel}    if user_obj:\n`;
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

  return code;
}