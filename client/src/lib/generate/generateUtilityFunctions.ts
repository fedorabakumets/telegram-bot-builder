/**
 * Функция для генерации утилитарных функций
 * @param userDatabaseEnabled - Включена ли база данных
 * @returns Строка с кодом утилитарных функций
 */
export function generateUtilityFunctions(userDatabaseEnabled: boolean): string {
  let code = '';
  code += '\n# Утилитарные функции\n';
  code += 'async def is_admin(user_id: int) -> bool:\n';
  code += '    return user_id in ADMIN_IDS\n\n';

  code += 'async def is_private_chat(message: types.Message) -> bool:\n';
  code += '    return message.chat.type == "private"\n\n';

  if (userDatabaseEnabled) {
    code += 'async def check_auth(user_id: int) -> bool:\n';
    code += '    # Проверяем наличие пользователя в БД или локальном хранилище\n';
    code += '    if db_pool:\n';
    code += '        user = await get_user_from_db(user_id)\n';
    code += '        return user is not None\n';
    code += '    return user_id in user_data\n\n';
  } else {
    // Простая версия без БД - проверяем только локальное хранилище
    code += 'async def check_auth(user_id: int) -> bool:\n';
    code += '    return user_id in user_data\n\n';
  }

  return code;
}
