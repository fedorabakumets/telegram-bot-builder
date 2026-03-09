/**
 * @fileoverview Генерация обработки неверного выбора кнопки
 * 
 * Модуль создаёт Python-код для сообщения пользователю
 * о неверном выборе и показа доступных вариантов.
 * 
 * @module bot-generator/user-input/generate-invalid-choice-handler
 */

/**
 * Генерирует Python-код для обработки неверного выбора
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код обработки неверного выбора
 */
export function generateInvalidChoiceHandler(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}else:\n`;
  code += `${indent}    # Неверный выбор - показываем доступные варианты\n`;
  code += `${indent}    available_options = [option["text"] for option in config.get("options", [])]\n`;
  code += `${indent}    options_text = "\\n".join([f"• {opt}" for opt in available_options])\n`;
  code += `${indent}    await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\\n\\n{options_text}")\n`;
  code += `${indent}    return\n`;
  return code;
}
