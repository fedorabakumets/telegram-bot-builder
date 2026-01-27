import { isLoggingEnabled } from "../bot-generator";
import { generateButtonText } from '../format/generateButtonText';
import { calculateOptimalColumns } from '../format/calculateOptimalColumns';
import { generateUniqueShortId } from '../format/generateUniqueShortId';
import { generateReplyKeyboardCode } from './generateReplyKeyboardCode';

// Функция для генерации inline клавиатуры с автоматической настройкой колонок
export function generateInlineKeyboardCode(buttons: any[], indentLevel: string, nodeId?: string, nodeData?: any, allNodeIds?: string[]): string {
  if (!buttons || buttons.length === 0) return '';

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
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИНИЦИАЛИЗИРУЕМ состояние множественного выбора для узла ${nodeId}`);
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

  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: generateInlineKeyboardCode для узла ${nodeId}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: nodeData.allowMultipleSelection = ${nodeData?.allowMultipleSelection}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons = ${hasSelectionButtons}, isMultipleSelection = ${isMultipleSelection}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget = ${nodeData?.continueButtonTarget}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Полный объект nodeData:`, JSON.stringify(nodeData, null, 2));
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Проверяем условие инициализации: hasSelectionButtons=${hasSelectionButtons} && isMultipleSelection=${isMultipleSelection}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Результат проверки: ${hasSelectionButtons && isMultipleSelection}`);

  buttons.forEach((button, _index) => {
    if (button.action === "url") {
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto') {
      const baseCallbackData = button.target || button.id || 'no_action';
      // Для кнопок goto всегда используем target как callback_data без суффиксов
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${baseCallbackData}"))\n`;
    } else if (button.action === 'command') {
      const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
      code += `${indentLevel}logging.info(f"Создана кнопка команды: ${button.text} -> ${commandCallback}")\n`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
    } else if (button.action === 'selection') {
      // Укорачиваем callback_data для соблюдения лимита Telegram в 64 байта
      const shortNodeId = nodeId ? generateUniqueShortId(nodeId, allNodeIds || []) : 'sel';
      const shortTarget = button.target || button.id || 'btn'; // Используем полный target без обрезки для совместимости с обработчиком
      const callbackData = `ms_${shortNodeId}_${shortTarget}`;
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Создана кнопка selection: ${button.text} -> ${callbackData} (shortNodeId: ${shortNodeId}) (длина: ${callbackData.length})`);

      // Добавляем галочки для множественного выбора
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: 🔍 ПРОВЕРЯЕМ галочки для ${button.text}: isMultipleSelection=${isMultipleSelection}`);
      if (isMultipleSelection) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ ГАЛОЧКИ для кнопки selection: ${button.text} (узел: ${nodeId})`);
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: 📋 ДАННЫЕ КНОПКИ: text="${button.text}", target="${button.target}", id="${button.id}"`);
        code += `${indentLevel}# Кнопка выбора с галочками: ${button.text}\n`;
        code += `${indentLevel}logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '${button.text}' в списке: {user_data[user_id]['multi_select_${nodeId}']}")\n`;
        code += `${indentLevel}selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
        code += `${indentLevel}logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '${button.text}': selected_mark='{selected_mark}'")\n`;
        code += `${indentLevel}final_text = f"{selected_mark}${button.text}"\n`;
        code += `${indentLevel}logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='${callbackData}'")\n`;
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=final_text, callback_data="${callbackData}"))\n`;
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СГЕНЕРИРОВАН КОД ГАЛОЧЕК для ${button.text} с детальным логированием`);
      } else {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ❌ НЕ добавляем галочки для ${button.text} (isMultipleSelection=${isMultipleSelection})`);
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    } else {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
    }
  });

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ДОБАВЛЯЕМ кнопку "Готово" для множественного выбора
  if (hasSelectionButtons && isMultipleSelection) {
    const continueText = nodeData?.continueButtonText || 'Готово';
    const callbackData = `multi_select_done_${nodeId}`;
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ кнопку "${continueText}" для узла ${nodeId} с callback_data: ${callbackData}`);
    code += `${indentLevel}# Добавляем кнопку "Готово" для множественного выбора\n`;
    code += `${indentLevel}builder.add(InlineKeyboardButton(text="${continueText}", callback_data="${callbackData}"))\n`;
  }

  // Автоматическое распределение колонок с учетом данных узла и кнопки "Готово"
  let allButtons = [...buttons];
  if (hasSelectionButtons && isMultipleSelection) {
    // Добавляем виртуальную кнопку "Готово" для правильного подсчета колонок
    allButtons.push({ text: nodeData?.continueButtonText || 'Готово' });
  }
  const columns = calculateOptimalColumns(allButtons, nodeData);
  code += `${indentLevel}builder.adjust(${columns})\n`;
  code += `${indentLevel}keyboard = builder.as_markup()\n`;

  return code;
}
