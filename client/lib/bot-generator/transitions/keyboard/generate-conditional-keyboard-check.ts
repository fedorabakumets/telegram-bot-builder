/**
 * @fileoverview Генерация проверки условной клавиатуры
 * 
 * Модуль создаёт Python-код для проверки и использования
 * условной клавиатуры если она была создана.
 * 
 * @module bot-generator/transitions/keyboard/generate-conditional-keyboard-check
 */

/**
 * Генерирует Python-код для проверки условной клавиатуры
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateConditionalKeyboardCheck(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Проверяем, есть ли условная клавиатура для использования\n`;
  code += `${indent}# Инициализируем переменную conditional_keyboard, если она не была определена\n`;
  code += `${indent}if "conditional_keyboard" not in locals():\n`;
  code += `${indent}    conditional_keyboard = None\n`;
  code += `${indent}user_id = callback_query.from_user.id\n`;
  code += `${indent}if user_id not in user_data:\n`;
  code += `${indent}    user_data[user_id] = {}\n`;
  code += `${indent}if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n`;
  code += `${indent}    keyboard = conditional_keyboard\n`;
  code += `${indent}    user_data[user_id]["_has_conditional_keyboard"] = True\n`;
  code += `${indent}    logging.info("✅ Используем условную клавиатуру для навигации")\n`;
  code += `${indent}else:\n`;
  code += `${indent}    user_data[user_id]["_has_conditional_keyboard"] = False\n`;
  code += `${indent}\n`;
  
  return code;
}
