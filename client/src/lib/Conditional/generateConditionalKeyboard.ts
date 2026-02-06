import { Button } from "../bot-generator";
import { generateButtonText } from '../Keyboard/generateButtonText';
import { calculateOptimalColumns } from '../Keyboard/calculateOptimalColumns';
import { toPythonBoolean } from "../format/toPythonBoolean";
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python код клавиатуры для условного сообщения в Telegram боте.
 * 
 * Эта функция создает Python код для создания inline или reply клавиатур в условных сообщениях.
 * Функция поддерживает различные типы кнопок (URL, переходы, команды, контакты, местоположение)
 * и автоматически настраивает оптимальное распределение колонок для лучшего отображения.
 * 
 * Основные возможности генерации:
 * - Inline клавиатуры с callback_data для интерактивных кнопок
 * - Reply клавиатуры с поддержкой специальных запросов (контакт, местоположение)
 * - Автоматическая генерация conditional_callback_data для кнопок команд
 * - Оптимизация количества колонок для лучшего UX
 * - Поддержка всех стандартных типов кнопок Telegram
 * 
 * @param condition - Объект условного сообщения, содержащий настройки клавиатуры и кнопки
 * @param indentLevel - Отступ для генерируемого Python кода (обычно '    ' для функций)
 * @param nodeData - Дополнительные данные узла для контекста (опционально)
 * @returns Строку с Python кодом для создания клавиатуры, или пустую строку если клавиатура не нужна
 * 
 * @example
 * const condition = {
 *   keyboardType: 'inline',
 *   variableName: 'user_age',
 *   buttons: [
 *     { text: 'Взрослый контент', action: 'command', target: '/adult' },
 *     { text: 'Детский контент', action: 'command', target: '/kids' },
 *     { text: 'Сайт', action: 'url', url: 'https://example.com' }
 *   ]
 * };
 * 
 * const code = generateConditionalKeyboard(condition, '    ');
 * // Генерирует Python код для inline клавиатуры с условными кнопками
 */
export function generateConditionalKeyboard(condition: any, indentLevel: string, nodeData?: any): string {
  // Проверяем наличие клавиатуры и её настроек
  if (!condition?.keyboardType || 
      condition.keyboardType === 'none' || 
      !condition?.buttons || 
      condition.buttons.length === 0) {
    return '';
  }

  // Собираем код в массив строк для автоматической обработки комментариями
  const codeLines: string[] = [];

  if (condition.keyboardType === 'inline') {
    // Создаем inline клавиатуру
    codeLines.push(`${indentLevel}# Создаем inline клавиатуру для условного сообщения`);
    codeLines.push(`${indentLevel}builder = InlineKeyboardBuilder()`);

    // Обрабатываем каждую кнопку
    condition.buttons.forEach((button: Button) => {
      if (button.action === "url") {
        codeLines.push(`${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))`);
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        codeLines.push(`${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))`);
      } else if (button.action === 'command') {
        // Для кнопок команд в условных сообщениях создаем специальную callback_data
        const conditionalVariableName = condition.variableName || condition.variableNames?.[0] || (nodeData && nodeData.inputVariable);
        if (conditionalVariableName) {
          const conditionalCallback = `conditional_${conditionalVariableName}_${button.text}`;
          codeLines.push(`${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${conditionalCallback}"))`);
        } else {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          codeLines.push(`${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))`);
        }
      } else {
        const callbackData = button.target || button.id || 'no_action';
        codeLines.push(`${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))`);
      }
    });

    // Автоматическое распределение колонок для inline клавиатуры
    const columns = calculateOptimalColumns(condition.buttons, nodeData);
    codeLines.push(`${indentLevel}builder.adjust(${columns})`);
    codeLines.push(`${indentLevel}keyboard = builder.as_markup()`);
    codeLines.push(`${indentLevel}conditional_keyboard = keyboard`);

  } else if (condition.keyboardType === 'reply') {
    // Создаем reply клавиатуру
    codeLines.push(`${indentLevel}# Создаем reply клавиатуру для условного сообщения`);
    codeLines.push(`${indentLevel}builder = ReplyKeyboardBuilder()`);

    condition.buttons.forEach((button: Button) => {
      if (button.action === "contact" && button.requestContact) {
        codeLines.push(`${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))`);
      } else if (button.action === "location" && button.requestLocation) {
        codeLines.push(`${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))`);
      } else {
        codeLines.push(`${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))`);
      }
    });

    // Используем oneTimeKeyboard из настроек условного сообщения
    const conditionOneTimeKb = toPythonBoolean(condition.oneTimeKeyboard === true);
    codeLines.push(`${indentLevel}keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKb})`);
    codeLines.push(`${indentLevel}conditional_keyboard = keyboard`);
  }

  // Применяем автоматическое добавление комментариев о генерации
  const processedCode = processCodeWithAutoComments(codeLines, 'generateConditionalKeyboard.ts');
  
  return processedCode.join('\n');
}
