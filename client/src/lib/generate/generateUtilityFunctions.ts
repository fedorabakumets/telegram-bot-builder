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
