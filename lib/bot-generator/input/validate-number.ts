/**
 * @fileoverview Валидация числа
 * Функции для генерации кода валидации числовых значений
 */

/**
 * Генерирует валидацию числа
 * @returns {string} Python код валидации числа
 */
export const generateNumberValidation = (): string => {
  let code = '    elif input_type == "number":\n';
  code += '        try:\n';
  code += '            float(user_text)\n';
  code += '        except ValueError:\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  return code;
};
