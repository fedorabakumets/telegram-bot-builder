/**
 * Утилиты для работы с пользовательскими данными и переменными
 */
/**
 * Генерирует код функции инициализации пользовательских переменных
 * @param indentLevel - уровень отступа для генерируемого кода
 * @returns строка с Python кодом функции
 */
export function generateInitUserVariablesFunction(indentLevel: string = ''): string {
  let code = '';

  code += `${indentLevel}def init_user_variables(user_id, user_obj):\n`;
  code += `${indentLevel}    """Инициализирует базовые переменные пользователя из Telegram API\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    Args:\n`;
  code += `${indentLevel}        user_id (int): ID пользователя Telegram\n`;
  code += `${indentLevel}        user_obj: Объект пользователя из aiogram (message.from_user или callback_query.from_user)\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    Returns:\n`;
  code += `${indentLevel}        str: Имя пользователя для отображения (приоритет: first_name > username > "Пользователь")\n`;
  code += `${indentLevel}    """\n`;
  code += `${indentLevel}    # Инициализируем пользовательские данные если их нет\n`;
  code += `${indentLevel}    if user_id not in user_data:\n`;
  code += `${indentLevel}        user_data[user_id] = {}\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Безопасно извлекаем данные из Telegram API\n`;
  code += `${indentLevel}    username = user_obj.username if hasattr(user_obj, "username") else None\n`;
  code += `${indentLevel}    first_name = user_obj.first_name if hasattr(user_obj, "first_name") else None\n`;
  code += `${indentLevel}    last_name = user_obj.last_name if hasattr(user_obj, "last_name") else None\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Определяем отображаемое имя по приоритету\n`;
  code += `${indentLevel}    user_name = first_name or username or "Пользователь"\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Сохраняем все переменные в пользовательские данные\n`;
  code += `${indentLevel}    user_data[user_id]["user_name"] = user_name\n`;
  code += `${indentLevel}    user_data[user_id]["first_name"] = first_name\n`;
  code += `${indentLevel}    user_data[user_id]["last_name"] = last_name\n`;
  code += `${indentLevel}    user_data[user_id]["username"] = username\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Логируем инициализацию для отладки\n`;
  code += `${indentLevel}    logging.info(f"✅ Инициализированы переменные пользователя {user_id}: user_name='{user_name}', first_name='{first_name}', username='{username}'")\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    return user_name\n`;

  return code;
}
