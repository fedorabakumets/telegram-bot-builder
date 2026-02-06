import { generateButtonText } from '../format/generateButtonText';
import { toPythonBoolean } from "../format/toPythonBoolean";

// Функция для генерации reply клавиатуры

export function generateReplyKeyboardCode(buttons: any[], indentLevel: string, _nodeId?: string, nodeData?: any): string {
  if (!buttons || buttons.length === 0) return '';

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

  const resizeKeyboard = toPythonBoolean(nodeData?.resizeKeyboard !== false);
  const oneTimeKeyboard = toPythonBoolean(nodeData?.oneTimeKeyboard === true);
  code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

  return code;
}
