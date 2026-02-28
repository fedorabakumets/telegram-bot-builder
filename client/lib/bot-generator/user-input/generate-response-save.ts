/**
 * @fileoverview Генерация сохранения ответа пользователя
 * 
 * Модуль создаёт Python-код для сохранения введённых данных
 * в user_data и базу данных.
 * 
 * @module bot-generator/user-input/generate-response-save
 */

/**
 * Генерирует Python-код для сохранения ответа
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения ответа
 */
export function generateResponseSave(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Сохраняем ответ для нового формата\n`;
  code += `${indent}timestamp = get_moscow_time()\n`;
  code += `${indent}response_data = user_text\n`;
  code += `${indent}    \n`;
  code += `${indent}# Сохраняем в пользовательские данные\n`;
  code += `${indent}user_data[user_id][variable_name] = response_data\n`;
  code += `${indent}    \n`;
  code += `${indent}# Сохраняем в базу данных если включено\n`;
  code += `${indent}if save_to_database:\n`;
  code += `${indent}    saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n`;
  code += `${indent}    if saved_to_db:\n`;
  code += `${indent}        logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
  return code;
}
