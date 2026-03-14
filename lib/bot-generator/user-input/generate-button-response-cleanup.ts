/**
 * @fileoverview Генерация очистки состояния button_response_config
 * 
 * Модуль создаёт Python-код для удаления состояния после
 * успешного выбора пользователя.
 * 
 * @module bot-generator/user-input/generate-button-response-cleanup
 */

/**
 * Генерирует Python-код для очистки button_response_config
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код очистки состояния
 */
export function generateButtonResponseCleanup(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Очищаем состояние\n`;
  code += `${indent}del user_data[user_id]["button_response_config"]\n`;
  code += `${indent}    \n`;
  code += `${indent}logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")\n`;
  code += `${indent}    \n`;
  return code;
}
