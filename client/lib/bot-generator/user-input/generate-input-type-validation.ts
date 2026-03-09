/**
 * @fileoverview Генерация валидации типа ввода
 * 
 * Модуль создаёт Python-код для проверки формата email,
 * телефона и числовых значений.
 * 
 * @module bot-generator/user-input/generate-input-type-validation
 */

/**
 * Генерирует Python-код для валидации email
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки email
 */
export function generateEmailValidation(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Валидация типа ввода\n`;
  code += `${indent}if input_type == "email":\n`;
  code += `${indent}    import re\n`;
  code += `${indent}    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n`;
  code += `${indent}    if not re.match(email_pattern, user_text):\n`;
  code += `${indent}        retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n`;
  code += `${indent}        await message.answer(f"❌ Неверный формат email. {retry_message}")\n`;
  code += `${indent}        return\n`;
  return code;
}

/**
 * Генерирует Python-код для валидации number
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки number
 */
export function generateNumberValidation(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}elif input_type == "number":\n`;
  code += `${indent}    try:\n`;
  code += `${indent}        float(user_text)\n`;
  code += `${indent}    except ValueError:\n`;
  code += `${indent}        retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n`;
  code += `${indent}        await message.answer(f"❌ Введите корректное число. {retry_message}")\n`;
  code += `${indent}        return\n`;
  return code;
}

/**
 * Генерирует Python-код для валидации phone
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки phone
 */
export function generatePhoneValidation(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}elif input_type == "phone":\n`;
  code += `${indent}    import re\n`;
  code += `${indent}    phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n`;
  code += `${indent}    if not re.match(phone_pattern, user_text):\n`;
  code += `${indent}        retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n`;
  code += `${indent}        await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n`;
  code += `${indent}        return\n`;
  return code;
}
