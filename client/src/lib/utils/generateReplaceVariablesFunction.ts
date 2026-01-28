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
