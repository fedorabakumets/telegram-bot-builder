/**
 * @fileoverview Генерация валидации длины текста
 * 
 * Модуль создаёт Python-код для проверки минимальной и
 * максимальной длины введённого пользователем текста.
 * 
 * @module bot-generator/user-input/generate-text-length-validation
 */

/**
 * Генерирует Python-код для валидации минимальной длины
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки минимальной длины
 */
export function generateMinLengthValidation(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Валидация длины\n`;
  code += `${indent}if min_length > 0 and len(user_text) < min_length:\n`;
  code += `${indent}    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n`;
  code += `${indent}    await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n`;
  code += `${indent}    return\n`;
  return code;
}

/**
 * Генерирует Python-код для валидации максимальной длины
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки максимальной длины
 */
export function generateMaxLengthValidation(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}if max_length > 0 and len(user_text) > max_length:\n`;
  code += `${indent}    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n`;
  code += `${indent}    await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n`;
  code += `${indent}    return\n`;
  code += `${indent}    \n`;
  return code;
}
