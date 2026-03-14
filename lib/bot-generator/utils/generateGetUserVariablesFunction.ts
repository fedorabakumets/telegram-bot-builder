/**
 * Генерирует код функции для получения пользовательских переменных
 * @param indentLevel - уровень отступа для генерируемого кода
 * @returns строка с Python кодом функции
 */
export function generateGetUserVariablesFunction(indentLevel: string = ''): string {
  let code = '';

  code += `${indentLevel}def get_user_variables(user_id):\n`;
  code += `${indentLevel}    \"\"\"Получает все переменные пользователя из локального хранилища\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    Args:\n`;
  code += `${indentLevel}        user_id (int): ID пользователя Telegram\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    Returns:\n`;
  code += `${indentLevel}        dict: Словарь с переменными пользователя или пустой словарь если пользователь не найден\n`;
  code += `${indentLevel}    \"\"\"\n`;
  code += `${indentLevel}    # Возвращаем переменные пользователя из локального хранилища или пустой словарь\n`;
  code += `${indentLevel}    return user_data.get(user_id, {})\n`;

  return code;
}