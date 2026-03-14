/**
 * @fileoverview Валидация длины текста
 * Функции для генерации кода валидации длины ввода
 */

/**
 * Генерирует валидацию минимальной длины
 * @returns {string} Python код валидации
 */
export const generateMinLengthValidation = (): string => {
  let code = '    if min_length > 0 and len(user_text) < min_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '        return\n';
  return code;
};

/**
 * Генерирует валидацию максимальной длины
 * @returns {string} Python код валидации
 */
export const generateMaxLengthValidation = (): string => {
  let code = '    if max_length > 0 and len(user_text) > max_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '        return\n';
  return code;
};

/**
 * Генерирует код валидации длины текста
 * @returns {string} Python код валидации длины
 */
export const generateLengthValidation = (): string => {
  let code = '    # Валидация длины текста\n';
  code += '    min_length = input_config.get("min_length", 0)\n';
  code += '    max_length = input_config.get("max_length", 0)\n';
  code += '    \n';
  code += generateMinLengthValidation();
  code += generateMaxLengthValidation();
  return code;
};
