import { Button } from "../../bot-generator";
import { generateKeyboard } from '../../templates/keyboard';
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
    // Создаем inline клавиатуру через Jinja2 шаблон
    codeLines.push(`${indentLevel}# Создаем inline клавиатуру для условного сообщения`);
    const keyboardCode = generateKeyboard({
      keyboardType: 'inline',
      buttons: condition.buttons || [],
      nodeId: condition.nodeId || 'conditional',
      keyboardLayout: condition.keyboardLayout,
      indentLevel,
    });
    codeLines.push(keyboardCode.trimEnd());
    codeLines.push(`${indentLevel}conditional_keyboard = keyboard`);

  } else if (condition.keyboardType === 'reply') {
    // Создаем reply клавиатуру через Jinja2 шаблон
    codeLines.push(`${indentLevel}# Создаем reply клавиатуру для условного сообщения`);
    const keyboardCode = generateKeyboard({
      keyboardType: 'reply',
      buttons: condition.buttons || [],
      nodeId: condition.nodeId || 'conditional',
      keyboardLayout: condition.keyboardLayout,
      indentLevel,
      resizeKeyboard: true,
      oneTimeKeyboard: condition.oneTimeKeyboard === true,
    });
    codeLines.push(keyboardCode.trimEnd());
    codeLines.push(`${indentLevel}conditional_keyboard = keyboard`);
  }

  // Применяем автоматическое добавление комментариев о генерации
  const processedCode = processCodeWithAutoComments(codeLines, 'generateConditionalKeyboard.ts');
  
  return processedCode.join('\n');
}
