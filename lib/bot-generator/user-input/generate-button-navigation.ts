/**
 * @fileoverview Генерация навигации на основе действия кнопки
 * 
 * Модуль создаёт Python-код для обработки действий кнопки:
 * url (открытие ссылки), command (выполнение команды), goto (переход к узлу).
 * 
 * @module bot-generator/user-input/generate-button-navigation
 */

/**
 * Генерирует Python-код для извлечения параметров действия кнопки
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код извлечения параметров
 */
export function generateButtonActionExtract(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Навигация на основе действия кнопки\n`;
  code += `${indent}option_action = selected_option.get("action", "goto")\n`;
  code += `${indent}option_target = selected_option.get("target", "")\n`;
  code += `${indent}option_url = selected_option.get("url", "")\n`;
  code += `${indent}    \n`;
  return code;
}

/**
 * Генерирует Python-код для обработки URL действия
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код обработки URL
 */
export function generateUrlActionHandler(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}if option_action == "url" and option_url:\n`;
  code += `${indent}    # Открытие ссылки\n`;
  code += `${indent}    url = option_url\n`;
  code += `${indent}    keyboard = InlineKeyboardMarkup(inline_keyboard=[\n`;
  code += `${indent}        [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]\n`;
  code += `${indent}    ])\n`;
  code += `${indent}    await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)\n`;
  return code;
}
