/**
 * Генерирует код утилитарных функций для бота
 * @param userDatabaseEnabled - Флаг, указывающий, включена ли база данных пользователей
 * @returns Сгенерированный код утилитарных функций
 */
export function generateUtilityFunctions(userDatabaseEnabled: boolean): string {
  let utilityCode = '\n# Утилитарные функции\n';
  utilityCode += 'from aiogram import types\n\n';
  utilityCode += 'async def is_admin(user_id: int) -> bool:\n';
  utilityCode += '    return user_id in ADMIN_IDS\n\n';

  utilityCode += 'async def is_private_chat(message: types.Message) -> bool:\n';
  utilityCode += '    return message.chat.type == "private"\n\n';

  // Функция для получения пользовательских переменных
  utilityCode += 'def get_user_variables(user_id):\n';
  utilityCode += '    """Получает все переменные пользователя из локального хранилища\n';
  utilityCode += '    \n';
  utilityCode += '    Args:\n';
  utilityCode += '        user_id (int): ID пользователя Telegram\n';
  utilityCode += '    \n';
  utilityCode += '    Returns:\n';
  utilityCode += '        dict: Словарь с переменными пользователя или пустой словарь если пользователь не найден\n';
  utilityCode += '    """\n';
  utilityCode += '    # Возвращаем переменные пользователя из локального хранилища или пустой словарь\n';
  utilityCode += '    return user_data.get(user_id, {})\n\n';

  if (userDatabaseEnabled) {
    utilityCode += 'async def check_auth(user_id: int) -> bool:\n';
    utilityCode += '    # Проверяем наличие пользователя в БД или локальном хранилище\n';
    utilityCode += '    if db_pool:\n';
    utilityCode += '        user = await get_user_from_db(user_id)\n';
    utilityCode += '        return user is not None\n';
    utilityCode += '    return user_id in user_data\n\n';
  } else {
    // Простая версия без БД - проверяем только локальное хранилище
    utilityCode += 'async def check_auth(user_id: int) -> bool:\n';
    utilityCode += '    return user_id in user_data\n\n';
  }

  return utilityCode;
}
