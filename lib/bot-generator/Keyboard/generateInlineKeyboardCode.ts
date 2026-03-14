import { generatorLogger } from '../core/generator-logger';
import { generateButtonText } from '../format/generateButtonText';
import { calculateOptimalColumns } from './calculateOptimalColumns';
import { generateUniqueShortId } from '../format/generateUniqueShortId';
import { generateReplyKeyboardCode } from './generateReplyKeyboardCode';
import { generateAdjustCode } from './generateKeyboardLayoutCode';
import { escapePythonString } from '../format/escapePythonString';

// Функция для генерации inline клавиатуры с автоматической настройкой колонок
export function generateInlineKeyboardCode(buttons: any[], indentLevel: string, nodeId?: string, nodeData?: any, allNodeIds?: string[]): string {
  if (!buttons || buttons.length === 0) {
    // Даже если нет кнопок, нужно определить переменные клавиатуры для предотвращения ошибок
    let code = '';
    code += `${indentLevel}keyboard = None  # Нет кнопок, клавиатура не нужна\n`;
    code += `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;
    return code;
  }

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем keyboardType и делегируем на правильную функцию
  const keyboardType = nodeData?.keyboardType || 'reply';
  if (keyboardType === 'reply') {
    // Для reply клавиатуры вызываем специальную функцию
    return generateReplyKeyboardCode(buttons, indentLevel, nodeId, nodeData);
  }

  // Продолжаем генерацию inline клавиатуры только если keyboardType === 'inline'
  let code = '';

  // Проверяем, есть ли кнопки выбора (selection) - если да, то это множественный выбор
  const hasSelectionButtons = buttons.some(button => button.action === 'selection');
  const isMultipleSelection = nodeData?.allowMultipleSelection === true;

  // Если есть множественный выбор, добавляем инициализацию состояния
  if (hasSelectionButtons && isMultipleSelection) {
    generatorLogger.debug(`Инициализация множественного выбора для узла: ${nodeId}`);
    const multiSelectVariable = nodeData?.multiSelectVariable || 'user_interests';
    const multiSelectKeyboardType = nodeData?.keyboardType || 'reply';

    code += `${indentLevel}# Инициализация состояния множественного выбора\n`;
    code += `${indentLevel}if user_id not in user_data:\n`;
    code += `${indentLevel}    user_data[user_id] = {}\n`;
    code += `${indentLevel}\n`;
    code += `${indentLevel}# Загружаем ранее выбранные варианты\n`;
    code += `${indentLevel}saved_selections = []\n`;
    code += `${indentLevel}if user_vars:\n`;
    code += `${indentLevel}    for var_name, var_data in user_vars.items():\n`;
    code += `${indentLevel}        if var_name == "${multiSelectVariable}":\n`;
    code += `${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:\n`;
    code += `${indentLevel}                selections_str = var_data["value"]\n`;
    code += `${indentLevel}            elif isinstance(var_data, str):\n`;
    code += `${indentLevel}                selections_str = var_data\n`;
    code += `${indentLevel}            else:\n`;
    code += `${indentLevel}                continue\n`;
    code += `${indentLevel}            if selections_str and selections_str.strip():\n`;
    code += `${indentLevel}                saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]\n`;
    code += `${indentLevel}                break\n`;
    code += `${indentLevel}\n`;
    code += `${indentLevel}# Инициализируем состояние если его нет\n`;
    code += `${indentLevel}if "multi_select_${nodeId}" not in user_data[user_id]:\n`;
    code += `${indentLevel}    user_data[user_id]["multi_select_${nodeId}"] = saved_selections.copy()\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_node"] = "${nodeId}"\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_type"] = "${multiSelectKeyboardType}"\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
    code += `${indentLevel}logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n`;
    code += `${indentLevel}\n`;
  }

  code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;

  generatorLogger.debug(`generateInlineKeyboardCode для узла: ${nodeId}`);
  generatorLogger.debug(`nodeData.allowMultipleSelection: ${nodeData?.allowMultipleSelection}`);
  generatorLogger.debug(`hasSelectionButtons: ${hasSelectionButtons}, isMultipleSelection: ${isMultipleSelection}`);
  generatorLogger.debug(`continueButtonTarget: ${nodeData?.continueButtonTarget}`);
  generatorLogger.debug(`nodeData:`, JSON.stringify(nodeData, null, 2));

  buttons.forEach((button, _index) => {
    if (button.action === "url") {
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto' || button.action === 'complete') {
      const baseCallbackData = button.target || button.id || 'no_action';
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${baseCallbackData}"))\n`;
    } else if (button.action === 'selection') {
      // Укорачиваем callback_data для соблюдения лимита Telegram в 64 байта
      const shortNodeId = nodeId ? generateUniqueShortId(nodeId, allNodeIds || []) : 'sel';
      const shortTarget = (button.target || button.id || 'btn').slice(-8); // Обрезаем до 8 последних символов для совместимости с обработчиком
      const callbackData = `ms_${shortNodeId}_${shortTarget}`;
      generatorLogger.debug(`ИСПРАВЛЕНО! Создана кнопка selection: ${button.text} -> ${callbackData} (длина: ${callbackData.length})`);

      // Добавляем галочки для множественного выбора
      if (isMultipleSelection) {
        generatorLogger.debug(`ДОБАВЛЯЕМ ГАЛОЧКИ для кнопки selection: ${button.text} (узел: ${nodeId})`);
        code += `${indentLevel}# Кнопка выбора с галочками: ${button.text}\n`;
        const escapedText = button.text.replace(/'/g, "\\'");
        code += `${indentLevel}logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '${escapedText}' в списке: {{user_data[user_id]['multi_select_${nodeId}']}}")\n`;
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=f"{'✅ ' if '${escapedText}' in user_data[user_id]['multi_select_${nodeId}'] else ''}${escapedText}", callback_data="${callbackData}"))\n`;
      } else {
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    }
  });

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ДОБАВЛЯЕМ кнопку "Готово" для множественного выбора
  const completeButton = buttons.find((btn: any) => btn.action === 'complete');
  if (hasSelectionButtons && isMultipleSelection && completeButton && nodeId) {
    const shortNodeIdForDone = generateUniqueShortId(nodeId, allNodeIds || []);
    const callbackData = `done_${shortNodeIdForDone}`;
    generatorLogger.debug(`ДОБАВЛЯЕМ кнопку "${completeButton.text}" для узла ${nodeId} с callback_data: ${callbackData}`);
    code += `${indentLevel}# Добавляем кнопку "Готово" для множественного выбора\n`;
    code += `${indentLevel}builder.add(InlineKeyboardButton(text=${escapePythonString(completeButton.text)}, callback_data="${callbackData}"))\n`;
  }

  // ИСПРАВЛЕНИЕ: Используем keyboardLayout если есть, иначе calculateOptimalColumns
  let adjustCode: string;
  if (nodeData?.keyboardLayout && !nodeData.keyboardLayout.autoLayout) {
    // Используем keyboardLayout для генерации adjust()
    adjustCode = generateAdjustCode(nodeData.keyboardLayout, buttons.length);
  } else {
    // Старая логика с calculateOptimalColumns
    const columns = isMultipleSelection ? 2 : calculateOptimalColumns(buttons, nodeData);
    adjustCode = `builder.adjust(${columns})\n`;
  }
  code += `${indentLevel}${adjustCode}`;
  code += `${indentLevel}keyboard = builder.as_markup()\n`;

  // Добавляем переменную keyboardHTML как альтернативу (пустая строка по умолчанию)
  code += `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;

  return code;
}
