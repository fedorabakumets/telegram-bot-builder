/**
 * @fileoverview Генерация очистки состояния ожидания ввода
 * 
 * Модуль создаёт Python-код для удаления waiting_for_input
 * после успешной обработки данных.
 * 
 * @module bot-generator/user-input/generate-waiting-cleanup
 */

/**
 * Генерирует Python-код для очистки waiting_for_input
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код очистки состояния
 */
export function generateWaitingCleanup(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем старое состояние ожидания перед навигацией\n`;
  code += `${indent}if "waiting_for_input" in user_data[user_id]:\n`;
  code += `${indent}    del user_data[user_id]["waiting_for_input"]\n`;
  code += `${indent}    \n`;
  code += `${indent}logging.info(f"✅ Переход к следующему узлу выполнен успешно")\n`;
  code += `${indent}logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n`;
  return code;
}
