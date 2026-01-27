import { Button } from "../bot-generator";
import { generateButtonText } from '../format/generateButtonText';
import { calculateOptimalColumns } from '../format/calculateOptimalColumns';
import { toPythonBoolean } from "../format/toPythonBoolean";

// Функция для генерации клавиатуры для условного сообщения
export function generateConditionalKeyboard(condition: any, indentLevel: string, nodeData?: any): string {
  if (!condition.keyboardType || condition.keyboardType === 'none' || !condition.buttons || condition.buttons.length === 0) {
    return '';
  }

  let code = '';

  if (condition.keyboardType === 'inline') {
    code += `${indentLevel}# Создаем inline клавиатуру для условного сообщения\n`;
    code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;

    condition.buttons.forEach((button: Button) => {
      if (button.action === "url") {
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      } else if (button.action === 'command') {
        // Для кнопок команд в условных сообщениях, которые должны сохранять данные
        // Создаем специальную callback_data с переменной и значением из условного сообщения
        const conditionalVariableName = condition.variableName || condition.variableNames?.[0] || (nodeData && nodeData.inputVariable);
        if (conditionalVariableName) {
          const conditionalCallback = `conditional_${conditionalVariableName}_${button.text}`;
          code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${conditionalCallback}"))\n`;
        } else {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
        }
      } else {
        const callbackData = button.target || button.id || 'no_action';
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    });

    // Автоматическое распределение колонок для inline клавиатуры
    const columns = calculateOptimalColumns(condition.buttons, nodeData);
    code += `${indentLevel}builder.adjust(${columns})\n`;
    code += `${indentLevel}keyboard = builder.as_markup()\n`;
    code += `${indentLevel}conditional_keyboard = keyboard\n`;

  } else if (condition.keyboardType === 'reply') {
    code += `${indentLevel}# Создаем reply клавиатуру для условного сообщения\n`;
    code += `${indentLevel}builder = ReplyKeyboardBuilder()\n`;

    condition.buttons.forEach((button: Button) => {
      if (button.action === "contact" && button.requestContact) {
        code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
      } else if (button.action === "location" && button.requestLocation) {
        code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
      } else {
        code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
      }
    });

    // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
    const conditionOneTimeKb = toPythonBoolean(condition.oneTimeKeyboard === true);
    code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKb})\n`;
    code += `${indentLevel}conditional_keyboard = keyboard\n`;
  }

  return code;
}
