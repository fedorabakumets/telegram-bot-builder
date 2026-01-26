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

/**
 * Генерирует код функции замены переменных в тексте
 * @param indentLevel - уровень отступа для генерируемого кода
 * @returns строка с Python кодом функции
 */
export function generateReplaceVariablesFunction(indentLevel: string = ''): string {
  let code = '';
  
  code += `${indentLevel}def replace_variables_in_text(text_content, variables_dict):\n`;
  code += `${indentLevel}    """Заменяет переменные формата {variable_name} в тексте на их значения\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    Args:\n`;
  code += `${indentLevel}        text_content (str): Текст с переменными для замены\n`;
  code += `${indentLevel}        variables_dict (dict): Словарь переменных пользователя\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    Returns:\n`;
  code += `${indentLevel}        str: Текст с замененными переменными\n`;
  code += `${indentLevel}    """\n`;
  code += `${indentLevel}    if not text_content or not variables_dict:\n`;
  code += `${indentLevel}        return text_content\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Проходим по всем переменным пользователя\n`;
  code += `${indentLevel}    for var_name, var_data in variables_dict.items():\n`;
  code += `${indentLevel}        placeholder = "{" + var_name + "}"\n`;
  code += `${indentLevel}        if placeholder in text_content:\n`;
  code += `${indentLevel}            # Извлекаем значение переменной\n`;
  code += `${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:\n`;
  code += `${indentLevel}                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n`;
  code += `${indentLevel}            elif var_data is not None:\n`;
  code += `${indentLevel}                var_value = str(var_data)\n`;
  code += `${indentLevel}            else:\n`;
  code += `${indentLevel}                var_value = var_name  # Показываем имя переменной если значения нет\n`;
  code += `${indentLevel}            \n`;
  code += `${indentLevel}            # Заменяем переменную на значение\n`;
  code += `${indentLevel}            text_content = text_content.replace(placeholder, var_value)\n`;
  code += `${indentLevel}            logging.debug(f"🔄 Заменена переменная {placeholder} на '{var_value}'")\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    return text_content\n`;
  
  return code;
}

/**
 * Генерирует код универсальной замены переменных с инициализацией
 * @param indentLevel - уровень отступа для генерируемого кода
 * @returns строка с Python кодом
 */
export function generateUniversalVariableReplacement(indentLevel: string): string {
  let code = '';
  
  code += `${indentLevel}# Инициализируем базовые переменные пользователя если их нет\n`;
  code += `${indentLevel}if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):\n`;
  code += `${indentLevel}    # Получаем объект пользователя из сообщения или callback\n`;
  code += `${indentLevel}    user_obj = None\n`;
  code += `${indentLevel}    if hasattr(locals().get('message'), 'from_user'):\n`;
  code += `${indentLevel}        user_obj = message.from_user\n`;
  code += `${indentLevel}    elif hasattr(locals().get('callback_query'), 'from_user'):\n`;
  code += `${indentLevel}        user_obj = callback_query.from_user\n`;
  code += `${indentLevel}    \n`;
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

/**
 * Список всех системных переменных, доступных пользователям
 */
export const SYSTEM_VARIABLES = {
  user_name: {
    description: 'Имя пользователя для отображения (приоритет: first_name > username > "Пользователь")',
    example: 'Алексей',
    source: 'Telegram API'
  },
  first_name: {
    description: 'Имя пользователя из профиля Telegram',
    example: 'Алексей',
    source: 'Telegram API'
  },
  last_name: {
    description: 'Фамилия пользователя из профиля Telegram',
    example: 'Иванов',
    source: 'Telegram API'
  },
  username: {
    description: 'Никнейм пользователя в Telegram (без @)',
    example: 'alex123',
    source: 'Telegram API'
  }
} as const;

/**
 * Генерирует документацию по доступным переменным
 * @returns строка с документацией
 */
export function generateVariablesDocumentation(): string {
  let doc = '# Доступные системные переменные\n\n';
  
  Object.entries(SYSTEM_VARIABLES).forEach(([varName, info]) => {
    doc += `## {${varName}}\n`;
    doc += `- **Описание**: ${info.description}\n`;
    doc += `- **Пример**: ${info.example}\n`;
    doc += `- **Источник**: ${info.source}\n\n`;
  });
  
  return doc;
}