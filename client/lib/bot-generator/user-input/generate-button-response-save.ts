/**
 * @fileoverview Генерация сохранения ответа кнопки в БД
 * 
 * Модуль создаёт Python-код для сохранения выбранного 
 * пользователем значения кнопки в базу данных.
 * 
 * @module bot-generator/user-input/generate-button-response-save
 */

/**
 * Генерирует Python-код для сохранения ответа кнопки в БД
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения в БД
 */
export function generateButtonResponseSave(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Сохраняем в базу данных если включено\n`;
  code += `${indent}if config.get("save_to_database"):\n`;
  code += `${indent}    saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n`;
  code += `${indent}    if saved_to_db:\n`;
  code += `${indent}        logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
  return code;
}
