/**
 * @fileoverview Валидация email
 * Функции для генерации кода валидации email адресов
 */

/**
 * Генерирует валидацию email
 * @returns {string} Python код валидации email
 */
export const generateEmailValidation = (): string => {
  let code = '    if input_type == "email":\n';
  code += '        import re\n';
  code += '        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '        if not re.match(email_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  return code;
};
