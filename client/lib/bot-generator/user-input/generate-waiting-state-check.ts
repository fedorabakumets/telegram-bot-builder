/**
 * @fileoverview Генерация проверки состояния ожидания ввода
 * 
 * Модуль создаёт Python-код для проверки waiting_for_input
 * и базовой обработки состояния.
 * 
 * @module bot-generator/user-input/generate-waiting-state-check
 */

/**
 * Генерирует Python-код для проверки waiting_for_input
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки
 */
export function generateWaitingStateCheck(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}# Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)\n`;
  code += `${indent}has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]\n`;
  code += `${indent}logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")\n`;
  code += `${indent}if user_id in user_data and "waiting_for_input" in user_data[user_id]:\n`;
  code += `${indent}    # Обрабатываем ввод через универсальную систему\n`;
  code += `${indent}    waiting_config = user_data[user_id]["waiting_for_input"]\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Проверяем, что пользователь все еще находится в состоянии ожидания ввода\n`;
  code += `${indent}    if not waiting_config:\n`;
  code += `${indent}        return  # Состояние ожидания пустое, игнорируем\n`;
  code += `${indent}    \n`;
  return code;
}

/**
 * Генерирует Python-код для получения переменных из БД
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код получения переменных
 */
export function generateDatabaseVarsGet(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Получаем переменные из базы данных (user_ids_list, user_ids_count)\n`;
  code += `${indent}# generateDatabaseVariablesCode будет вызван отдельно\n`;
  return code;
}
