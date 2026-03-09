/**
 * @fileoverview Валидация телефона
 * Функции для генерации кода валидации телефонных номеров
 */

/**
 * Генерирует валидацию телефона
 * @returns {string} Python код валидации телефона
 */
export const generatePhoneValidation = (): string => {
  let code = '    elif input_type == "phone":\n';
  code += '        import re\n';
  code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '        if not re.match(phone_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  return code;
};
