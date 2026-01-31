import { Button } from '../../../shared/schema';
import { generateButtonText } from './format';
import { calculateOptimalColumns } from './format/calculateOptimalColumns';

/**
 * Генерирует Python-код для создания inline клавиатуры для start узла
 * @param buttons - массив кнопок
 * @param keyboardType - тип клавиатуры
 * @param nodeData - данные узла
 * @param indent - отступ для кода
 * @returns Строку с Python-кодом для создания inline клавиатуры
 */
export function generateStartNodeInlineKeyboardCode(
  buttons: Button[],
  keyboardType: string,
  nodeData: any,
  indent: string = '    '
): string {
  let code = '';

  if (keyboardType === "inline" && buttons && buttons.length > 0) {
    code += `${indent}# Проверяем, есть ли условная клавиатура\n`;
    code += `${indent}if keyboard is None:\n`;
    code += `${indent}    # Создаем inline клавиатуру для start узла\n`;
    code += `${indent}    builder = InlineKeyboardBuilder()\n`;
    
    buttons.forEach((btn: Button, index: number) => {
      if (btn.action === "url") {
        code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
      } else if (btn.action === 'goto') {
        // Создаем уникальный callback_data для каждой кнопки
        const baseCallbackData = btn.target || btn.id || 'no_action';
        const callbackData = `${baseCallbackData}_btn_${index}`;
        code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
      } else if (btn.action === 'command') {
        // Для кнопок команд создаем специальную callback_data
        const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
        code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
      }
    });
    
    // Добавляем настройку колонок для консистентности
    const columns = calculateOptimalColumns(buttons, nodeData);
    code += `${indent}    builder.adjust(${columns})\n`;
    code += `${indent}    keyboard = builder.as_markup()\n`;
  }

  return code;
}