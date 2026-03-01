import { generateButtonText } from '../format/generateButtonText';
import { toPythonBoolean } from "../format/toPythonBoolean";
import { generateAdjustCode } from './generateKeyboardLayoutCode';

/**
 * Генерирует код для reply клавиатуры
 *
 * @param buttons - Массив кнопок
 * @param indentLevel - Уровень отступа
 * @param nodeId - ID узла
 * @param nodeData - Данные узла (включая keyboardLayout)
 * @returns Python-код для reply клавиатуры
 */
export function generateReplyKeyboardCode(buttons: any[], indentLevel: string, _nodeId?: string, nodeData?: any): string {
  if (!buttons || buttons.length === 0) {
    let code = '';
    code += `${indentLevel}keyboard = None  # Нет кнопок, клавиатура не нужна\n`;
    code += `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;
    return code;
  }

  let code = '';
  code += `${indentLevel}builder = ReplyKeyboardBuilder()\n`;

  buttons.forEach((button, _index) => {
    if (button.action === "contact" && button.requestContact) {
      code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
    } else if (button.action === "location" && button.requestLocation) {
      code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
    } else {
      code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
    }
  });

  // Используем keyboardLayout если есть
  if (nodeData?.keyboardLayout && !nodeData.keyboardLayout.autoLayout) {
    code += `${indentLevel}${generateAdjustCode(nodeData.keyboardLayout, buttons.length)}`;
  } else {
    // Старая логика: resizeKeyboard по умолчанию true
    const resizeKeyboard = toPythonBoolean(nodeData?.resizeKeyboard !== false);
    const oneTimeKeyboard = toPythonBoolean(nodeData?.oneTimeKeyboard === true);
    code += `${indentLevel}builder.adjust(${nodeData?.keyboardLayout?.columns || 2})\n`;
    code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
    return code;
  }

  const resizeKeyboard = toPythonBoolean(nodeData?.resizeKeyboard !== false);
  const oneTimeKeyboard = toPythonBoolean(nodeData?.oneTimeKeyboard === true);
  code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

  code += `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;

  return code;
}
