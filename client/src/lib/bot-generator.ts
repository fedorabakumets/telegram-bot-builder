import { BotData, Node, BotGroup } from '@shared/schema';
import { generateBotFatherCommands } from './commands';

// Функция для правильного экранирования строк в Python коде
function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для удаления HTML тегов из текста
function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

// Функция для правильного форматирования текста с поддержкой многострочности
function formatTextForPython(text: string): string {
  if (!text) return '""';
  
  // Для многострочного текста используем тройные кавычки
  if (text.includes('\n')) {
    return `"""${text}"""`;
  } else {
    // Для однострочного текста экранируем только кавычки
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}

// Функция для получения режима парсинга
function getParseMode(formatMode: string): string {
  if (formatMode === 'html') {
    return ', parse_mode=ParseMode.HTML';
  } else if (formatMode === 'markdown') {
    return ', parse_mode=ParseMode.MARKDOWN';
  }
  return '';
}

// Функция для конвертации JavaScript boolean в Python boolean
function toPythonBoolean(value: any): string {
  return value ? 'True' : 'False';
}

// Функция для создания уникальных коротких ID для узлов
function generateUniqueShortId(nodeId: string, allNodeIds: string[]): string {
  if (!nodeId) return 'node';
  
  // Особая обработка для узлов интересов
  if (nodeId.endsWith('_interests')) {
    const prefix = nodeId.replace('_interests', '');
    // Возвращаем первые 5-6 символов префикса для уникальности
    return prefix.substring(0, Math.min(6, prefix.length));
  }
  
  // Для метро и других узлов используем старую логику
  const baseShortId = nodeId.slice(-10).replace(/^_+/, '');
  
  // Проверяем уникальность среди всех узлов
  const conflicts = allNodeIds.filter(id => {
    const otherShortId = id.slice(-10).replace(/^_+/, '');
    return otherShortId === baseShortId && id !== nodeId;
  });
  
  // Если конфликтов нет, возвращаем базовый ID
  if (conflicts.length === 0) {
    return baseShortId;
  }
  
  // Если есть конфликты, берем более уникальную часть
  return nodeId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
}

// Функция для правильного экранирования строк в JSON контексте
function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для вычисления оптимального количества колонок для кнопок
function calculateOptimalColumns(buttons: any[], nodeData?: any): number {
  if (!buttons || buttons.length === 0) return 1;
  
  const totalButtons = buttons.length;
  
  // Если это множественный выбор, всегда используем 2 колонки для красивого вида
  if (nodeData?.multiSelectEnabled || nodeData?.allowMultipleSelection) {
    return 2;
  }
  
  // Стандартная логика для обычных кнопок
  if (totalButtons >= 6) {
    return 2; // Для 6+ кнопок - 2 колонки
  } else if (totalButtons >= 3) {
    return 1; // Для 3-5 кнопок - 1 колонка для удобочитаемости
  } else {
    return 1; // Для 1-2 кнопок - 1 колонка
  }
}

// Функция для генерации inline клавиатуры с автоматической настройкой колонок
function generateInlineKeyboardCode(buttons: any[], indentLevel: string, nodeId?: string, nodeData?: any, allNodeIds?: string[]): string {
  if (!buttons || buttons.length === 0) return '';
  
  let code = '';
  
  // Проверяем, есть ли кнопки выбора (selection) - если да, то это множественный выбор
  const hasSelectionButtons = buttons.some(button => button.action === 'selection');
  const isMultipleSelection = nodeData?.allowMultipleSelection === true;
  
  // Если есть множественный выбор, добавляем инициализацию состояния
  if (hasSelectionButtons && isMultipleSelection) {
    console.log(`🔧 ГЕНЕРАТОР: ИНИЦИАЛИЗИРУЕМ состояние множественного выбора для узла ${nodeId}`);
    const multiSelectVariable = nodeData?.multiSelectVariable || 'user_interests';
    
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
    code += `${indentLevel}user_data[user_id]["multi_select_type"] = "inline"\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
    code += `${indentLevel}logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n`;
    code += `${indentLevel}\n`;
  }
  
  code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;
  
  console.log(`🔧 ГЕНЕРАТОР: generateInlineKeyboardCode для узла ${nodeId}`);
  console.log(`🔧 ГЕНЕРАТОР: nodeData.allowMultipleSelection = ${nodeData?.allowMultipleSelection}`);
  console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons = ${hasSelectionButtons}, isMultipleSelection = ${isMultipleSelection}`);
  console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget = ${nodeData?.continueButtonTarget}`);
  console.log(`🔧 ГЕНЕРАТОР: Полный объект nodeData:`, JSON.stringify(nodeData, null, 2));
  console.log(`🔧 ГЕНЕРАТОР: Проверяем условие инициализации: hasSelectionButtons=${hasSelectionButtons} && isMultipleSelection=${isMultipleSelection}`);
  console.log(`🔧 ГЕНЕРАТОР: Результат проверки: ${hasSelectionButtons && isMultipleSelection}`);
  
  buttons.forEach((button, index) => {
    if (button.action === "url") {
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto') {
      const baseCallbackData = button.target || button.id || 'no_action';
      // Для кнопок goto всегда используем target как callback_data без суффиксов
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${baseCallbackData}"))\n`;
    } else if (button.action === 'command') {
      const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
      code += `${indentLevel}logging.info(f"Создана кнопка команды: ${button.text} -> ${commandCallback}")\n`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
    } else if (button.action === 'selection') {
      // Укорачиваем callback_data для соблюдения лимита Telegram в 64 байта
      const shortNodeId = nodeId ? generateUniqueShortId(nodeId, allNodeIds || []) : 'sel';
      const shortTarget = button.target || button.id || 'btn'; // Используем полный target без обрезки для совместимости с обработчиком
      const callbackData = `ms_${shortNodeId}_${shortTarget}`;
      console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Создана кнопка selection: ${button.text} -> ${callbackData} (shortNodeId: ${shortNodeId}) (длина: ${callbackData.length})`);
      
      // Добавляем галочки для множественного выбора
      console.log(`🔧 ГЕНЕРАТОР: 🔍 ПРОВЕРЯЕМ галочки для ${button.text}: isMultipleSelection=${isMultipleSelection}`);
      if (isMultipleSelection) {
        console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ ГАЛОЧКИ для кнопки selection: ${button.text} (узел: ${nodeId})`);
        console.log(`🔧 ГЕНЕРАТОР: 📋 ДАННЫЕ КНОПКИ: text="${button.text}", target="${button.target}", id="${button.id}"`);
        code += `${indentLevel}# Кнопка выбора с галочками: ${button.text}\n`;
        code += `${indentLevel}logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '${button.text}' в списке: {user_data[user_id]['multi_select_${nodeId}']}")\n`;
        code += `${indentLevel}selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
        code += `${indentLevel}logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '${button.text}': selected_mark='{selected_mark}'")\n`;
        code += `${indentLevel}final_text = f"{selected_mark}${button.text}"\n`;
        code += `${indentLevel}logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='${callbackData}'")\n`;
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=final_text, callback_data="${callbackData}"))\n`;
        console.log(`🔧 ГЕНЕРАТОР: ✅ СГЕНЕРИРОВАН КОД ГАЛОЧЕК для ${button.text} с детальным логированием`);
      } else {
        console.log(`🔧 ГЕНЕРАТОР: ❌ НЕ добавляем галочки для ${button.text} (isMultipleSelection=${isMultipleSelection})`);
        code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
      }
    } else {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
    }
  });
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ДОБАВЛЯЕМ кнопку "Готово" для множественного выбора
  if (hasSelectionButtons && isMultipleSelection) {
    const continueText = nodeData?.continueButtonText || 'Готово';
    const callbackData = `multi_select_done_${nodeId}`;
    console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ кнопку "${continueText}" для узла ${nodeId} с callback_data: ${callbackData}`);
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

// Функция для генерации замены переменных в тексте
function generateVariableReplacement(variableName: string, indentLevel: string): string {
  let code = '';
  code += `${indentLevel}    # Подставляем значения переменных\n`;
  code += `${indentLevel}    if "{${variableName}}" in text:\n`;
  code += `${indentLevel}        if variable_value is not None:\n`;
  code += `${indentLevel}            text = text.replace("{${variableName}}", str(variable_value))\n`;
  code += `${indentLevel}        else:\n`;
  code += `${indentLevel}            # Если переменная не найдена, отображаем как простой текст\n`;
  code += `${indentLevel}            text = text.replace("{${variableName}}", "${variableName}")\n`;
  return code;
}

// Функция для генерации замены всех переменных в тексте
function generateUniversalVariableReplacement(indentLevel: string): string {
  let code = '';
  code += `${indentLevel}# Подставляем все доступные переменные пользователя в текст\n`;
  code += `${indentLevel}user_vars = await get_user_from_db(user_id)\n`;
  code += `${indentLevel}if not user_vars:\n`;
  code += `${indentLevel}    user_vars = user_data.get(user_id, {})\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# get_user_from_db теперь возвращает уже обработанные user_data\n`;
  code += `${indentLevel}if not isinstance(user_vars, dict):\n`;
  code += `${indentLevel}    user_vars = {}\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Заменяем все переменные в тексте\n`;
  code += `${indentLevel}import re\n`;
  code += `${indentLevel}def replace_variables_in_text(text_content, variables_dict):\n`;
  code += `${indentLevel}    if not text_content or not variables_dict:\n`;
  code += `${indentLevel}        return text_content\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    for var_name, var_data in variables_dict.items():\n`;
  code += `${indentLevel}        placeholder = "{" + var_name + "}"\n`;
  code += `${indentLevel}        if placeholder in text_content:\n`;
  code += `${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:\n`;
  code += `${indentLevel}                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n`;
  code += `${indentLevel}            elif var_data is not None:\n`;
  code += `${indentLevel}                var_value = str(var_data)\n`;
  code += `${indentLevel}            else:\n`;
  code += `${indentLevel}                var_value = var_name  # Показываем имя переменной если значения нет\n`;
  code += `${indentLevel}            text_content = text_content.replace(placeholder, var_value)\n`;
  code += `${indentLevel}    return text_content\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}text = replace_variables_in_text(text, user_vars)\n`;
  return code;
}

// Функция для генерации клавиатуры для условного сообщения
function generateConditionalKeyboard(condition: any, indentLevel: string, nodeData?: any): string {
  if (!condition.keyboardType || condition.keyboardType === 'none' || !condition.buttons || condition.buttons.length === 0) {
    return '';
  }

  let code = '';
  
  if (condition.keyboardType === 'inline') {
    code += `${indentLevel}# Создаем inline клавиатуру для условного сообщения\n`;
    code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;
    
    condition.buttons.forEach((button: any) => {
      if (button.action === "url") {
        code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
      } else if (button.action === 'command') {
        // Для кнопок команд в условных сообщениях, которые должны сохранять данные
        // Создаем специальную callback_data с переменной и значением из условного сообщения
        const conditionalVariableName = condition.variableName || condition.variableNames?.[0] || (nodeData && nodeData.inputVariable);
        if (conditionalVariableName) {
          const conditionalCallback = `conditional_${conditionalVariableName}_${button.text}`;
          code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${conditionalCallback}"))\n`;
        } else {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
        }
      } else {
        const callbackData = button.target || button.id || 'no_action';
        code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
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
    
    condition.buttons.forEach((button: any) => {
      if (button.action === "contact" && button.requestContact) {
        code += `${indentLevel}builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
      } else if (button.action === "location" && button.requestLocation) {
        code += `${indentLevel}builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
      } else {
        code += `${indentLevel}builder.add(KeyboardButton(text="${button.text}"))\n`;
      }
    });
    
    code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)\n`;
    code += `${indentLevel}conditional_keyboard = keyboard\n`;
  }
  
  return code;
}

// Функция для генерации логики условных сообщений
function generateConditionalMessageLogic(conditionalMessages: any[], indentLevel: string = '    ', nodeData?: any): string {
  if (!conditionalMessages || conditionalMessages.length === 0) {
    return '';
  }

  let code = '';
  const sortedConditions = [...conditionalMessages].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Add variables to track conditional parse mode and keyboard
  code += `${indentLevel}conditional_parse_mode = None\n`;
  code += `${indentLevel}conditional_keyboard = None\n`;
  
  // Генерируем единую функцию проверки переменных
  code += `${indentLevel}# Функция для проверки переменных пользователя\n`;
  code += `${indentLevel}def check_user_variable(var_name, user_data_dict):\n`;
  code += `${indentLevel}    """Проверяет существование и получает значение переменной пользователя"""\n`;
  code += `${indentLevel}    # Сначала проверяем в поле user_data (из БД)\n`;
  code += `${indentLevel}    if "user_data" in user_data_dict and user_data_dict["user_data"]:\n`;
  code += `${indentLevel}        try:\n`;
  code += `${indentLevel}            import json\n`;
  code += `${indentLevel}            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n`;
  code += `${indentLevel}            if var_name in parsed_data:\n`;
  code += `${indentLevel}                raw_value = parsed_data[var_name]\n`;
  code += `${indentLevel}                if isinstance(raw_value, dict) and "value" in raw_value:\n`;
  code += `${indentLevel}                    var_value = raw_value["value"]\n`;
  code += `${indentLevel}                    # Проверяем, что значение действительно существует и не пустое\n`;
  code += `${indentLevel}                    if var_value is not None and str(var_value).strip() != "":\n`;
  code += `${indentLevel}                        return True, str(var_value)\n`;
  code += `${indentLevel}                else:\n`;
  code += `${indentLevel}                    # Проверяем, что значение действительно существует и не пустое\n`;
  code += `${indentLevel}                    if raw_value is not None and str(raw_value).strip() != "":\n`;
  code += `${indentLevel}                        return True, str(raw_value)\n`;
  code += `${indentLevel}        except (json.JSONDecodeError, TypeError):\n`;
  code += `${indentLevel}            pass\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Проверяем в локальных данных (без вложенности user_data)\n`;
  code += `${indentLevel}    if var_name in user_data_dict:\n`;
  code += `${indentLevel}        variable_data = user_data_dict.get(var_name)\n`;
  code += `${indentLevel}        if isinstance(variable_data, dict) and "value" in variable_data:\n`;
  code += `${indentLevel}            var_value = variable_data["value"]\n`;
  code += `${indentLevel}            # Проверяем, что значение действительно существует и не пустое\n`;
  code += `${indentLevel}            if var_value is not None and str(var_value).strip() != "":\n`;
  code += `${indentLevel}                return True, str(var_value)\n`;
  code += `${indentLevel}        elif variable_data is not None and str(variable_data).strip() != "":\n`;
  code += `${indentLevel}            return True, str(variable_data)\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    return False, None\n`;
  code += `${indentLevel}\n`;
  
  // Создаем единую if/elif/else структуру для всех условий
  for (let i = 0; i < sortedConditions.length; i++) {
    const condition = sortedConditions[i];
    const cleanedConditionText = stripHtmlTags(condition.messageText);
    const conditionText = formatTextForPython(cleanedConditionText);
    const conditionKeyword = i === 0 ? 'if' : 'elif';
    
    // Get variable names - support both new array format and legacy single variable
    const variableNames = condition.variableNames && condition.variableNames.length > 0 
      ? condition.variableNames 
      : (condition.variableName ? [condition.variableName] : []);
    
    const logicOperator = condition.logicOperator || 'AND';
    
    code += `${indentLevel}# Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;
    
    switch (condition.condition) {
      case 'user_data_exists':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками ВНУТРИ
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          code += `${indentLevel}    check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
        }
        code += `${indentLevel}):\n`;
        
        // Внутри блока условия собираем значения переменных
        code += `${indentLevel}    # Собираем значения переменных\n`;
        code += `${indentLevel}    variable_values = {}\n`;
        for (const varName of variableNames) {
          code += `${indentLevel}    _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
        }
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode1 = getParseMode(condition.formatMode || 'text');
        if (parseMode1) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode1}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Заменяем переменные в тексте
        for (const varName of variableNames) {
          code += `${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
          code += `${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} (${logicOperator})")\n`;
        break;
        
      case 'user_data_not_exists':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками ВНУТРИ (инвертированными)
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          if (logicOperator === 'AND') {
            code += `${indentLevel}    not check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
          } else {
            code += `${indentLevel}    not check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
          }
        }
        code += `${indentLevel}):\n`;
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode2 = getParseMode(condition.formatMode || 'text');
        if (parseMode2) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode2}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для user_data_not_exists
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные ${variableNames} не существуют (${logicOperator})")\n`;
        break;
        
      case 'user_data_equals':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками равенства ВНУТРИ
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          code += `${indentLevel}    check_user_variable("${varName}", user_data_dict)[1] == "${condition.expectedValue || ''}"${operator}\n`;
        }
        code += `${indentLevel}):\n`;
        
        // Внутри блока условия собираем значения переменных
        code += `${indentLevel}    # Собираем значения переменных\n`;
        code += `${indentLevel}    variable_values = {}\n`;
        for (const varName of variableNames) {
          code += `${indentLevel}    _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
        }
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode3 = getParseMode(condition.formatMode || 'text');
        if (parseMode3) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode3}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Заменяем переменные в тексте
        for (const varName of variableNames) {
          code += `${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
          code += `${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для user_data_equals
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} равны '${condition.expectedValue || ''}' (${logicOperator})")\n`;
        break;
        
      case 'user_data_contains':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками содержания ВНУТРИ
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          code += `${indentLevel}    (check_user_variable("${varName}", user_data_dict)[1] is not None and "${condition.expectedValue || ''}" in str(check_user_variable("${varName}", user_data_dict)[1]))${operator}\n`;
        }
        code += `${indentLevel}):\n`;
        
        // Внутри блока условия собираем значения переменных
        code += `${indentLevel}    # Собираем значения переменных\n`;
        code += `${indentLevel}    variable_values = {}\n`;
        for (const varName of variableNames) {
          code += `${indentLevel}    _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
        }
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode4 = getParseMode(condition.formatMode || 'text');
        if (parseMode4) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode4}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Заменяем переменные в тексте
        for (const varName of variableNames) {
          code += `${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
          code += `${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для user_data_contains
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} содержат '${condition.expectedValue || ''}' (${logicOperator})")\n`;
        break;
        
      case 'first_time':
        code += `${indentLevel}${conditionKeyword} user_record.get("interaction_count", 0) <= 1:\n`;
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode5 = getParseMode(condition.formatMode || 'text');
        if (parseMode5) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode5}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для first_time
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info("Условие выполнено: первое посещение пользователя")\n`;
        break;
        
      case 'returning_user':
        code += `${indentLevel}${conditionKeyword} user_record.get("interaction_count", 0) > 1:\n`;
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode6 = getParseMode(condition.formatMode || 'text');
        if (parseMode6) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode6}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для returning_user
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info("Условие выполнено: возвращающийся пользователь")\n`;
        break;
        
      default:
        code += `${indentLevel}${conditionKeyword} False:  # Неизвестное условие: ${condition.condition}\n`;
        code += `${indentLevel}    pass\n`;
        break;
    }
  }
  
  // НЕ добавляем else блок здесь - он будет добавлен основной функцией
  return code;
}

export function generatePythonCode(botData: BotData, botName: string = "MyBot", groups: BotGroup[] = []): string {
  const { nodes, connections } = botData;
  
  // Собираем все ID узлов для генерации уникальных коротких ID
  const allNodeIds = nodes ? nodes.map(node => node.id) : [];
  
  // ЛОГИРОВАНИЕ ГЕНЕРАТОРА: Подробная информация о данных бота
  console.log(`🔧 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${nodes?.length || 0}, связей - ${connections?.length || 0}`);
  
  // Логируем все узлы с их свойствами
  if (nodes && nodes.length > 0) {
    console.log('🔧 ГЕНЕРАТОР: Анализируем все узлы:');
    nodes.forEach((node, index) => {
      const hasMultiSelect = node.data.allowMultipleSelection || node.data.multiSelectEnabled;
      const hasButtons = node.data.buttons && node.data.buttons.length > 0;
      const continueTarget = node.data.continueButtonTarget;
      
      console.log(`🔧 ГЕНЕРАТОР: Узел ${index + 1}: "${node.id}" (тип: ${node.type})`);
      console.log(`🔧 ГЕНЕРАТОР:   - allowMultipleSelection: ${node.data.allowMultipleSelection}`);
      console.log(`🔧 ГЕНЕРАТОР:   - multiSelectEnabled: ${node.data.multiSelectEnabled}`);
      console.log(`🔧 ГЕНЕРАТОР:   - hasMultiSelect: ${hasMultiSelect}`);
      console.log(`🔧 ГЕНЕРАТОР:   - кнопок: ${node.data.buttons?.length || 0}`);
      console.log(`🔧 ГЕНЕРАТОР:   - keyboardType: ${node.data.keyboardType || 'нет'}`);
      console.log(`🔧 ГЕНЕРАТОР:   - continueButtonTarget: ${continueTarget || 'нет'}`);
      
      if (node.id === 'interests_result') {
        console.log(`🚨 ГЕНЕРАТОР: НАЙДЕН interests_result!`);
        console.log(`🚨 ГЕНЕРАТОР: interests_result полные данные:`, JSON.stringify(node.data, null, 2));
      }
    });
    
    // Проверим связи
    if (connections && connections.length > 0) {
      console.log('🔧 ГЕНЕРАТОР: Анализируем связи:');
      connections.forEach((conn, index) => {
        console.log(`🔧 ГЕНЕРАТОР: Связь ${index + 1}: ${conn.sourceNodeId} -> ${conn.targetNodeId}`);
      });
    }
  }
  
  let code = '"""\n';
  code += `${botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';
  
  const botFatherCommands = generateBotFatherCommands(nodes);
  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }
  
  code += '"""\n\n';
  
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'import os\n';
  code += 'import sys\n';
  code += 'import locale\n';
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.exceptions import TelegramBadRequest\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
  code += 'from aiogram.enums import ParseMode\n';
  code += 'from typing import Optional\n';
  code += 'import asyncpg\n';
  code += 'from datetime import datetime, timezone, timedelta\n';
  code += 'import json\n\n';
  
  code += '# Настройка кодировки для Windows\n';
  code += 'if sys.platform.startswith("win"):\n';
  code += '    # Устанавливаем UTF-8 кодировку для stdout и stderr\n';
  code += '    import codecs\n';
  code += '    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())\n';
  code += '    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())\n';
  code += '    \n';
  code += '    # Альтернативный способ для старых версий Python\n';
  code += '    if hasattr(sys.stdout, "reconfigure"):\n';
  code += '        sys.stdout.reconfigure(encoding="utf-8")\n';
  code += '        sys.stderr.reconfigure(encoding="utf-8")\n';
  code += '    \n';
  code += '    # Устанавливаем locale для корректной работы с UTF-8\n';
  code += '    try:\n';
  code += '        locale.setlocale(locale.LC_ALL, "en_US.UTF-8")\n';
  code += '    except locale.Error:\n';
  code += '        try:\n';
  code += '            locale.setlocale(locale.LC_ALL, "C.UTF-8")\n';
  code += '        except locale.Error:\n';
  code += '            pass  # Игнорируем ошибки locale на Windows\n\n';
  
  code += '# Функция для получения московского времени\n';
  code += 'def get_moscow_time():\n';
  code += '    """Возвращает текущее время в московском часовом поясе"""\n';
  code += '    moscow_tz = timezone(timedelta(hours=3))  # UTC+3 для Москвы\n';
  code += '    return datetime.now(moscow_tz).isoformat()\n\n';
  
  code += '# Токен вашего бота (получите у @BotFather)\n';
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';
  
  code += '# Настройка логирования\n';
  code += 'logging.basicConfig(level=logging.INFO)\n\n';
  
  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n\n';
  
  code += '# Список администраторов (добавьте свой Telegram ID)\n';
  code += 'ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов\n\n';
  
  // Добавляем конфигурацию групп
  if (groups && groups.length > 0) {
    code += '# Подключенные группы\n';
    code += 'CONNECTED_GROUPS = {\n';
    groups.forEach((group, index) => {
      const groupId = group.groupId || 'None';
      const isLast = index === groups.length - 1;
      code += `    "${group.name}": {\n`;
      code += `        "id": ${groupId === 'None' ? 'None' : `"${groupId}"`},\n`;
      code += `        "url": "${group.url}",\n`;
      code += `        "is_admin": ${group.isAdmin ? 'True' : 'False'},\n`;
      code += `        "chat_type": "${group.chatType || 'group'}",\n`;
      if (group.adminRights) {
        code += `        "admin_rights": ${JSON.stringify(group.adminRights, null, 12).replace(/"/g, "'")},\n`;
      }
      code += `        "description": "${group.description || ''}"\n`;
      code += `    }${isLast ? '' : ','}\n`;
    });
    code += '}\n\n';
  }
  
  code += '# Настройки базы данных\n';
  code += 'DATABASE_URL = os.getenv("DATABASE_URL")\n\n';
  
  code += '# Пул соединений с базой данных\n';
  code += 'db_pool = None\n\n';
  
  code += '# Хранилище пользователей (резервное для случаев без БД)\n';
  code += 'user_data = {}\n\n';

  // Добавляем функции для работы с базой данных
  code += '\n# Функции для работы с базой данных\n';
  code += 'async def init_database():\n';
  code += '    """Инициализация подключения к базе данных и создание таблиц"""\n';
  code += '    global db_pool\n';
  code += '    try:\n';
  code += '        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)\n';
  code += '        # Создаем таблицу пользователей если её нет\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            await conn.execute("""\n';
  code += '                CREATE TABLE IF NOT EXISTS bot_users (\n';
  code += '                    user_id BIGINT PRIMARY KEY,\n';
  code += '                    username TEXT,\n';
  code += '                    first_name TEXT,\n';
  code += '                    last_name TEXT,\n';
  code += '                    registered_at TIMESTAMP DEFAULT NOW(),\n';
  code += '                    last_interaction TIMESTAMP DEFAULT NOW(),\n';
  code += '                    interaction_count INTEGER DEFAULT 0,\n';
  code += '                    user_data JSONB DEFAULT \'{}\',\n';
  code += '                    is_active BOOLEAN DEFAULT TRUE\n';
  code += '                );\n';
  code += '            """)\n';
  code += '        logging.info("✅ База данных инициализирована")\n';
  code += '    except Exception as e:\n';
  code += '        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")\n';
  code += '        db_pool = None\n\n';

  code += 'async def save_user_to_db(user_id: int, username: Optional[str] = None, first_name: Optional[str] = None, last_name: Optional[str] = None):\n';
  code += '    """Сохраняет пользователя в базу данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return False\n';
  code += '    try:\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            await conn.execute("""\n';
  code += '                INSERT INTO bot_users (user_id, username, first_name, last_name)\n';
  code += '                VALUES ($1, $2, $3, $4)\n';
  code += '                ON CONFLICT (user_id) DO UPDATE SET\n';
  code += '                    username = EXCLUDED.username,\n';
  code += '                    first_name = EXCLUDED.first_name,\n';
  code += '                    last_name = EXCLUDED.last_name,\n';
  code += '                    last_interaction = NOW(),\n';
  code += '                    interaction_count = bot_users.interaction_count + 1\n';
  code += '            """, user_id, username, first_name, last_name)\n';
  code += '        return True\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка сохранения пользователя в БД: {e}")\n';
  code += '        return False\n\n';

  code += 'async def get_user_from_db(user_id: int):\n';
  code += '    """Получает данные пользователя из базы данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return None\n';
  code += '    try:\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)\n';
  code += '            if row:\n';
  code += '                # Преобразуем Record в словарь\n';
  code += '                row_dict = {key: row[key] for key in row.keys()}\n';
  code += '                # Если есть user_data, возвращаем его содержимое\n';
  code += '                if "user_data" in row_dict and row_dict["user_data"]:\n';
  code += '                    user_data = row_dict["user_data"]\n';
  code += '                    if isinstance(user_data, str):\n';
  code += '                        try:\n';
  code += '                            import json\n';
  code += '                            return json.loads(user_data)\n';
  code += '                        except (json.JSONDecodeError, TypeError):\n';
  code += '                            return {}\n';
  code += '                    elif isinstance(user_data, dict):\n';
  code += '                        return user_data\n';
  code += '                    else:\n';
  code += '                        return {}\n';
  code += '                # Если нет user_data, возвращаем полную запись\n';
  code += '                return row_dict\n';
  code += '        return None\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка получения пользователя из БД: {e}")\n';
  code += '        return None\n\n';

  // Добавляем функцию handle_command_start как алиас для start_handler
  code += '# Алиас функция для callback обработчиков\n';
  code += 'async def handle_command_start(message):\n';
  code += '    """Алиас для start_handler, используется в callback обработчиках"""\n';
  code += '    await start_handler(message)\n\n';

  code += 'async def update_user_data_in_db(user_id: int, data_key: str, data_value):\n';
  code += '    """Обновляет пользовательские данные в базе данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return False\n';
  code += '    try:\n';
  code += '        import json\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            # Сначала создаём или получаем существующую запись\n';
  code += '            await conn.execute("""\n';
  code += '                INSERT INTO bot_users (user_id) \n';
  code += '                VALUES ($1) \n';
  code += '                ON CONFLICT (user_id) DO NOTHING\n';
  code += '            """, user_id)\n';
  code += '            \n';
  code += '            # Обновляем данные пользователя\n';
  code += '            update_data = {data_key: data_value}\n';
  code += '            await conn.execute("""\n';
  code += '                UPDATE bot_users \n';
  code += '                SET user_data = COALESCE(user_data, \'{}\'::jsonb) || $2::jsonb,\n';
  code += '                    last_interaction = NOW()\n';
  code += '                WHERE user_id = $1\n';
  code += '            """, user_id, json.dumps(update_data))\n';
  code += '        return True\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка обновления данных пользователя: {e}")\n';
  code += '        return False\n\n';

  // Добавляем алиас функции для обратной совместимости
  code += 'async def save_user_data_to_db(user_id: int, data_key: str, data_value):\n';
  code += '    """Алиас для update_user_data_in_db для обратной совместимости"""\n';
  code += '    return await update_user_data_in_db(user_id, data_key, data_value)\n\n';

  code += 'async def update_user_variable_in_db(user_id: int, variable_name: str, variable_value: str):\n';
  code += '    """Сохраняет переменную пользователя в базу данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return False\n';
  code += '    try:\n';
  code += '        import json\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            # Сначала создаём или получаем существующую запись\n';
  code += '            await conn.execute("""\n';
  code += '                INSERT INTO bot_users (user_id) \n';
  code += '                VALUES ($1) \n';
  code += '                ON CONFLICT (user_id) DO NOTHING\n';
  code += '            """, user_id)\n';
  code += '            \n';
  code += '            # Обновляем переменную пользователя\n';
  code += '            update_data = {variable_name: variable_value}\n';
  code += '            await conn.execute("""\n';
  code += '                UPDATE bot_users \n';
  code += '                SET user_data = COALESCE(user_data, \'{}\'::jsonb) || $2::jsonb,\n';
  code += '                    last_interaction = NOW()\n';
  code += '                WHERE user_id = $1\n';
  code += '            """, user_id, json.dumps(update_data))\n';
  code += '        return True\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка сохранения переменной пользователя: {e}")\n';
  code += '        return False\n\n';

  // Добавляем утилитарные функции
  code += '\n# Утилитарные функции\n';
  code += 'async def is_admin(user_id: int) -> bool:\n';
  code += '    return user_id in ADMIN_IDS\n\n';
  
  code += 'async def is_private_chat(message: types.Message) -> bool:\n';
  code += '    return message.chat.type == "private"\n\n';
  
  code += 'async def check_auth(user_id: int) -> bool:\n';
  code += '    # Проверяем наличие пользователя в БД или локальном хранилище\n';
  code += '    if db_pool:\n';
  code += '        user = await get_user_from_db(user_id)\n';
  code += '        return user is not None\n';
  code += '    return user_id in user_data\n\n';
  
  code += 'def is_local_file(url: str) -> bool:\n';
  code += '    """Проверяет, является ли URL локальным загруженным файлом"""\n';
  code += '    return url.startswith("/uploads/") or url.startswith("uploads/")\n\n';
  
  code += 'def get_local_file_path(url: str) -> str:\n';
  code += '    """Получает локальный путь к файлу из URL"""\n';
  code += '    if url.startswith("/"):\n';
  code += '        return url[1:]  # Убираем ведущий слеш\n';
  code += '    return url\n\n';

  // Добавляем функции для работы с картографическими сервисами
  code += 'def extract_coordinates_from_yandex(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Яндекс.Карт"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в формате ll=longitude,latitude\n';
  code += '    match = re.search(r"ll=([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    # Ищем координаты в формате /longitude,latitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def extract_coordinates_from_google(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Google Maps"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в формате @latitude,longitude\n';
  code += '    match = re.search(r"@([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
  code += '    # Ищем координаты в формате /latitude,longitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def extract_coordinates_from_2gis(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки 2ГИС"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в различных форматах 2ГИС\n';
  code += '    # Формат: center/longitude,latitude\n';
  code += '    match = re.search(r"center/([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    # Формат: /longitude,latitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def generate_map_urls(latitude: float, longitude: float, title: str = "") -> dict:\n';
  code += '    """Генерирует ссылки на различные картографические сервисы"""\n';
  code += '    import urllib.parse\n';
  code += '    \n';
  code += '    encoded_title = urllib.parse.quote(title) if title else ""\n';
  code += '    \n';
  code += '    return {\n';
  code += '        "yandex": f"https://yandex.ru/maps/?ll={longitude},{latitude}&z=15&l=map&pt={longitude},{latitude}",\n';
  code += '        "google": f"https://maps.google.com/?q={latitude},{longitude}",\n';
  code += '        "2gis": f"https://2gis.ru/geo/{longitude},{latitude}",\n';
  code += '        "openstreetmap": f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=15"\n';
  code += '    }\n\n';

  // Настройка меню команд для BotFather
  const menuCommands = (nodes || []).filter(node => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.showInMenu && 
    node.data.command
  );

  if (menuCommands.length > 0) {
    code += '\n# Настройка меню команд\n';
    code += 'async def set_bot_commands():\n';
    code += '    commands = [\n';
    
    menuCommands.forEach(node => {
      const command = node.data.command?.replace('/', '') || '';
      const description = node.data.description || 'Команда бота';
      code += `        BotCommand(command="${command}", description="${description}"),\n`;
    });
    
    code += '    ]\n';
    code += '    await bot.set_my_commands(commands)\n\n';
  }

  // Generate handlers for each node
  (nodes || []).forEach((node: Node) => {
    if (node.type === "start") {
      code += generateStartHandler(node);
    } else if (node.type === "command") {
      code += generateCommandHandler(node);
    } else if (node.type === "photo") {
      code += generatePhotoHandler(node);
    } else if (node.type === "video") {
      code += generateVideoHandler(node);
    } else if (node.type === "audio") {
      code += generateAudioHandler(node);
    } else if (node.type === "document") {
      code += generateDocumentHandler(node);
    } else if (node.type === "sticker") {
      code += generateStickerHandler(node);
    } else if (node.type === "voice") {
      code += generateVoiceHandler(node);
    } else if (node.type === "animation") {
      code += generateAnimationHandler(node);
    } else if (node.type === "location") {
      code += generateLocationHandler(node);
    } else if (node.type === "contact") {
      code += generateContactHandler(node);
    } else if (node.type === "pin_message") {
      code += generatePinMessageHandler(node);
    } else if (node.type === "unpin_message") {
      code += generateUnpinMessageHandler(node);
    } else if (node.type === "delete_message") {
      code += generateDeleteMessageHandler(node);
    } else if (node.type === "ban_user") {
      code += generateBanUserHandler(node);
    } else if (node.type === "unban_user") {
      code += generateUnbanUserHandler(node);
    } else if (node.type === "mute_user") {
      code += generateMuteUserHandler(node);
    } else if (node.type === "unmute_user") {
      code += generateUnmuteUserHandler(node);
    } else if (node.type === "kick_user") {
      code += generateKickUserHandler(node);
    } else if (node.type === "promote_user") {
      code += generatePromoteUserHandler(node);
    } else if (node.type === "demote_user") {
      code += generateDemoteUserHandler(node);
    }
    // Note: user-input and message nodes are handled via callback handlers, not as separate command handlers
  });

  // Generate synonym handlers for all nodes
  const nodesWithSynonyms = (nodes || []).filter(node => 
    node.data.synonyms && 
    node.data.synonyms.length > 0
  );

  if (nodesWithSynonyms.length > 0) {
    code += '\n# Обработчики синонимов\n';
    nodesWithSynonyms.forEach(node => {
      if (node.data.synonyms) {
        node.data.synonyms.forEach((synonym: string) => {
          if (node.type === 'start' || node.type === 'command') {
            code += generateSynonymHandler(node, synonym);
          } else if (node.type === 'ban_user' || node.type === 'unban_user' || node.type === 'mute_user' || node.type === 'unmute_user' || 
                     node.type === 'kick_user' || node.type === 'promote_user' || node.type === 'demote_user') {
            code += generateUserManagementSynonymHandler(node, synonym);
          } else {
            code += generateMessageSynonymHandler(node, synonym);
          }
        });
      }
    });
  }

  // Generate callback handlers for inline buttons AND input target nodes
  const inlineNodes = (nodes || []).filter(node => 
    node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
  );

  // Also collect all target nodes from user input collections
  const inputTargetNodeIds = new Set<string>();
  (nodes || []).forEach(node => {
    if (node.data.inputTargetNodeId) {
      inputTargetNodeIds.add(node.data.inputTargetNodeId);
    }
  });

  // Collect all referenced node IDs and conditional message buttons
  const allReferencedNodeIds = new Set<string>();
  const allConditionalButtons = new Set<string>();
  
  // Add nodes from inline buttons
  inlineNodes.forEach(node => {
    node.data.buttons.forEach(button => {
      if (button.action === 'goto' && button.target) {
        allReferencedNodeIds.add(button.target);
      }
    });
    
    // Also add continueButtonTarget for multi-select nodes
    if (node.data.continueButtonTarget) {
      allReferencedNodeIds.add(node.data.continueButtonTarget);
    }
  });
  
  // Collect buttons from conditional messages
  (nodes || []).forEach(node => {
    if (node.data.conditionalMessages) {
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: any) => {
            if (button.action === 'goto' && button.target) {
              allConditionalButtons.add(button.target);
            }
          });
        }
      });
    }
  });
  
  // Add input target nodes
  inputTargetNodeIds.forEach(nodeId => {
    allReferencedNodeIds.add(nodeId);
  });

  // Add all connection targets to ensure every connected node gets a handler
  console.log(`🔗 ГЕНЕРАТОР: Обрабатываем ${connections.length} соединений`);
  connections.forEach((connection, index) => {
    console.log(`🔗 ГЕНЕРАТОР: Соединение ${index}: source=${connection.source} -> target=${connection.target}`);
    if (connection.target) {
      allReferencedNodeIds.add(connection.target);
      console.log(`✅ ГЕНЕРАТОР: Добавлен target ${connection.target} в allReferencedNodeIds`);
    }
  });
  console.log(`🎯 ГЕНЕРАТОР: Финальный allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);

  if (inlineNodes.length > 0 || allReferencedNodeIds.size > 0 || allConditionalButtons.size > 0) {
    code += '\n# Обработчики inline кнопок\n';
    const processedCallbacks = new Set<string>();
    
    // Skip conditional placeholder handlers - they conflict with main handlers
    // Main callback handlers below will handle all button interactions properly
    
    // Then, handle inline button nodes - create handlers for each unique button ID
    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.id) {
          const callbackData = button.id; // Use button ID as callback_data
          
          // Avoid duplicate handlers for button IDs (not target IDs)
          if (processedCallbacks.has(callbackData)) return;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Избегаем дублированных обработчиков для target узлов
          if (button.target && processedCallbacks.has(button.target)) {
            console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
            return;
          }
          
          // Find target node (может быть null если нет target)
          const targetNode = button.target ? nodes.find(n => n.id === button.target) : null;
          
          // Создаем обработчик для каждой кнопки используя target как callback_data
          const actualCallbackData = button.target || callbackData;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем target узел перед созданием обработчика
          if (button.target && processedCallbacks.has(button.target)) {
            console.log(`🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
            return;
          }
          
          // Mark this button ID as processed
          processedCallbacks.add(callbackData);
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем target в processedCallbacks СРАЗУ, чтобы избежать дублирования
          if (button.target) {
            processedCallbacks.add(button.target);
            console.log(`🔧 ГЕНЕРАТОР: Узел ${button.target} добавлен в processedCallbacks ДО создания обработчика`);
          }
          
          // ОТЛАДКА: Проверяем если это interests_result или metro_selection
          if (button.target === 'interests_result') {
            console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для interests_result в основном цикле');
            console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
          }
          if (button.target === 'metro_selection') {
            console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для metro_selection в основном цикле');
            console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
          }
          
          // Если целевой узел имеет множественный выбор, добавляем обработку кнопки "done_"
          const isDoneHandlerNeeded = targetNode && targetNode.data.allowMultipleSelection && targetNode.data.continueButtonTarget;
          const shortNodeIdForDone = isDoneHandlerNeeded ? actualCallbackData.slice(-10).replace(/^_+/, '') : '';
          
          // ЛОГИРОВАНИЕ: Отслеживаем создание обработчиков для interests_result
          if (actualCallbackData === 'interests_result') {
            console.log('🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: Создаем обработчик для interests_result!');
            console.log('🚨 ГЕНЕРАТОР: Текущие processedCallbacks:', Array.from(processedCallbacks));
          }
          
          if (isDoneHandlerNeeded) {
            code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_") or c.data == "multi_select_done_${shortNodeIdForDone}")\n`;
            console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавлен обработчик кнопки "multi_select_done_${shortNodeIdForDone}" для узла ${actualCallbackData}`);
          } else {
            code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_"))\n`;
          }
          // Создаем безопасное имя функции на основе target или button ID
          const safeFunctionName = actualCallbackData.replace(/[^a-zA-Z0-9_]/g, '_');
          
          if (actualCallbackData === 'interests_result') {
            console.log('🚨 ГЕНЕРАТОР: Создаем функцию handle_callback_interests_result в ОСНОВНОМ ЦИКЛЕ');
          }
          
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    callback_data = callback_query.data\n';
          code += '    \n';
          
          // Добавляем обработку кнопки "done_" для множественного выбора
          if (isDoneHandlerNeeded) {
            code += '    # Проверяем, является ли это кнопкой "Готово" для множественного выбора\n';
            code += `    if callback_data == "multi_select_done_${shortNodeIdForDone}":\n`;
            code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
            code += '        \n';
            
            // Сохраняем выбранные значения в базу данных
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            code += '        # Сохраняем выбранные значения в базу данных\n';
            code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
            code += '        if selected_options:\n';
            code += '            selected_text = ", ".join(selected_options)\n';
            code += `            \n`;
            code += `            # Универсальная логика аккумуляции для всех множественных выборов\n`;
            code += `            # Загружаем существующие значения\n`;
            code += `            existing_data = await get_user_data_from_db(user_id, "${multiSelectVariable}")\n`;
            code += `            existing_selections = []\n`;
            code += `            if existing_data and existing_data.strip():\n`;
            code += `                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]\n`;
            code += `            \n`;
            code += `            # Объединяем существующие и новые выборы (убираем дубли)\n`;
            code += `            all_selections = list(set(existing_selections + selected_options))\n`;
            code += `            final_text = ", ".join(all_selections)\n`;
            code += `            await update_user_data_in_db(user_id, "${multiSelectVariable}", final_text)\n`;
            code += `            logging.info(f"✅ Аккумулировано в переменную ${multiSelectVariable}: {final_text}")\n`;
            code += '        \n';
            
            // Очищаем состояние множественного выбора
            code += '        # Очищаем состояние множественного выбора\n';
            code += '        if user_id in user_data:\n';
            code += `            user_data[user_id].pop("multi_select_${actualCallbackData}", None)\n`;
            code += '            user_data[user_id].pop("multi_select_node", None)\n';
            code += '            user_data[user_id].pop("multi_select_type", None)\n';
            code += '            user_data[user_id].pop("multi_select_variable", None)\n';
            code += '        \n';
            
            // Переход к следующему узлу
            if (targetNode.data.continueButtonTarget) {
              const nextNodeId = targetNode.data.continueButtonTarget;
              
              // КРИТИЧЕСКАЯ ОТЛАДКА
              console.log(`🚨 ГЕНЕРАТОР CONTINUEBUTTON DEBUG:`);
              console.log(`🚨 ГЕНЕРАТОР: targetNode.id = "${targetNode.id}"`);
              console.log(`🚨 ГЕНЕРАТОР: targetNode.data.continueButtonTarget = "${targetNode.data.continueButtonTarget}"`);
              console.log(`🚨 ГЕНЕРАТОР: nextNodeId = "${nextNodeId}"`);
              console.log(`🚨 ГЕНЕРАТОР: actualCallbackData = "${actualCallbackData}"`);
              
              code += '        # Переход к следующему узлу\n';
              code += `        next_node_id = "${nextNodeId}"\n`;
              code += `        logging.info(f"🚀 DEBUG: targetNode.id=${targetNode.id}, continueButtonTarget=${targetNode.data.continueButtonTarget}, nextNodeId=${nextNodeId}")\n`;
              
              // ИСПРАВЛЕНИЕ: Специальная логика для metro_selection -> interests_result
              console.log(`🔧 ГЕНЕРАТОР: Проверяем metro_selection -> interests_result: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
              if (targetNode.id.includes('metro_selection') && nextNodeId === 'interests_result') {
                console.log(`🔧 ГЕНЕРАТОР: ✅ Применяем специальную логику metro_selection -> interests_result`);
                code += '        # ИСПРАВЛЕНИЕ: Сохраняем метро выбор и устанавливаем флаг для показа клавиатуры\n';
                code += `        selected_metro = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
                code += '        if user_id not in user_data:\n';
                code += '            user_data[user_id] = {}\n';
                code += '        user_data[user_id]["saved_metro_selection"] = selected_metro\n';
                code += '        user_data[user_id]["show_metro_keyboard"] = True\n';
                code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: targetNode.id={targetNode.id}, nextNodeId={nextNodeId}")\n';
                code += '        logging.info(f"🚇 Сохранили метро выбор: {selected_metro}, установлен флаг show_metro_keyboard=True")\n';
                code += '        \n';
              } else {
                console.log(`🔧 ГЕНЕРАТОР: ❌ Не применяем специальную логику: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
              }
              
              code += '        try:\n';
              code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
              code += '        except Exception as e:\n';
              code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
              code += `            await callback_query.message.edit_text("Переход завершен")\n`;
            } else {
              code += '        # Завершение множественного выбора\n';
              code += `        await callback_query.message.edit_text("✅ Выбор завершен!")\n`;
            }
            code += '        return\n';
            code += '    \n';
          }
          
          // Специальная обработка для кнопок "Изменить выбор" и "Начать заново"
          // Эти кнопки должны обрабатываться как обычные goto кнопки к start узлу
          
          // Правильная логика сохранения переменной на основе кнопки
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';
          
          // Определяем переменную для сохранения на основе родительского узла
          const parentNode = node; // Используем текущий узел как родительский
          
          // Проверяем настройку skipDataCollection для кнопки
          const shouldSkipDataCollection = button.skipDataCollection === true;
          
          if (!shouldSkipDataCollection) {
            if (parentNode && parentNode.data.inputVariable) {
              const variableName = parentNode.data.inputVariable;
              
              // Используем текст кнопки как значение переменной
              const variableValue = 'button_text';
              
              code += '    # Сохраняем правильную переменную в базу данных\n';
              code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
              code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
              code += '    \n';
              
              // КРИТИЧЕСКИ ВАЖНО: Очищаем состояние ожидания после сохранения переменной
              code += '    # Очищаем состояние ожидания ввода для этой переменной\n';
              code += '    if user_id in user_data:\n';
              code += '        # Удаляем waiting_for_input чтобы текстовый обработчик не перезаписал данные\n';
              code += '        if "waiting_for_input" in user_data[user_id]:\n';
              code += `            if user_data[user_id]["waiting_for_input"] == "${parentNode.id}":\n`;
              code += '                del user_data[user_id]["waiting_for_input"]\n';
              code += `                logging.info(f"Состояние ожидания ввода очищено для переменной ${variableName} (пользователь {user_id})")\n`;
              code += '    \n';
            } else {
              // Fallback: сохраняем кнопку как есть
              code += '    # Сохраняем кнопку в базу данных\n';
              code += '    timestamp = get_moscow_time()\n';
              code += '    response_data = button_text  # Простое значение\n';
              code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
              code += '    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")\n';
            }
          } else {
            code += '    # Кнопка настроена для пропуска сбора данных (skipDataCollection=true)\n';
            code += `    logging.info(f"Кнопка пропущена: {button_text} (не сохраняется из-за skipDataCollection)")\n`;
          }
          code += '    \n';
          
          if (targetNode) {
            
            // Handle callback nodes with variable saving
            if (targetNode.type === 'callback') {
              const action = targetNode.data.action || 'none';
              const variableName = targetNode.data.variableName || '';
              const variableValue = targetNode.data.variableValue || '';
              const successMessage = targetNode.data.successMessage || 'Успешно сохранено!';
              
              if (action === 'save_variable' && variableName && variableValue) {
                code += `    # Сохраняем переменную "${variableName}" = "${variableValue}"\n`;
                code += `    user_data[user_id]["${variableName}"] = "${variableValue}"\n`;
                code += `    await update_user_variable_in_db(user_id, "${variableName}", "${variableValue}")\n`;
                code += `    logging.info(f"Переменная сохранена: ${variableName} = ${variableValue} (пользователь {user_id})")\n`;
                code += '    \n';
                
                if (successMessage.includes('\n')) {
                  code += `    success_text = """${successMessage}"""\n`;
                } else {
                  const escapedMessage = successMessage.replace(/"/g, '\\"');
                  code += `    success_text = "${escapedMessage}"\n`;
                }
                
                // Добавляем замену переменных в сообщении об успехе
                code += `    # Подставляем значения переменных в текст сообщения\n`;
                code += `    if "{${variableName}}" in success_text:\n`;
                code += `        success_text = success_text.replace("{${variableName}}", "${variableValue}")\n`;
                
                code += '    await callback_query.message.edit_text(success_text)\n';
              }
            }
            // Handle regular message nodes (like source_friends, source_search, etc.)
            else if (targetNode.type === 'message') {
              const messageText = targetNode.data.messageText || "Сообщение";
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              const parseMode = getParseMode(targetNode.data.formatMode);
              
              code += `    # Отправляем сообщение для узла ${targetNode.id}\n`;
              code += `    text = ${formattedText}\n`;
              
              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              
              // Добавляем поддержку условных сообщений
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default
                code += '    # Используем условное сообщение если есть подходящее условие\n';
                code += '    if "text" not in locals():\n';
                code += `        text = ${formattedText}\n`;
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    if conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '    else:\n';
                code += '        keyboard = None\n';
              } else {
                code += '    \n';
                code += '    # Без условных сообщений - используем обычную клавиатуру\n';
                code += '    keyboard = None\n';
              }
              
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем множественный выбор ИЛИ обычные inline кнопки
              const hasMultipleSelection = targetNode.data.allowMultipleSelection && targetNode.data.buttons && targetNode.data.buttons.length > 0;
              const hasRegularInlineButtons = targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0;
              
              console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} - allowMultipleSelection: ${targetNode.data.allowMultipleSelection}, кнопок: ${targetNode.data.buttons?.length}, keyboardType: ${targetNode.data.keyboardType}`);
              
              if (hasMultipleSelection || hasRegularInlineButtons) {
                console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ клавиатуру для узла ${targetNode.id} (множественный выбор: ${hasMultipleSelection})`);
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if keyboard is None:\n';
                code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
                // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
                const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
                code += keyboardCode;
              } else if (targetNode.data.keyboardType !== "inline") {
                // Сохраняем keyboard = None только если это не inline клавиатура
                code += '    if keyboard is None:\n';
                code += '        keyboard = None\n';
              }
              
              // Добавляем настройку ожидания текстового ввода для условных сообщений
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Настраиваем ожидание текстового ввода для условных сообщений\n';
                code += '    if "conditional_message_config" in locals():\n';
                code += '        # Проверяем, включено ли ожидание текстового ввода\n';
                code += '        wait_for_input = conditional_message_config.get("wait_for_input", False)\n';
                code += '        if wait_for_input:\n';
                code += '            # Получаем следующий узел из условного сообщения или подключений\n';
                code += '            conditional_next_node = conditional_message_config.get("next_node_id")\n';
                code += '            if conditional_next_node:\n';
                code += '                next_node_id = conditional_next_node\n';
                code += '            else:\n';
                const currentNodeConnections = connections.filter(conn => conn.source === targetNode.id);
                if (currentNodeConnections.length > 0) {
                  const nextNodeId = currentNodeConnections[0].target;
                  code += `                next_node_id = "${nextNodeId}"\n`;
                } else {
                  code += '                next_node_id = None\n';
                }
                code += '            \n';
                code += '            # Получаем переменную для сохранения ввода\n';
                code += '            input_variable = conditional_message_config.get("input_variable")\n';
                code += '            if not input_variable:\n';
                code += '                input_variable = f"conditional_response_{conditional_message_config.get(\'condition_id\', \'unknown\')}"\n';
                code += '            \n';
                code += '            # Устанавливаем состояние ожидания текстового ввода\n';
                code += '            user_data[user_id]["waiting_for_conditional_input"] = {\n';
                code += '                "node_id": callback_query.data,\n';
                code += '                "condition_id": conditional_message_config.get("condition_id"),\n';
                code += '                "next_node_id": next_node_id,\n';
                code += '                "input_variable": input_variable,\n';
                code += '                "source_type": "conditional_message"\n';
                code += '            }\n';
                code += '            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")\n';
                code += '    \n';
              }
              
              // Отправляем сообщение с учетом всех условий
              code += '    # Отправляем сообщение\n';
              code += '    try:\n';
              code += '        if keyboard is not None:\n';
              code += `            await callback_query.message.edit_text(text, reply_markup=keyboard${parseMode})\n`;
              code += '        else:\n';
              code += `            await callback_query.message.edit_text(text${parseMode})\n`;
              code += '    except Exception:\n';
              code += '        if keyboard is not None:\n';
              code += `            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              code += '        else:\n';
              code += `            await callback_query.message.answer(text${parseMode})\n`;
              
              // КРИТИЧЕСКИ ВАЖНАЯ ЛОГИКА: Если этот узел имеет collectUserInput, настраиваем состояние ожидания
              if (targetNode.data.collectUserInput === true) {
                const inputType = targetNode.data.inputType || 'text';
                const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если у узла есть кнопки И НЕТ текстового ввода, НЕ настраиваем ожидание ввода
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0 && !targetNode.data.enableTextInput) {
                  code += '    \n';
                  code += `    logging.info(f"✅ Узел ${targetNode.id} имеет кнопки БЕЗ текстового ввода - НЕ настраиваем ожидание ввода")\n`;
                  code += `    # ИСПРАВЛЕНИЕ: У узла есть inline кнопки без текстового ввода\n`;
                } else {
                  code += '    \n';
                  code += `    logging.info(f"DEBUG: Настраиваем ожидание ввода для узла ${targetNode.id}, переменная ${inputVariable}")\n`;
                  code += '    # КРИТИЧЕСКИ ВАЖНО: Настраиваем ожидание ввода для message узла с collectUserInput\n';
                  code += '    # Инициализируем user_data для пользователя если не существует\n';
                  code += '    if user_id not in user_data:\n';
                  code += '        user_data[user_id] = {}\n';
                  code += '    user_data[user_id]["waiting_for_input"] = {\n';
                  code += `        "type": "${inputType}",\n`;
                  code += `        "variable": "${inputVariable}",\n`;
                  code += '        "save_to_database": True,\n';
                  code += `        "node_id": "${targetNode.id}",\n`;
                  code += `        "next_node_id": "${inputTargetNodeId || ''}",\n`;
                  code += `        "min_length": ${targetNode.data.minLength || 0},\n`;
                  code += `        "max_length": ${targetNode.data.maxLength || 0},\n`;
                  code += '        "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
                  code += '        "success_message": "✅ Спасибо за ваш ответ!"\n';
                  code += '    }\n';
                  code += `    logging.info(f"✅ Состояние ожидания настроено: ${inputType} ввод для переменной ${inputVariable}")\n`;
                }
              }
            }
            // Handle different target node types
            else if (targetNode.type === 'photo') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "📸 Фото";
              const imageUrl = targetNode.data.imageUrl || "https://picsum.photos/800/600?random=1";
              
              code += `    # Отправляем фото для узла ${targetNode.id}\n`;
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              // Применяем универсальную замену переменных для подписи
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              code += '    caption = replace_variables_in_text(caption, user_vars)\n';
              
              // Добавляем поддержку условных сообщений для фото
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для фото\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default caption
                code += '    # Используем условное сообщение как подпись если есть подходящее условие\n';
                code += '    if "text" in locals():\n';
                code += '        caption = text\n';
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    conditional_keyboard_for_photo = conditional_keyboard\n';
              }
              
              code += `    photo_url = "${imageUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(photo_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(photo_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                photo_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            photo_file = photo_url\n';
              code += '        \n';
              
              // Проверяем условную клавиатуру или обычную
              code += '        # Определяем клавиатуру для фото\n';
              code += '        keyboard = None\n';
              
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '        if conditional_keyboard_for_photo is not None:\n';
                code += '            keyboard = conditional_keyboard_for_photo\n';
                code += '        elif '
              } else {
                code += '        if ';
              }
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += 'True:  # У узла есть обычные кнопки\n';
                code += '            builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '            builder.adjust(2)  # Используем 2 колонки для консистентности\n';
                code += '            keyboard = builder.as_markup()\n';
              } else {
                code += 'False:  # Нет кнопок\n';
                code += '            pass\n';
              }
              
              code += '        \n';
              code += '        await callback_query.message.delete()\n';
              code += '        if keyboard is not None:\n';
              code += '            await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption)\n';
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки фото: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить фото\\n{caption}")\n';
              
            } else if (targetNode.type === 'video') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "🎥 Видео";
              const videoUrl = targetNode.data.videoUrl || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4";
              
              code += `    # Отправляем видео для узла ${targetNode.id}\n`;
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              // Применяем универсальную замену переменных для подписи
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              code += '    caption = replace_variables_in_text(caption, user_vars)\n';
              
              // Добавляем поддержку условных сообщений для видео
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для видео\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default caption
                code += '    # Используем условное сообщение как подпись если есть подходящее условие\n';
                code += '    if "text" in locals():\n';
                code += '        caption = text\n';
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    conditional_keyboard_for_video = conditional_keyboard\n';
              }
              
              code += `    video_url = "${videoUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(video_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(video_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                video_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            video_file = video_url\n';
              code += '        \n';
              
              // Проверяем условную клавиатуру или обычную
              code += '        # Определяем клавиатуру для видео\n';
              code += '        keyboard = None\n';
              
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '        if conditional_keyboard_for_video is not None:\n';
                code += '            keyboard = conditional_keyboard_for_video\n';
                code += '        elif '
              } else {
                code += '        if ';
              }
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += 'True:  # У узла есть обычные кнопки\n';
                code += '            builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '            builder.adjust(2)  # Используем 2 колонки для консистентности\n';
                code += '            keyboard = builder.as_markup()\n';
              } else {
                code += 'False:  # Нет кнопок\n';
                code += '            pass\n';
              }
              
              code += '        \n';
              code += '        await callback_query.message.delete()\n';
              code += '        if keyboard is not None:\n';
              code += '            await bot.send_video(callback_query.from_user.id, video_file, caption=caption, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await bot.send_video(callback_query.from_user.id, video_file, caption=caption)\n';
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки видео: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить видео\\n{caption}")\n';
              
            } else if (targetNode.type === 'audio') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "🎵 Аудио";
              const audioUrl = targetNode.data.audioUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              
              code += `    # Отправляем аудио для узла ${targetNode.id}\n`;
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              // Применяем универсальную замену переменных для подписи
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              code += '    caption = replace_variables_in_text(caption, user_vars)\n';
              
              // Добавляем поддержку условных сообщений для аудио
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для аудио\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default caption
                code += '    # Используем условное сообщение как подпись если есть подходящее условие\n';
                code += '    if "text" in locals():\n';
                code += '        caption = text\n';
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    conditional_keyboard_for_audio = conditional_keyboard\n';
              }
              
              code += `    audio_url = "${audioUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(audio_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(audio_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                audio_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            audio_file = audio_url\n';
              code += '        \n';
              
              // Проверяем условную клавиатуру или обычную
              code += '        # Определяем клавиатуру для аудио\n';
              code += '        keyboard = None\n';
              
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '        if conditional_keyboard_for_audio is not None:\n';
                code += '            keyboard = conditional_keyboard_for_audio\n';
                code += '        elif '
              } else {
                code += '        if ';
              }
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += 'True:  # У узла есть обычные кнопки\n';
                code += '            builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для audio nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `            # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `            builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '            keyboard = builder.as_markup()\n';
              } else {
                code += 'False:  # Нет кнопок\n';
                code += '            pass\n';
              }
              
              code += '        \n';
              code += '        await callback_query.message.delete()\n';
              code += '        if keyboard is not None:\n';
              code += '            await bot.send_audio(callback_query.from_user.id, audio_file, caption=caption, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await bot.send_audio(callback_query.from_user.id, audio_file, caption=caption)\n';
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки аудио: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить аудио\\n{caption}")\n';
              
            } else if (targetNode.type === 'document') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "📄 Документ";
              const documentUrl = targetNode.data.documentUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    document_url = "${documentUrl}"\n`;
              const documentName = targetNode.data.documentName || "document.pdf";
              code += `    document_name = "${documentName}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(document_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(document_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                document_file = FSInputFile(file_path, filename=document_name)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            document_file = URLInputFile(document_url, filename=document_name)\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для document nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_document(callback_query.from_user.id, document_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_document(callback_query.from_user.id, document_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки документа: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить документ\\n{caption}")\n';
              
            } else if (targetNode.type === 'sticker') {
              const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
              
              code += `    sticker_url = "${stickerUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(sticker_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(sticker_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                sticker_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL или file_id для стикеров\n';
              code += '            sticker_file = sticker_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для sticker nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить стикер")\n';
              
            } else if (targetNode.type === 'voice') {
              const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              const duration = targetNode.data.duration || 30;
              
              code += `    voice_url = "${voiceUrl}"\n`;
              code += `    duration = ${duration}\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(voice_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(voice_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                voice_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            voice_file = voice_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для voice nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить голосовое сообщение")\n';
              
            } else if (targetNode.type === 'animation') {
              const caption = targetNode.data.mediaCaption || "🎬 Анимация";
              const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    animation_url = "${animationUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(animation_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(animation_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                animation_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            animation_file = animation_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для animation nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить анимацию\\n{caption}")\n';
              
            } else if (targetNode.type === 'location') {
              let latitude = targetNode.data.latitude || 55.7558;
              let longitude = targetNode.data.longitude || 37.6176;
              const title = targetNode.data.title || "";
              const address = targetNode.data.address || "";
              const city = targetNode.data.city || "";
              const country = targetNode.data.country || "";
              const mapService = targetNode.data.mapService || 'custom';
              const generateMapPreview = targetNode.data.generateMapPreview !== false;
              
              code += '    # Определяем координаты на основе выбранного сервиса карт\n';
              
              if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
                code += `    yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
                code += `    google_url = "${targetNode.data.googleMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
                code += `    gis_url = "${targetNode.data.gisMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else {
                code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
              }
              
              if (title) code += `    title = "${title}"\n`;
              if (address) code += `    address = "${address}"\n`;
              
              code += '    try:\n';
              code += '        # Удаляем старое сообщение\n';
              code += '        await callback_query.message.delete()\n';
              
              code += '        # Отправляем геолокацию\n';
              if (title || address) {
                code += '        await bot.send_venue(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude,\n';
                code += '            title=title,\n';
                code += '            address=address\n';
                code += '        )\n';
              } else {
                code += '        await bot.send_location(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude\n';
                code += '        )\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n';
              
              // Генерируем кнопки для картографических сервисов если включено
              if (generateMapPreview) {
                code += '        \n';
                code += '        # Генерируем ссылки на картографические сервисы\n';
                code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
                code += '        \n';
                code += '        # Создаем кнопки для различных карт\n';
                code += '        map_builder = InlineKeyboardBuilder()\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
                
                if (targetNode.data.showDirections) {
                  code += '        # Добавляем кнопки для построения маршрута\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
                }
                
                code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
                code += '        map_keyboard = map_builder.as_markup()\n';
                code += '        \n';
                code += '        await bot.send_message(\n';
                code += '            callback_query.from_user.id,\n';
                if (targetNode.data.showDirections) {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
                } else {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
                }
                code += '            reply_markup=map_keyboard\n';
                code += '        )\n';
              }
              
              // Добавляем дополнительные кнопки если они есть
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        \n';
                code += '        # Отправляем дополнительные кнопки\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки местоположения: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n';
              
            } else if (targetNode.type === 'contact') {
              const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
              const firstName = targetNode.data.firstName || "Контакт";
              const lastName = targetNode.data.lastName || "";
              const userId = targetNode.data.userId || null;
              const vcard = targetNode.data.vcard || "";
              
              code += `    phone_number = "${phoneNumber}"\n`;
              code += `    first_name = "${firstName}"\n`;
              if (lastName) code += `    last_name = "${lastName}"\n`;
              if (userId) code += `    user_id = ${userId}\n`;
              if (vcard) code += `    vcard = """${vcard}"""\n`;
              
              code += '    try:\n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n';
                }
              } else {
                code += '        await callback_query.message.delete()\n';
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n';
                }
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить контакт")\n';
              
            } else if (targetNode.type === 'user-input') {
              // Handle user-input nodes
              const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
              const responseType = targetNode.data.responseType || 'text';
              const inputType = targetNode.data.inputType || 'text';
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const responseOptions = targetNode.data.responseOptions || [];
              const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
              const inputValidation = targetNode.data.inputValidation || '';
              const minLength = targetNode.data.minLength || 0;
              const maxLength = targetNode.data.maxLength || 0;
              const inputTimeout = targetNode.data.inputTimeout || 60;
              const inputRequired = targetNode.data.inputRequired !== false;
              const allowSkip = targetNode.data.allowSkip || false;
              const saveToDatabase = targetNode.data.saveToDatabase || false;
              const inputRetryMessage = targetNode.data.inputRetryMessage || "Пожалуйста, попробуйте еще раз.";
              const inputSuccessMessage = targetNode.data.inputSuccessMessage || "✅ Спасибо за ваш ответ!";
              const placeholder = targetNode.data.placeholder || "";
              
              code += '    # Удаляем старое сообщение\n';
              code += '    await callback_query.message.delete()\n';
              code += '    \n';
              
              // Отправляем запрос пользователю
              const formattedPrompt = formatTextForPython(inputPrompt);
              code += `    text = ${formattedPrompt}\n`;
              
              if (responseType === 'buttons' && responseOptions.length > 0) {
                // Обработка кнопочного ответа
                const buttonType = targetNode.data.buttonType || 'inline';
                code += '    \n';
                code += '    # Создаем кнопки для выбора ответа\n';
                
                if (buttonType === 'reply') {
                  code += '    builder = ReplyKeyboardBuilder()\n';
                  
                  responseOptions.forEach((option, index) => {
                    code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
                  });
                  
                  if (allowSkip) {
                    code += `    builder.add(KeyboardButton(text="⏭️ Пропустить"))\n`;
                  }
                  
                  code += '    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)\n';
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                } else {
                  code += '    builder = InlineKeyboardBuilder()\n';
                  
                  responseOptions.forEach((option, index) => {
                    const optionValue = option.value || option.text;
                    code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="response_${targetNode.id}_${index}"))\n`;
                  });
                  
                  if (allowSkip) {
                    code += `    builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="skip_${targetNode.id}"))\n`;
                  }
                  
                  code += '    keyboard = builder.as_markup()\n';
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                }
                code += '    \n';
                code += '    # Инициализируем пользовательские данные если их нет\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Find the next node to navigate to after successful input
                const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.targetNodeId : null;
                
                code += '    # Сохраняем настройки для обработки ответа\n';
                code += '    user_data[callback_query.from_user.id]["button_response_config"] = {\n';
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                code += `        "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
                code += `        "next_node_id": "${nextNodeId || ''}",\n`;
                code += '        "options": [\n';
                responseOptions.forEach((option, index) => {
                  const optionValue = option.value || option.text;
                  const optionAction = option.action || 'goto';
                  const optionTarget = option.target || '';
                  const optionUrl = option.url || '';
                  code += `            {"index": ${index}, "text": "${escapeForJsonString(option.text)}", "value": "${escapeForJsonString(optionValue)}", "action": "${optionAction}", "target": "${optionTarget}", "url": "${escapeForJsonString(optionUrl)}"},\n`;
                });
                code += '        ],\n';
                code += `        "selected": []\n`;
                code += '    }\n';
                
              } else {
                // Обработка текстового ввода (оригинальная логика)
                if (placeholder) {
                  code += `    placeholder_text = "${placeholder}"\n`;
                  code += '    text += f"\\n\\n💡 {placeholder_text}"\n';
                }
                
                if (allowSkip) {
                  code += '    text += "\\n\\n⏭️ Нажмите /skip чтобы пропустить"\n';
                }
                
                code += '    await bot.send_message(callback_query.from_user.id, text)\n';
                code += '    \n';
                code += '    # Инициализируем пользовательские данные если их нет\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Find the next node to navigate to after successful input
                const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.targetNodeId : null;
                
                code += '    # Настраиваем ожидание ввода\n';
                code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                code += `        "type": "${inputType}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "validation": "${inputValidation}",\n`;
                code += `        "min_length": ${minLength},\n`;
                code += `        "max_length": ${maxLength},\n`;
                code += `        "timeout": ${inputTimeout},\n`;
                code += `        "required": ${toPythonBoolean(inputRequired)},\n`;
                code += `        "allow_skip": ${toPythonBoolean(allowSkip)},\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "retry_message": "${escapeForJsonString(inputRetryMessage)}",\n`;
                code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                code += `        "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "next_node_id": "${nextNodeId || ''}"\n`;
                code += '    }\n';
              }
              
            } else if (targetNode.type === 'start') {
              // Handle start nodes in callback queries - show start message with buttons
              const messageText = targetNode.data.messageText || "Добро пожаловать!";
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              const parseMode = getParseMode(targetNode.data.formatMode);
              
              code += `    # Обрабатываем узел start: ${targetNode.id}\n`;
              code += `    text = ${formattedText}\n`;
              
              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              
              // Добавляем поддержку условных сообщений для start узлов
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для start узла\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default
                code += '    # Используем условное сообщение если есть подходящее условие\n';
                code += '    if "text" not in locals():\n';
                code += `        text = ${formattedText}\n`;
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    if conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '    else:\n';
                code += '        keyboard = None\n';
              } else {
                code += '    \n';
                code += '    # Без условных сообщений - используем обычную клавиатуру\n';
                code += '    keyboard = None\n';
              }
              
              // Создаем inline клавиатуру для start узла (только если нет условной клавиатуры)
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if keyboard is None:\n';
                code += '        # Создаем inline клавиатуру для start узла\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    // Создаем уникальный callback_data для каждой кнопки
                    const baseCallbackData = btn.target || btn.id || 'no_action';
                    const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                // Добавляем настройку колонок для консистентности
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `        builder.adjust(${columns})\n`;
                code += '        keyboard = builder.as_markup()\n';
              }
              
              // Отправляем сообщение start узла
              code += '    # Отправляем сообщение start узла\n';
              code += '    try:\n';
              code += '        if keyboard is not None:\n';
              code += `            await callback_query.message.edit_text(text, reply_markup=keyboard${parseMode})\n`;
              code += '        else:\n';
              code += `            await callback_query.message.edit_text(text${parseMode})\n`;
              code += '    except Exception:\n';
              code += '        if keyboard is not None:\n';
              code += `            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              code += '        else:\n';
              code += `            await callback_query.message.answer(text${parseMode})\n`;
              
            } else if (targetNode.type === 'command') {
              // Handle command nodes in callback queries
              const command = targetNode.data.command || '/start';
              const commandMessage = targetNode.data.messageText || `Выполняем команду ${command}`;
              const cleanedCommandMessage = stripHtmlTags(commandMessage);
              const formattedCommandText = formatTextForPython(cleanedCommandMessage);
              const parseMode = getParseMode(targetNode.data.formatMode);
              
              code += `    # Обрабатываем узел command: ${targetNode.id}\n`;
              code += `    text = ${formattedCommandText}\n`;
              
              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              
              // Создаем inline клавиатуру для command узла если есть кнопки
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Создаем inline клавиатуру для command узла\n';
                code += '    builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action';
                    const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                  }
                });
                // Добавляем настройку колонок для консистентности
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `    builder.adjust(${columns})\n`;
                code += '    keyboard = builder.as_markup()\n';
                code += '    # Отправляем сообщение command узла с клавиатурой\n';
                code += '    try:\n';
                code += `        await callback_query.message.edit_text(text, reply_markup=keyboard${parseMode})\n`;
                code += '    except Exception:\n';
                code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              } else {
                code += '    # Отправляем сообщение command узла без клавиатуры\n';
                code += '    try:\n';
                code += `        await callback_query.message.edit_text(text${parseMode})\n`;
                code += '    except Exception:\n';
                code += `        await callback_query.message.answer(text${parseMode})\n`;
              }
              
            } else {
              // Universal handler for all other node types (message, photo, document, etc.)
              code += `    # Обрабатываем узел типа ${targetNode.type}: ${targetNode.id}\n`;
              
              if (targetNode.type === 'photo') {
                // Handle photo nodes
                const photoUrl = targetNode.data.photoUrl || targetNode.data.imageUrl || "";
                const caption = targetNode.data.caption || targetNode.data.messageText || "";
                const cleanedCaption = stripHtmlTags(caption);
                const formattedCaption = formatTextForPython(cleanedCaption);
                const parseMode = getParseMode(targetNode.data.formatMode);
                
                code += `    # Отправляем фото\n`;
                code += `    photo_url = "${photoUrl}"\n`;
                code += `    caption = ${formattedCaption}\n`;
                
                // Применяем универсальную замену переменных в подписи
                code += generateUniversalVariableReplacement('    ');
                
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += '    # Создаем inline клавиатуру для фото\n';
                  code += '    builder = InlineKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn, index) => {
                    if (btn.action === "url") {
                      code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                    } else if (btn.action === 'goto') {
                      const baseCallbackData = btn.target || btn.id || 'no_action';
                      const callbackData = `${baseCallbackData}_btn_${index}`;
                      code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                    }
                  });
                  code += '    keyboard = builder.as_markup()\n';
                  code += '    await callback_query.message.delete()\n';
                  code += `    await bot.send_photo(callback_query.from_user.id, photo=photo_url, caption=caption, reply_markup=keyboard${parseMode})\n`;
                } else {
                  code += '    await callback_query.message.delete()\n';
                  code += `    await bot.send_photo(callback_query.from_user.id, photo=photo_url, caption=caption${parseMode})\n`;
                }
                
              } else {
                // Handle message and other text-based nodes
                const targetText = targetNode.data.messageText || "Сообщение";
                const cleanedText = stripHtmlTags(targetText);
                const formattedTargetText = formatTextForPython(cleanedText);
                const parseMode = getParseMode(targetNode.data.formatMode);
                
                code += `    text = ${formattedTargetText}\n`;
                
                // Добавляем замену переменных в тексте
                code += generateUniversalVariableReplacement('    ');
                
                // Добавляем поддержку условных сообщений для keyboard узлов с collectUserInput
                if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                  code += '    \n';
                  code += '    # Проверка условных сообщений для keyboard узла\n';
                  code += '    user_record = await get_user_from_db(callback_query.from_user.id)\n';
                  code += '    if not user_record:\n';
                  code += '        user_record = user_data.get(callback_query.from_user.id, {})\n';
                  code += '    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})\n';
                  code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                  code += '    \n';
                  
                  // Use conditional message if available, otherwise use default
                  code += '    # Используем условное сообщение если есть подходящее условие\n';
                  code += '    if "text" not in locals():\n';
                  code += `        text = ${formattedTargetText}\n`;
                  code += '    \n';
                  code += '    # Используем условную клавиатуру если есть\n';
                  code += '    if conditional_keyboard is not None:\n';
                  code += '        keyboard = conditional_keyboard\n';
                  code += '    else:\n';
                  code += '        keyboard = None\n';
                  code += '    \n';
                }
              }
            
              // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла (основной цикл)
              if (targetNode.data.collectUserInput === true) {
                // Настраиваем сбор пользовательского ввода
                const inputType = targetNode.data.inputType || 'text';
                const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const saveToDatabase = targetNode.data.saveToDatabase !== false; // По умолчанию true для collectUserInput
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                
                code += '    # Активируем сбор пользовательского ввода (основной цикл)\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                code += `        "type": "${inputType}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "next_node_id": "${inputTargetNodeId || ''}",\n`;
                code += `        "min_length": ${targetNode.data.minLength || 0},\n`;
                code += `        "max_length": ${targetNode.data.maxLength || 0},\n`;
                code += '        "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
                code += '        "success_message": "✅ Спасибо за ваш ответ!"\n';
                code += '    }\n';
                code += '    \n';
                
                // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок с проверкой условной клавиатуры
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли условная клавиатуря для этого узла\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)\n';
                  code += '        builder = InlineKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn, index) => {
                    if (btn.action === "url") {
                      code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                    } else if (btn.action === 'goto') {
                      // Создаем уникальный callback_data для каждой кнопки
                      const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                      const uniqueCallbackData = `${callbackData}_btn_${targetNode.data.buttons.indexOf(btn)}`;
                      code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${uniqueCallbackData}"))\n`;
                    } else if (btn.action === 'command') {
                      // Для кнопок команд создаем специальную callback_data
                      const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                      code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
                    }
                  });
                  // Добавляем настройку колонок для консистентности
                  const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                  code += `        builder.adjust(${columns})\n`;
                  code += '        keyboard = builder.as_markup()\n';
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n`;
                  code += `    try:\n`;
                  code += `        await callback_query.message.edit_text(text, reply_markup=keyboard${parseModeTarget})\n`;
                  code += `    except Exception as e:\n`;
                  code += `        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n`;
                  code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
                } else {
                  code += `    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n`;
                  code += `    try:\n`;
                  code += `        await callback_query.message.edit_text(text)\n`;
                  code += `    except Exception as e:\n`;
                  code += `        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n`;
                  code += `        await callback_query.message.answer(text)\n`;
                }
                code += '    \n';
              } else {
                // Обычное отображение сообщения без сбора ввода
                
                // Handle keyboard for target node
                code += `    # DEBUG: Узел ${targetNode.id} - hasRegularButtons=${toPythonBoolean(targetNode.data.buttons && targetNode.data.buttons.length > 0)}, hasInputCollection=False\n`;
                code += `    logging.info(f"DEBUG: Узел ${targetNode.id} обработка кнопок - keyboardType=${targetNode.data.keyboardType}, buttons=${targetNode.data.buttons ? targetNode.data.buttons.length : 0}")\n`;
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                  code += `    logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${targetNode.id} с ${targetNode.data.buttons.length} кнопками")\n`;
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
                  // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
                  const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
                  code += keyboardCode;
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n`;
                  code += `    try:\n`;
                  code += `        await callback_query.message.edit_text(text, reply_markup=keyboard${parseModeTarget})\n`;
                  code += `    except Exception as e:\n`;
                  code += `        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n`;
                  code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
                } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем reply клавиатуру\n';
                  code += '        builder = ReplyKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn, index) => {
                    code += `        builder.add(KeyboardButton(text="${btn.text}"))\n`;
                  });
                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  code += '    # Для reply клавиатуры отправляем новое сообщение и удаляем старое\n';
                  code += '    try:\n';
                  code += '        await callback_query.message.delete()\n';
                  code += '    except:\n';
                  code += '        pass  # Игнорируем ошибки удаления\n';
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
                } else {
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n`;
                  code += `    try:\n`;
                  code += `        await callback_query.message.edit_text(text${parseModeTarget})\n`;
                  code += `    except Exception as e:\n`;
                  code += `        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n`;
                  code += `        await callback_query.message.answer(text${parseModeTarget})\n`;
                }
              } // Закрываем else блок для обычного отображения (основной цикл)
            } // Закрываем else блок для обычных текстовых сообщений (основной цикл)
          } else {
            // Кнопка без цели - просто уведомляем пользователя
            code += '    # Кнопка пока никуда не ведет\n';
            code += '    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)\n';
          }
        } else if (button.action === 'command' && button.id) {
          // Обработка кнопок с действием "command"
          const callbackData = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          
          // Avoid duplicate handlers
          if (processedCallbacks.has(callbackData)) return;
          processedCallbacks.add(callbackData);
          
          code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
          const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';
          code += '    # Сохраняем кнопку в базу данных\n';
          code += '    timestamp = get_moscow_time()\n';
          code += '    response_data = button_text\n';
          code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
          code += `    logging.info(f"Команда ${button.target || 'неизвестная'} выполнена через callback кнопку (пользователь {user_id})")\n`;
          code += '    \n';
          
          // Создаем правильный вызов команды для callback кнопок
          if (button.target) {
            // Определяем команду - убираем ведущий слеш если есть
            const command = button.target.startsWith('/') ? button.target.replace('/', '') : button.target;
            const handlerName = `${command}_handler`;
            
            code += `    # Вызываем ${handlerName} правильно через edit_text\n`;
            code += '    # Создаем специальный объект для редактирования сообщения\n';
            code += '    class FakeMessageEdit:\n';
            code += '        def __init__(self, callback_query):\n';
            code += '            self.from_user = callback_query.from_user\n';
            code += '            self.chat = callback_query.message.chat\n';
            code += '            self.date = callback_query.message.date\n';
            code += '            self.message_id = callback_query.message.message_id\n';
            code += '            self._callback_query = callback_query\n';
            code += '        \n';
            code += '        async def answer(self, text, parse_mode=None, reply_markup=None):\n';
            code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
            code += '        \n';
            code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
            code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
            code += '    \n';
            code += '    fake_edit_message = FakeMessageEdit(callback_query)\n';
            code += `    await ${handlerName}(fake_edit_message)\n`;
          } else {
            code += '    await callback_query.message.edit_text("❌ Команда не найдена")\n';
          }
        }
      });
    });
    
    // CRITICAL FIX: Ensure interests_result gets a handler BUT avoid duplicates
    console.log('🔧 ГЕНЕРАТОР CRITICAL FIX: Проверяем interests_result обработчик');
    console.log('🔧 ГЕНЕРАТОР: processedCallbacks перед check:', Array.from(processedCallbacks));
    
    // Проверяем, был ли interests_result уже обработан в основном цикле
    const wasInterestsResultProcessed = processedCallbacks.has('interests_result');
    console.log('🔧 ГЕНЕРАТОР: interests_result уже обработан в основном цикле?', wasInterestsResultProcessed);
    
    // ИСПРАВЛЕНИЕ: НЕ создаем дублирующий обработчик если он уже есть
    if (wasInterestsResultProcessed) {
      console.log('🔧 ГЕНЕРАТОР: ПРОПУСКАЕМ создание дублирующего обработчика для interests_result');
      console.log('🔧 ГЕНЕРАТОР: interests_result уже обработан в основном цикле, избегаем конфликта клавиатур');
    } else {
      console.log('🔧 ГЕНЕРАТОР: Создаем обработчик для interests_result (не найден в основном цикле)');
      processedCallbacks.add('interests_result');
      const interestsResultNode = nodes.find(n => n.id === 'interests_result');
      if (interestsResultNode) {
        processedCallbacks.add('interests_result');
        code += `\n@dp.callback_query(lambda c: c.data == "interests_result" or c.data.startswith("interests_result_btn_"))\n`;
        code += `async def handle_callback_interests_result(callback_query: types.CallbackQuery):\n`;
        code += '    await callback_query.answer()\n';
        code += '    # Handle interests_result node\n';
        code += '    user_id = callback_query.from_user.id\n';
        
        // Add the full message handling for interests_result node
        const messageText = interestsResultNode.data.messageText || "Результат";
        const cleanedMessageText = stripHtmlTags(messageText);
        const formattedText = formatTextForPython(cleanedMessageText);
        
        code += `    text = ${formattedText}\n`;
        code += '    \n';
        code += generateUniversalVariableReplacement('    ');
        
        // ИСПРАВЛЕНИЕ: Специальная логика для interests_result - показываем метро клавиатуру
        console.log('🔧 ГЕНЕРАТОР: Обрабатываем interests_result узел - добавляем метро клавиатуру');
        code += '    # ИСПРАВЛЕНИЕ: Проверяем, нужно ли показать метро клавиатуру\n';
        code += '    logging.info("🔧 ГЕНЕРАТОР DEBUG: Вошли в узел interests_result")\n';
        code += '    # Загружаем флаг из базы данных, если он там есть\n';
        code += '    user_vars = await get_user_from_db(user_id)\n';
        code += '    if not user_vars:\n';
        code += '        user_vars = user_data.get(user_id, {})\n';
        code += '        logging.info("🔧 ГЕНЕРАТОР DEBUG: user_vars загружены из user_data")\n';
        code += '    else:\n';
        code += '        logging.info("🔧 ГЕНЕРАТОР DEBUG: user_vars загружены из базы данных")\n';
        code += '    \n';
        code += '    show_metro_keyboard = False\n';
        code += '    if isinstance(user_vars, dict):\n';
        code += '        if "show_metro_keyboard" in user_vars:\n';
        code += '            show_metro_keyboard = str(user_vars["show_metro_keyboard"]).lower() == "true"\n';
        code += '            logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Нашли show_metro_keyboard в user_vars: {show_metro_keyboard}")\n';
        code += '    \n';
        code += '    # Также проверяем локальное хранилище\n';
        code += '    if not show_metro_keyboard:\n';
        code += '        show_metro_keyboard = user_data.get(user_id, {}).get("show_metro_keyboard", False)\n';
        code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Проверили локальное хранилище: {show_metro_keyboard}")\n';
        code += '    \n';
        code += '    saved_metro = user_data.get(user_id, {}).get("saved_metro_selection", [])\n';
        code += '    logging.info(f"🚇 interests_result: show_metro_keyboard={show_metro_keyboard}, saved_metro={saved_metro}")\n';
        code += '    \n';
        
        // Находим узел metro_selection для восстановления его кнопок
        const metroNode = nodes.find(n => n.id.includes('metro_selection'));
        console.log(`🔧 ГЕНЕРАТОР: Поиск узла metro_selection - найден: ${metroNode ? 'да' : 'нет'}`);
        if (metroNode && metroNode.data.buttons) {
          console.log(`🔧 ГЕНЕРАТОР: Узел metro_selection найден: ${metroNode.id}, кнопок: ${metroNode.data.buttons.length}`);
          code += '    # Создаем метро клавиатуру если нужно\n';
          code += '    if show_metro_keyboard:\n';
          code += '        logging.info("🚇 ПОКАЗЫВАЕМ метро клавиатуру в interests_result")\n';
          code += '        builder = InlineKeyboardBuilder()\n';
          
          // Добавляем кнопки метро
          metroNode.data.buttons.forEach((btn, index) => {
            const shortNodeId = metroNode.id.slice(-10).replace(/^_+/, '');
            const callbackData = `ms_${shortNodeId}_${btn.target || `btn_${index}`}`;
            code += `        # Кнопка метро: ${btn.text}\n`;
            code += `        selected_metro = "${btn.text}" in saved_metro\n`;
            code += `        button_text = "✅ " + "${btn.text}" if selected_metro else "${btn.text}"\n`;
            code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data="${callbackData}"))\n`;
          });
          
          // Добавляем кнопку "Готово" с правильным callback_data для handle_multi_select_done
          const metroCallbackData = `multi_select_done_${metroNode.id}`;
          code += `        builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="${metroCallbackData}"))\n`;
          code += '        builder.adjust(2)  # 2 кнопки в ряд\n';
          code += '        metro_keyboard = builder.as_markup()\n';
          code += '        \n';
          
          // Обычные кнопки interests_result
          code += '        # Добавляем обычные кнопки interests_result\n';
          if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
            code += '        result_builder = InlineKeyboardBuilder()\n';
            interestsResultNode.data.buttons.forEach((btn, index) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `        result_builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `        result_builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "url") {
                code += `        result_builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              }
            });
            code += '        result_keyboard = result_builder.as_markup()\n';
            code += '        \n';
            code += '        # Объединяем клавиатуры\n';
            code += '        combined_keyboard = InlineKeyboardMarkup(inline_keyboard=metro_keyboard.inline_keyboard + result_keyboard.inline_keyboard)\n';
            code += '        await bot.send_message(user_id, text, reply_markup=combined_keyboard)\n';
          } else {
            code += '        await bot.send_message(user_id, text, reply_markup=metro_keyboard)\n';
          }
          
          code += '        # НЕ сбрасываем флаг show_metro_keyboard, чтобы клавиатура оставалась активной\n';
          code += '        logging.info("🚇 Клавиатура метро показана и остается активной")\n';
          code += '    else:\n';
          code += '        # Обычная логика без метро клавиатуры\n';
          
          // Handle buttons if any (без метро клавиатуры)
          if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
            code += '        builder = InlineKeyboardBuilder()\n';
            interestsResultNode.data.buttons.forEach((btn, index) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "url") {
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              }
            });
            code += '        keyboard = builder.as_markup()\n';
            code += '        await bot.send_message(user_id, text, reply_markup=keyboard)\n';
          } else {
            code += '        await bot.send_message(user_id, text)\n';
          }
        } else {
          console.log('🔧 ГЕНЕРАТОР: Узел metro_selection НЕ найден или у него нет кнопок');
          // Обычная логика если узла метро нет
          code += '    logging.info("🚇 Узел metro_selection не найден, используем обычную логику")\n';
          if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
            code += '    builder = InlineKeyboardBuilder()\n';
            interestsResultNode.data.buttons.forEach((btn, index) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              }
            });
            code += '    keyboard = builder.as_markup()\n';
            code += '    await bot.send_message(user_id, text, reply_markup=keyboard)\n';
          } else {
            code += '    await bot.send_message(user_id, text)\n';
          }
        }
        code += '\n';
      }
    }

    // Now generate callback handlers for all remaining referenced nodes that don't have inline buttons
    console.log(`🔍 ГЕНЕРАТОР: Обработка allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);
    console.log(`🔍 ГЕНЕРАТОР: Уже обработанные callbacks: ${Array.from(processedCallbacks).join(', ')}`);
    
    allReferencedNodeIds.forEach(nodeId => {
      console.log(`🔎 ГЕНЕРАТОР: Проверяем узел ${nodeId}`);
      if (!processedCallbacks.has(nodeId)) {
        console.log(`✅ ГЕНЕРАТОР: Узел ${nodeId} НЕ был обработан ранее, создаем обработчик`);
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          console.log(`📋 ГЕНЕРАТОР: Найден узел ${nodeId}, тип: ${targetNode.type}`);
          console.log(`📋 ГЕНЕРАТОР: allowMultipleSelection: ${targetNode.data.allowMultipleSelection}`);
          console.log(`📋 ГЕНЕРАТОР: keyboardType: ${targetNode.data.keyboardType}`);
          console.log(`📋 ГЕНЕРАТОР: кнопок: ${targetNode.data.buttons?.length || 0}`);
          console.log(`📋 ГЕНЕРАТОР: continueButtonTarget: ${targetNode.data.continueButtonTarget || 'нет'}`);
          
          if (nodeId === 'interests_result') {
            console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: СОЗДАЕМ ТРЕТИЙ ОБРАБОТЧИК ДЛЯ interests_result!`);
            console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: interests_result данные:`, JSON.stringify(targetNode.data, null, 2));
            console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: ЭТО МОЖЕТ БЫТЬ ИСТОЧНИКОМ КОНФЛИКТА КЛАВИАТУР!`);
          }
          
          // ВАЖНО: Не создаваем обработчик для "start", если он уже был создан ранее (избегаем дублирования)
          if (nodeId === 'start') {
            console.log(`Пропускаем создание дублированной функции для узла ${nodeId} - уже создана ранее`);
            return; // Пропускаем создание дублированной функции
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также проверяем interests_result и metro_selection
          if (nodeId === 'interests_result') {
            console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для interests_result - уже создан в основном цикле`);
            return; // Избегаем дублирования обработчика interests_result
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пропускаем дублирующий обработчик для metro_selection
          if (nodeId === 'metro_selection') {
            console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для metro_selection - уже создан в основном цикле`);
            return; // Избегаем дублирования обработчика metro_selection
          }
          
          processedCallbacks.add(nodeId);
          
          // Create callback handler for this node that can handle multiple buttons AND multi-select "done" button
          const safeFunctionName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
          const shortNodeIdForDone = nodeId.slice(-10).replace(/^_+/, ''); // Такой же как в генерации кнопки
          code += `\n@dp.callback_query(lambda c: c.data == "${nodeId}" or c.data.startswith("${nodeId}_btn_") or c.data == "done_${shortNodeIdForDone}")\n`;
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    callback_data = callback_query.data\n';
          code += '    \n';
          
          // Добавляем обработку кнопки "Готово" для множественного выбора
          if (targetNode.data.allowMultipleSelection) {
            code += '    # Проверяем, является ли это кнопкой "Готово"\n';
            code += `    if callback_data == "done_${shortNodeIdForDone}":\n`;
            code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
            code += '        \n';
            
            // Сохраняем выбранные значения в базу данных
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            code += '        # Сохраняем выбранные значения в базу данных\n';
            code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${nodeId}", [])\n`;
            code += '        if selected_options:\n';
            code += '            selected_text = ", ".join(selected_options)\n';
            code += `            \n`;
            code += `            # Универсальная логика аккумуляции для всех множественных выборов\n`;
            code += `            # Загружаем существующие значения\n`;
            code += `            existing_data = await get_user_data_from_db(user_id, "${multiSelectVariable}")\n`;
            code += `            existing_selections = []\n`;
            code += `            if existing_data and existing_data.strip():\n`;
            code += `                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]\n`;
            code += `            \n`;
            code += `            # Объединяем существующие и новые выборы (убираем дубли)\n`;
            code += `            all_selections = list(set(existing_selections + selected_options))\n`;
            code += `            final_text = ", ".join(all_selections)\n`;
            code += `            await update_user_data_in_db(user_id, "${multiSelectVariable}", final_text)\n`;
            code += `            logging.info(f"✅ Аккумулировано в переменную ${multiSelectVariable}: {final_text}")\n`;
            code += '        \n';
            
            // Очищаем состояние множественного выбора
            code += '        # Очищаем состояние множественного выбора\n';
            code += '        if user_id in user_data:\n';
            code += `            user_data[user_id].pop("multi_select_${nodeId}", None)\n`;
            code += '            user_data[user_id].pop("multi_select_node", None)\n';
            code += '            user_data[user_id].pop("multi_select_type", None)\n';
            code += '            user_data[user_id].pop("multi_select_variable", None)\n';
            code += '        \n';
            
            // Переход к следующему узлу
            if (targetNode.data.continueButtonTarget) {
              const nextNodeId = targetNode.data.continueButtonTarget;
              code += '        # Переход к следующему узлу\n';
              code += `        next_node_id = "${nextNodeId}"\n`;
              code += '        try:\n';
              code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
              code += '        except Exception as e:\n';
              code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
              code += `            await callback_query.message.edit_text("Переход завершен")\n`;
            } else {
              code += '        # Завершение множественного выбора\n';
              code += `        await callback_query.message.edit_text("✅ Выбор завершен!")\n`;
            }
            code += '        return\n';
            code += '    \n';
          }
          
          // Обычная обработка узлов без специальной логики
          
          // Определяем переменную для сохранения на основе родительского узла  
          if (targetNode && targetNode.data.inputVariable) {
            const variableName = targetNode.data.inputVariable;
            const variableValue = 'callback_query.data';
            
            code += '    # Сохраняем правильную переменную в базу данных\n';
            code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
            code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
            code += '    \n';
          }
          
          code += `    # Обрабатываем узел ${nodeId}: ${nodeId}\n`;
          const messageText = targetNode.data.messageText || "Сообщение не задано";
          const formattedText = formatTextForPython(messageText);
          code += `    text = ${formattedText}\n`;
          code += '    \n';
          code += generateUniversalVariableReplacement('    ');
          
          // ИСПРАВЛЕНИЕ: Добавляем специальную обработку для узлов с множественным выбором
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Все узлы с кнопками selection обрабатываются как множественный выбор
          const hasSelectionButtons = targetNode.data.buttons && targetNode.data.buttons.some(btn => btn.action === 'selection');
          if (targetNode.data.allowMultipleSelection || hasSelectionButtons) {
            // Узел с множественным выбором - создаем специальную клавиатуру
            console.log(`🎯 ГЕНЕРАТОР: ========================================`);
            const reason = hasSelectionButtons ? 'ИМЕЕТ КНОПКИ SELECTION' : 'ИМЕЕТ allowMultipleSelection=true';
            console.log(`🎯 ГЕНЕРАТОР: УЗЕЛ ${nodeId} ${reason}`);
            console.log(`🎯 ГЕНЕРАТОР: ЭТО ПРАВИЛЬНЫЙ ПУТЬ ВЫПОЛНЕНИЯ!`);
            console.log(`🔘 ГЕНЕРАТОР: Кнопки узла ${nodeId}:`, targetNode.data.buttons?.map(b => `${b.text} (action: ${b.action})`)?.join(', ') || 'НЕТ КНОПОК');
            console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget для ${nodeId}: ${targetNode.data.continueButtonTarget}`);
            console.log(`🔧 ГЕНЕРАТОР: multiSelectVariable для ${nodeId}: ${targetNode.data.multiSelectVariable}`);
            console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons: ${hasSelectionButtons}`);
            console.log(`🎯 ГЕНЕРАТОР: ========================================`);
            
            // Добавляем логику инициализации множественного выбора
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            
            code += '    # Инициализация состояния множественного выбора\n';
            code += '    if user_id not in user_data:\n';
            code += '        user_data[user_id] = {}\n';
            code += '    \n';
            code += '    # Загружаем ранее выбранные варианты\n';
            code += '    saved_selections = []\n';
            code += '    if user_vars:\n';
            code += `        for var_name, var_data in user_vars.items():\n`;
            code += `            if var_name == "${multiSelectVariable}":\n`;
            code += '                if isinstance(var_data, dict) and "value" in var_data:\n';
            code += '                    selections_str = var_data["value"]\n';
            code += '                elif isinstance(var_data, str):\n';
            code += '                    selections_str = var_data\n';
            code += '                else:\n';
            code += '                    continue\n';
            code += '                if selections_str and selections_str.strip():\n';
            code += '                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]\n';
            code += '                    break\n';
            code += '    \n';
            code += '    # Инициализируем состояние если его нет\n';
            code += `    if "multi_select_${nodeId}" not in user_data[user_id]:\n`;
            code += `        user_data[user_id]["multi_select_${nodeId}"] = saved_selections.copy()\n`;
            code += `    user_data[user_id]["multi_select_node"] = "${nodeId}"\n`;
            code += `    user_data[user_id]["multi_select_type"] = "inline"\n`;
            code += `    user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
            code += '    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n';
            code += '    \n';
            
            // Создаем inline клавиатуру с кнопками выбора
            code += '    # Создаем inline клавиатуру с поддержкой множественного выбора\n';
            code += '    builder = InlineKeyboardBuilder()\n';
            
            // Разделяем кнопки на опции выбора и обычные кнопки
            console.log(`🔧 ГЕНЕРАТОР: targetNode.data.buttons:`, targetNode.data.buttons);
            
            let buttonsToUse = targetNode.data.buttons || [];
            
            const selectionButtons = buttonsToUse.filter(button => button.action === 'selection');
            const regularButtons = buttonsToUse.filter(button => button.action !== 'selection');
            console.log(`🔧 ГЕНЕРАТОР: Найдено ${selectionButtons.length} кнопок выбора и ${regularButtons.length} обычных кнопок`);
            
            // Добавляем кнопки выбора с отметками о состоянии
            console.log(`🔧 ГЕНЕРАТОР: Создаем ${selectionButtons.length} кнопок выбора для узла ${nodeId}`);
            selectionButtons.forEach((button, index) => {
              // Используем короткие callback_data
              const shortNodeId = generateUniqueShortId(nodeId, allNodeIds || []); // Используем новую функцию
              const shortTarget = (button.target || button.id || 'btn').slice(-8);
              const callbackData = `ms_${shortNodeId}_${shortTarget}`;
              console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> ${callbackData} (shortNodeId: ${shortNodeId}) (длина: ${callbackData.length})`);
              code += `    # Кнопка выбора ${index + 1}: ${button.text}\n`;
              code += `    logging.info(f"🔘 Создаем кнопку: ${button.text} -> ${callbackData}")\n`;
              code += `    selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
              code += `    builder.add(InlineKeyboardButton(text=f"{selected_mark}${button.text}", callback_data="${callbackData}"))\n`;
            });
            
            // Добавляем кнопку "Готово" для множественного выбора
            console.log(`🔧 ГЕНЕРАТОР: НАЧИНАЕМ создание кнопки "Готово" для узла ${nodeId}`);
            console.log(`🔧 ГЕНЕРАТОР: allowMultipleSelection = ${targetNode.data.allowMultipleSelection}`);
            console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget = ${targetNode.data.continueButtonTarget}`);
            console.log(`🔧 ГЕНЕРАТОР: selectionButtons.length = ${selectionButtons.length}`);
            
            // ВСЕГДА добавляем кнопку "Готово" если есть кнопки выбора
            if (selectionButtons.length > 0) {
              console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ кнопку "Готово" (есть ${selectionButtons.length} кнопок выбора)`);
              code += '    # Кнопка "Готово" для множественного выбора\n';
              const shortNodeIdDone = nodeId.slice(-10).replace(/^_+/, ''); // Убираем ведущие underscores
              const doneCallbackData = `done_${shortNodeIdDone}`;
              console.log(`🔧 ГЕНЕРАТОР: Кнопка "Готово" -> ${doneCallbackData} (длина: ${doneCallbackData.length})`);
              console.log(`🔧 ГЕНЕРАТОР: ГЕНЕРИРУЕМ код кнопки "Готово"!`);
              
              code += `    logging.info(f"🔘 Создаем кнопку Готово -> ${doneCallbackData}")\n`;
              code += `    builder.add(InlineKeyboardButton(text="Готово", callback_data="${doneCallbackData}"))\n`;
              
              console.log(`🔧 ГЕНЕРАТОР: ✅ УСПЕШНО добавили кнопку "Готово" в код генерации`);
            } else {
              console.log(`🔧 ГЕНЕРАТОР: ❌ НЕ добавляем кнопку "Готово" - нет кнопок выбора`);
            }  
            
            // Добавляем обычные кнопки (navigation и другие)
            regularButtons.forEach((btn, index) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              }
            });
            
            // Автоматическое распределение колонок для множественного выбора
            const totalButtons = selectionButtons.length + (targetNode.data.continueButtonTarget ? 1 : 0) + regularButtons.length;
            // Для множественного выбора всегда используем nodeData с включенным флагом
            const multiSelectNodeData = { ...targetNode.data, allowMultipleSelection: true };
            const columns = calculateOptimalColumns(selectionButtons, multiSelectNodeData);
            code += `    builder.adjust(${columns})\n`;
            code += '    keyboard = builder.as_markup()\n';
            
          } else if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            // Обычные кнопки без множественного выбора
            code += '    # Create inline keyboard\n';
            code += '    builder = InlineKeyboardBuilder()\n';
            targetNode.data.buttons.forEach((btn, index) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `    # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "selection") {
                // Добавляем поддержку кнопок выбора для обычных узлов
                const callbackData = `multi_select_${nodeId}_${btn.target || btn.id}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
              }
            });
            code += '    keyboard = builder.as_markup()\n';
          } else {
            code += '    keyboard = None\n';
          }
          
          // Send message with keyboard
          code += '    # Отправляем сообщение\n';
          code += '    try:\n';
          code += '        if keyboard:\n';
          code += '            await callback_query.message.edit_text(text, reply_markup=keyboard)\n';
          code += '        else:\n';
          code += '            await callback_query.message.edit_text(text)\n';
          code += '    except Exception:\n';
          code += '        if keyboard:\n';
          code += '            await callback_query.message.answer(text, reply_markup=keyboard)\n';
          code += '        else:\n';
          code += '            await callback_query.message.answer(text)\n';
          
          // Сохраняем нажатие кнопки в базу данных
          code += '    # Сохраняем нажатие кнопки в базу данных\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    \n';
          code += '    # Ищем текст кнопки по callback_data\n';
          // Генерируем код для поиска текста кнопки
          const sourceNode = nodes.find(n => 
            n.data.buttons && n.data.buttons.some(btn => btn.target === nodeId)
          );
          
          // Если к узлу ведут несколько кнопок, нужно определить, какую именно нажали
          let buttonsToTargetNode = [];
          if (sourceNode) {
            buttonsToTargetNode = sourceNode.data.buttons.filter(btn => btn.target === nodeId);
          }
          
          if (buttonsToTargetNode.length > 1) {
            // Несколько кнопок ведут к одному узлу - создаем логику определения по callback_data
            code += `    # Определяем текст кнопки по callback_data\n`;
            code += `    button_display_text = "Неизвестная кнопка"\n`;
            buttonsToTargetNode.forEach((button, index) => {
              // Проверяем по суффиксу _btn_index в callback_data
              code += `    if callback_query.data.endswith("_btn_${index}"):\n`;
              code += `        button_display_text = "${button.text}"\n`;
            });
            
            // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ищем кнопку по точному соответствию callback_data с nodeId
            code += `    # Дополнительная проверка по точному соответствию callback_data\n`;
            buttonsToTargetNode.forEach((button) => {
              code += `    if callback_query.data == "${nodeId}":\n`;
              // Для случая когда несколько кнопок ведут к одному узлу, используем первую найденную
              code += `        button_display_text = "${button.text}"\n`;
            });
          } else if (sourceNode) {
            const button = sourceNode.data.buttons.find(btn => btn.target === nodeId);
            if (button) {
              code += `    button_display_text = "${button.text}"\n`;
            } else {
              code += `    button_display_text = "Кнопка ${nodeId}"\n`;
            }
          } else {
            code += `    button_display_text = "Кнопка ${nodeId}"\n`;
          }
          code += '    \n';
          code += '    # Сохраняем ответ в базу данных\n';

          code += '    timestamp = get_moscow_time()\n';
          code += '    \n';
          code += '    response_data = button_display_text  # Простое значение\n';
          code += '    \n';
          code += '    # Сохраняем в пользовательские данные\n';
          code += '    if user_id not in user_data:\n';
          code += '        user_data[user_id] = {}\n';
          code += '    user_data[user_id]["button_click"] = button_display_text\n';
          code += '    \n';
          // Определяем переменную для сохранения на основе кнопки
          const parentNode = nodes.find(n => 
            n.data.buttons && n.data.buttons.some(btn => btn.target === nodeId)
          );
          
          let variableName = 'button_click';
          let variableValue = 'button_display_text';
          
          // КРИТИЧЕСКИ ВАЖНО: специальная логика для шаблона "Федя"
          if (nodeId === 'source_search') {
            variableName = 'источник';
            variableValue = '"🔍 Поиск в интернете"';
          } else if (nodeId === 'source_friends') {
            variableName = 'источник';
            variableValue = '"👥 Друзья"';
          } else if (nodeId === 'source_ads') {
            variableName = 'источник';
            variableValue = '"📱 Реклама"';
          } else if (parentNode && parentNode.data.inputVariable) {
            variableName = parentNode.data.inputVariable;
            
            // Ищем конкретную кнопку и её значение
            const button = parentNode.data.buttons.find(btn => btn.target === nodeId);
            if (button) {
              // Определяем значение переменной в зависимости от кнопки
              if (button.id === 'btn_search' || nodeId === 'source_search') {
                variableValue = '"из инета"';
              } else if (button.id === 'btn_friends' || nodeId === 'source_friends') {
                variableValue = '"friends"';
              } else if (button.id === 'btn_ads' || nodeId === 'source_ads') {
                variableValue = '"ads"';
              } else if (variableName === 'пол') {
                // Специальная логика для переменной "пол"
                if (button.text === 'Мужчина' || button.text === '👨 Мужчина') {
                  variableValue = '"Мужчина"';
                } else if (button.text === 'Женщина' || button.text === '👩 Женщина') {
                  variableValue = '"Женщина"';
                } else {
                  variableValue = `"${button.text}"`;
                }
              } else {
                variableValue = 'button_display_text';
              }
            }
          }
          
          code += '    # Сохраняем в базу данных с правильным именем переменной\n';
          code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
          code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
          code += '    \n';
          
          // КРИТИЧЕСКИ ВАЖНО: Добавляем показ сообщения "✅ Спасибо за ваш ответ! Обрабатываю..." для кнопок
          code += '    # Показываем сообщение об обработке\n';
          code += '    await callback_query.answer("✅ Спасибо за ваш ответ! Обрабатываю...")\n';
          code += '    \n';
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Для узлов с множественным выбором НЕ делаем автоматической переадресации
          const currentNode = nodes.find(n => n.id === nodeId);
          
          // Для узлов с множественным выбором - НЕ делаем автоматический переход при первичном заходе в узел
          const shouldRedirect = !(currentNode && currentNode.data.allowMultipleSelection);
          console.log(`🔧 ГЕНЕРАТОР КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Узел ${nodeId} allowMultipleSelection: ${currentNode?.data.allowMultipleSelection}, shouldRedirect: ${shouldRedirect}`);
          
          let redirectTarget = nodeId; // По умолчанию остаемся в том же узле
          
          if (shouldRedirect) {
            if (currentNode && currentNode.data.continueButtonTarget) {
              // Для обычных узлов используем continueButtonTarget если есть
              redirectTarget = currentNode.data.continueButtonTarget;
              console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит к continueButtonTarget ${redirectTarget}`);
            } else {
              // Для обычных узлов ищем следующий узел через соединения
              const nodeConnections = connections.filter(conn => conn.sourceNodeId === nodeId);
              if (nodeConnections.length > 0) {
                redirectTarget = nodeConnections[0].targetNodeId;
                console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит через соединение к ${redirectTarget}`);
              } else {
                console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} остается в том же узле (нет соединений)`);
              }
            }
          } else {
            console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} с множественным выбором - НЕ делаем автоматическую переадресацию`);
          }
          
          if (shouldRedirect && redirectTarget) {
            code += '    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сохранения данных\n';
            code += `    next_node_id = "${redirectTarget}"\n`;
            code += '    try:\n';
            code += '        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")\n';
            
            // Добавляем навигацию для каждого узла
            if (nodes.length > 0) {
              nodes.forEach((navTargetNode, index) => {
                const condition = index === 0 ? 'if' : 'elif';
                code += `        ${condition} next_node_id == "${navTargetNode.id}":\n`;
                
                if (navTargetNode.type === 'message') {
                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                  if (navTargetNode.data.allowMultipleSelection === true) {
                    // Для узлов с множественным выбором вызываем полноценный обработчик
                    const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                    code += `            # Узел с множественным выбором - вызываем полноценный обработчик\n`;
                    code += `            logging.info(f"🔧 Callback навигация к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                    code += `            await handle_callback_${safeFunctionName}(callback_query)\n`;
                  } else {
                    const messageText = navTargetNode.data.messageText || 'Сообщение';
                    const formattedText = formatTextForPython(messageText);
                    code += `            nav_text = ${formattedText}\n`;
                    code += '            await callback_query.message.edit_text(nav_text)\n';
                  }
                  
                  // Если узел message собирает ввод, настраиваем ожидание
                  if (navTargetNode.data.collectUserInput === true) {
                    const inputType = navTargetNode.data.inputType || 'text';
                    // ИСПРАВЛЕНИЕ: Берем inputVariable именно из целевого узла, а не из родительского
                    const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                    const inputTargetNodeId = navTargetNode.data.inputTargetNodeId;
                    
                    code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                    code += '            user_id = callback_query.from_user.id\n';
                    code += '            if user_id not in user_data:\n';
                    code += '                user_data[user_id] = {}\n';
                    code += `            # Проверяем, не была ли переменная ${inputVariable} уже сохранена\n`;
                    code += `            if "${inputVariable}" not in user_data[user_id] or not user_data[user_id]["${inputVariable}"]:\n`;
                    code += '                # Переменная не сохранена - настраиваем ожидание ввода\n';
                    code += '                user_data[user_id]["waiting_for_input"] = {\n';
                    code += `                    "type": "${inputType}",\n`;
                    code += `                    "variable": "${inputVariable}",\n`;
                    code += '                    "save_to_database": True,\n';
                    code += `                    "node_id": "${navTargetNode.id}",\n`;
                    code += `                    "next_node_id": "${inputTargetNodeId || ''}",\n`;
                    code += `                    "min_length": ${navTargetNode.data.minLength || 0},\n`;
                    code += `                    "max_length": ${navTargetNode.data.maxLength || 0},\n`;
                    code += '                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
                    code += '                    "success_message": "✅ Спасибо за ваш ответ!"\n';
                    code += '                }\n';
                    code += `                logging.info(f"🔧 Настроено ожидание ввода для переменной: ${inputVariable} (узел ${navTargetNode.id})")\n`;
                    code += '            else:\n';
                    code += `                logging.info(f"⏭️ Переменная ${inputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                  }
                } else if (navTargetNode.type === 'command') {
                  // Для узлов команд вызываем соответствующий обработчик
                  const commandName = navTargetNode.data.command?.replace('/', '') || 'unknown';
                  const handlerName = `${commandName}_handler`;
                  code += `            # Выполняем команду ${navTargetNode.data.command}\n`;
                  code += '            from types import SimpleNamespace\n';
                  code += '            fake_message = SimpleNamespace()\n';
                  code += '            fake_message.from_user = callback_query.from_user\n';
                  code += '            fake_message.chat = callback_query.message.chat\n';
                  code += '            fake_message.date = callback_query.message.date\n';
                  code += '            fake_message.answer = callback_query.message.answer\n';
                  code += `            await ${handlerName}(fake_message)\n`;
                } else if (navTargetNode.type === 'keyboard' && navTargetNode.data.enableTextInput) {
                  // Обрабатываем узлы ввода текста с поддержкой условных сообщений
                  const messageText = navTargetNode.data.messageText || 'Введите ваш ответ:';
                  const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                  const inputTargetNodeId = navTargetNode.data.inputTargetNodeId || '';
                  
                  // Проверяем, есть ли условные сообщения для этого узла
                  const hasConditionalMessages = navTargetNode.data.enableConditionalMessages && 
                                                navTargetNode.data.conditionalMessages && 
                                                navTargetNode.data.conditionalMessages.length > 0;
                  
                  if (hasConditionalMessages) {
                    // Если есть условные сообщения, генерируем их обработку
                    code += '            await callback_query.message.delete()\n';
                    code += '            # Узел с условными сообщениями - проверяем условия\n';
                    code += '            user_id = callback_query.from_user.id\n';
                    code += '            user_data_dict = await get_user_from_db(user_id) or {}\n';
                    code += '            user_data_dict.update(user_data.get(user_id, {}))\n\n';
                    
                    // Добавляем определение функции check_user_variable в локальную область видимости
                    code += '            # Функция для проверки переменных пользователя\n';
                    code += '            def check_user_variable(var_name, user_data_dict):\n';
                    code += '                """Проверяет существование и получает значение переменной пользователя"""\n';
                    code += '                # Сначала проверяем в поле user_data (из БД)\n';
                    code += '                if "user_data" in user_data_dict and user_data_dict["user_data"]:\n';
                    code += '                    try:\n';
                    code += '                        import json\n';
                    code += '                        parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n';
                    code += '                        if var_name in parsed_data:\n';
                    code += '                            raw_value = parsed_data[var_name]\n';
                    code += '                            if isinstance(raw_value, dict) and "value" in raw_value:\n';
                    code += '                                var_value = raw_value["value"]\n';
                    code += '                                # Проверяем, что значение действительно существует и не пустое\n';
                    code += '                                if var_value is not None and str(var_value).strip() != "":\n';
                    code += '                                    return True, str(var_value)\n';
                    code += '                            else:\n';
                    code += '                                # Проверяем, что значение действительно существует и не пустое\n';
                    code += '                                if raw_value is not None and str(raw_value).strip() != "":\n';
                    code += '                                    return True, str(raw_value)\n';
                    code += '                    except (json.JSONDecodeError, TypeError):\n';
                    code += '                        pass\n';
                    code += '                \n';
                    code += '                # Проверяем в локальных данных (без вложенности user_data)\n';
                    code += '                if var_name in user_data_dict:\n';
                    code += '                    variable_data = user_data_dict.get(var_name)\n';
                    code += '                    if isinstance(variable_data, dict) and "value" in variable_data:\n';
                    code += '                        var_value = variable_data["value"]\n';
                    code += '                        # Проверяем, что значение действительно существует и не пустое\n';
                    code += '                        if var_value is not None and str(var_value).strip() != "":\n';
                    code += '                            return True, str(var_value)\n';
                    code += '                    elif variable_data is not None and str(variable_data).strip() != "":\n';
                    code += '                        return True, str(variable_data)\n';
                    code += '                \n';
                    code += '                return False, None\n\n';
                    
                    // Генерируем условную логику для этого узла
                    const conditionalMessages = navTargetNode.data.conditionalMessages.sort((a, b) => (b.priority || 0) - (a.priority || 0));
                    
                    // Создаем единую if/elif/else структуру для всех условий
                    for (let i = 0; i < conditionalMessages.length; i++) {
                      const condition = conditionalMessages[i];
                      const cleanedConditionText = stripHtmlTags(condition.messageText);
                      const conditionText = formatTextForPython(cleanedConditionText);
                      const conditionKeyword = i === 0 ? 'if' : 'elif';
                      
                      // Get variable names - support both new array format and legacy single variable
                      const variableNames = condition.variableNames && condition.variableNames.length > 0 
                        ? condition.variableNames 
                        : (condition.variableName ? [condition.variableName] : []);
                      
                      const logicOperator = condition.logicOperator || 'AND';
                      
                      code += `            # Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;
                      
                      if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                        // Создаем единый блок условия с проверками ВНУТРИ
                        code += `            ${conditionKeyword} (\n`;
                        for (let j = 0; j < variableNames.length; j++) {
                          const varName = variableNames[j];
                          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                          code += `                check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
                        }
                        code += `            ):\n`;
                        
                        // Внутри блока условия собираем значения переменных
                        code += `                # Собираем значения переменных\n`;
                        code += `                variable_values = {}\n`;
                        for (const varName of variableNames) {
                          code += `                _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
                        }
                        
                        code += `                text = ${conditionText}\n`;
                        
                        // Заменяем переменные в тексте
                        for (const varName of variableNames) {
                          code += `                if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
                          code += `                    text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
                        }
                        
                        // Генерируем клавиатуру для условного сообщения если она есть
                        if (condition.keyboardType && condition.keyboardType !== 'none' && condition.buttons && condition.buttons.length > 0) {
                          code += '                # Создаем клавиатуру для условного сообщения\n';
                          
                          if (condition.keyboardType === 'inline') {
                            code += '                builder = InlineKeyboardBuilder()\n';
                            condition.buttons.forEach((button: any) => {
                              if (button.action === "url") {
                                code += `                builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
                              } else if (button.action === 'goto') {
                                const callbackData = button.target || button.id || 'no_action';
                                code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
                              } else if (button.action === 'command') {
                                // Для кнопок команд создаем специальную callback_data
                                const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                                code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
                              } else {
                                const callbackData = button.target || button.id || 'no_action';
                                code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
                              }
                            });
                            code += '                conditional_keyboard = builder.as_markup()\n';
                            code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                          } else if (condition.keyboardType === 'reply') {
                            code += '                builder = ReplyKeyboardBuilder()\n';
                            condition.buttons.forEach((button: any) => {
                              if (button.action === "contact" && button.requestContact) {
                                code += `                builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
                              } else if (button.action === "location" && button.requestLocation) {
                                code += `                builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
                              } else {
                                code += `                builder.add(KeyboardButton(text="${button.text}"))\n`;
                              }
                            });
                            code += '                conditional_keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)\n';
                            code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                          }
                        } else {
                          // Нет клавиатуры - отправляем только текст
                          code += '                await bot.send_message(user_id, text)\n';
                        }
                        
                        // Настраиваем ожидание текстового ввода для условного сообщения (если нужно)
                        if (condition.waitForTextInput) {
                          // ИСПРАВЛЕНИЕ: Используем переменную из условия или из целевого узла
                          const conditionalInputVariable = condition.textInputVariable || navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                          code += `                # Настраиваем ожидание текстового ввода для условного сообщения\n`;
                          code += `                user_data[user_id]["waiting_for_input"] = {\n`;
                          code += `                    "type": "text",\n`;
                          code += `                    "variable": "${conditionalInputVariable}",\n`;
                          code += `                    "save_to_database": True,\n`;
                          code += `                    "node_id": "${navTargetNode.id}",\n`;
                          code += `                    "next_node_id": "${condition.nextNodeAfterInput || inputTargetNodeId}"\n`;
                          code += `                }\n`;
                          code += `                logging.info(f"🔧 Настроено условное ожидание ввода для переменной: ${conditionalInputVariable} (узел ${navTargetNode.id})")\n`;
                        }
                      }
                    }
                    
                    // Fallback сообщение
                    code += `            else:\n`;
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором создаем прямую навигацию
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `                # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                      code += `                logging.info(f"🔧 Fallback переход к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += `                nav_text = ${formattedText}\n`;
                      
                      // Замена переменных
                      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
                      code += generateUniversalVariableReplacement('                ');
                      
                      // Инициализируем состояние множественного выбора
                      code += `                # Инициализируем состояние множественного выбора\n`;
                      code += `                user_data[user_id]["multi_select_${navTargetNode.id}"] = []\n`;
                      code += `                user_data[user_id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                      code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
                      if (navTargetNode.data.multiSelectVariable) {
                        code += `                user_data[user_id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                      }
                      
                      // Создаем inline клавиатуру с кнопками выбора
                      if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(navTargetNode.data.buttons, '                ', navTargetNode.id, navTargetNode.data, allNodeIds);
                        code += `                await bot.send_message(user_id, nav_text, reply_markup=keyboard)\n`;
                      } else {
                        code += `                await bot.send_message(user_id, nav_text)\n`;
                      }
                      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
                    } else {
                      const formattedText = formatTextForPython(messageText);
                      // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                      const fallbackInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                      code += `                # Fallback сообщение\n`;
                      code += `                nav_text = ${formattedText}\n`;
                      // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                      if (navTargetNode.data.collectUserInput === true) {
                      code += `                # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n`;
                      code += `                if "${fallbackInputVariable}" not in user_data[user_id] or not user_data[user_id]["${fallbackInputVariable}"]:\n`;
                      code += `                    # Настраиваем ожидание ввода\n`;
                      code += `                    user_data[user_id]["waiting_for_input"] = {\n`;
                      code += `                        "type": "text",\n`;
                      code += `                        "variable": "${fallbackInputVariable}",\n`;
                      code += `                        "save_to_database": True,\n`;
                      code += `                        "node_id": "${navTargetNode.id}",\n`;
                      code += `                        "next_node_id": "${inputTargetNodeId}"\n`;
                      code += `                    }\n`;
                      code += `                    logging.info(f"🔧 Настроено fallback ожидание ввода для переменной: ${fallbackInputVariable} (узел ${navTargetNode.id})")\n`;
                      code += `                else:\n`;
                        code += `                    logging.info(f"⏭️ Переменная ${fallbackInputVariable} уже сохранена, пропускаем fallback ожидание ввода")\n`;
                      } else {
                        code += `                logging.info(f"Fallback переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                      }
                      code += `                await bot.send_message(user_id, nav_text)\n`;
                    }
                  } else {
                    // Обычный узел без условных сообщений
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором создаем прямую навигацию
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `            # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                      code += `            logging.info(f"🔧 Переходим к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += '            await callback_query.message.delete()\n';
                      code += `            text = ${formattedText}\n`;
                      
                      // Замена переменных
                      code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                      code += generateUniversalVariableReplacement('            ');
                      
                      // Инициализируем состояние множественного выбора
                      code += `            # Инициализируем состояние множественного выбора\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_${navTargetNode.id}"] = []\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_type"] = "selection"\n`;
                      if (navTargetNode.data.multiSelectVariable) {
                        code += `            user_data[callback_query.from_user.id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                      }
                      
                      // Создаем inline клавиатуру с кнопками выбора
                      if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(navTargetNode.data.buttons, '            ', navTargetNode.id, navTargetNode.data, allNodeIds);
                        code += `            await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n`;
                      } else {
                        code += `            await bot.send_message(callback_query.from_user.id, text)\n`;
                      }
                      code += `            logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
                    } else {
                      const formattedText = formatTextForPython(messageText);
                      code += '            await callback_query.message.delete()\n';
                      code += `            nav_text = ${formattedText}\n`;
                    
                      // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                      if (navTargetNode.data.collectUserInput === true) {
                        // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                        const regularInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                        code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                        code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                        code += `            if "${regularInputVariable}" not in user_data[callback_query.from_user.id] or not user_data[callback_query.from_user.id]["${regularInputVariable}"]:\n`;
                        code += '                # Настраиваем ожидание ввода\n';
                        code += '                user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                        code += '                    "type": "text",\n';
                        code += `                    "variable": "${regularInputVariable}",\n`;
                        code += '                    "save_to_database": True,\n';
                        code += `                    "node_id": "${navTargetNode.id}",\n`;
                        code += `                    "next_node_id": "${inputTargetNodeId}"\n`;
                        code += '                }\n';
                        code += `                logging.info(f"🔧 Настроено ожидание ввода для переменной: ${regularInputVariable} (узел ${navTargetNode.id})")\n`;
                        code += '            else:\n';
                        code += `                logging.info(f"⏭️ Переменная ${regularInputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                      } else {
                        code += `            logging.info(f"Переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                      }
                      code += '            await bot.send_message(callback_query.from_user.id, nav_text)\n';
                    }
                  }
                } else {
                  code += `            logging.info("Переход к узлу ${navTargetNode.id}")\n`;
                }
              });
              
              code += '        else:\n';
              code += '            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
            } else {
              code += '        # No nodes available for navigation\n';
              code += '        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
            }
            
            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
            code += '    \n';
            code += '    return  # Завершаем обработку после переадресации\n';
          }
          code += '    \n';
          
          // Generate response based on node type
          if (targetNode.type === 'user-input') {
            // Handle user-input nodes
            const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
            const responseType = targetNode.data.responseType || 'text';
            const inputType = targetNode.data.inputType || 'text';
            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const saveToDatabase = targetNode.data.saveToDatabase || false;
            
            code += '    # Удаляем старое сообщение\n';
            code += '    await callback_query.message.delete()\n';
            code += '    \n';
            
            const formattedPrompt = formatTextForPython(inputPrompt);
            code += `    text = ${formattedPrompt}\n`;
            
            if (responseType === 'text') {
              // Find next node through connections
              const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
              const nextNodeId = nextConnection ? nextConnection.targetNodeId : null;
              
              code += '    # Настраиваем ожидание ввода\n';
              code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
              code += `        "type": "${inputType}",\n`;
              code += `        "variable": "${inputVariable}",\n`;
              code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
              code += `        "node_id": "${targetNode.id}",\n`;
              code += `        "next_node_id": "${nextNodeId || ''}"\n`;
              code += '    }\n';
              code += '    await bot.send_message(callback_query.from_user.id, text)\n';
            }
          } else {
            // Handle regular message nodes
            const targetText = targetNode.data.messageText || "Сообщение";
            const formattedTargetText = formatTextForPython(targetText);
            
            // Добавляем поддержку условных сообщений для callback handlers
            if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
              code += '    # Проверяем условные сообщения\n';
              code += '    text = None\n';
              code += '    \n';
              code += '    # Получаем данные пользователя для проверки условий\n';
              code += '    user_record = await get_user_from_db(user_id)\n';
              code += '    if not user_record:\n';
              code += '        user_record = user_data.get(user_id, {})\n';
              code += '    \n';
              code += '    # Безопасно извлекаем user_data\n';
              code += '    if isinstance(user_record, dict):\n';
              code += '        if "user_data" in user_record:\n';
              code += '            if isinstance(user_record["user_data"], str):\n';
              code += '                try:\n';
              code += '                    import json\n';
              code += '                    user_data_dict = json.loads(user_record["user_data"])\n';
              code += '                except (json.JSONDecodeError, TypeError):\n';
              code += '                    user_data_dict = {}\n';
              code += '            elif isinstance(user_record["user_data"], dict):\n';
              code += '                user_data_dict = user_record["user_data"]\n';
              code += '            else:\n';
              code += '                user_data_dict = {}\n';
              code += '        else:\n';
              code += '            user_data_dict = user_record\n';
              code += '    else:\n';
              code += '        user_data_dict = {}\n';
              code += '    \n';
              code += '    # Функция для замены переменных в тексте\n';
              code += '    def replace_variables_in_text(text_content, variables_dict):\n';
              code += '        if not text_content or not variables_dict:\n';
              code += '            return text_content\n';
              code += '        \n';
              code += '        for var_name, var_data in variables_dict.items():\n';
              code += '            placeholder = "{" + var_name + "}"\n';
              code += '            if placeholder in text_content:\n';
              code += '                if isinstance(var_data, dict) and "value" in var_data:\n';
              code += '                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n';
              code += '                elif var_data is not None:\n';
              code += '                    var_value = str(var_data)\n';
              code += '                else:\n';
              code += '                    var_value = var_name  # Показываем имя переменной если значения нет\n';
              code += '                text_content = text_content.replace(placeholder, var_value)\n';
              code += '        return text_content\n';
              code += '    \n';
              
              // Generate conditional logic using helper function
              code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
              
              // Add fallback
              code += '    else:\n';
              
              if (targetNode.data.fallbackMessage) {
                const fallbackText = formatTextForPython(targetNode.data.fallbackMessage);
                code += `        text = ${fallbackText}\n`;
                code += '        text = replace_variables_in_text(text, user_data_dict)\n';
                code += '        logging.info("Используется запасное сообщение")\n';
              } else {
                code += `        text = ${formattedTargetText}\n`;
                code += '        text = replace_variables_in_text(text, user_data_dict)\n';
                code += '        logging.info("Используется основное сообщение узла")\n';
              }
              
              code += '    \n';
            } else {
              code += `    text = ${formattedTargetText}\n`;
              
              // Добавляем замену переменных для обычных сообщений
              code += generateUniversalVariableReplacement('    ');
            }
            
            // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
            if (targetNode.data.collectUserInput === true) {
              // Настраиваем сбор пользовательского ввода
              const inputType = targetNode.data.inputType || 'text';
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const saveToDatabase = targetNode.data.saveToDatabase !== false; // По умолчанию true для collectUserInput
              const inputTargetNodeId = targetNode.data.inputTargetNodeId;
              
              code += '    # Активируем сбор пользовательского ввода\n';
              code += '    if callback_query.from_user.id not in user_data:\n';
              code += '        user_data[callback_query.from_user.id] = {}\n';
              code += '    \n';
              code += `    user_data[callback_query.from_user.id]["waiting_for_input"] = "${targetNode.id}"\n`;
              code += `    user_data[callback_query.from_user.id]["input_type"] = "${inputType}"\n`;
              code += `    user_data[callback_query.from_user.id]["input_variable"] = "${inputVariable}"\n`;
              code += `    user_data[callback_query.from_user.id]["save_to_database"] = ${toPythonBoolean(saveToDatabase)}\n`;
              code += `    user_data[callback_query.from_user.id]["input_target_node_id"] = "${inputTargetNodeId || ''}"\n`;
              code += '    \n';
              
              // ИСПРАВЛЕНИЕ: Добавляем поддержку inline кнопок с проверкой условной клавиатуры
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if "keyboard" not in locals() or keyboard is None:\n';
                code += '        # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    // Создаем уникальный callback_data, включающий ID кнопки и текст
                    const callbackData = btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для команд создаем специальный callback_data с префиксом cmd_
                    const commandName = btn.target ? btn.target.replace('/', '') : 'unknown';
                    const callbackData = `cmd_${commandName}`;
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += '    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n';
                code += '    try:\n';
                code += `        await callback_query.message.edit_text(text, reply_markup=keyboard${parseModeTarget})\n`;
                code += '    except Exception as e:\n';
                code += '        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n';
                code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
              } else {
                code += '    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n';
                code += '    try:\n';
                code += '        await callback_query.message.edit_text(text)\n';
                code += '    except Exception as e:\n';
                code += '        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n';
                code += '        await callback_query.message.answer(text)\n';
              }
              code += '    \n';
            } else {
              // Обычное отображение сообщения без сбора ввода
              
              // Handle keyboard for target node
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn, index) => {
                  if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    // Создаем уникальный callback_data, включающий ID кнопки
                    const callbackData = btn.id || 'no_action';
                    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для команд создаем специальный callback_data с префиксом cmd_
                    const commandName = btn.target ? btn.target.replace('/', '') : 'unknown';
                    const callbackData = `cmd_${commandName}`;
                    code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '    keyboard = builder.as_markup()\n';
                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += `    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n`;
                code += `    try:\n`;
                code += `        await callback_query.message.edit_text(text, reply_markup=keyboard${parseModeTarget})\n`;
                code += `    except Exception as e:\n`;
                code += `        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n`;
                code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
              } else {
                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += `    # Пытаемся редактировать сообщение, если не получается - отправляем новое\n`;
                code += `    try:\n`;
                code += `        await callback_query.message.edit_text(text${parseModeTarget})\n`;
                code += `    except Exception as e:\n`;
                code += `        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")\n`;
                code += `        await callback_query.message.answer(text${parseModeTarget})\n`;
              }
            } // Закрываем else блок для обычного отображения
          } // Закрываем else блок для regular message nodes
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем обязательный return в конец функции
          code += '    return\n';
        }
      }
    });
  }
  
  // Generate handlers for reply keyboard buttons
  const replyNodes = (nodes || []).filter(node => 
    node.data.keyboardType === 'reply' && node.data.buttons && node.data.buttons.length > 0
  );
  
  if (replyNodes.length > 0) {
    code += '\n# Обработчики reply кнопок\n';
    const processedReplyButtons = new Set<string>();
    
    replyNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target) {
          const buttonText = button.text;
          
          // Avoid duplicate handlers
          if (processedReplyButtons.has(buttonText)) return;
          processedReplyButtons.add(buttonText);
          
          // Find target node
          const targetNode = nodes.find(n => n.id === button.target);
          if (targetNode) {
            code += `\n@dp.message(lambda message: message.text == "${buttonText}")\n`;
            // Создаем безопасное имя функции на основе button ID
            const safeFunctionName = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `async def handle_reply_${safeFunctionName}(message: types.Message):\n`;
            
            // Generate response for target node
            const targetText = targetNode.data.messageText || "Сообщение";
            const formattedTargetText = formatTextForPython(targetText);
            code += `    text = ${formattedTargetText}\n`;
            
            // Добавляем замену переменных для reply кнопок
            code += '    user_id = message.from_user.id\n';
            code += generateUniversalVariableReplacement('    ');
            
            // Handle keyboard for target node
            if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn, index) => {
                code += `    builder.add(KeyboardButton(text="${btn.text}"))\n`;
              });
              const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
              const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
              code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              // Определяем режим форматирования для целевого узла
              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `    await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
            
            // Дополнительно: сохраняем нажатие reply кнопки если включен сбор ответов
            code += '    \n';
            code += '    # Сохраняем нажатие reply кнопки если включен сбор ответов\n';
            code += '    user_id = message.from_user.id\n';
            code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
            code += '        import datetime\n';
            code += '        timestamp = get_moscow_time()\n';
            code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
            code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
            code += '        \n';
            code += '        response_data = {\n';
            code += `            "value": "${buttonText}",\n`;
            code += '            "type": "reply_button",\n';
            code += '            "timestamp": timestamp,\n';
            code += '            "nodeId": input_node_id,\n';
            code += '            "variable": input_variable,\n';
            code += '            "source": "reply_button_click"\n';
            code += '        }\n';
            code += '        \n';
            code += '        user_data[user_id][f"{input_variable}_button"] = response_data\n';
            code += '        logging.info(f"Reply кнопка сохранена: {input_variable}_button = ${buttonText} (пользователь {user_id})")\n';
            
            } else if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              // Добавляем поддержку условных сообщений для целевого узла
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Проверка условных сообщений для целевого узла\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
                code += '    use_conditional_keyboard = conditional_keyboard is not None\n';
              } else {
                code += '    # Инициализируем переменную для проверки условной клавиатуры\n';
                code += '    use_conditional_keyboard = False\n';
                code += '    conditional_keyboard = None\n';
              }
              
              code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
              code += '    if use_conditional_keyboard:\n';
              // Определяем режим форматирования для целевого узла
              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `        await message.answer(text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
              code += '    else:\n';
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn, index) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  // Если есть target, используем его, иначе используем ID кнопки как callback_data
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command') {
                  // Для команд создаем специальный callback_data с префиксом cmd_
                  const commandName = btn.target ? btn.target.replace('/', '') : 'unknown';
                  const callbackData = `cmd_${commandName}`;
                  code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                }
              });
              // Добавляем настройку колонок для консистентности
              const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
              code += `        builder.adjust(${columns})\n`;
              code += '        keyboard = builder.as_markup()\n';
              code += `        await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
            
            // Дополнительно: сохраняем нажатие reply кнопки если включен сбор ответов
            code += '    \n';
            code += '    # Сохраняем нажатие reply кнопки если включен сбор ответов\n';
            code += '    user_id = message.from_user.id\n';
            code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
            code += '        import datetime\n';
            code += '        timestamp = get_moscow_time()\n';
            code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
            code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
            code += '        \n';
            code += '        response_data = {\n';
            code += `            "value": "${buttonText}",\n`;
            code += '            "type": "reply_button",\n';
            code += '            "timestamp": timestamp,\n';
            code += '            "nodeId": input_node_id,\n';
            code += '            "variable": input_variable,\n';
            code += '            "source": "reply_button_click"\n';
            code += '        }\n';
            code += '        \n';
            code += '        user_data[user_id][f"{input_variable}_button"] = response_data\n';
            code += '        logging.info(f"Reply кнопка сохранена: {input_variable}_button = ${buttonText} (пользователь {user_id})")\n';
            
            } else {
              code += '    # Удаляем предыдущие reply клавиатуры если они были\n';
              // Определяем режим форматирования для целевого узла
              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `    await message.answer(text, reply_markup=ReplyKeyboardRemove()${parseModeTarget})\n`;
            }
          }
        }
      });
    });
  }

  // Generate handlers for contact and location buttons
  const contactButtons = replyNodes.flatMap(node => 
    node.data.buttons.filter(button => button.action === 'contact')
  );
  
  const locationButtons = replyNodes.flatMap(node => 
    node.data.buttons.filter(button => button.action === 'location')
  );
  
  if (contactButtons.length > 0 || locationButtons.length > 0) {
    code += '\n# Обработчики специальных кнопок\n';
    
    if (contactButtons.length > 0) {
      code += '\n@dp.message(F.contact)\n';
      code += 'async def handle_contact(message: types.Message):\n';
      code += '    contact = message.contact\n';
      code += '    text = f"Спасибо за контакт!\\n"\n';
      code += '    text += f"Имя: {contact.first_name}\\n"\n';
      code += '    text += f"Телефон: {contact.phone_number}"\n';
      code += '    await message.answer(text)\n';
    }
    
    if (locationButtons.length > 0) {
      code += '\n@dp.message(F.location)\n';
      code += 'async def handle_location(message: types.Message):\n';
      code += '    location = message.location\n';
      code += '    text = f"Спасибо за геолокацию!\\n"\n';
      code += '    text += f"Широта: {location.latitude}\\n"\n';
      code += '    text += f"Долгота: {location.longitude}"\n';
      code += '    await message.answer(text)\n';
    }
  }

  // Добавляем обработчики кнопочных ответов для user-input узлов
  const userInputNodes = (nodes || []).filter(node => 
    node.type === 'user-input' && 
    node.data.responseType === 'buttons' && 
    Array.isArray(node.data.responseOptions) && 
    node.data.responseOptions.length > 0
  );

  if (userInputNodes.length > 0) {
    code += '\n# Обработчики кнопочных ответов для сбора пользовательского ввода\n';
    
    userInputNodes.forEach(node => {
      const responseOptions = node.data.responseOptions || [];
      
      // Обработчики для каждого варианта ответа
      responseOptions.forEach((option, index) => {
        code += `\n@dp.callback_query(F.data == "response_${node.id}_${index}")\n`;
        const safeFunctionName = `${node.id}_${index}`.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `async def handle_response_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
        code += '    user_id = callback_query.from_user.id\n';
        code += '    \n';
        code += '    # Проверяем настройки кнопочного ответа\n';
        code += '    if user_id not in user_data or "button_response_config" not in user_data[user_id]:\n';
        code += '        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)\n';
        code += '        return\n';
        code += '    \n';
        code += '    config = user_data[user_id]["button_response_config"]\n';
        code += `    selected_value = "${option.value || option.text}"\n`;
        code += `    selected_text = "${option.text}"\n`;
        code += '    \n';
        code += '    # Обработка множественного выбора\n';
        code += '    if config.get("allow_multiple"):\n';
        code += '        # Проверяем, является ли это кнопкой "Готово" для завершения выбора\n';
        code += '        if selected_value == "done":\n';
        code += '            # Завершаем множественный выбор\n';
        code += '            if len(config["selected"]) > 0:\n';
        code += '                # Сохраняем все выбранные элементы\n';
        code += '                variable_name = config.get("variable", "user_response")\n';
        code += '                import datetime\n';
        code += '                import pytz\n';
        code += '                timestamp = datetime.datetime.now(moscow_tz).isoformat()\n';
        code += '                node_id = config.get("node_id", "unknown")\n';
        code += '                \n';
        code += '                # Создаем структурированный ответ для множественного выбора\n';
        code += '                response_data = {\n';
        code += '                    "value": [item["value"] for item in config["selected"]],\n';
        code += '                    "text": [item["text"] for item in config["selected"]],\n';
        code += '                    "type": "multiple_choice",\n';
        code += '                    "timestamp": timestamp,\n';
        code += '                    "nodeId": node_id,\n';
        code += '                    "variable": variable_name\n';
        code += '                }\n';
        code += '                \n';
        code += '                # Сохраняем в пользовательские данные\n';
        code += '                user_data[user_id][variable_name] = response_data\n';
        code += '                \n';
        code += '                # Сохраняем в базу данных если включено\n';
        code += '                if config.get("save_to_database"):\n';
        code += '                    saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
        code += '                    if saved_to_db:\n';
        code += '                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data[\'text\']} (пользователь {user_id})")\n';
        code += '                    else:\n';
        code += '                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
        code += '                \n';
        code += '                # Отправляем сообщение об успехе\n';
        code += '                success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
        code += '                selected_items = ", ".join([item["text"] for item in config["selected"]])\n';
        code += '                await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_items}")\n';
        code += '                \n';
        code += '                logging.info(f"Получен множественный выбор: {variable_name} = {[item[\'text\'] for item in config[\'selected\']]}")\n';
        code += '                \n';
        code += '                # Очищаем состояние\n';
        code += '                del user_data[user_id]["button_response_config"]\n';
        code += '                \n';
        code += '                # Автоматическая навигация к следующему узлу\n';
        code += '                next_node_id = config.get("next_node_id")\n';
        code += '                if next_node_id:\n';
        code += '                    try:\n';
        code += '                        # Вызываем обработчик для следующего узла\n';
        
        // Add navigation for done button
        if (nodes.length > 0) {
          nodes.forEach((btnNode, btnIndex) => {
            const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            const condition = btnIndex === 0 ? 'if' : 'elif';
            code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
            code += `                            await handle_callback_${safeFunctionName}(callback_query)\n`;
          });
          
          code += '                        else:\n';
          code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
        } else {
          code += '                        # No nodes available for navigation\n';
          code += '                        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
        }
        code += '                    except Exception as e:\n';
        code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
        code += '                return\n';
        code += '            else:\n';
        code += '                # Если ничего не выбрано, показываем предупреждение\n';
        code += '                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)\n';
        code += '                return\n';
        code += '        else:\n';
        code += '            # Обычная логика множественного выбора\n';
        code += '            if selected_value not in config["selected"]:\n';
        code += '                config["selected"].append({"text": selected_text, "value": selected_value})\n';
        code += '                await callback_query.answer(f"✅ Выбрано: {selected_text}")\n';
        code += '            else:\n';
        code += '                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]\n';
        code += '                await callback_query.answer(f"❌ Убрано: {selected_text}")\n';
        code += '            return  # Не завершаем сбор, позволяем выбрать еще\n';
        code += '    \n';
        code += '    # Сохраняем одиночный выбор\n';
        code += '    variable_name = config.get("variable", "user_response")\n';
        code += '    import datetime\n';
        code += '    timestamp = get_moscow_time()\n';
        code += '    node_id = config.get("node_id", "unknown")\n';
        code += '    \n';
        code += '    # Создаем структурированный ответ\n';
        code += '    response_data = {\n';
        code += '        "value": selected_value,\n';
        code += '        "text": selected_text,\n';
        code += '        "type": "button_choice",\n';
        code += '        "timestamp": timestamp,\n';
        code += '        "nodeId": node_id,\n';
        code += '        "variable": variable_name\n';
        code += '    }\n';
        code += '    \n';
        code += '    # Сохраняем в пользовательские данные\n';
        code += '    user_data[user_id][variable_name] = response_data\n';
        code += '    \n';
        code += '    # Сохраняем в базу данных если включено\n';
        code += '    if config.get("save_to_database"):\n';
        code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
        code += '        if saved_to_db:\n';
        code += '            logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
        code += '        else:\n';
        code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
        code += '    \n';
        code += '    # Отправляем сообщение об успехе\n';
        code += '    success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
        code += '    await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}")\n';
        code += '    \n';
        code += '    # Очищаем состояние\n';
        code += '    del user_data[user_id]["button_response_config"]\n';
        code += '    \n';
        code += '    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")\n';
        code += '    \n';
        code += '    # Навигация на основе индивидуальных настроек кнопки\n';
        code += '    # Находим настройки для этого конкретного варианта ответа\n';
        code += '    options = config.get("options", [])\n';
        code += `    current_option = None\n`;
        code += `    for option in options:\n`;
        code += `        if option.get("callback_data") == "response_${node.id}_${index}":\n`;
        code += `            current_option = option\n`;
        code += `            break\n`;
        code += '    \n';
        code += '    if current_option:\n';
        code += '        option_action = current_option.get("action", "goto")\n';
        code += '        option_target = current_option.get("target", "")\n';
        code += '        option_url = current_option.get("url", "")\n';
        code += '        \n';
        code += '        if option_action == "url" and option_url:\n';
        code += '            # Открываем ссылку\n';
        code += '            from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup\n';
        code += '            keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
        code += '                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]\n';
        code += '            ])\n';
        code += '            await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)\n';
        code += '        elif option_action == "command" and option_target:\n';
        code += '            # Выполняем команду\n';
        code += '            command = option_target\n';
        code += '            if not command.startswith("/"):\n';
        code += '                command = "/" + command\n';
        code += '            \n';
        code += '            # Создаем фиктивное сообщение для выполнения команды\n';
        code += '            import aiogram.types as aiogram_types\n';
        code += '            fake_message = aiogram_types.SimpleNamespace(\n';
        code += '                from_user=callback_query.from_user,\n';
        code += '                chat=callback_query.message.chat,\n';
        code += '                text=command,\n';
        code += '                message_id=callback_query.message.message_id\n';
        code += '            )\n';
        code += '            \n';
        
        // Добавляем обработку различных команд для button responses
        const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
        commandNodes.forEach((cmdNode, cmdIndex) => {
          const condition = cmdIndex === 0 ? 'if' : 'elif';
          code += `            ${condition} command == "${cmdNode.data.command}":\n`;
          code += `                try:\n`;
          code += `                    await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
          code += `                except Exception as e:\n`;
          code += `                    logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
        });
        if (commandNodes.length > 0) {
          code += `            else:\n`;
          code += `                logging.warning(f"Неизвестная команда: {command}")\n`;
        }
        code += '        elif option_action == "goto" and option_target:\n';
        code += '            # Переход к узлу\n';
        code += '            target_node_id = option_target\n';
        code += '            try:\n';
        code += '                # Вызываем обработчик для целевого узла\n';
        
        // Generate navigation logic for button responses  
        if (nodes.length > 0) {
          nodes.forEach((btnNode, btnIndex) => {
            const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            const condition = btnIndex === 0 ? 'if' : 'elif';
            code += `                ${condition} target_node_id == "${btnNode.id}":\n`;
            code += `                    await handle_callback_${safeFunctionName}(callback_query)\n`;
          });
          code += '                else:\n';
          code += '                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
        } else {
          code += '                pass  # No nodes to handle\n';
        }
        code += '            except Exception as e:\n';
        code += '                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
        code += '    else:\n';
        code += '        # Fallback к старой системе next_node_id если нет настроек кнопки\n';
        code += '        next_node_id = config.get("next_node_id")\n';
        code += '        if next_node_id:\n';
        code += '            try:\n';
        code += '                # Вызываем обработчик для следующего узла\n';
          
          if (nodes.length > 0) {
            nodes.forEach((btnNode, btnIndex) => {
              const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
              const condition = btnIndex === 0 ? 'if' : 'elif';
              code += `                ${condition} next_node_id == "${btnNode.id}":\n`;
              code += `                    await handle_callback_${safeFunctionName}(callback_query)\n`;
            });
            code += '                else:\n';
            code += '                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
          } else {
            code += '                pass  # No nodes to handle\n';
          }
          code += '            except Exception as e:\n';
          code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
      });
      
      // Обработчик для кнопки "Пропустить"
      if (node.data.allowSkip) {
        code += `\n@dp.callback_query(F.data == "skip_${node.id}")\n`;
        code += `async def handle_skip_${node.id}(callback_query: types.CallbackQuery):\n`;
        code += '    user_id = callback_query.from_user.id\n';
        code += '    \n';
        code += '    # Проверяем настройки\n';
        code += '    if user_id not in user_data or "button_response_config" not in user_data[user_id]:\n';
        code += '        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)\n';
        code += '        return\n';
        code += '    \n';
        code += '    await callback_query.message.edit_text("⏭️ Ответ пропущен")\n';
        code += '    del user_data[user_id]["button_response_config"]\n';
        code += '    \n';
        code += '    logging.info(f"Пользователь {user_id} пропустил кнопочный ответ")\n';
      }
    });
  }

  // Добавляем универсальный обработчик пользовательского ввода
  code += '\n\n# Универсальный обработчик пользовательского ввода\n';
  code += '@dp.message(F.text)\n';
  code += 'async def handle_user_input(message: types.Message):\n';
  code += '    user_id = message.from_user.id\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы ввод для условного сообщения\n';
  code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
  code += '        config = user_data[user_id]["waiting_for_conditional_input"]\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Сохраняем текстовый ввод для условного сообщения\n';
  code += '        condition_id = config.get("condition_id", "unknown")\n';
  code += '        next_node_id = config.get("next_node_id")\n';
  code += '        \n';
  code += '        # Сохраняем ответ пользователя\n';
  code += '        timestamp = get_moscow_time()\n';
  code += '        # Используем переменную из конфигурации или создаем автоматическую\n';
  code += '        input_variable = config.get("input_variable", "")\n';
  code += '        if input_variable:\n';
  code += '            variable_name = input_variable\n';
  code += '        else:\n';
  code += '            variable_name = f"conditional_response_{condition_id}"\n';
  code += '        \n';
  code += '        # Сохраняем в пользовательские данные\n';
  code += '        user_data[user_id][variable_name] = user_text\n';
  code += '        \n';
  code += '        # Сохраняем в базу данных\n';
  code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, user_text)\n';
  code += '        if saved_to_db:\n';
  code += '            logging.info(f"✅ Условный ответ сохранен в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '        else:\n';
  code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '        \n';
  code += '        # Отправляем подтверждение\n';
  code += '        await message.answer("✅ Спасибо за ваш ответ! Обрабатываю...")\n';
  code += '        \n';
  code += '        # Очищаем состояние ожидания\n';
  code += '        del user_data[user_id]["waiting_for_conditional_input"]\n';
  code += '        \n';
  code += '        logging.info(f"Получен ответ на условное сообщение: {variable_name} = {user_text}")\n';
  code += '        \n';
  code += '        # Переходим к следующему узлу если указан\n';
  code += '        if next_node_id:\n';
  code += '            try:\n';
  code += '                logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
  code += '                \n';
  code += '                # Проверяем, является ли это командой\n';
  code += '                if next_node_id == "profile_command":\n';
  code += '                    logging.info("Переход к команде /profile")\n';
  code += '                    await profile_handler(message)\n';
  code += '                else:\n';
  code += '                    # Создаем фиктивный callback для навигации к обычному узлу\n';
  code += '                    import types as aiogram_types\n';
  code += '                    fake_callback = aiogram_types.SimpleNamespace(\n';
  code += '                        id="conditional_nav",\n';
  code += '                        from_user=message.from_user,\n';
  code += '                        chat_instance="",\n';
  code += '                        data=next_node_id,\n';
  code += '                        message=message,\n';
  code += '                        answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
  code += '                    )\n';
  code += '                    \n';
  
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `                    ${condition} next_node_id == "${targetNode.id}":\n`;
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
      if (targetNode.data.allowMultipleSelection === true) {
        // Для узлов с множественным выбором создаем прямую навигацию
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                        # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
        code += `                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: ${targetNode.id}")\n`;
        code += `                        text = ${formattedText}\n`;
        
        // Замена переменных
        code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
        code += generateUniversalVariableReplacement('                        ');
        
        // Инициализируем состояние множественного выбора
        code += `                        # Инициализируем состояние множественного выбора\n`;
        code += `                        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
        code += `                        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
        code += `                        user_data[user_id]["multi_select_type"] = "selection"\n`;
        if (targetNode.data.multiSelectVariable) {
          code += `                        user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
        }
        
        // Создаем inline клавиатуру с кнопками выбора
        if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
          code += `                        await message.answer(text, reply_markup=keyboard)\n`;
        } else {
          code += `                        await message.answer(text)\n`;
        }
        code += `                        logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
      } else {
        // Для обычных узлов проверяем сначала, собирают ли они ввод
        if (targetNode.data.collectUserInput === true) {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их вместо ожидания ввода
          if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += `                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их, а не ожидаем ввод\n`;
            code += `                        logging.info(f"✅ Показаны кнопки для узла ${targetNode.id} с collectUserInput=true")\n`;
            code += `                        text = ${formattedText}\n`;
            
            // Добавляем замену переменных
            code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                        ');
            
            // Генерируем inline клавиатуру
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
            code += `                        await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            // Обычное ожидание ввода если кнопок нет
            code += `                        # Узел собирает пользовательский ввод\n`;
            code += `                        logging.info(f"🔧 Условная навигация к узлу с вводом: ${targetNode.id}")\n`;
            code += `                        text = ${formattedText}\n`;
            
            // Настраиваем ожидание ввода
            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const inputTargetNodeId = targetNode.data.inputTargetNodeId;
            code += `                        await message.answer(text)\n`;
            code += `                        # Настраиваем ожидание ввода\n`;
            code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
            code += `                            "type": "text",\n`;
            code += `                            "variable": "${inputVariable}",\n`;
            code += `                            "save_to_database": True,\n`;
            code += `                            "node_id": "${targetNode.id}",\n`;
            code += `                            "next_node_id": "${inputTargetNodeId || ''}"\n`;
            code += `                        }\n`;
          }
        } else {
          // Обычная навигация с простым сообщением
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                        # Обычный узел - отправляем сообщение\n`;
          code += `                        nav_text = ${formattedText}\n`;
          
          // Добавляем замену переменных
          code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
          code += generateUniversalVariableReplacement('                        ');
          code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
          code += '                        await message.answer(nav_text)\n';
        }
      }
    });
    code += '                    else:\n';
    code += '                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '                    # No nodes available for navigation\n';
    code += '                    logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  
  code += '            except Exception as e:\n';
  code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '        \n';
  code += '        return  # Завершаем обработку для условного сообщения\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру\n';
  code += '    if user_id in user_data and "button_response_config" in user_data[user_id]:\n';
  code += '        config = user_data[user_id]["button_response_config"]\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Ищем выбранный вариант среди доступных опций\n';
  code += '        selected_option = None\n';
  code += '        for option in config.get("options", []):\n';
  code += '            if option["text"] == user_text:\n';
  code += '                selected_option = option\n';
  code += '                break\n';
  code += '        \n';
  code += '        if selected_option:\n';
  code += '            selected_value = selected_option["value"]\n';
  code += '            selected_text = selected_option["text"]\n';
  code += '            \n';
  code += '            # Сохраняем ответ пользователя\n';
  code += '            variable_name = config.get("variable", "button_response")\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            node_id = config.get("node_id", "unknown")\n';
  code += '            \n';
  code += '            # Создаем структурированный ответ\n';
  code += '            response_data = {\n';
  code += '                "value": selected_value,\n';
  code += '                "text": selected_text,\n';
  code += '                "type": "button_choice",\n';
  code += '                "timestamp": timestamp,\n';
  code += '                "nodeId": node_id,\n';
  code += '                "variable": variable_name\n';
  code += '            }\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][variable_name] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных если включено\n';
  code += '            if config.get("save_to_database"):\n';
  code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
  code += '                if saved_to_db:\n';
  code += '                    logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
  code += '                else:\n';
  code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '            \n';
  code += '            # Отправляем сообщение об успехе\n';
  code += '            success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
  code += '            await message.answer(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())\n';
  code += '            \n';
  code += '            # Очищаем состояние\n';
  code += '            del user_data[user_id]["button_response_config"]\n';
  code += '            \n';
  code += '            logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")\n';
  code += '            \n';
  code += '            # Навигация на основе действия кнопки\n';
  code += '            option_action = selected_option.get("action", "goto")\n';
  code += '            option_target = selected_option.get("target", "")\n';
  code += '            option_url = selected_option.get("url", "")\n';
  code += '            \n';
  code += '            if option_action == "url" and option_url:\n';
  code += '                # Открытие ссылки\n';
  code += '                url = option_url\n';
  code += '                keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
  code += '                    [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]\n';
  code += '                ])\n';
  code += '                await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)\n';
  code += '            elif option_action == "command" and option_target:\n';
  code += '                # Выполнение команды\n';
  code += '                command = option_target\n';
  code += '                # Создаем фиктивное сообщение для выполнения команды\n';
  code += '                import types as aiogram_types\n';
  code += '                fake_message = aiogram_types.SimpleNamespace(\n';
  code += '                    from_user=message.from_user,\n';
  code += '                    chat=message.chat,\n';
  code += '                    text=command,\n';
  code += '                    message_id=message.message_id\n';
  code += '                )\n';
  code += '                \n';
  
  // Добавляем обработку различных команд для reply клавиатур
  const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
  commandNodes.forEach((cmdNode, cmdIndex) => {
    const condition = cmdIndex === 0 ? 'if' : 'elif';
    code += `                ${condition} command == "${cmdNode.data.command}":\n`;
    code += `                    try:\n`;
    code += `                        await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
    code += `                    except Exception as e:\n`;
    code += `                        logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
  });
  if (commandNodes.length > 0) {
    code += `                else:\n`;
    code += `                    logging.warning(f"Неизвестная команда: {command}")\n`;
  }
  
  code += '            elif option_action == "goto" and option_target:\n';
  code += '                # Переход к узлу\n';
  code += '                target_node_id = option_target\n';
  code += '                try:\n';
  code += '                    # Вызываем обработчик для целевого узла\n';

  // Generate navigation logic for reply button responses  
  if (nodes.length > 0) {
    nodes.forEach((btnNode, btnIndex) => {
      const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const condition = btnIndex === 0 ? 'if' : 'elif';
      code += `                    ${condition} target_node_id == "${btnNode.id}":\n`;
      code += `                        await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))\n`;
    });
    code += '                    else:\n';
    code += '                        logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
  } else {
    code += '                    pass  # No nodes to handle\n';
  }
  code += '                except Exception as e:\n';
  code += '                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
  code += '            else:\n';
  code += '                # Fallback к старой системе next_node_id если нет action\n';
  code += '                next_node_id = config.get("next_node_id")\n';
  code += '                if next_node_id:\n';
  code += '                    try:\n';
  code += '                        # Вызываем обработчик для следующего узла\n';
  
  if (nodes.length > 0) {
    nodes.forEach((btnNode, btnIndex) => {
      const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const condition = btnIndex === 0 ? 'if' : 'elif';
      code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
      code += `                            await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))\n`;
    });
    code += '                        else:\n';
    code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '                        pass  # No nodes to handle\n';
  }
  code += '                    except Exception as e:\n';
  code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '            return\n';
  code += '        else:\n';
  code += '            # Неверный выбор - показываем доступные варианты\n';
  code += '            available_options = [option["text"] for option in config.get("options", [])]\n';
  code += '            options_text = "\\n".join([f"• {opt}" for opt in available_options])\n';
  code += '            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\\n\\n{options_text}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)\n';
  code += '    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]\n';
  code += '    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")\n';
  code += '    if user_id in user_data and "waiting_for_input" in user_data[user_id]:\n';
  code += '        # Обрабатываем ввод через универсальную систему\n';
  code += '        waiting_config = user_data[user_id]["waiting_for_input"]\n';
  code += '        \n';
  code += '        # ИСПРАВЛЕНИЕ: Проверяем, что пользователь все еще находится в состоянии ожидания ввода\n';
  code += '        # и что ввод предназначен для правильного узла\n';
  code += '        if not waiting_config:\n';
  code += '            return  # Состояние ожидания пустое, игнорируем\n';
  code += '        \n';
  code += '        # Проверяем, был ли уже обработан ввод для данного узла\n';
  code += '        current_node_id = waiting_config.get("node_id") if isinstance(waiting_config, dict) else waiting_config\n';
  code += '        processed_inputs = user_data[user_id].get("processed_inputs", set())\n';
  code += '        if current_node_id in processed_inputs and current_node_id != "name_input":\n';
  code += '            logging.info(f"Ввод для узла {current_node_id} уже был обработан, игнорируем")\n';
  code += '            return  # Ввод для этого узла уже был обработан\n';
  code += '        \n';
  code += '        # ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: если переменная уже сохранена inline кнопкой, не перезаписываем\n';
  code += '        variable_name_preview = waiting_config.get("variable") if isinstance(waiting_config, dict) else user_data[user_id].get("input_variable", "user_response")\n';
  code += '        if variable_name_preview in user_data[user_id] and user_data[user_id][variable_name_preview]:\n';
  code += '            logging.info(f"Переменная {variable_name_preview} уже сохранена, игнорируем текстовый ввод")\n';
  code += '            # Очищаем состояние ожидания и переходим дальше\n';
  code += '            del user_data[user_id]["waiting_for_input"]\n';
  code += '            return\n';
  code += '        \n';
  code += '        # Проверяем формат конфигурации - новый (словарь) или старый (строка)\n';
  code += '        if isinstance(waiting_config, dict):\n';
  code += '            # Новый формат - извлекаем данные из словаря\n';
  code += '            waiting_node_id = waiting_config.get("node_id")\n';
  code += '            input_type = waiting_config.get("type", "text")\n';
  code += '            variable_name = waiting_config.get("variable", "user_response")\n';
  code += '            save_to_database = waiting_config.get("save_to_database", False)\n';
  code += '            min_length = waiting_config.get("min_length", 0)\n';
  code += '            max_length = waiting_config.get("max_length", 0)\n';
  code += '            next_node_id = waiting_config.get("next_node_id")\n';
  code += '        else:\n';
  code += '            # Старый формат - waiting_config это строка с node_id\n';
  code += '            waiting_node_id = waiting_config\n';
  code += '            input_type = user_data[user_id].get("input_type", "text")\n';
  code += '            variable_name = user_data[user_id].get("input_variable", "user_response")\n';
  code += '            save_to_database = user_data[user_id].get("save_to_database", False)\n';
  code += '            min_length = 0\n';
  code += '            max_length = 0\n';
  code += '            next_node_id = user_data[user_id].get("waiting_input_target_node_id") or user_data[user_id].get("input_target_node_id")\n';
  code += '        \n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Валидация для нового формата\n';
  code += '        if isinstance(waiting_config, dict):\n';
  code += '            # Валидация длины\n';
  code += '            if min_length > 0 and len(user_text) < min_length:\n';
  code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '                return\n';
  code += '            \n';
  code += '            if max_length > 0 and len(user_text) > max_length:\n';
  code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '                return\n';
  code += '            \n';
  code += '            # Валидация типа ввода\n';
  code += '            if input_type == "email":\n';
  code += '                import re\n';
  code += '                email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '                if not re.match(email_pattern, user_text):\n';
  code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                    await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '                    return\n';
  code += '            elif input_type == "number":\n';
  code += '                try:\n';
  code += '                    float(user_text)\n';
  code += '                except ValueError:\n';
  code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                    await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '                    return\n';
  code += '            elif input_type == "phone":\n';
  code += '                import re\n';
  code += '                phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '                if not re.match(phone_pattern, user_text):\n';
  code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                    await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '                    return\n';
  code += '            \n';
  code += '            # Сохраняем ответ для нового формата\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][variable_name] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных если включено\n';
  code += '            if save_to_database:\n';
  code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
  code += '                if saved_to_db:\n';
  code += '                    logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '                else:\n';
  code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '            \n';
  code += '            # ИСПРАВЛЕНО: Отправляем подтверждающее сообщение\n';
  code += '            success_message = waiting_config.get("success_message", "✅ Спасибо за ваш ответ!")\n';
  code += '            logging.info(f"DEBUG: Отправляем подтверждение с текстом: {success_message}")\n';
  code += '            await message.answer(success_message)\n';
  code += '            logging.info(f"✅ Отправлено подтверждение: {success_message}")\n';
  code += '            \n';
  code += '            # ИСПРАВЛЕНИЕ: Добавляем маркер, что ввод был обработан для этого узла\n';
  code += '            if "processed_inputs" not in user_data[user_id]:\n';
  code += '                user_data[user_id]["processed_inputs"] = set()\n';
  code += '            user_data[user_id]["processed_inputs"].add(waiting_node_id)\n';
  code += '            \n';
  code += '            logging.info(f"✅ Переход к следующему узлу выполнен успешно")\n';
  code += '            logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
  code += '            \n';
  code += '            # Навигация к следующему узлу для нового формата\n';
  code += '            if next_node_id:\n';
  code += '                try:\n';
  code += '                    logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
  code += '                    # Проверяем навигацию к узлам\n';
  
  // Добавляем навигацию для каждого узла
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      code += `                    ${condition} next_node_id == "${targetNode.id}":\n`;
      
      if (targetNode.type === 'message') {
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
        if (targetNode.data.allowMultipleSelection === true) {
          // Для узлов с множественным выбором создаем прямую навигацию
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                        # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
          code += `                        logging.info(f"🔧 Переходим к узлу с множественным выбором: ${targetNode.id}")\n`;
          code += `                        text = ${formattedText}\n`;
          
          // Замена переменных
          code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
          code += generateUniversalVariableReplacement('                        ');
          
          // Инициализируем состояние множественного выбора
          code += `                        # Инициализируем состояние множественного выбора\n`;
          code += `                        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
          code += `                        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
          code += `                        user_data[user_id]["multi_select_type"] = "selection"\n`;
          if (targetNode.data.multiSelectVariable) {
            code += `                        user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
          }
          
          // Создаем inline клавиатуру с кнопками выбора
          if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
            code += `                        await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `                        await message.answer(text)\n`;
          }
          code += `                        logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
        } else {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const cleanedMessageText = stripHtmlTags(messageText);
          const formattedText = formatTextForPython(cleanedMessageText);
          code += `                        text = ${formattedText}\n`;
          
          // Применяем замену переменных
          code += '                        # Замена переменных в тексте\n';
          code += generateUniversalVariableReplacement('                        ');
          
          // Если узел message собирает ввод, настраиваем ожидание
          if (targetNode.data.collectUserInput === true) {
          const inputType = targetNode.data.inputType || 'text';
          const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
          const inputTargetNodeId = targetNode.data.inputTargetNodeId;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если у узла есть кнопки, показываем их ВМЕСТО ожидания текста
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их вместо ожидания текста\n';
            code += '                        builder = InlineKeyboardBuilder()\n';
            
            // Добавляем кнопки для узла с collectUserInput + buttons
            targetNode.data.buttons.forEach((btn, btnIndex) => {
              if (btn.action === "goto" && btn.target) {
                const callbackData = `${btn.target}`;
                code += `                        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
              } else if (btn.action === "url" && btn.url) {
                code += `                        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `                        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              }
            });
            
            const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data, allNodeIds);
            code += `                        builder.adjust(${columns})\n`;
            code += '                        keyboard = builder.as_markup()\n';
            code += '                        await message.answer(text, reply_markup=keyboard)\n';
            code += `                        logging.info(f"✅ Показаны кнопки для узла ${targetNode.id} с collectUserInput")\n`;
          } else {
            code += '                        await message.answer(text)\n';
            
            // Настраиваем ожидание ввода ТОЛЬКО если нет кнопок
            code += `                        logging.info(f"DEBUG: Настраиваем ожидание ввода для узла ${targetNode.id}, переменная ${inputVariable}")\n`;
            code += '                        # Настраиваем ожидание ввода для message узла\n';
            code += '                        user_data[user_id]["waiting_for_input"] = {\n';
            code += `                            "type": "${inputType}",\n`;
            code += `                            "variable": "${inputVariable}",\n`;
            code += '                            "save_to_database": True,\n';
            code += `                            "node_id": "${targetNode.id}",\n`;
            code += `                            "next_node_id": "${inputTargetNodeId || ''}",\n`;
            code += `                            "min_length": ${targetNode.data.minLength || 0},\n`;
            code += `                            "max_length": ${targetNode.data.maxLength || 0},\n`;
            code += '                            "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
            code += '                            "success_message": "✅ Спасибо за ваш ответ!"\n';
            code += '                        }\n';
          }
        } else {
          // Если узел не собирает ввод, проверяем есть ли inline кнопки
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '                        # Создаем inline клавиатуру\n';
            code += '                        builder = InlineKeyboardBuilder()\n';
            
            // Добавляем кнопки
            targetNode.data.buttons.forEach((btn, btnIndex) => {
              if (btn.action === "goto" && btn.target) {
                const callbackData = `${btn.target}`;
                code += `                        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
              } else if (btn.action === "url" && btn.url) {
                code += `                        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `                        logging.info(f"Создана кнопка команды: ${btn.text} -> ${commandCallback}")\n`;
                code += `                        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${commandCallback}"))\n`;
              }
            });
            
            // ВОССТАНОВЛЕНИЕ: Добавляем умное расположение кнопок по колонкам
            const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data, allNodeIds);
            code += `                        builder.adjust(${columns})\n`;
            code += '                        keyboard = builder.as_markup()\n';
            code += '                        await message.answer(text, reply_markup=keyboard)\n';
          } else {
            code += '                        await message.answer(text)\n';
          }
          
          // Очищаем состояние ожидания ввода после успешного перехода для message узлов без сбора ввода
          if (!targetNode.data.collectUserInput) {
            code += '                        # НЕ отправляем сообщение об успехе здесь - это делается в старом формате\n';
            code += '                        # Очищаем состояние ожидания ввода после успешного перехода\n';
            code += '                        if "waiting_for_input" in user_data[user_id]:\n';
            code += '                            del user_data[user_id]["waiting_for_input"]\n';
            code += '                        \n';
            code += '                        logging.info("✅ Переход к следующему узлу выполнен успешно")\n';
          }
        }
        } // Закрываем блок else для allowMultipleSelection
      } else if (targetNode.type === 'user-input') {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || "Введите ваш ответ:");
        code += `                        prompt_text = ${inputPrompt}\n`;
        code += '                        await message.answer(prompt_text)\n';
        code += '                        # Устанавливаем новое ожидание ввода\n';
        code += '                        user_data[user_id]["waiting_for_input"] = {\n';
        code += `                            "type": "${targetNode.data.inputType || 'text'}",\n`;
        code += `                            "variable": "${targetNode.data.inputVariable || 'user_response'}",\n`;
        code += `                            "save_to_database": True,\n`;
        code += `                            "node_id": "${targetNode.id}",\n`;
        const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
        if (nextConnection) {
          code += `                            "next_node_id": "${nextConnection.targetNodeId}",\n`;
        } else {
          code += '                            "next_node_id": None,\n';
        }
        code += `                            "min_length": ${targetNode.data.minLength || 0},\n`;
        code += `                            "max_length": ${targetNode.data.maxLength || 0},\n`;
        code += '                            "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
        code += '                            "success_message": "✅ Спасибо за ваш ответ!"\n';
        code += '                        }\n';
      } else if (targetNode.type === 'command') {
        // Для узлов команд вызываем соответствующий обработчик
        const commandName = targetNode.data.command?.replace('/', '') || 'unknown';
        const handlerName = `${commandName}_handler`;
        code += `                        # Выполняем команду ${targetNode.data.command}\n`;
        code += '                        from types import SimpleNamespace\n';
        code += '                        fake_message = SimpleNamespace()\n';
        code += '                        fake_message.from_user = message.from_user\n';
        code += '                        fake_message.chat = message.chat\n';
        code += '                        fake_message.date = message.date\n';
        code += '                        fake_message.answer = message.answer\n';
        code += `                        await ${handlerName}(fake_message)\n`;
      } else {
        code += `                        logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
      }
    });
    
    code += '                    else:\n';
    code += '                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '                    # No nodes available for navigation\n';
    code += '                    logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  
  code += '                except Exception as e:\n';
  code += '                    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '            \n';
  code += '            return  # Завершаем обработку для нового формата\n';
  code += '        \n';
  code += '        # Обработка старого формата (для совместимости)\n';
  code += '        # Находим узел для получения настроек\n';
  
  // Генерируем проверку для каждого узла с универсальным сбором ввода (старый формат)
  const inputNodes = (nodes || []).filter(node => node.data.collectUserInput);
  code += `        logging.info(f"DEBUG old format: checking inputNodes: ${inputNodes.map(n => n.id).join(', ')}")\n`;
  inputNodes.forEach((node, index) => {
    const condition = index === 0 ? 'if' : 'elif';
    code += `        ${condition} waiting_node_id == "${node.id}":\n`;
    
    // Добавляем валидацию если есть
    if (node.data.inputValidation) {
      if (node.data.minLength && node.data.minLength > 0) {
        code += `            if len(user_text) < ${node.data.minLength}:\n`;
        code += `                await message.answer("❌ Слишком короткий ответ (минимум ${node.data.minLength} символов). Попробуйте еще раз.")\n`;
        code += `                return\n`;
      }
      if (node.data.maxLength && node.data.maxLength > 0) {
        code += `            if len(user_text) > ${node.data.maxLength}:\n`;
        code += `                await message.answer("❌ Слишком длинный ответ (максимум ${node.data.maxLength} символов). Попробуйте еще раз.")\n`;
        code += `                return\n`;
      }
    }
    
    // Валидация типа ввода
    if (node.data.inputType === 'email') {
      code += `            import re\n`;
      code += `            email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n`;
      code += `            if not re.match(email_pattern, user_text):\n`;
      code += `                await message.answer("❌ Неверный формат email. Попробуйте еще раз.")\n`;
      code += `                return\n`;
    } else if (node.data.inputType === 'number') {
      code += `            try:\n`;
      code += `                float(user_text)\n`;
      code += `            except ValueError:\n`;
      code += `                await message.answer("❌ Введите корректное число. Попробуйте еще раз.")\n`;
      code += `                return\n`;
    } else if (node.data.inputType === 'phone') {
      code += `            import re\n`;
      code += `            phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n`;
      code += `            if not re.match(phone_pattern, user_text):\n`;
      code += `                await message.answer("❌ Неверный формат телефона. Попробуйте еще раз.")\n`;
      code += `                return\n`;
    }
    
    // Сохранение ответа
    const variableName = node.data.inputVariable || 'user_response';
    code += `            \n`;
    code += `            # Сохраняем ответ пользователя\n`;
    code += `            import datetime\n`;
    code += `            timestamp = get_moscow_time()\n`;
    code += `            \n`;
    code += `            # Сохраняем простое значение для совместимости с логикой профиля\n`;
    code += `            response_data = user_text  # Простое значение вместо сложного объекта\n`;
    code += `            \n`;
    code += `            # Сохраняем в пользовательские данные\n`;
    code += `            user_data[user_id]["${variableName}"] = response_data\n`;
    code += `            \n`;
    
    // Сохранение в базу данных (всегда включено для collectUserInput)
    code += `            # Сохраняем в базу данных\n`;
    code += `            saved_to_db = await update_user_data_in_db(user_id, "${variableName}", response_data)\n`;
    code += `            if saved_to_db:\n`;
    code += `                logging.info(f"✅ Данные сохранены в БД: ${variableName} = {user_text} (пользователь {user_id})")\n`;
    code += `            else:\n`;
    code += `                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
    code += `            \n`;
    
    code += `            \n`;
    code += `            # Отправляем сообщение об успехе с галочкой\n`;
    code += `            await message.answer("✅ Спасибо за ваш ответ!")\n`;
    code += `            \n`;
    code += `            logging.info(f"Получен пользовательский ввод: ${variableName} = {user_text}")\n`;
    code += `            \n`;
    
    // Навигация к следующему узлу
    if (node.data.inputTargetNodeId) {
      code += `            # Переходим к следующему узлу\n`;
      code += `            try:\n`;
      
      // Найдем целевой узел для навигации
      const targetNode = nodes.find(n => n.id === node.data.inputTargetNodeId);
      if (targetNode) {
        if (targetNode.type === 'keyboard' || targetNode.type === 'message') {
          // Для keyboard и message узлов отправляем сообщение напрямую
          const messageText = targetNode.data.messageText || 'Выберите действие';
          const formattedText = formatTextForPython(messageText);
          code += `                # Отправляем сообщение для узла ${targetNode.id}\n`;
          code += `                text = ${formattedText}\n`;
          
          // Если целевой узел тоже собирает ввод, настраиваем новое ожидание
          if (targetNode.data.collectUserInput === true) {
            const nextInputType = targetNode.data.inputType || 'text';
            const nextInputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const nextInputTargetNodeId = targetNode.data.inputTargetNodeId;
            
            code += `                # Настраиваем новое ожидание ввода для узла ${targetNode.id}\n`;
            code += `                user_data[user_id]["waiting_for_input"] = {\n`;
            code += `                    "type": "${nextInputType}",\n`;
            code += `                    "variable": "${nextInputVariable}",\n`;
            code += `                    "save_to_database": True,\n`;
            code += `                    "node_id": "${targetNode.id}",\n`;
            code += `                    "next_node_id": "${nextInputTargetNodeId || ''}",\n`;
            code += `                    "min_length": 0,\n`;
            code += `                    "max_length": 0,\n`;
            code += `                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
            code += `                    "success_message": "✅ Спасибо за ваш ответ!"\n`;
            code += `                }\n`;
            code += `                \n`;
          }
          
          if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            // Используем универсальную функцию для создания inline клавиатуры
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
            code += `                await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `                await message.answer(text)\n`;
          }
          
          code += `                # Очищаем состояние ожидания ввода после успешного перехода\n`;
          code += `                if "waiting_for_input" in user_data[user_id]:\n`;
          code += `                    del user_data[user_id]["waiting_for_input"]\n`;
          if (node.data.inputType) {
            code += `                if "input_type" in user_data[user_id]:\n`;
            code += `                    del user_data[user_id]["input_type"]\n`;
          }
          code += `                \n`;
          code += `                logging.info("✅ Переход к следующему узлу выполнен успешно")\n`;
        } else {
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
          if (targetNode.data.allowMultipleSelection === true) {
            // Для узлов с множественным выбором создаем прямую навигацию
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
            code += `                text = ${formattedText}\n`;
            
            // Замена переменных
            code += '                user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                ');
            
            // Инициализируем состояние множественного выбора
            code += `                # Инициализируем состояние множественного выбора\n`;
            code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
            code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
            code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
            if (targetNode.data.multiSelectVariable) {
              code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
            }
            
            // Создаем inline клавиатуру с кнопками выбора
            if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
              code += `                await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `                await message.answer(text)\n`;
            }
            code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
          } else {
            // Для обычных узлов используем обычную навигацию
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                # Обычный узел - отправляем сообщение\n`;
            code += `                nav_text = ${formattedText}\n`;
            
            // Добавляем замену переменных
            code += '                user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                ');
            
            // Создаем inline клавиатуру если есть кнопки
            if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
              code += `                await message.answer(nav_text, reply_markup=keyboard)\n`;
            } else {
              code += '                await message.answer(nav_text)\n';
            }
            code += `                logging.info(f"✅ Ввод навигация к обычному узлу: ${targetNode.id}")\n`;
          }
        }
      } else {
        // Если целевой узел не найден, добавляем заглушку
        code += `                logging.warning(f"Целевой узел {node.data.inputTargetNodeId} не найден")\n`;
        code += `                await message.answer("❌ Ошибка перехода: целевой узел не найден")\n`;
      }
      
      code += `            except Exception as e:\n`;
      code += `                logging.error(f"Ошибка при переходе к следующему узлу: {e}")\n`;
      code += `            return\n`;
    } else {
      // Если inputTargetNodeId равен null, это конец цепочки - это нормально
      code += `            # Конец цепочки ввода - завершаем обработку\n`;
      code += `            logging.info("Завершена цепочка сбора пользовательских данных")\n`;
      code += `            return\n`;
    }
  });
  
  code += '        \n';
  code += '        # Если узел не найден\n';
  code += '        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")\n';
  code += '        del user_data[user_id]["waiting_for_input"]\n';
  code += '        return\n';
  code += '    \n';
  code += '    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок\n';
  code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
  code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
  code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
  code += '        input_target_node_id = user_data[user_id].get("input_target_node_id")\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Если есть целевой узел для перехода - это основной ввод, а не дополнительный\n';
  code += '        if input_target_node_id:\n';
  code += '            # Это основной ввод с переходом к следующему узлу\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][input_variable] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных\n';
  code += '            saved_to_db = await update_user_data_in_db(user_id, input_variable, response_data)\n';
  code += '            if saved_to_db:\n';
  code += '                logging.info(f"✅ Данные сохранены в БД: {input_variable} = {user_text} (пользователь {user_id})")\n';
  code += '            else:\n';
  code += '                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '            \n';
  code += '            # Уведомляем пользователя об успешном сохранении\n';
  code += '            await message.answer("✅ Спасибо за ваш ответ!")\n';
  code += '            \n';
  code += '            logging.info(f"Получен основной пользовательский ввод: {input_variable} = {user_text}")\n';
  code += '            \n';
  code += '            # Переходим к целевому узлу\n';
  code += '            # Очищаем состояние сбора ввода\n';
  code += '            del user_data[user_id]["input_collection_enabled"]\n';
  code += '            if "input_node_id" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_node_id"]\n';
  code += '            if "input_variable" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_variable"]\n';
  code += '            if "input_target_node_id" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_target_node_id"]\n';
  code += '            \n';
  code += '            # Находим и вызываем обработчик целевого узла\n';
  
  // Добавляем навигацию к целевому узлу
  nodes.forEach((targetNode) => {
    code += `            if input_target_node_id == "${targetNode.id}":\n`;
    if (targetNode.type === 'keyboard' || targetNode.type === 'message') {
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextForPython(messageText);
      code += `                # Переход к узлу ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;
      
      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      code += generateUniversalVariableReplacement('                ');
      
      // Отправляем сообщение с кнопками если есть
      if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"Переход к узлу ${targetNode.id} выполнен")\n`;
    } else if (targetNode.data.allowMultipleSelection) {
      // Для узлов с множественным выбором создаем прямую навигацию
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextForPython(messageText);
      code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;
      
      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      code += generateUniversalVariableReplacement('                ');
      
      // Инициализируем состояние множественного выбора
      code += `                # Инициализируем состояние множественного выбора\n`;
      code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
      code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
      code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
      if (targetNode.data.multiSelectVariable) {
        code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
      }
      
      // Создаем inline клавиатуру с кнопками выбора
      if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
    } else {
      // Для обычных узлов отправляем простое сообщение
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextForPython(messageText);
      code += `                # Обычный узел - отправляем сообщение ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;
      
      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      code += generateUniversalVariableReplacement('                ');
      
      if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"✅ Навигация к обычному узлу ${targetNode.id} выполнена")\n`;
    }
  });
  code += '            return\n';
  code += '        else:\n';
  code += '            # Это дополнительный комментарий (нет целевого узла)\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][f"{input_variable}_additional"] = response_data\n';
  code += '            \n';
  code += '            # Уведомляем пользователя\n';
  code += '            await message.answer("✅ Дополнительный комментарий сохранен!")\n';
  code += '            \n';
  code += '            logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Если нет активного ожидания ввода, игнорируем сообщение\n';
  code += '    return\n';
  code += '    # Валидация длины текста\n';
  code += '    min_length = input_config.get("min_length", 0)\n';
  code += '    max_length = input_config.get("max_length", 0)\n';
  code += '    \n';
  code += '    if min_length > 0 and len(user_text) < min_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    if max_length > 0 and len(user_text) > max_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Валидация типа ввода\n';
  code += '    input_type = input_config.get("type", "text")\n';
  code += '    \n';
  code += '    if input_type == "email":\n';
  code += '        import re\n';
  code += '        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '        if not re.match(email_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "number":\n';
  code += '        try:\n';
  code += '            float(user_text)\n';
  code += '        except ValueError:\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "phone":\n';
  code += '        import re\n';
  code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '        if not re.match(phone_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    # Сохраняем ответ пользователя простым значением\n';
  code += '    variable_name = input_config.get("variable", "user_response")\n';
  code += '    timestamp = get_moscow_time()\n';
  code += '    node_id = input_config.get("node_id", "unknown")\n';
  code += '    \n';
  code += '    # Простое значение вместо сложного объекта\n';
  code += '    response_data = user_text\n';
  code += '    \n';
  code += '    # Сохраняем в пользовательские данные\n';
  code += '    user_data[user_id][variable_name] = response_data\n';
  code += '    \n';
  code += '    # Сохраняем в базу данных если включено\n';
  code += '    if input_config.get("save_to_database"):\n';
  code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
  code += '        if saved_to_db:\n';
  code += '            logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '        else:\n';
  code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '    \n';
  code += '    # Отправляем сообщение об успехе\n';
  code += '    success_message = input_config.get("success_message", "✅ Спасибо за ваш ответ!")\n';
  code += '    await message.answer(success_message)\n';
  code += '    \n';
  code += '    # Очищаем состояние ожидания ввода\n';
  code += '    del user_data[user_id]["waiting_for_input"]\n';
  code += '    \n';
  code += '    logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
  code += '    \n';
  code += '    # Автоматическая навигация к следующему узлу после успешного ввода\n';
  code += '    next_node_id = input_config.get("next_node_id")\n';
  code += '    logging.info(f"🔄 Проверяем навигацию: next_node_id = {next_node_id}")\n';
  code += '    if next_node_id:\n';
  code += '        try:\n';
  code += '            logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
  code += '            \n';
  code += '            # Создаем фейковое сообщение для навигации\n';
  code += '            fake_message = type("FakeMessage", (), {})()\n';
  code += '            fake_message.from_user = message.from_user\n';
  code += '            fake_message.answer = message.answer\n';
  code += '            fake_message.delete = lambda: None\n';
  code += '            \n';
  code += '            # Находим узел по ID и выполняем соответствующее действие\n';
  
  // Generate navigation logic for each node type
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      code += `            ${condition} next_node_id == "${targetNode.id}":\n`;
      
      if (targetNode.type === 'keyboard') {
        // Обработка узлов клавиатуры
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        
        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += `                text = ${formattedText}\n`;
          code += '                builder = InlineKeyboardBuilder()\n';
          targetNode.data.buttons.forEach((button: any, buttonIndex: number) => {
            if (button.action === "url") {
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
            } else if (button.action === 'goto') {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
            } else if (button.action === 'command') {
              const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
            } else {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
            }
          });
          code += '                keyboard = builder.as_markup()\n';
          code += '                await fake_message.answer(text, reply_markup=keyboard)\n';
        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += `                text = ${formattedText}\n`;
          code += '                builder = ReplyKeyboardBuilder()\n';
          targetNode.data.buttons.forEach((button: any) => {
            if (button.action === "contact" && button.requestContact) {
              code += `                builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
            } else if (button.action === "location" && button.requestLocation) {
              code += `                builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
            } else {
              code += `                builder.add(KeyboardButton(text="${button.text}"))\n`;
            }
          });
          const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
          const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
          code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
          code += '                await fake_message.answer(text, reply_markup=keyboard)\n';
        } else {
          code += `                text = ${formattedText}\n`;
          code += '                await fake_message.answer(text)\n';
        }
        
        // Проверяем, нужно ли настроить ожидание текстового ввода
        if (targetNode.data.enableTextInput) {
          const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
          const inputTargetNodeId = targetNode.data.inputTargetNodeId || '';
          
          code += '                # Настраиваем ожидание текстового ввода\n';
          code += '                user_data[user_id]["waiting_for_input"] = {\n';
          code += '                    "type": "text",\n';
          code += `                    "variable": "${inputVariable}",\n`;
          code += '                    "save_to_database": True,\n';
          code += `                    "node_id": "${targetNode.id}",\n`;
          code += `                    "next_node_id": "${inputTargetNodeId}"\n`;
          code += '                }\n';
        } else if (targetNode.data.collectUserInput) {
          // ИСПРАВЛЕНИЕ: Настраиваем ожидание текстового ввода только если включен collectUserInput
          const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
          const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
          const inputTargetNodeId = nextConnection ? nextConnection.targetNodeId : '';
          
          code += '                # Настраиваем ожидание текстового ввода (collectUserInput)\n';
          code += '                user_data[user_id]["waiting_for_input"] = {\n';
          code += '                    "type": "text",\n';
          code += `                    "variable": "${inputVariable}",\n`;
          code += '                    "save_to_database": True,\n';
          code += `                    "node_id": "${targetNode.id}",\n`;
          code += `                    "next_node_id": "${inputTargetNodeId}"\n`;
          code += '                }\n';
        }
      } else if (targetNode.type === 'message') {
        // Добавляем поддержку условных сообщений для узлов сообщений
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        
        if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
          code += '                # Проверяем условные сообщения\n';
          code += '                text = None\n';
          code += '                \n';
          code += '                # Получаем данные пользователя для проверки условий\n';
          code += '                user_record = await get_user_from_db(user_id)\n';
          code += '                if not user_record:\n';
          code += '                    user_record = user_data.get(user_id, {})\n';
          code += '                \n';
          code += '                # Безопасно извлекаем user_data\n';
          code += '                if isinstance(user_record, dict):\n';
          code += '                    if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
          code += '                        user_data_dict = user_record["user_data"]\n';
          code += '                    else:\n';
          code += '                        user_data_dict = user_record\n';
          code += '                else:\n';
          code += '                    user_data_dict = {}\n';
          code += '                \n';
          
          // Generate conditional logic using helper function
          code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '                ');
          
          // Add fallback
          code += '                else:\n';
          
          if (targetNode.data.fallbackMessage) {
            const fallbackText = formatTextForPython(targetNode.data.fallbackMessage);
            code += `                    text = ${fallbackText}\n`;
            code += '                    logging.info("Используется запасное сообщение")\n';
          } else {
            code += `                    text = ${formattedText}\n`;
            code += '                    logging.info("Используется основное сообщение узла")\n';
          }
          
          code += '                \n';
        } else {
          code += `                text = ${formattedText}\n`;
        }
        
        // Определяем режим форматирования (приоритет у условного сообщения)
        code += '                # Используем parse_mode условного сообщения если он установлен\n';
        code += '                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n';
        code += '                    parse_mode = conditional_parse_mode\n';
        code += '                else:\n';
        if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
          code += '                    parse_mode = ParseMode.MARKDOWN\n';
        } else if (targetNode.data.formatMode === 'html') {
          code += '                    parse_mode = ParseMode.HTML\n';
        } else {
          code += '                    parse_mode = None\n';
        }
        
        // Добавляем кнопки если есть
        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
          // Используем универсальную функцию для создания inline клавиатуры
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
          code += '                builder = ReplyKeyboardBuilder()\n';
          targetNode.data.buttons.forEach(button => {
            code += `                builder.add(KeyboardButton(text="${button.text}"))\n`;
          });
          const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
          const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
          code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
          code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
        } else {
          code += '                await message.answer(text, parse_mode=parse_mode)\n';
        }
      } else if (targetNode.type === 'user-input') {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || targetNode.data.inputPrompt || "Введите ваш ответ:");
        const responseType = targetNode.data.responseType || 'text';
        const inputType = targetNode.data.inputType || 'text';
        const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
        const minLength = targetNode.data.minLength || 0;
        const maxLength = targetNode.data.maxLength || 0;
        const inputTimeout = targetNode.data.inputTimeout || 60;
        const saveToDatabase = targetNode.data.saveToDatabase || false;
        const placeholder = targetNode.data.placeholder || "";
        const responseOptions = targetNode.data.responseOptions || [];
        const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
        const allowSkip = targetNode.data.allowSkip || false;
        
        code += `                prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
        if (placeholder) {
          code += `                placeholder_text = "${placeholder}"\n`;
          code += '                prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
        }
        
        // Check if this is a button response node
        if (responseType === 'buttons' && responseOptions.length > 0) {
          // For button response nodes, set up button_response_config
          code += '                \n';
          code += '                # Создаем кнопки для выбора ответа\n';
          code += '                builder = InlineKeyboardBuilder()\n';
          
          // Создаем кнопки для вариантов ответа
          const responseButtons = responseOptions.map((option, index) => ({
            text: option.text,
            action: 'goto',
            target: `response_${targetNode.id}_${index}`,
            id: `response_${targetNode.id}_${index}`
          }));
          
          if (allowSkip) {
            responseButtons.push({
              text: "⏭️ Пропустить",
              action: 'goto',
              target: `skip_${targetNode.id}`,
              id: `skip_${targetNode.id}`
            });
          }
          
          // Используем универсальную функцию для создания inline клавиатуры
          code += generateInlineKeyboardCode(responseButtons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += '                await message.answer(prompt_text, reply_markup=keyboard)\n';
          code += '                \n';
          code += '                # Настраиваем конфигурацию кнопочного ответа\n';
          code += '                user_data[user_id]["button_response_config"] = {\n';
          code += `                    "variable": "${inputVariable}",\n`;
          code += `                    "node_id": "${targetNode.id}",\n`;
          code += `                    "timeout": ${inputTimeout},\n`;
          code += `                    "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
          code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
          code += '                    "selected": [],\n';
          code += '                    "success_message": "✅ Спасибо за ваш ответ!",\n';
          code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
          code += '                    "options": [\n';
          
          // Добавляем каждый вариант ответа с индивидуальными настройками навигации
          responseOptions.forEach((option, index) => {
            const optionValue = option.value || option.text;
            const action = option.action || 'goto';
            const target = option.target || '';
            const url = option.url || '';
            
            code += '                        {\n';
            code += `                            "text": "${escapeForJsonString(option.text)}",\n`;
            code += `                            "value": "${escapeForJsonString(optionValue)}",\n`;
            code += `                            "action": "${action}",\n`;
            code += `                            "target": "${target}",\n`;
            code += `                            "url": "${url}",\n`;
            code += `                            "callback_data": "response_${targetNode.id}_${index}"\n`;
            code += '                        }';
            if (index < responseOptions.length - 1) {
              code += ',';
            }
            code += '\n';
          });
          
          code += '                    ],\n';
          
          // Находим следующий узел для этого user-input узла (fallback)
          const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
          if (nextConnection) {
            code += `                    "next_node_id": "${nextConnection.targetNodeId}"\n`;
          } else {
            code += '                    "next_node_id": None\n';
          }
          code += '                }\n';
        } else {
          // For text input nodes, use waiting_for_input
          code += '                await message.answer(prompt_text)\n';
          code += '                \n';
          code += '                # Настраиваем ожидание ввода\n';
          code += '                user_data[user_id]["waiting_for_input"] = {\n';
          code += `                    "type": "${inputType}",\n`;
          code += `                    "variable": "${inputVariable}",\n`;
          code += '                    "validation": "",\n';
          code += `                    "min_length": ${minLength},\n`;
          code += `                    "max_length": ${maxLength},\n`;
          code += `                    "timeout": ${inputTimeout},\n`;
          code += '                    "required": True,\n';
          code += '                    "allow_skip": False,\n';
          code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
          code += '                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
          code += '                    "success_message": "✅ Спасибо за ваш ответ!",\n';
          code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
          code += `                    "node_id": "${targetNode.id}",\n`;
          
          // Находим следующий узел для этого user-input узла
          const nextConnection = connections.find(conn => conn.sourceNodeId === targetNode.id);
          if (nextConnection) {
            code += `                    "next_node_id": "${nextConnection.targetNodeId}"\n`;
          } else {
            code += '                    "next_node_id": None\n';
          }
          code += '                }\n';
        }
      } else if (targetNode.type === 'message') {
        // Обработка узлов сообщений
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                await fake_message.answer(${formattedText})\n`;
        code += `                logging.info(f"Отправлено сообщение узла ${targetNode.id}")\n`;
      } else {
        // Для других типов узлов просто логируем
        code += `                logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
      }
    });
    
    code += '            else:\n';
    code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '            # No nodes available for navigation\n';
    code += '            logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  code += '        except Exception as e:\n';
  code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '\n';

  // Добавляем обработчик для условных кнопок (conditional_variableName_value)
  code += '\n# Обработчик для условных кнопок\n';
  code += '@dp.callback_query(lambda c: c.data.startswith("conditional_"))\n';
  code += 'async def handle_conditional_button(callback_query: types.CallbackQuery):\n';
  code += '    await callback_query.answer()\n';
  code += '    \n';
  code += '    # Парсим callback_data: conditional_variableName_value\n';
  code += '    callback_parts = callback_query.data.split("_", 2)\n';
  code += '    if len(callback_parts) >= 3:\n';
  code += '        variable_name = callback_parts[1]\n';
  code += '        variable_value = callback_parts[2]\n';
  code += '        \n';
  code += '        user_id = callback_query.from_user.id\n';
  code += '        \n';
  code += '        # Сохраняем значение в базу данных\n';
  code += '        await update_user_data_in_db(user_id, variable_name, variable_value)\n';
  code += '        \n';
  code += '        # Сохраняем в локальные данные\n';
  code += '        if user_id not in user_data:\n';
  code += '            user_data[user_id] = {}\n';
  code += '        user_data[user_id][variable_name] = variable_value\n';
  code += '        \n';
  code += '        logging.info(f"Условная кнопка: {variable_name} = {variable_value} (пользователь {user_id})")\n';
  code += '        \n';
  code += '        # После обновления значения автоматически вызываем профиль\n';
  code += '        await callback_query.answer(f"✅ {variable_name} обновлено")\n';
  code += '        \n';
  code += '        # Создаем имитацию сообщения для вызова команды профиль\n';
  code += '        class FakeMessage:\n';
  code += '            def __init__(self, callback_query):\n';
  code += '                self.from_user = callback_query.from_user\n';
  code += '                self.chat = callback_query.message.chat\n';
  code += '                self.date = callback_query.message.date\n';
  code += '                self.message_id = callback_query.message.message_id\n';
  code += '            \n';
  code += '            async def answer(self, text, parse_mode=None, reply_markup=None):\n';
  code += '                if reply_markup:\n';
  code += '                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
  code += '                else:\n';
  code += '                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode)\n';
  code += '            \n';
  code += '            async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
  code += '                try:\n';
  code += '                    await bot.edit_message_text(text, self.chat.id, self.message_id, parse_mode=parse_mode, reply_markup=reply_markup)\n';
  code += '                except Exception:\n';
  code += '                    await self.answer(text, parse_mode, reply_markup)\n';
  code += '        \n';
  code += '        fake_message = FakeMessage(callback_query)\n';
  code += '        \n';
  code += '        # Вызываем обработчик профиля\n';
  code += '        try:\n';
  code += '            await profile_handler(fake_message)\n';
  code += '        except Exception as e:\n';
  code += '            logging.error(f"Ошибка вызова profile_handler: {e}")\n';
  code += '            await callback_query.message.answer(f"✅ Значение {variable_name} обновлено на: {variable_value}")\n';
  code += '    else:\n';
  code += '        logging.warning(f"Неверный формат условной кнопки: {callback_query.data}")\n';
  code += '        await callback_query.answer("❌ Ошибка обработки кнопки", show_alert=True)\n';
  code += '\n';

  // Добавляем обработчики для кнопок команд (типа cmd_start) с подробным логированием
  const commandButtons = new Set<string>();
  console.log('🔍 НАЧИНАЕМ СБОР КНОПОК КОМАНД из', nodes.length, 'узлов');
  
  nodes.forEach(node => {
    console.log(`🔎 Проверяем узел ${node.id} (тип: ${node.type})`);
    
    // Обычные кнопки узла
    if (node.data.buttons) {
      console.log(`📋 Узел ${node.id} имеет ${node.data.buttons.length} кнопок`);
      node.data.buttons.forEach((button: any, index: number) => {
        console.log(`  🔘 Кнопка ${index}: "${button.text}" (action: ${button.action}, target: ${button.target})`);
        if (button.action === 'command' && button.target) {
          const commandCallback = `cmd_${button.target.replace('/', '')}`;
          console.log(`✅ НАЙДЕНА кнопка команды: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
          commandButtons.add(commandCallback);
        }
      });
    } else {
      console.log(`❌ Узел ${node.id} не имеет кнопок`);
    }
    
    // Кнопки в условных сообщениях
    if (node.data.conditionalMessages) {
      console.log(`📨 Узел ${node.id} имеет ${node.data.conditionalMessages.length} условных сообщений`);
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: any) => {
            console.log(`  🔘 Условная кнопка: "${button.text}" (action: ${button.action}, target: ${button.target})`);
            if (button.action === 'command' && button.target) {
              const commandCallback = `cmd_${button.target.replace('/', '')}`;
              console.log(`✅ НАЙДЕНА кнопка команды в условном сообщении: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
              commandButtons.add(commandCallback);
            }
          });
        }
      });
    }
  });
  
  console.log(`🎯 ИТОГО найдено кнопок команд: ${commandButtons.size}`);
  console.log('📝 Список найденных кнопок команд:', Array.from(commandButtons));
  
  if (commandButtons.size > 0) {
    code += '\n# Обработчики для кнопок команд\n';
    code += `# Найдено ${commandButtons.size} кнопок команд: ${Array.from(commandButtons).join(', ')}\n`;
    
    commandButtons.forEach(commandCallback => {
      const command = commandCallback.replace('cmd_', '');
      code += `\n@dp.callback_query(lambda c: c.data == "${commandCallback}")\n`;
      code += `async def handle_${commandCallback}(callback_query: types.CallbackQuery):\n`;
      code += '    await callback_query.answer()\n';
      code += `    logging.info(f"Обработка кнопки команды: ${commandCallback} -> /${command} (пользователь {callback_query.from_user.id})")\n`;
      code += `    # Симулируем выполнение команды /${command}\n`;
      code += '    \n';
      code += '    # Создаем fake message object для команды\n';
      code += '    from types import SimpleNamespace\n';
      code += '    fake_message = SimpleNamespace()\n';
      code += '    fake_message.from_user = callback_query.from_user\n';
      code += '    fake_message.chat = callback_query.message.chat\n';
      code += '    fake_message.date = callback_query.message.date\n';
      code += '    fake_message.answer = callback_query.message.answer\n';
      code += '    fake_message.edit_text = callback_query.message.edit_text\n';
      code += '    \n';
      
      // Найти соответствующий обработчик команды
      const commandNode = nodes.find(n => n.data.command === `/${command}` || n.data.command === command);
      if (commandNode) {
        if (commandNode.type === 'start') {
          code += '    # Вызываем start handler через edit_text\n';
          code += '    # Создаем специальный объект для редактирования сообщения\n';
          code += '    class FakeMessageEdit:\n';
          code += '        def __init__(self, callback_query):\n';
          code += '            self.from_user = callback_query.from_user\n';
          code += '            self.chat = callback_query.message.chat\n';
          code += '            self.date = callback_query.message.date\n';
          code += '            self.message_id = callback_query.message.message_id\n';
          code += '            self._callback_query = callback_query\n';
          code += '        \n';
          code += '        async def answer(self, text, parse_mode=None, reply_markup=None):\n';
          code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
          code += '        \n';
          code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
          code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
          code += '    \n';
          code += '    fake_edit_message = FakeMessageEdit(callback_query)\n';
          code += '    await start_handler(fake_edit_message)\n';
        } else if (commandNode.type === 'command') {
          code += `    # Вызываем ${command} handler\n`;
          code += `    await ${command}_handler(fake_message)\n`;
        }
      } else {
        code += `    await callback_query.message.edit_text("Команда /${command} выполнена")\n`;
      }
      code += `    logging.info(f"Команда /${command} выполнена через callback кнопку (пользователь {callback_query.from_user.id})")\n`;
    });
  }

  // УДАЛЕН универсальный profile_handler - он конфликтует с основным обработчиком команды из узла
  code += '\n';

  // Добавляем обработчики для групп
  if (groups && groups.length > 0) {
    code += '\n# Обработчики для работы с группами\n';
    code += '@dp.message(F.chat.type.in_(["group", "supergroup"]))\n';
    code += 'async def handle_group_message(message: types.Message):\n';
    code += '    """\n';
    code += '    Обработчик сообщений в группах\n';
    code += '    """\n';
    code += '    chat_id = message.chat.id\n';
    code += '    user_id = message.from_user.id\n';
    code += '    username = message.from_user.username or "Неизвестный"\n';
    code += '    \n';
    code += '    # Проверяем, является ли группа подключенной\n';
    code += '    group_name = None\n';
    code += '    for name, config in CONNECTED_GROUPS.items():\n';
    code += '        if config.get("id") and str(config["id"]) == str(chat_id):\n';
    code += '            group_name = name\n';
    code += '            break\n';
    code += '    \n';
    code += '    if group_name:\n';
    code += '        logging.info(f"📢 Сообщение в подключенной группе {group_name}: {message.text[:50]}... от @{username}")\n';
    code += '        \n';
    code += '        # Здесь можно добавить логику обработки групповых сообщений\n';
    code += '        # Например, модерация, автоответы, статистика и т.д.\n';
    code += '        \n';
    code += '        # Сохраняем статистику сообщений\n';
    code += '        try:\n';
    code += '            await save_group_message_stats(chat_id, user_id, message.text)\n';
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка сохранения статистики группы: {e}")\n';
    code += '    \n';
    code += '# Функция для сохранения статистики групповых сообщений\n';
    code += 'async def save_group_message_stats(chat_id: int, user_id: int, message_text: str):\n';
    code += '    """\n';
    code += '    Сохраняет статистику сообщений в группе\n';
    code += '    """\n';
    code += '    if db_pool:\n';
    code += '        try:\n';
    code += '            async with db_pool.acquire() as conn:\n';
    code += '                # Здесь можно добавить логику сохранения статистики в БД\n';
    code += '                await conn.execute(\n';
    code += '                    """\n';
    code += '                    INSERT INTO group_activity (chat_id, user_id, message_length, created_at) \n';
    code += '                    VALUES ($1, $2, $3, $4)\n';
    code += '                    ON CONFLICT DO NOTHING\n';
    code += '                    """,\n';
    code += '                    chat_id, user_id, len(message_text or ""), get_moscow_time()\n';
    code += '                )\n';
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при сохранении статистики группы: {e}")\n';
    code += '    \n';
    
    // Добавляем обработчик новых участников
    code += '# Обработчик новых участников в группе\n';
    code += '@dp.message(F.new_chat_members)\n';
    code += 'async def handle_new_member(message: types.Message):\n';
    code += '    """\n';
    code += '    Обработчик новых участников в группе\n';
    code += '    """\n';
    code += '    chat_id = message.chat.id\n';
    code += '    \n';
    code += '    # Проверяем, является ли группа подключенной\n';
    code += '    group_name = None\n';
    code += '    for name, config in CONNECTED_GROUPS.items():\n';
    code += '        if config.get("id") and str(config["id"]) == str(chat_id):\n';
    code += '            group_name = name\n';
    code += '            break\n';
    code += '    \n';
    code += '    if group_name:\n';
    code += '        for new_member in message.new_chat_members:\n';
    code += '            username = new_member.username or new_member.first_name or "Новый участник"\n';
    code += '            logging.info(f"👋 Новый участник в группе {group_name}: @{username}")\n';
    code += '            \n';
    code += '            # Приветственное сообщение (опционально)\n';
    code += '            # await message.answer(f"Добро пожаловать в группу, @{username}!")\n';
    code += '    \n';
  }
  
  code += '\n\n# Запуск бота\n';
  code += 'async def main():\n';
  code += '    global db_pool\n';
  code += '    try:\n';
  code += '        # Инициализируем базу данных\n';
  code += '        await init_database()\n';
  if (menuCommands.length > 0) {
    code += '        await set_bot_commands()\n';
  }
  code += '        print("🤖 Бот запущен и готов к работе!")\n';
  code += '        await dp.start_polling(bot)\n';
  code += '    except KeyboardInterrupt:\n';
  code += '        print("🛑 Получен сигнал остановки, завершаем работу...")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Критическая ошибка: {e}")\n';
  code += '    finally:\n';
  code += '        # Правильно закрываем все соединения\n';
  code += '        if db_pool:\n';
  code += '            await db_pool.close()\n';
  code += '            print("🔌 Соединение с базой данных закрыто")\n';
  code += '        \n';
  code += '        # Закрываем сессию бота\n';
  code += '        await bot.session.close()\n';
  code += '        print("🔌 Сессия бота закрыта")\n';
  code += '        print("✅ Бот корректно завершил работу")\n\n';
  
  // Добавляем обработчики для множественного выбора
  code += '\n# Обработчики для множественного выбора\n';
  
  // Найдем узлы с множественным выбором для использования в обработчиках
  const multiSelectNodes = (nodes || []).filter(node => 
    node.data.allowMultipleSelection
  );
  console.log(`🔍 ГЕНЕРАТОР: Найдено ${multiSelectNodes.length} узлов с множественным выбором:`, multiSelectNodes.map(n => n.id));
  
  // Обработчик для inline кнопок множественного выбора
  code += '@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))\n';
  code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
  code += '    await callback_query.answer()\n';
  code += '    user_id = callback_query.from_user.id\n';
  code += '    callback_data = callback_query.data\n';
  code += '    \n';
  code += '    # Обработка кнопки "Готово"\n';
  code += '    if callback_data.startswith("done_"):\n';
  code += '        # Завершение множественного выбора (новый формат)\n';
  code += '        logging.info(f"🏁 Обработка кнопки Готово: {callback_data}")\n';
  code += '        short_node_id = callback_data.replace("done_", "")\n';
  code += '        # Находим полный node_id по короткому суффиксу\n';
  code += '        node_id = None\n';
  multiSelectNodes.forEach(node => {
    const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
    code += `        if short_node_id == "${shortNodeId}":\n`;
    code += `            node_id = "${node.id}"\n`;
    code += `            logging.info(f"✅ Найден узел: ${node.id}")\n`;
  });
  code += '    elif callback_data.startswith("multi_select_done_"):\n';
  code += '        # Завершение множественного выбора (старый формат)\n';
  code += '        node_id = callback_data.replace("multi_select_done_", "")\n';
  code += '        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n';
  code += '        \n';
  code += '        # Сохраняем выбранные опции в базу данных\n';
  code += '        if selected_options:\n';
  code += '            selected_text = ", ".join(selected_options)\n';
  
  // Генерируем сохранение для каждого узла с его переменной
  multiSelectNodes.forEach(node => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    code += `            if node_id == "${node.id}":\n`;
    code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
  });
  
  code += '            # Резервное сохранение если узел не найден\n';
  code += '            if not any(node_id == node for node in [' + multiSelectNodes.map(n => `"${n.id}"`).join(', ') + ']):\n';
  code += '                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)\n';
  code += '        \n';
  code += '        # Очищаем состояние множественного выбора\n';
  code += '        if user_id in user_data:\n';
  code += '            user_data[user_id].pop(f"multi_select_{node_id}", None)\n';
  code += '            user_data[user_id].pop("multi_select_node", None)\n';
  code += '        \n';
  code += '        # Переходим к следующему узлу, если указан\n';
  
  // Добавим переходы для узлов с множественным выбором
  
  if (multiSelectNodes.length > 0) {
    console.log(`🔧 ГЕНЕРАТОР: Обрабатываем ${multiSelectNodes.length} узлов множественного выбора для переходов`);
    code += '        # Определяем следующий узел для каждого node_id\n';
    multiSelectNodes.forEach(node => {
      console.log(`🔧 ГЕНЕРАТОР: Создаем блок if для узла ${node.id}`);
      console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget: ${node.data.continueButtonTarget}`);
      console.log(`🔧 ГЕНЕРАТОР: соединения из узла: ${connections.filter(conn => conn.source === node.id).map(c => c.target).join(', ')}`);
      
      code += `        if node_id == "${node.id}":\n`;
      
      let hasContent = false;
      
      // Сначала проверяем continueButtonTarget
      if (node.data.continueButtonTarget) {
        const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
        if (targetNode) {
          console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через continueButtonTarget`);
          console.log(`🔧 ГЕНЕРАТОР: Тип целевого узла: ${targetNode.type}`);
          code += `            # Переход к узлу ${targetNode.id}\n`;
          code += `            logging.info(f"🔄 Переходим к узлу ${targetNode.id} (тип: ${targetNode.type})")\n`;
          if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
            console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик, отправляем сообщение`);
            const messageText = targetNode.data.messageText || "Продолжение...";
            const formattedText = formatTextForPython(messageText);
            code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
            code += `            text = ${formattedText}\n`;
            
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
              code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для целевого узла\n`;
              code += `            # Загружаем пользовательские данные для клавиатуры\n`;
              code += `            user_vars = await get_user_from_db(user_id)\n`;
              code += `            if not user_vars:\n`;
              code += `                user_vars = user_data.get(user_id, {})\n`;
              code += `            if not isinstance(user_vars, dict):\n`;
              code += `                user_vars = {}\n`;
              code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
              code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `            await callback_query.message.answer(text)\n`;
            }
            code += `            return\n`;
            hasContent = true;
          } else if (targetNode.type === 'command') {
            const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
            console.log(`🔧 ГЕНЕРАТОР: Добавляем вызов handle_command_${safeCommandName}`);
            code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            hasContent = true;
          } else if (targetNode.type === 'start') {
            console.log(`🔧 ГЕНЕРАТОР: Вызываем полный обработчик start для правильной клавиатуры`);
            code += `            # Вызываем полный обработчик start для правильного отображения главного меню\n`;
            code += `            await handle_command_start(callback_query.message)\n`;
            code += `            return\n`;
            hasContent = true;
          } else {
            console.log(`⚠️ ГЕНЕРАТОР: Неизвестный тип узла ${targetNode.type}, добавляем pass`);
            code += `            logging.warning(f"⚠️ Неизвестный тип узла: ${targetNode.type}")\n`;
            code += `            pass\n`;
            hasContent = true;
          }
        } else {
          console.log(`⚠️ ГЕНЕРАТОР: Целевой узел не найден для continueButtonTarget: ${node.data.continueButtonTarget}`);
          // Если целевой узел не найден, просто завершаем выбор без перехода
          code += `            # Целевой узел не найден, завершаем выбор\n`;
          code += `            logging.warning(f"⚠️ Целевой узел не найден: ${node.data.continueButtonTarget}")\n`;
          code += `            await callback_query.message.edit_text("✅ Выбор завершен!")\n`;
          hasContent = true;
        }
      } else {
        // Если нет continueButtonTarget, ищем соединения
        const nodeConnections = connections.filter(conn => conn.source === node.id);
        if (nodeConnections.length > 0) {
          const targetNode = nodes.find(n => n.id === nodeConnections[0].target);
          if (targetNode) {
            console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через соединение`);
            code += `            # Переход к узлу ${targetNode.id} через соединение\n`;
            if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
              console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик через соединение`);
              const messageText = targetNode.data.messageText || "Продолжение...";
              const formattedText = formatTextForPython(messageText);
              code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
              code += `            text = ${formattedText}\n`;
              
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для соединения ${targetNode.id}`);
                code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для соединения\n`;
                code += `            # Загружаем пользовательские данные для клавиатуры\n`;
                code += `            user_vars = await get_user_from_db(user_id)\n`;
                code += `            if not user_vars:\n`;
                code += `                user_vars = user_data.get(user_id, {})\n`;
                code += `            if not isinstance(user_vars, dict):\n`;
                code += `                user_vars = {}\n`;
                code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
                code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
              } else {
                code += `            await callback_query.message.answer(text)\n`;
              }
              code += `            return\n`;
            } else if (targetNode.type === 'command') {
              const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
              code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            }
            hasContent = true;
          }
        }
      }
      
      // Если блок if остался пустым, добавляем return
      if (!hasContent) {
        console.log(`⚠️ ГЕНЕРАТОР: Блок if для узла ${node.id} остался пустым, добавляем return`);
        code += `            return\n`;
      } else {
        console.log(`✅ ГЕНЕРАТОР: Блок if для узла ${node.id} заполнен контентом`);
      }
    });
  }
  
  code += '        return\n';
  code += '    \n';
  code += '    # Обработка выбора опции\n';
  code += '    logging.info(f"📱 Обрабатываем callback_data: {callback_data}")\n';
  code += '    \n';
  code += '    # Поддерживаем и новый формат ms_ и старый multi_select_\n';
  code += '    if callback_data.startswith("ms_"):\n';
  code += '        # Новый короткий формат: ms_shortNodeId_shortTarget\n';
  code += '        parts = callback_data.split("_")\n';
  code += '        if len(parts) >= 3:\n';
  code += '            short_node_id = parts[1]\n';
  code += '            button_id = "_".join(parts[2:])\n';
  code += '            # Находим полный node_id по короткому суффиксу\n';
  code += '            node_id = None\n';
  code += '            logging.info(f"🔍 Ищем узел по короткому ID: {short_node_id}")\n';
  code += '            \n';
  code += '            # Для станций метро ищем по содержимому кнопки, а не по короткому ID\n';
  code += '            if short_node_id == "stations":\n';
  code += '                # Проверяем каждый узел станций на наличие нужной кнопки\n';
  
  let hasStationsCode = false;
  multiSelectNodes.forEach(node => {
    const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
    if (shortNodeId === 'stations') {
      const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
      code += `                # Проверяем узел ${node.id}\n`;
      selectionButtons.forEach(button => {
        const buttonValue = button.target || button.id || button.text;
        code += `                if button_id == "${buttonValue}":\n`;
        code += `                    node_id = "${node.id}"\n`;
        code += `                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")\n`;
        hasStationsCode = true;
      });
    }
  });
  
  // Добавляем pass если в if блоке нет кода
  if (!hasStationsCode) {
    code += '                pass\n';
  }
  
  code += '            else:\n';
  code += '                # Обычная логика для других узлов\n';
  
  let hasElseCode = false;
  multiSelectNodes.forEach(node => {
    const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
    if (shortNodeId !== 'stations') {
      code += `                if short_node_id == "${shortNodeId}":\n`;
      code += `                    node_id = "${node.id}"\n`;
      code += `                    logging.info(f"✅ Найден узел: {node_id}")\n`;
      hasElseCode = true;
    }
  });
  
  // Добавляем pass если в else блоке нет кода
  if (!hasElseCode) {
    code += '                pass\n';
  }
  code += '    elif callback_data.startswith("multi_select_"):\n';
  code += '        # Старый формат для обратной совместимости\n';
  code += '        parts = callback_data.split("_")\n';
  code += '        if len(parts) >= 3:\n';
  code += '            node_id = parts[2]\n';
  code += '            button_id = "_".join(parts[3:]) if len(parts) > 3 else parts[2]\n';
  code += '    else:\n';
  code += '        logging.warning(f"⚠️ Неизвестный формат callback_data: {callback_data}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    if not node_id:\n';
  code += '        logging.warning(f"⚠️ Не удалось найти node_id для callback_data: {callback_data}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    logging.info(f"📱 Определили node_id: {node_id}, button_id: {button_id}")\n';
  code += '    \n';
  code += '    # Инициализируем список выбранных опций с восстановлением из БД\n';
  code += '    if user_id not in user_data:\n';
  code += '        user_data[user_id] = {}\n';
  code += '    \n';
  code += '    # Восстанавливаем ранее выбранные опции из базы данных\n';
  code += '    if f"multi_select_{node_id}" not in user_data[user_id]:\n';
  code += '        # Загружаем сохраненные данные из базы\n';
  code += '        user_vars = await get_user_from_db(user_id)\n';
  code += '        saved_selections = []\n';
  code += '        \n';
  code += '        if user_vars:\n';
  code += '            # Ищем переменную с интересами\n';
  code += '            for var_name, var_data in user_vars.items():\n';
  code += '                if "интерес" in var_name.lower() or var_name == "interests" or var_name.startswith("multi_select_"):\n';
  code += '                    if isinstance(var_data, dict) and "value" in var_data:\n';
  code += '                        saved_str = var_data["value"]\n';
  code += '                    elif isinstance(var_data, str):\n';
  code += '                        saved_str = var_data\n';
  code += '                    else:\n';
  code += '                        saved_str = str(var_data) if var_data else ""\n';
  code += '                    \n';
  code += '                    if saved_str:\n';
  code += '                        saved_selections = [item.strip() for item in saved_str.split(",")]\n';
  code += '                        break\n';
  code += '        \n';
  code += '        user_data[user_id][f"multi_select_{node_id}"] = saved_selections\n';
  code += '    \n';
  code += '    # Находим текст кнопки по button_id\n';
  code += '    button_text = None\n';
  
  // Добавляем маппинг кнопок для каждого узла с множественным выбором
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    if (selectionButtons.length > 0) {
      code += `    if node_id == "${node.id}":\n`;
      selectionButtons.forEach(button => {
        // Используем target или id для маппинга, как в генераторе клавиатуры
        const buttonValue = button.target || button.id || button.text;
        code += `        if button_id == "${buttonValue}":\n`;
        code += `            button_text = "${button.text}"\n`;
      });
    }
  });
  
  code += '    \n';
  code += '    if button_text:\n';
  code += '        logging.info(f"🔘 Обрабатываем кнопку: {button_text}")\n';
  code += '        selected_list = user_data[user_id][f"multi_select_{node_id}"]\n';
  code += '        if button_text in selected_list:\n';
  code += '            # Убираем из выбранных\n';
  code += '            selected_list.remove(button_text)\n';
  code += '            logging.info(f"➖ Убрали выбор: {button_text}")\n';
  code += '        else:\n';
  code += '            # Добавляем к выбранным\n';
  code += '            selected_list.append(button_text)\n';
  code += '            logging.info(f"➕ Добавили выбор: {button_text}")\n';
  code += '        \n';
  code += '        logging.info(f"📋 Текущие выборы: {selected_list}")\n';
  code += '        \n';
  code += '        # Обновляем клавиатуру с галочками\n';
  code += '        builder = InlineKeyboardBuilder()\n';
  
  // Генерируем обновление клавиатуры для каждого узла
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    const regularButtons = node.data.buttons?.filter(btn => btn.action !== 'selection') || [];
    
    if (selectionButtons.length > 0) {
      code += `        if node_id == "${node.id}":\n`;
      
      // Добавляем кнопки выбора с галочками
      console.log(`🔧 ГЕНЕРАТОР: Добавляем ${selectionButtons.length} кнопок выбора для узла ${node.id}`);
      selectionButtons.forEach((button, index) => {
        // ИСПРАВЛЕНИЕ: используем тот же формат callback_data как при создании кнопок
        const shortNodeId = generateUniqueShortId(node.id, allNodeIds || []);
        const shortTarget = button.target || button.id || 'btn';
        const callbackData = `ms_${shortNodeId}_${shortTarget}`;
        console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> callback_data: ${callbackData}`);
        code += `            selected_mark = "✅ " if "${button.text}" in selected_list else ""\n`;
        code += `            builder.add(InlineKeyboardButton(text=f"{selected_mark}${button.text}", callback_data="${callbackData}"))\n`;
      });
      
      // Добавляем обычные кнопки
      regularButtons.forEach(button => {
        if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `            builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        } else if (button.action === 'url') {
          code += `            builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'command') {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `            builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
        }
      });
      
      // Добавляем кнопку завершения  
      const continueText = node.data.continueButtonText || 'Готово';
      const doneCallbackData = `multi_select_done_${node.id}`;
      console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем кнопку завершения "${continueText}" с callback_data: ${doneCallbackData}`);
      code += `            builder.add(InlineKeyboardButton(text="${continueText}", callback_data="${doneCallbackData}"))\n`;
      code += `            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла ${node.id} (multi-select)")\n`;
      code += `            builder.adjust(2)\n`;
    }
  });
  
  code += '        \n';
  code += '        keyboard = builder.as_markup()\n';
  code += '        logging.info(f"🔄 ОБНОВЛЯЕМ клавиатуру для узла {node_id} с галочками")\n';
  code += '        await callback_query.message.edit_reply_markup(reply_markup=keyboard)\n';
  code += '\n';
  
  // Генерируем обработчики для кнопок "Готово" многомерного выбора
  console.log(`🔧 ГЕНЕРАТОР: Создаем обработчик для кнопок завершения множественного выбора`);
  console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ - добавлен return после отправки сообщения для остановки выполнения`);
  console.log(`🔧 ГЕНЕРАТОР: УБРАНЫ ВСЕ АВТОМАТИЧЕСКИЕ ВЫЗОВЫ handle_callback_* после кнопки Готово`);
  console.log(`🔧 ГЕНЕРАТОР: Теперь после Готово - только отправка сообщения и return`);
  console.log(`🔧 ГЕНЕРАТОР: Количество узлов с множественным выбором: ${multiSelectNodes.length}`);
  multiSelectNodes.forEach((node, index) => {
    console.log(`🔧 ГЕНЕРАТОР: Узел ${index + 1}: ${node.id}, continueButtonTarget: ${node.data.continueButtonTarget}`);
    const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
    console.log(`🔧 ГЕНЕРАТОР: Целевой узел найден: ${!!targetNode}, тип: ${targetNode?.type}, allowMultipleSelection: ${targetNode?.data?.allowMultipleSelection}`);
    console.log(`🔧 ГЕНЕРАТОР: Целевой узел кнопки: ${targetNode?.data?.buttons?.length || 0}, keyboardType: ${targetNode?.data?.keyboardType}`);
  });
  
  code += '# Обработчик для кнопок завершения множественного выбора\n';
  code += '@dp.callback_query(lambda callback_query: callback_query.data and callback_query.data.startswith("multi_select_done_"))\n';
  code += 'async def handle_multi_select_done(callback_query: types.CallbackQuery):\n';
  code += '    logging.info(f"🏁 ОБРАБОТЧИК ГОТОВО АКТИВИРОВАН! callback_data: {callback_query.data}")\n';
  code += '    await callback_query.answer()\n';
  code += '    user_id = callback_query.from_user.id\n';
  code += '    callback_data = callback_query.data\n';
  code += '    \n';
  code += '    logging.info(f"🏁 Завершение множественного выбора: {callback_data}")\n';
  code += '    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Текущее сообщение ID: {callback_query.message.message_id}")\n';
  code += '    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Текущий текст сообщения: {callback_query.message.text}")\n';
  code += '    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Есть ли клавиатура: {bool(callback_query.message.reply_markup)}")\n';
  code += '    \n';
  code += '    # Извлекаем node_id из callback_data\n';
  code += '    node_id = callback_data.replace("multi_select_done_", "")\n';
  code += '    logging.info(f"🎯 Node ID для завершения: {node_id}")\n';
  code += '    \n';
  
  multiSelectNodes.forEach(node => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    const continueButtonTarget = node.data.continueButtonTarget;
    
    code += `    if node_id == "${node.id}":\n`;
    code += `        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Обрабатываем завершение для узла ${node.id}")\n`;
    code += `        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: continueButtonTarget = ${continueButtonTarget || 'НЕТ'}")\n`;
    code += `        # Получаем выбранные опции для узла ${node.id}\n`;
    code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${node.id}", [])\n`;
    code += `        logging.info(f"📋 ГЕНЕРАТОР DEBUG: Выбранные опции для ${node.id}: {selected_options}")\n`;
    code += `        \n`;
    code += `        if selected_options:\n`;
    code += `            selected_text = ", ".join(selected_options)\n`;
    code += `            await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
    code += `            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: ${variableName} = {selected_text}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций для сохранения")\n`;
    code += `        \n`;
    
    if (continueButtonTarget) {
      const targetNode = nodes.find(n => n.id === continueButtonTarget);
      if (targetNode) {
        code += `        # Переход к следующему узлу: ${continueButtonTarget}\n`;
        const safeFunctionName = continueButtonTarget.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Переходим к узлу '${continueButtonTarget}'")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Тип целевого узла: ${targetNode?.type || 'неизвестно'}")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: allowMultipleSelection: ${targetNode?.data?.allowMultipleSelection || false}")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Есть ли кнопки: ${targetNode?.data?.buttons?.length || 0}")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: keyboardType: ${targetNode?.data?.keyboardType || 'нет'}")\n`;
        
        // Специальная обработка для узлов с множественным выбором
        if (targetNode.data.allowMultipleSelection || targetNode.data.multiSelectEnabled) {
          code += `        # Узел ${continueButtonTarget} поддерживает множественный выбор - сохраняем состояние\n`;
          code += `        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Инициализируем множественный выбор для узла ${targetNode.id}")\n`;
          code += `        if user_id not in user_data:\n`;
          code += `            user_data[user_id] = {}\n`;
          code += `        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
          code += `        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
          code += `        user_data[user_id]["multi_select_type"] = "inline"\n`;
          code += `        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Состояние множественного выбора установлено для узла ${targetNode.id}")\n`;
        }
        
        // ИСПРАВЛЕНИЕ: НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!
        // Пользователь должен сам выбрать продолжение
        
        // Отправляем сообщение для следующего узла с ожиданием пользовательского ввода
        if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
          // Показываем сообщение следующего узла
          const messageText = targetNode.data.messageText || "Выберите опции:";
          const formattedText = formatTextForPython(messageText);
          
          code += `        # Отправляем сообщение для следующего узла с ожиданием пользовательского ввода\n`;
          code += `        text = ${formattedText}\n`;
          code += `        \n`;
          code += `        # Инициализируем состояние множественного выбора для следующего узла\n`;
          
          // Генерируем клавиатуру для следующего узла
          if (targetNode.data.allowMultipleSelection && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            
            code += `        # Инициализируем состояние множественного выбора\n`;
            code += `        if user_id not in user_data:\n`;
            code += `            user_data[user_id] = {}\n`;
            code += `        \n`;
            code += `        # Загружаем ранее выбранные варианты из БД\n`;
            code += `        saved_selections = []\n`;
            code += `        user_record = await get_user_from_db(user_id)\n`;
            code += `        if user_record and isinstance(user_record, dict):\n`;
            code += `            user_data_field = user_record.get("user_data", {})\n`;
            code += `            if isinstance(user_data_field, str):\n`;
            code += `                import json\n`;
            code += `                try:\n`;
            code += `                    user_vars = json.loads(user_data_field)\n`;
            code += `                except:\n`;
            code += `                    user_vars = {}\n`;
            code += `            elif isinstance(user_data_field, dict):\n`;
            code += `                user_vars = user_data_field\n`;
            code += `            else:\n`;
            code += `                user_vars = {}\n`;
            code += `            \n`;
            code += `            if "${multiSelectVariable}" in user_vars:\n`;
            code += `                var_data = user_vars["${multiSelectVariable}"]\n`;
            code += `                if isinstance(var_data, str) and var_data.strip():\n`;
            code += `                    saved_selections = [sel.strip() for sel in var_data.split(",") if sel.strip()]\n`;
            code += `        \n`;
            code += `        # Инициализируем состояние с восстановленными значениями\n`;
            code += `        user_data[user_id]["multi_select_${targetNode.id}"] = saved_selections.copy()\n`;
            code += `        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
            code += `        user_data[user_id]["multi_select_type"] = "inline"\n`;
            code += `        user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
            code += `        \n`;
            code += `        builder = InlineKeyboardBuilder()\n`;
            
            // Добавляем кнопки выбора с учетом ранее сохраненных значений
            targetNode.data.buttons.forEach((button, index) => {
              if (button.action === 'selection') {
                const cleanText = button.text.replace(/"/g, '\\"');
                const callbackData = `ms_${generateUniqueShortId(targetNode.id, allNodeIds || [])}_${button.target || button.id || `btn${index}`}`.replace(/[^a-zA-Z0-9_]/g, '_');
                code += `        # Кнопка с галочкой: ${cleanText}\n`;
                code += `        selected_mark = "✅ " if "${cleanText}" in user_data[user_id]["multi_select_${targetNode.id}"] else ""\n`;
                code += `        button_text = f"{selected_mark}${cleanText}"\n`;
                code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data="${callbackData}"))\n`;
              }
            });
            
            // Добавляем кнопку "Готово"
            code += `        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_${targetNode.id}"))\n`;
            code += `        builder.adjust(2)\n`;
            code += `        keyboard = builder.as_markup()\n`;
            code += `        \n`;
            code += `        await callback_query.message.answer(text, reply_markup=keyboard)\n`;
            code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено, ЗАВЕРШАЕМ функцию")\n`;
            code += `        return\n`;
          } else {
            // Обычная клавиатура без множественного выбора
            code += `        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, нужна ли клавиатура для целевого узла\n`;
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
              code += `        # Добавляем клавиатуру для целевого узла\n`;
              code += `        # Загружаем пользовательские данные для клавиатуры\n`;
              code += `        user_vars = await get_user_from_db(user_id)\n`;
              code += `        if not user_vars:\n`;
              code += `            user_vars = user_data.get(user_id, {})\n`;
              code += `        if not isinstance(user_vars, dict):\n`;
              code += `            user_vars = {}\n`;
              code += `        \n`;
              code += generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
              code += `        await callback_query.message.answer(text, reply_markup=keyboard)\n`;
              code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено С КЛАВИАТУРОЙ для узла ${targetNode.id}")\n`;
            } else {
              code += `        # Отправляем только сообщение без клавиатуры\n`;
              code += `        await callback_query.message.answer(text)\n`;
              code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено БЕЗ КЛАВИАТУРЫ для узла ${targetNode.id}")\n`;
            }
            code += `        return\n`;
          }
        } else {
          // Узел не найден - отправляем простое сообщение
          code += `        logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Целевой узел не найден, отправляем простое сообщение")\n`;
          code += `        await callback_query.message.answer("Переход завершен")\n`;
          code += `        return\n`;
        }
      }
    }
    
    code += `        return\n`;
    code += `    \n`;
  });
  
  code += '\n';
  

  
  // Обработчик для reply кнопок множественного выбора
  code += '# Обработчик для reply кнопок множественного выбора\n';
  code += '@dp.message()\n';
  code += 'async def handle_multi_select_reply(message: types.Message):\n';
  code += '    user_id = message.from_user.id\n';
  code += '    user_input = message.text\n';
  code += '    \n';
  code += '    # Проверяем, находится ли пользователь в режиме множественного выбора reply\n';
  code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';
  code += '        node_id = user_data[user_id]["multi_select_node"]\n';
  code += '        \n';
  
  // Проверяем, является ли это кнопкой завершения
  multiSelectNodes.forEach(node => {
    const continueText = node.data.continueButtonText || 'Готово';
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    code += `        if node_id == "${node.id}" and user_input == "${continueText}":\n`;
    code += `            # Завершение множественного выбора для узла ${node.id}\n`;
    code += `            selected_options = user_data.get(user_id, {}).get("multi_select_{node_id}", [])\n`;
    code += `            if selected_options:\n`;
    code += `                selected_text = ", ".join(selected_options)\n`;
    code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
    code += `            \n`;
    code += `            # Очищаем состояние\n`;
    code += `            user_data[user_id].pop("multi_select_{node_id}", None)\n`;
    code += `            user_data[user_id].pop("multi_select_node", None)\n`;
    code += `            user_data[user_id].pop("multi_select_type", None)\n`;
    code += `            \n`;
    
    if (node.data.continueButtonTarget) {
      const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
      if (targetNode) {
        code += `            # Переход к следующему узлу\n`;
        if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
          console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик в reply mode`);
          const messageText = targetNode.data.messageText || "Продолжение...";
          const formattedText = formatTextForPython(messageText);
          code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
          code += `            text = ${formattedText}\n`;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла в reply mode
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для reply mode ${targetNode.id}`);
            code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для reply mode\n`;
            code += `            # Загружаем пользовательские данные для клавиатуры\n`;
            code += `            user_vars = await get_user_from_db(user_id)\n`;
            code += `            if not user_vars:\n`;
            code += `                user_vars = user_data.get(user_id, {})\n`;
            code += `            if not isinstance(user_vars, dict):\n`;
            code += `                user_vars = {}\n`;
            code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
            code += `            await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `            await message.answer(text)\n`;
          };
        } else if (targetNode.type === 'command') {
          const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
          code += `            await handle_command_${safeCommandName}(message)\n`;
        }
      }
    }
    code += `            return\n`;
    code += `        \n`;
  });
  
  code += '        # Обработка выбора опции\n';
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    
    if (selectionButtons.length > 0) {
      code += `        if node_id == "${node.id}":\n`;
      selectionButtons.forEach(button => {
        code += `            if user_input == "${button.text}":\n`;
        code += `                if "multi_select_{node_id}" not in user_data[user_id]:\n`;
        code += `                    user_data[user_id]["multi_select_{node_id}"] = []\n`;
        code += `                \n`;
        code += `                selected_list = user_data[user_id]["multi_select_{node_id}"]\n`;
        code += `                if "${button.text}" in selected_list:\n`;
        code += `                    selected_list.remove("${button.text}")\n`;
        code += `                    await message.answer("❌ Убрано: ${button.text}")\n`;
        code += `                else:\n`;
        code += `                    selected_list.append("${button.text}")\n`;
        code += `                    await message.answer("✅ Выбрано: ${button.text}")\n`;
        code += `                return\n`;
        code += `            \n`;
      });
    }
  });
  
  code += '    \n';
  code += '    # Если не множественный выбор, передаем дальше по цепочке обработчиков\n';
  code += '    pass\n';
  code += '\n';

  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}

function generateStartHandler(node: Node): string {
  let code = '\n@dp.message(CommandStart())\n';
  code += 'async def start_handler(message: types.Message):\n';

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Регистрируем пользователя
  code += '\n    # Регистрируем пользователя в системе\n';
  code += '    user_id = message.from_user.id\n';
  code += '    username = message.from_user.username\n';
  code += '    first_name = message.from_user.first_name\n';
  code += '    last_name = message.from_user.last_name\n';
  code += '    \n';
  code += '    # Сохраняем пользователя в базу данных\n';
  code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
  code += '    \n';
  code += '    # Резервное сохранение в локальное хранилище\n';
  code += '    if not saved_to_db:\n';
  code += '        user_data[user_id] = {\n';
  code += '            "username": username,\n';
  code += '            "first_name": first_name,\n';
  code += '            "last_name": last_name,\n';
  code += '            "registered_at": message.date\n';
  code += '        }\n';
  code += '        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")\n';
  code += '    else:\n';
  code += '        logging.info(f"Пользователь {user_id} сохранен в базу данных")\n\n';
  
  // КРИТИЧЕСКИ ВАЖНО: ВСЕГДА восстанавливаем состояние множественного выбора
  // Это необходимо для корректной работы кнопок "Изменить выбор" и "Начать заново"
  // УБИРАЕМ условие node.data.allowMultipleSelection, потому что состояние нужно восстанавливать всегда
  code += '    # ВАЖНО: ВСЕГДА восстанавливаем состояние множественного выбора из БД\n';
  code += '    # Это критически важно для кнопок "Изменить выбор" и "Начать заново"\n';
  code += '    user_record = await get_user_from_db(user_id)\n';
  code += '    saved_interests = []\n';
  code += '    \n';
  code += '    if user_record and isinstance(user_record, dict):\n';
  code += '        user_data_field = user_record.get("user_data", {})\n';
  code += '        if isinstance(user_data_field, str):\n';
  code += '            import json\n';
  code += '            try:\n';
  code += '                user_vars = json.loads(user_data_field)\n';
  code += '            except:\n';
  code += '                user_vars = {}\n';
  code += '        elif isinstance(user_data_field, dict):\n';
  code += '            user_vars = user_data_field\n';
  code += '        else:\n';
  code += '            user_vars = {}\n';
  code += '        \n';
  code += '        # Ищем сохраненные интересы в любой переменной\n';
  code += '        for var_name, var_data in user_vars.items():\n';
  code += '            if "интерес" in var_name.lower() or var_name == "user_interests":\n';
  code += '                if isinstance(var_data, str) and var_data:\n';
  code += '                    saved_interests = [interest.strip() for interest in var_data.split(",")]\n';
  code += '                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")\n';
  code += '                    break\n';
  code += '    \n';
  code += '    # ВСЕГДА инициализируем состояние множественного выбора с восстановленными интересами\n';
  code += '    if user_id not in user_data:\n';
  code += '        user_data[user_id] = {}\n';
  const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';
  code += `    user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy()\n`;
  code += `    user_data[user_id]["multi_select_node"] = "${node.id}"\n`;
  code += '    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")\n';
  code += '    \n';
  
  // Создаем клавиатуру с восстановленными галочками для множественного выбора
  if (node.data.allowMultipleSelection) {
    code += '    # Создаем клавиатуру с восстановленными галочками\n';
    code += '    builder = InlineKeyboardBuilder()\n';
    code += '    \n';
    code += '    # Функция для проверки совпадения интересов\n';
    code += '    def check_interest_match(button_text, saved_list):\n';
    code += '        """Проверяет, есть ли интерес в сохраненном списке"""\n';
    code += '        if not saved_list:\n';
    code += '            return False\n';
    code += '        # Убираем эмодзи и галочки для сравнения\n';
    code += '        clean_button = button_text.replace("✅ ", "").replace("⬜ ", "").strip()\n';
    code += '        for saved_interest in saved_list:\n';
    code += '            clean_saved = saved_interest.replace("✅ ", "").replace("⬜ ", "").strip()\n';
    code += '            if clean_button == clean_saved or clean_button in clean_saved or clean_saved in clean_button:\n';
    code += '                return True\n';
    code += '        return False\n';
    code += '    \n';
    
    // Добавляем кнопки интересов с галочками
    const buttons = node.data.buttons || [];
    const interestButtons = buttons.filter(btn => btn.action === 'selection');
    
    interestButtons.forEach(button => {
      const buttonText = button.text || 'Неизвестно';
      const buttonTarget = button.target || button.id;
      code += `    ${buttonTarget}_selected = check_interest_match("${buttonText}", saved_interests)\n`;
      code += `    ${buttonTarget}_text = "✅ ${buttonText}" if ${buttonTarget}_selected else "${buttonText}"\n`;
      code += `    builder.add(InlineKeyboardButton(text=${buttonTarget}_text, callback_data="multi_select_${node.id}_${buttonTarget}"))\n`;
      code += '    \n';
    });
    
    // Добавляем кнопки команд и другие кнопки ПЕРЕД кнопкой "Готово"
    const allButtons = node.data.buttons || [];
    const nonSelectionButtons = allButtons.filter(btn => btn.action !== 'selection');
    
    nonSelectionButtons.forEach(button => {
      if (button.action === 'command') {
        const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
      } else if (button.action === 'url') {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
      }
    });
    
    // Добавляем кнопку "Готово"
    const continueTarget = node.data.continueButtonTarget || 'next';
    const continueText = node.data.continueButtonText || 'Готово';
    code += `    builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
    code += '    builder.adjust(2)  # Используем 2 колонки для консистентности\n';
    code += '    keyboard = builder.as_markup()\n';
    code += '    \n';
  }
  
  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "Привет! Добро пожаловать!";
  const formattedText = formatTextForPython(messageText);
  
  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += '    # Проверяем условные сообщения\n';
    code += '    text = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';
    
    // Generate conditional logic using helper function
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    
    // Add fallback
    code += '    else:\n';
    
    if (node.data.fallbackMessage) {
      const fallbackText = formatTextForPython(node.data.fallbackMessage);
      code += `        text = ${fallbackText}\n`;
      code += '        logging.info("Используется запасное сообщение")\n';
    } else {
      code += `        text = ${formattedText}\n`;
      code += '        logging.info("Используется основное сообщение узла")\n';
    }
    
    code += '    \n';
  } else {
    code += `    text = ${formattedText}\n`;
  }
  
  // Для множественного выбора используем уже созданную клавиатуру
  if (node.data.allowMultipleSelection) {
    code += '    await message.answer(text, reply_markup=keyboard)\n';
    return code;
  }
  
  return code + generateKeyboard(node);
}

function generateCommandHandler(node: Node): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(Command("${command.replace('/', '')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

  // Добавляем логирование для отладки
  code += `    logging.info(f"Команда ${command} вызвана пользователем {message.from_user.id}")\n`;

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Сохраняем информацию о команде в пользовательских данных
  code += '    # Сохраняем пользователя и статистику использования команд\n';
  code += '    user_id = message.from_user.id\n';
  code += '    username = message.from_user.username\n';
  code += '    first_name = message.from_user.first_name\n';
  code += '    last_name = message.from_user.last_name\n';
  code += '    \n';
  code += '    # Сохраняем пользователя в базу данных\n';
  code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
  code += '    \n';
  code += '    # Обновляем статистику команд в БД\n';
  code += `    if saved_to_db:\n`;
  code += `        await update_user_data_in_db(user_id, "command_${command.replace('/', '')}", datetime.now().isoformat())\n`;
  code += '    \n';
  code += '    # Резервное сохранение в локальное хранилище\n';
  code += '    if user_id not in user_data:\n';
  code += '        user_data[user_id] = {}\n';
  code += '    if "commands_used" not in user_data[user_id]:\n';
  code += '        user_data[user_id]["commands_used"] = {}\n';
  code += `    user_data[user_id]["commands_used"]["${command}"] = user_data[user_id]["commands_used"].get("${command}", 0) + 1\n`;

  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки";
  const cleanedMessageText = stripHtmlTags(messageText); // Удаляем HTML теги
  const formattedText = formatTextForPython(cleanedMessageText);
  
  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += '\n    # Проверяем условные сообщения\n';
    code += '    text = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';
    
    // Generate conditional logic using helper function
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    
    // Add fallback
    code += '    else:\n';
    
    if (node.data.fallbackMessage) {
      const cleanedFallbackText = stripHtmlTags(node.data.fallbackMessage);
      const fallbackText = formatTextForPython(cleanedFallbackText);
      code += `        text = ${fallbackText}\n`;
      code += '        logging.info("Используется запасное сообщение")\n';
    } else {
      code += `        text = ${formattedText}\n`;
      code += '        logging.info("Используется основное сообщение узла")\n';
    }
    
    code += '    \n';
  } else {
    code += `\n    text = ${formattedText}\n`;
    
    // Добавляем замену переменных для обычных команд
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
  }
  
  return code + generateKeyboard(node);
}

// generateMessageHandler removed - message nodes are handled via callback handlers only

function generatePhotoHandler(node: Node): string {
  let code = `\n# Обработчик фото для узла ${node.id}\n`;
  
  // Если у узла есть команда, добавляем её как триггер
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `photo_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    // Добавляем логирование
    code += `    logging.info(f"Команда фото ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    // Добавляем проверки безопасности
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const imageUrl = node.data.imageUrl || "https://via.placeholder.com/400x300?text=Photo";
    const caption = node.data.messageText || "📸 Фото";
    
    const formattedCaption = formatTextForPython(caption);
    code += `    caption = ${formattedCaption}\n`;
    
    // Добавляем замену переменных в подписи к фото
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
    code += '    # Обновляем caption с заменёнными переменными\n';
    code += '    caption = text\n';
    code += '    \n';
    
    code += `    photo_url = "${imageUrl}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(photo_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(photo_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                photo_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            photo_file = photo_url\n';
    code += '        \n';
    
    // Обрабатываем клавиатуру для фото
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Используем универсальную функцию для создания inline клавиатуры
      code += generateInlineKeyboardCode(node.data.buttons, '        ', node.id, node.data);
      code += '        # Отправляем фото с подписью и inline кнопками\n';
      code += '        await message.answer_photo(photo_file, caption=caption, reply_markup=keyboard)\n';
    } else if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      code += '        # Создаем reply клавиатуру\n';
      code += '        builder = ReplyKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "contact" && button.requestContact) {
          code += `        builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
        } else if (button.action === "location" && button.requestLocation) {
          code += `        builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
        } else {
          code += `        builder.add(KeyboardButton(text="${button.text}"))\n`;
        }
      });
      const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
      const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
      code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
      code += '        # Отправляем фото с подписью и reply клавиатурой\n';
      code += '        await message.answer_photo(photo_file, caption=caption, reply_markup=keyboard)\n';
    } else {
      code += '        # Отправляем фото только с подписью\n';
      code += '        await message.answer_photo(photo_file, caption=caption)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки фото: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить фото\\n{caption}")\n';
  }
  
  return code;
}

function generateVideoHandler(node: Node): string {
  let code = `\n# Обработчик видео для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `video_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда видео ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const videoUrl = node.data.videoUrl || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4";
    const caption = node.data.mediaCaption || node.data.messageText || "🎥 Видео";
    const duration = node.data.duration || 0;
    const fileSize = node.data.fileSize || 0;
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    video_url = "${videoUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (fileSize > 0) code += `    file_size = ${fileSize * 1024 * 1024}\n`;  // Convert MB to bytes
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(video_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(video_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                video_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            video_file = video_url\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Используем универсальную функцию для создания inline клавиатуры
      code += generateInlineKeyboardCode(node.data.buttons, '        ', node.id, node.data);
      code += '        await message.answer_video(\n';
      code += '            video_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      code += ',\n            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_video(\n';
      code += '            video_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      code += '\n        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки видео: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить видео\\n{caption}")\n';
  }
  
  return code;
}

function generateAudioHandler(node: Node): string {
  let code = `\n# Обработчик аудио для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `audio_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда аудио ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const audioUrl = node.data.audioUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const caption = node.data.mediaCaption || node.data.messageText || "🎵 Аудио";
    const duration = node.data.duration || 0;
    const performer = node.data.performer || "";
    const title = node.data.title || "";
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    audio_url = "${audioUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (performer) code += `    performer = "${performer}"\n`;
    if (title) code += `    title = "${title}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(audio_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(audio_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                audio_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            audio_file = audio_url\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_audio(\n';
      code += '            audio_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      if (performer) code += ',\n            performer=performer';
      if (title) code += ',\n            title=title';
      code += ',\n            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_audio(\n';
      code += '            audio_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      if (performer) code += ',\n            performer=performer';
      if (title) code += ',\n            title=title';
      code += '\n        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки аудио: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить аудио\\n{caption}")\n';
  }
  
  return code;
}

function generateDocumentHandler(node: Node): string {
  let code = `\n# Обработчик документа для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `document_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда документа ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const documentUrl = node.data.documentUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    const documentName = node.data.documentName || "document.pdf";
    const caption = node.data.mediaCaption || node.data.messageText || "📄 Документ";
    const fileSize = node.data.fileSize || 0;
    const mimeType = node.data.mimeType || "";
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    document_url = "${documentUrl}"\n`;
    code += `    document_name = "${documentName}"\n`;
    if (fileSize > 0) code += `    file_size = ${fileSize * 1024 * 1024}\n`;  // Convert MB to bytes
    if (mimeType) code += `    mime_type = "${mimeType}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(document_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(document_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                document_file = FSInputFile(file_path, filename=document_name)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            document_file = URLInputFile(document_url, filename=document_name)\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_document(\n';
      code += '            document_file,\n';
      code += '            caption=caption,\n';
      code += '            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_document(\n';
      code += '            document_file,\n';
      code += '            caption=caption\n';
      code += '        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки документа: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить документ\\n{caption}")\n';
  }
  
  return code;
}

function generateStickerHandler(node: Node): string {
  let code = `\n# Обработчик стикера для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `sticker_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда стикера ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const stickerUrl = node.data.stickerUrl || node.data.stickerFileId || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
    
    code += '    try:\n';
    code += '        # Отправляем стикер\n';
    
    if (node.data.stickerFileId) {
      code += `        sticker_file_id = "${node.data.stickerFileId}"\n`;
      code += '        await message.answer_sticker(sticker_file_id)\n';
    } else {
      code += `        sticker_url = "${stickerUrl}"\n`;
      code += '        await message.answer_sticker(sticker_url)\n';
    }
    
    // Добавляем кнопки после стикера если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после стикера\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить стикер")\n';
  }
  
  return code;
}

function generateVoiceHandler(node: Node): string {
  let code = `\n# Обработчик голосового сообщения для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `voice_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда голосового сообщения ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const voiceUrl = node.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const duration = node.data.duration || 10;
    
    code += `    voice_url = "${voiceUrl}"\n`;
    code += `    duration = ${duration}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем голосовое сообщение\n';
    code += '        await message.answer_voice(voice_url, duration=duration)\n';
    
    // Добавляем кнопки после голосового сообщения если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после голосового сообщения\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить голосовое сообщение")\n';
  }
  
  return code;
}

function generateAnimationHandler(node: Node): string {
  let code = `\n# Обработчик GIF анимации для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `animation_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда анимации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const animationUrl = node.data.animationUrl || "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif";
    const caption = node.data.mediaCaption || node.data.messageText || "🎬 GIF анимация";
    const duration = node.data.duration || 0;
    const width = node.data.width || 0;
    const height = node.data.height || 0;
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    animation_url = "${animationUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (width > 0) code += `    width = ${width}\n`;
    if (height > 0) code += `    height = ${height}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем GIF анимацию\n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_animation(animation_url, caption=caption, reply_markup=keyboard';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    } else {
      code += '        await message.answer_animation(animation_url, caption=caption';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить анимацию\\n{caption}")\n';
  }
  
  return code;
}

function generateLocationHandler(node: Node): string {
  let code = `\n# Обработчик геолокации для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `location_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда геолокации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    // Получаем координаты из различных источников
    let latitude = node.data.latitude || 55.7558;
    let longitude = node.data.longitude || 37.6176;
    const title = node.data.title || "Местоположение";
    const address = node.data.address || "";
    const city = node.data.city || "";
    const country = node.data.country || "";
    const foursquareId = node.data.foursquareId || "";
    const foursquareType = node.data.foursquareType || "";
    const mapService = node.data.mapService || 'custom';
    const generateMapPreview = node.data.generateMapPreview !== false;

    code += '    # Определяем координаты на основе выбранного сервиса карт\n';
    
    if (mapService === 'yandex' && node.data.yandexMapUrl) {
      code += `    yandex_url = "${node.data.yandexMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else if (mapService === 'google' && node.data.googleMapUrl) {
      code += `    google_url = "${node.data.googleMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else if (mapService === '2gis' && node.data.gisMapUrl) {
      code += `    gis_url = "${node.data.gisMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else {
      code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
    }
    
    if (title) code += `    title = "${title}"\n`;
    if (address) code += `    address = "${address}"\n`;
    if (city) code += `    city = "${city}"\n`;
    if (country) code += `    country = "${country}"\n`;
    if (foursquareId) code += `    foursquare_id = "${foursquareId}"\n`;
    if (foursquareType) code += `    foursquare_type = "${foursquareType}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем геолокацию\n';
    
    if (title || address) {
      code += '        await message.answer_venue(\n';
      code += '            latitude=latitude,\n';
      code += '            longitude=longitude,\n';
      code += '            title=title,\n';
      code += '            address=address';
      if (foursquareId) code += ',\n            foursquare_id=foursquare_id';
      if (foursquareType) code += ',\n            foursquare_type=foursquare_type';
      code += '\n        )\n';
    } else {
      code += '        await message.answer_location(latitude=latitude, longitude=longitude)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось отправить геолокацию")\n';
    
    // Генерируем кнопки для картографических сервисов если включено
    if (generateMapPreview) {
      code += '        \n';
      code += '        # Генерируем ссылки на картографические сервисы\n';
      code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
      code += '        \n';
      code += '        # Создаем кнопки для различных карт\n';
      code += '        map_builder = InlineKeyboardBuilder()\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
      
      if (node.data.showDirections) {
        code += '        # Добавляем кнопки для построения маршрута\n';
        code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
        code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
      }
      
      code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
      code += '        map_keyboard = map_builder.as_markup()\n';
      code += '        \n';
      code += '        await message.answer(\n';
      if (node.data.showDirections) {
        code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
      } else {
        code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
      }
      code += '            reply_markup=map_keyboard\n';
      code += '        )\n';
    }
    
    // Добавляем дополнительные кнопки после геолокации если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем дополнительные кнопки\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить геолокацию")\n';
  }
  
  return code;
}

function generateContactHandler(node: Node): string {
  let code = `\n# Обработчик контакта для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `contact_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда контакта ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const phoneNumber = node.data.phoneNumber || "+7 (999) 123-45-67";
    const firstName = node.data.firstName || "Имя";
    const lastName = node.data.lastName || "";
    const userId = node.data.userId || 0;
    const vcard = node.data.vcard || "";
    
    code += `    phone_number = "${phoneNumber}"\n`;
    code += `    first_name = "${firstName}"\n`;
    if (lastName) code += `    last_name = "${lastName}"\n`;
    if (userId > 0) code += `    user_id = ${userId}\n`;
    if (vcard) code += `    vcard = "${vcard}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем контакт\n';
    code += '        await message.answer_contact(\n';
    code += '            phone_number=phone_number,\n';
    code += '            first_name=first_name';
    if (lastName) code += ',\n            last_name=last_name';
    if (userId > 0) code += ',\n            user_id=user_id';
    if (vcard) code += ',\n            vcard=vcard';
    code += '\n        )\n';
    
    // Добавляем кнопки после контакта если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после контакта\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить контакт")\n';
  }
  
  return code;
}

// Функции-генераторы для управления контентом
function generatePinMessageHandler(node: Node): string {
  let code = `\n# Pin Message Handler\n`;
  const synonyms = node.data.synonyms || ['закрепить', 'прикрепить', 'зафиксировать'];
  const disableNotification = node.data.disableNotification || false;
  const targetGroupId = node.data.targetGroupId;
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Создаем универсальный обработчик, который работает в любых группах
  synonyms.forEach((synonym, index) => {
    const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
    
    // Условие: проверяем синоним и что сообщение пришло из группы
    let condition = `lambda message: message.text and message.text.lower().startswith("${synonym.toLowerCase()}") and message.chat.type in ['group', 'supergroup']`;
    
    // Если указана конкретная группа, добавляем проверку ID группы
    if (targetGroupId) {
      condition += ` and str(message.chat.id) == "${targetGroupId}"`;
    }
    
    code += `\n@dp.message(${condition})\n`;
    code += `async def pin_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик для закрепления сообщения по команде '${synonym}'\n`;
    if (targetGroupId) {
      code += `    Работает только в группе ${targetGroupId}\n`;
    } else {
      code += `    Работает в любых группах где бот имеет права администратора\n`;
    }
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} в группе {chat_id}")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения в группе {chat_id}")\n`;
    code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
    code += `            return\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Закрепляем сообщение в текущей группе\n`;
    code += `        await bot.pin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id,\n`;
    code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer("✅ Сообщение закреплено")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для закрепления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка закрепления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при закреплении: {e}")\n`;
    code += `\n`;
  });
  
  return code;
}

function generateUnpinMessageHandler(node: Node): string {
  let code = `\n# Unpin Message Handler\n`;
  const synonyms = node.data.synonyms || ['открепить', 'отцепить', 'убрать закрепление'];
  const targetGroupId = node.data.targetGroupId;
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Создаем универсальный обработчик, который работает в любых группах
  synonyms.forEach((synonym, index) => {
    const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
    
    // Условие: проверяем синоним и что сообщение пришло из группы
    let condition = `lambda message: message.text and message.text.lower().startswith("${synonym.toLowerCase()}") and message.chat.type in ['group', 'supergroup']`;
    
    // Если указана конкретная группа, добавляем проверку ID группы
    if (targetGroupId) {
      condition += ` and str(message.chat.id) == "${targetGroupId}"`;
    }
    
    code += `\n@dp.message(${condition})\n`;
    code += `async def unpin_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик для открепления сообщения по команде '${synonym}'\n`;
    if (targetGroupId) {
      code += `    Работает только в группе ${targetGroupId}\n`;
    } else {
      code += `    Работает в любых группах где бот имеет права администратора\n`;
    }
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для открепления в группе {chat_id}")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для открепления в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения - открепим все в группе {chat_id}")\n`;
    code += `            # Если нет конкретного сообщения, открепляем все\n`;
    code += `            target_message_id = None\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Открепляем сообщение в текущей группе\n`;
    code += `        if target_message_id:\n`;
    code += `            await bot.unpin_chat_message(\n`;
    code += `                chat_id=chat_id,\n`;
    code += `                message_id=target_message_id\n`;
    code += `            )\n`;
    code += `            await message.answer("✅ Сообщение откреплено")\n`;
    code += `            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            await bot.unpin_all_chat_messages(chat_id=chat_id)\n`;
    code += `            await message.answer("✅ Все сообщения откреплены")\n`;
    code += `            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to unpin not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для открепления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка открепления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при откреплении: {e}")\n`;
    code += `\n`;
  });
  
  return code;
}

function generateDeleteMessageHandler(node: Node): string {
  let code = `\n# Delete Message Handler\n`;
  const synonyms = node.data.synonyms || ['удалить', 'стереть', 'убрать сообщение'];
  const targetGroupId = node.data.targetGroupId;
  const messageText = node.data.messageText || "🗑️ Сообщение успешно удалено!";
  
  // Если указан конкретный ID группы, генерируем обработчик для этой группы
  if (targetGroupId) {
    const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    
    synonyms.forEach((synonym, index) => {
      const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
      code += `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
      code += `async def delete_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
      code += `    """\n`;
      code += `    Обработчик для удаления сообщения по команде '${synonym}'\n`;
      code += `    Работает в группе ${targetGroupId}\n`;
      code += `    """\n`;
      code += `    user_id = message.from_user.id\n`;
      code += `    chat_id = ${targetGroupId}\n`;
      code += `    \n`;
      code += `    # Определяем целевое сообщение\n`;
      code += `    target_message_id = None\n`;
      code += `    \n`;
      code += `    if message.reply_to_message:\n`;
      code += `        # Если есть ответ на сообщение - используем его\n`;
      code += `        target_message_id = message.reply_to_message.message_id\n`;
      code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления")\n`;
      code += `    else:\n`;
      code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
      code += `        text_parts = message.text.split()\n`;
      code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
      code += `            target_message_id = int(text_parts[1])\n`;
      code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления")\n`;
      code += `        else:\n`;
      code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения")\n`;
      code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
      code += `            return\n`;
      code += `    \n`;
      code += `    try:\n`;
      code += `        # Удаляем сообщение в указанной группе\n`;
      code += `        await bot.delete_message(\n`;
      code += `            chat_id=chat_id,\n`;
      code += `            message_id=target_message_id\n`;
      code += `        )\n`;
      code += `        await message.answer("${messageText}")\n`;
      code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id}")\n`;
      code += `    except TelegramBadRequest as e:\n`;
      code += `        if "message to delete not found" in str(e) or "message not found" in str(e):\n`;
      code += `            await message.answer("❌ Сообщение не найдено")\n`;
      code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
      code += `            await message.answer("❌ Недостаточно прав для удаления сообщения")\n`;
      code += `        else:\n`;
      code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
      code += `        logging.error(f"Ошибка удаления сообщения: {e}")\n`;
      code += `    except Exception as e:\n`;
      code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
      code += `        logging.error(f"Неожиданная ошибка при удалении: {e}")\n`;
      code += `\n`;
    });
  } else {
    // Если группа не указана, создаем общий обработчик для всех групп
    code += `# Обработчик для удаления сообщения используя синонимы: ${synonyms.join(', ')}\n`;
    code += `# Поддерживает ответ на сообщение для автоматического определения target message ID\n`;
    code += `# Работает в любых группах где бот имеет права администратора\n`;
    
    const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Генерируем обработчик команды
    code += `\n@dp.message(Command("delete_message"))\n`;
    code += `async def delete_message_${sanitizedNodeId}_command_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик команды /delete_message\n`;
    code += `    Работает в любых группах где бот имеет права администратора\n`;
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id\n`;
    code += `    \n`;
    code += `    # Проверяем, что это группа\n`;
    code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
    code += `        await message.answer("❌ Команда работает только в группах")\n`;
    code += `        return\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получена команда удаления без ID сообщения")\n`;
    code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '/delete_message ID_сообщения'")\n`;
    code += `            return\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Удаляем сообщение\n`;
    code += `        await bot.delete_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to delete not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для удаления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка удаления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при удалении: {e}")\n`;
    code += `\n`;
    
    // Генерируем обработчики для синонимов
    synonyms.forEach((synonym, index) => {
      const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
      code += `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} ")) and message.chat.type in ['group', 'supergroup'])\n`;
      code += `async def delete_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
      code += `    """\n`;
      code += `    Обработчик синонима '${synonym}' для удаления сообщения\n`;
      code += `    Работает в группах с ответом на сообщение или с указанием ID\n`;
      code += `    """\n`;
      code += `    user_id = message.from_user.id\n`;
      code += `    chat_id = message.chat.id\n`;
      code += `    \n`;
      code += `    # Определяем целевое сообщение\n`;
      code += `    target_message_id = None\n`;
      code += `    \n`;
      code += `    if message.reply_to_message:\n`;
      code += `        # Если есть ответ на сообщение - используем его\n`;
      code += `        target_message_id = message.reply_to_message.message_id\n`;
      code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления через синоним '${synonym}'")\n`;
      code += `    else:\n`;
      code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
      code += `        text_parts = message.text.split()\n`;
      code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
      code += `            target_message_id = int(text_parts[1])\n`;
      code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления через синоним '${synonym}'")\n`;
      code += `        else:\n`;
      code += `            logging.info(f"DEBUG: Получен синоним '${synonym}' без ID сообщения")\n`;
      code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
      code += `            return\n`;
      code += `    \n`;
      code += `    try:\n`;
      code += `        # Удаляем сообщение\n`;
      code += `        await bot.delete_message(\n`;
      code += `            chat_id=chat_id,\n`;
      code += `            message_id=target_message_id\n`;
      code += `        )\n`;
      code += `        await message.answer("${messageText}")\n`;
      code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id} через синоним '${synonym}'")\n`;
      code += `    except TelegramBadRequest as e:\n`;
      code += `        if "message to delete not found" in str(e) or "message not found" in str(e):\n`;
      code += `            await message.answer("❌ Сообщение не найдено")\n`;
      code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
      code += `            await message.answer("❌ Недостаточно прав для удаления сообщения")\n`;
      code += `        else:\n`;
      code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
      code += `        logging.error(f"Ошибка удаления сообщения через синоним '${synonym}': {e}")\n`;
      code += `    except Exception as e:\n`;
      code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
      code += `        logging.error(f"Неожиданная ошибка при удалении через синоним '${synonym}': {e}")\n`;
      code += `\n`;
    });
  }
  
  return code;
}

function generateContentManagementSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const messageText = node.data.messageText || (
    node.type === 'pin_message' ? "✅ Сообщение закреплено" :
    node.type === 'unpin_message' ? "✅ Сообщение откреплено" :
    node.type === 'delete_message' ? "🗑️ Сообщение успешно удалено!" :
    "✅ Действие выполнено"
  );
  
  let code = `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} ")) and message.chat.type in ['group', 'supergroup'])\n`;
  code += `async def ${node.type}_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик синонима '${synonym}' для ${node.type}\n`;
  code += `    Работает в группах с ответом на сообщение или с указанием ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевое сообщение\n`;
  code += `    target_message_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        # Если есть ответ на сообщение - используем его\n`;
  code += `        target_message_id = message.reply_to_message.message_id\n`;
  code += `        logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для сообщения {target_message_id} (через ответ)")\n`;
  code += `    else:\n`;
  code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_message_id = int(text_parts[1])\n`;
  code += `            logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для сообщения {target_message_id} (через ID)")\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    \n`;
  code += `    try:\n`;
  
  if (node.type === 'pin_message') {
    const disableNotification = node.data.disableNotification || false;
    code += `        # Закрепляем сообщение\n`;
    code += `        await bot.pin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id,\n`;
    code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id}")\n`;
  } else if (node.type === 'unpin_message') {
    code += `        # Открепляем сообщение\n`;
    code += `        await bot.unpin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id}")\n`;
  } else if (node.type === 'delete_message') {
    code += `        # Удаляем сообщение\n`;
    code += `        await bot.delete_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id}")\n`;
  }
  
  code += `    \n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для выполнения операции")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка ${node.type}: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка в {node.type}: {e}")\n`;
  code += `\n`;
  
  return code;
}

// Функции для управления пользователями

function generateBanUserHandler(node: Node): string {
  let code = `\n# Ban User Handler\n`;
  const reason = node.data.reason || 'Нарушение правил группы';
  const untilDate = node.data.untilDate || 0;
  const synonyms = node.data.synonyms || ['забанить', 'бан', 'заблокировать'];
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /ban_user
  code += `@dp.message(Command("ban_user"))\n`;
  code += `async def ban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /ban_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для блокировки")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Баним пользователя\n`;
  if (untilDate && untilDate > 0) {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    code += `            until_date=${untilDate}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до {untilDate}\\nПричина: ${reason}")\n`;
  } else {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
  }
  code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для блокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка блокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при блокировке: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие для работы в любых группах (синонимы)
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}]) and message.chat.type in ['group', 'supergroup']`;
  
  code += `@dp.message(${condition})\n`;
  code += `async def ban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для блокировки пользователя\n`;
  code += `    Синонимы: ${synonymsList.join(', ')}\n`;
  code += `    Работает в любых группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
    // Автоматическое определение пользователя из упоминаний
    code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
    code += `        if message.entities:\n`;
    code += `            for entity in message.entities:\n`;
    code += `                if entity.type == "text_mention":\n`;
    code += `                    target_user_id = entity.user.id\n`;
    code += `                    break\n`;
    code += `        if not target_user_id:\n`;
    code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
    code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для блокировки")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Баним пользователя\n`;
  if (untilDate && untilDate > 0) {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    code += `            until_date=${untilDate}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до {untilDate}\\nПричина: ${reason}")\n`;
  } else {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
  }
  code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для блокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка блокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при блокировке: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateUnbanUserHandler(node: Node): string {
  let code = `\n# Unban User Handler\n`;
  const synonyms = node.data.synonyms || ['разбанить', 'разблокировать', 'unban'];
  const targetGroupId = node.data.targetGroupId || '';
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /unban_user
  code += `@dp.message(Command("unban_user"))\n`;
  code += `async def unban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /unban_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    # Проверяем, есть ли ответ на сообщение\n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Определен пользователь для разбана из reply: {target_user_id}")\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для разблокировки")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Разбаниваем пользователя\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для разблокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка разблокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при разблокировке: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие для работы в любых группах (синонимы)
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}]) and message.chat.type in ['group', 'supergroup']`;
  
  code += `@dp.message(${condition})\n`;
  code += `async def unban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для разблокировки пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  // Автоматическое определение пользователя из контекста
  code += `    # Проверяем, есть ли ответ на сообщение\n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Определен пользователь для разбана из reply: {target_user_id}")\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для разблокировки")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Разбаниваем пользователя\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для разблокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка разблокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при разблокировке: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateMuteUserHandler(node: Node): string {
  let code = `\n# Mute User Handler\n`;
  const duration = node.data.duration || 3600;
  const reason = node.data.reason || 'Нарушение правил группы';
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || 'замутить, мут, заткнуть';
  
  // Permissions для мута
  const canSendMessages = node.data.canSendMessages || false;
  const canSendMediaMessages = node.data.canSendMediaMessages || false;
  const canSendPolls = node.data.canSendPolls || false;
  const canSendOtherMessages = node.data.canSendOtherMessages || false;
  const canAddWebPagePreviews = node.data.canAddWebPagePreviews || false;
  const canChangeGroupInfo = node.data.canChangeGroupInfo || false;
  const canInviteUsers2 = node.data.canInviteUsers2 || false;
  const canPinMessages2 = node.data.canPinMessages2 || false;
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /mute_user
  code += `@dp.message(Command("mute_user"))\n`;
  code += `async def mute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    \"\"\"\n`;
  code += `    Обработчик команды /mute_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    \"\"\"\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer(\"❌ Команда работает только в группах\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == \"text_mention\":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer(\"❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия\")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer(\"❌ Не удалось определить пользователя для ограничения\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Вычисляем время окончания мута\n`;
  code += `        from datetime import datetime, timedelta\n`;
  code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
  code += `        \n`;
  code += `        # Ограничиваем пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
  code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'},\n`;
  code += `                can_send_polls=${canSendPolls ? 'True' : 'False'},\n`;
  code += `                can_send_other_messages=${canSendOtherMessages ? 'True' : 'False'},\n`;
  code += `                can_add_web_page_previews=${canAddWebPagePreviews ? 'True' : 'False'},\n`;
  code += `                can_change_info=${canChangeGroupInfo ? 'True' : 'False'},\n`;
  code += `                can_invite_users=${canInviteUsers2 ? 'True' : 'False'},\n`;
  code += `                can_pin_messages=${canPinMessages2 ? 'True' : 'False'}\n`;
  code += `            ),\n`;
  code += `            until_date=until_date\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        hours = ${duration} // 3600\n`;
  code += `        minutes = (${duration} % 3600) // 60\n`;
  code += `        time_str = f\"{hours}ч {minutes}м\" if hours > 0 else f\"{minutes}м\"\n`;
  code += `        \n`;
  code += `        await message.answer(f\"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}\")\n`;
  code += `        logging.info(f\"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на ${duration} секунд\")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if \"not enough rights\" in str(e) or \"CHAT_ADMIN_REQUIRED\" in str(e):\n`;
  code += `            await message.answer(\"❌ Недостаточно прав для ограничения пользователя\")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f\"❌ Ошибка: {e}\")\n`;
  code += `        logging.error(f\"Ошибка ограничения пользователя: {e}\")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(\"❌ Произошла неожиданная ошибка\")\n`;
  code += `        logging.error(f\"Неожиданная ошибка при ограничении: {e}\")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def mute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для ограничения пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для ограничения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Вычисляем время окончания мута\n`;
  code += `        from datetime import datetime, timedelta\n`;
  code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
  code += `        \n`;
  code += `        # Ограничиваем пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
  code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'},\n`;
  code += `                can_send_polls=${canSendPolls ? 'True' : 'False'},\n`;
  code += `                can_send_other_messages=${canSendOtherMessages ? 'True' : 'False'},\n`;
  code += `                can_add_web_page_previews=${canAddWebPagePreviews ? 'True' : 'False'},\n`;
  code += `                can_change_info=${canChangeGroupInfo ? 'True' : 'False'},\n`;
  code += `                can_invite_users=${canInviteUsers2 ? 'True' : 'False'},\n`;
  code += `                can_pin_messages=${canPinMessages2 ? 'True' : 'False'}\n`;
  code += `            ),\n`;
  code += `            until_date=until_date\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        hours = ${duration} // 3600\n`;
  code += `        minutes = (${duration} % 3600) // 60\n`;
  code += `        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на ${duration} секунд")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для ограничения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка ограничения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при ограничении: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateUnmuteUserHandler(node: Node): string {
  let code = `\n# Unmute User Handler\n`;
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || 'размутить, размут, освободить';
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /unmute_user
  code += `@dp.message(Command("unmute_user"))\n`;
  code += `async def unmute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    \"\"\"\n`;
  code += `    Обработчик команды /unmute_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    \"\"\"\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer(\"❌ Команда работает только в группах\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == \"text_mention\":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer(\"❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия\")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer(\"❌ Не удалось определить пользователя для снятия ограничений\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем ограничения с пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=True,\n`;
  code += `                can_send_media_messages=True,\n`;
  code += `                can_send_polls=True,\n`;
  code += `                can_send_other_messages=True,\n`;
  code += `                can_add_web_page_previews=True,\n`;
  code += `                can_change_info=False,\n`;
  code += `                can_invite_users=False,\n`;
  code += `                can_pin_messages=False\n`;
  code += `            )\n`;
  code += `        )\n`;
  code += `        await message.answer(f\"✅ Ограничения с пользователя {target_user_id} сняты\")\n`;
  code += `        logging.info(f\"Ограничения с пользователя {target_user_id} сняты администратором {user_id} в группе {chat_id}\")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if \"not enough rights\" in str(e) or \"CHAT_ADMIN_REQUIRED\" in str(e):\n`;
  code += `            await message.answer(\"❌ Недостаточно прав для снятия ограничений\")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f\"❌ Ошибка: {e}\")\n`;
  code += `        logging.error(f\"Ошибка снятия ограничений: {e}\")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(\"❌ Произошла неожиданная ошибка\")\n`;
  code += `        logging.error(f\"Неожиданная ошибка при снятии ограничений: {e}\")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def unmute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для снятия ограничений с пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для снятия ограничений")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем ограничения с пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=True,\n`;
  code += `                can_send_media_messages=True,\n`;
  code += `                can_send_polls=True,\n`;
  code += `                can_send_other_messages=True,\n`;
  code += `                can_add_web_page_previews=True,\n`;
  code += `                can_change_info=False,\n`;
  code += `                can_invite_users=False,\n`;
  code += `                can_pin_messages=False\n`;
  code += `            )\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")\n`;
  code += `        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для снятия ограничений")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка снятия ограничений: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при снятии ограничений: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateKickUserHandler(node: Node): string {
  let code = `\n# Kick User Handler\n`;
  const reason = node.data.reason || 'Нарушение правил группы';
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['кикнуть', 'кик', 'исключить'];
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /kick_user
  code += `@dp.message(Command("kick_user"))\n`;
  code += `async def kick_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /kick_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для исключения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Исключаем пользователя (ban + unban)\n`;
  code += `        await bot.ban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Немедленно разбаниваем, чтобы пользователь мог вернуться\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id} из группы {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для исключения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка исключения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при исключении: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def kick_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для исключения пользователя из группы\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для исключения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Исключаем пользователя из группы (кик)\n`;
  code += `        await bot.ban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            revoke_messages=False  # Не удаляем сообщения пользователя\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Добавляем небольшую задержку для корректной обработки\n`;
  code += `        import asyncio\n`;
  code += `        await asyncio.sleep(0.5)\n`;
  code += `        \n`;
  code += `        # Сразу же разбаниваем, чтобы пользователь мог зайти обратно\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id} из группы {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для исключения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка исключения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при исключении: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generatePromoteUserHandler(node: Node): string {
  let code = `\n# Promote User Handler\n`;

  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['повысить', 'админ', 'назначить'];
  
  // Admin rights
  const canChangeInfo = node.data.canChangeInfo || false;
  const canDeleteMessages = node.data.canDeleteMessages || true;
  const canBanUsers = node.data.canBanUsers || false;
  const canInviteUsers = node.data.canInviteUsers || true;
  const canPinMessages = node.data.canPinMessages || true;
  const canAddAdmins = node.data.canAddAdmins || false;
  const canRestrictMembers = node.data.canRestrictMembers || false;
  const canPromoteMembers = node.data.canPromoteMembers || false;
  const canManageVideoChats = node.data.canManageVideoChats || false;
  const canManageTopics = node.data.canManageTopics || false;
  const isAnonymous = node.data.isAnonymous || false;
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /promote_user
  code += `@dp.message(Command("promote_user"))\n`;
  code += `async def promote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /promote_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для повышения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для повышения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Повышаем пользователя до админа\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=${canChangeInfo ? 'True' : 'False'},\n`;
  code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
  code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
  code += `            can_restrict_members=${canRestrictMembers ? 'True' : 'False'},\n`;
  code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'},\n`;
  code += `            can_promote_members=${canPromoteMembers ? 'True' : 'False'},\n`;
  code += `            can_manage_video_chats=${canManageVideoChats ? 'True' : 'False'},\n`;
  if (canManageTopics) {
    code += `            can_manage_topics=${canManageTopics ? 'True' : 'False'},\n`;
  }
  code += `            is_anonymous=${isAnonymous ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором!")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} назначен администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для назначения администраторов")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка назначения админа: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при назначении админа: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def promote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для назначения пользователя администратором\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для назначения администратором")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Назначаем пользователя администратором\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=${canChangeInfo ? 'True' : 'False'},\n`;
  code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
  code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
  code += `            can_restrict_members=${canRestrictMembers ? 'True' : 'False'},\n`;
  code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'},\n`;
  code += `            can_promote_members=${canPromoteMembers ? 'True' : 'False'},\n`;
  code += `            can_manage_video_chats=${canManageVideoChats ? 'True' : 'False'},\n`;
  if (canManageTopics) {
    code += `            can_manage_topics=${canManageTopics ? 'True' : 'False'},\n`;
  }
  code += `            is_anonymous=${isAnonymous ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Создаем список предоставленных прав\n`;
  code += `        rights = []\n`;
  if (canChangeInfo) code += `        rights.append("изменение информации")\n`;
  if (canDeleteMessages) code += `        rights.append("удаление сообщений")\n`;
  if (canBanUsers) code += `        rights.append("блокировка пользователей")\n`;
  if (canInviteUsers) code += `        rights.append("приглашение пользователей")\n`;
  if (canPinMessages) code += `        rights.append("закрепление сообщений")\n`;
  if (canRestrictMembers) code += `        rights.append("ограничение участников")\n`;
  if (canPromoteMembers) code += `        rights.append("назначение администраторов")\n`;
  if (canManageVideoChats) code += `        rights.append("управление видеочатами")\n`;
  if (canManageTopics) code += `        rights.append("управление темами")\n`;
  
  code += `        rights_text = ", ".join(rights) if rights else "базовые права администратора"\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором\\nПрава: {rights_text}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для назначения администратора")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка назначения администратора: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при назначении администратора: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateDemoteUserHandler(node: Node): string {
  let code = `\n# Demote User Handler\n`;

  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['понизить', 'снять с админки', 'демоут'];
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : synonyms.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /demote_user
  code += `@dp.message(Command("demote_user"))\n`;
  code += `async def demote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /demote_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для понижения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для понижения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Понижаем пользователя - убираем все права админа\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=False,\n`;
  code += `            can_delete_messages=False,\n`;
  code += `            can_invite_users=False,\n`;
  code += `            can_restrict_members=False,\n`;
  code += `            can_pin_messages=False,\n`;
  code += `            can_promote_members=False,\n`;
  code += `            can_manage_video_chats=False,\n`;
  code += `            can_manage_topics=False,\n`;
  code += `            is_anonymous=False\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} снят с должности администратора!")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} понижен администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для понижения администраторов")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка понижения админа: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при понижении админа: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def demote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для снятия прав администратора с пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для снятия прав администратора")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем права администратора\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=False,\n`;
  code += `            can_delete_messages=False,\n`;
  code += `            can_invite_users=False,\n`;
  code += `            can_restrict_members=False,\n`;
  code += `            can_pin_messages=False,\n`;
  code += `            can_promote_members=False,\n`;
  code += `            can_manage_video_chats=False,\n`;
  code += `            can_manage_topics=False,\n`;
  code += `            is_anonymous=False\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")\n`;
  code += `        logging.info(f"Права администратора сняты с пользователя {target_user_id} пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для снятия прав администратора")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка снятия прав администратора: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при снятии прав администратора: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateUserManagementSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} ")) and message.chat.type in ['group', 'supergroup'])\n`;
  code += `async def ${node.type}_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик синонима '${synonym}' для ${node.type}\n`;
  code += `    Работает в группах с ответом на сообщение или с указанием ID пользователя\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        # Если есть ответ на сообщение - используем его\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для пользователя {target_user_id} (через ответ)")\n`;
  code += `    else:\n`;
  code += `        # Если нет ответа, проверяем текст на наличие ID пользователя\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_user_id = int(text_parts[1])\n`;
  code += `            logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для пользователя {target_user_id} (через ID)")\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите '${synonym} ID_пользователя'")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя")\n`;
  code += `        return\n`;
  code += `    \n`;
  // Генерируем код в зависимости от типа узла
  code += `    try:\n`;
  if (node.type === 'ban_user') {
    const reason = node.data.reason || 'Нарушение правил группы';
    const untilDate = node.data.untilDate || 0;
    
    if (untilDate && untilDate > 0) {
      code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id, until_date=${untilDate})\n`;
      code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до ${untilDate}\\nПричина: ${reason}")\n`;
    } else {
      code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
      code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
    }
    code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id}")\n`;
  } else if (node.type === 'unban_user') {
    code += `        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id, only_if_banned=True)\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id}")\n`;
  } else if (node.type === 'kick_user') {
    const reason = node.data.reason || 'Нарушение правил группы';
    code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
    code += `        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id}")\n`;
  } else if (node.type === 'mute_user') {
    const duration = node.data.duration || 3600;
    const reason = node.data.reason || 'Нарушение правил группы';
    const canSendMessages = node.data.canSendMessages || false;
    const canSendMediaMessages = node.data.canSendMediaMessages || false;
    
    code += `        from datetime import datetime, timedelta\n`;
    code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
    code += `        await bot.restrict_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            permissions=types.ChatPermissions(\n`;
    code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
    code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'}\n`;
    code += `            ), until_date=until_date\n`;
    code += `        )\n`;
    code += `        hours = ${duration} // 3600\n`;
    code += `        minutes = (${duration} % 3600) // 60\n`;
    code += `        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id}")\n`;
  } else if (node.type === 'unmute_user') {
    code += `        await bot.restrict_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            permissions=types.ChatPermissions(\n`;
    code += `                can_send_messages=True, can_send_media_messages=True,\n`;
    code += `                can_send_polls=True, can_send_other_messages=True,\n`;
    code += `                can_add_web_page_previews=True\n`;
    code += `            )\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")\n`;
    code += `        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id}")\n`;
  } else if (node.type === 'promote_user') {
    const canDeleteMessages = node.data.canDeleteMessages !== false;
    const canInviteUsers = node.data.canInviteUsers !== false;
    const canPinMessages = node.data.canPinMessages !== false;
    
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
    code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
    code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id}")\n`;
  } else if (node.type === 'demote_user') {
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            can_change_info=False, can_delete_messages=False,\n`;
    code += `            can_invite_users=False, can_restrict_members=False,\n`;
    code += `            can_pin_messages=False, can_promote_members=False\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")\n`;
    code += `        logging.info(f"Права администратора сняты с пользователя {target_user_id} администратором {user_id}")\n`;
  }
  
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для выполнения операции")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка ${node.type}: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка в {node.type}: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
  const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def ${functionName}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для команды ${originalCommand}\n`;
  
  if (node.type === 'start') {
    code += '    await start_handler(message)\n';
  } else {
    code += `    await ${functionName}_handler(message)\n`;
  }
  
  return code;
}

function generateMessageSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def message_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для сообщения ${node.id}\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    logging.info(f"Пользователь {user_id} написал синоним '${synonym}' для узла ${node.id}")\n`;
  code += `    \n`;
  code += `    # Обрабатываем синоним как переход к узлу ${node.id}\n`;
  code += `    # Создаем Mock callback для эмуляции кнопки\n`;
  code += `    class MockCallback:\n`;
  code += `        def __init__(self, data, user, msg):\n`;
  code += `            self.data = data\n`;
  code += `            self.from_user = user\n`;
  code += `            self.message = msg\n`;
  code += `        async def answer(self):\n`;
  code += `            pass  # Mock метод, ничего не делаем\n`;
  code += `        async def edit_text(self, text, **kwargs):\n`;
  code += `            return await self.message.answer(text, **kwargs)\n`;
  code += `    \n`;
  code += `    mock_callback = MockCallback("${node.id}", message.from_user, message)\n`;
  code += `    await handle_callback_${sanitizedNodeId}(mock_callback)\n`;
  
  return code;
}

function generateKeyboard(node: Node): string {
  let code = '';
  
  // Добавляем поддержку условных сообщений для клавиатуры
  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += generateUniversalVariableReplacement('    ');
    code += '    text = replace_variables_in_text(text, user_vars)\n';
    code += '    \n';
    code += '    # Проверка условных сообщений для клавиатуры\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    code += '    \n';
    
    // Use conditional message if available, otherwise use default text
    code += '    # Используем условное сообщение если есть подходящее условие\n';
    code += '    if "text" not in locals():\n';
    code += '        # Используем исходный текст клавиатуры если условие не сработало\n';
    code += '        pass  # text уже установлен выше\n';
    code += '    \n';
    code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
    code += '    use_conditional_keyboard = conditional_keyboard is not None\n';
  }
  
  // Определяем режим форматирования (приоритет у условного сообщения)
  code += '    # Определяем режим форматирования (приоритет у условного сообщения)\n';
  code += '    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n';
  code += '        current_parse_mode = conditional_parse_mode\n';
  code += '    else:\n';
  if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
    code += '        current_parse_mode = ParseMode.MARKDOWN\n';
  } else if (node.data.formatMode === 'html') {
    code += '        current_parse_mode = ParseMode.HTML\n';
  } else {
    code += '        current_parse_mode = None\n';
  }
  
  // Генерируем parseMode строку для использования в коде
  let parseMode = '';
  if (node.data.formatMode === 'markdown' || node.data.markdown === true || node.data.formatMode === 'html') {
    parseMode = ', parse_mode=current_parse_mode';
  } else {
    // Для текстового режима добавляем parse_mode только если он установлен
    parseMode = ', parse_mode=current_parse_mode if current_parse_mode else None';
  }
  
  // Инициализируем use_conditional_keyboard для всех случаев
  if (!node.data.enableConditionalMessages || !node.data.conditionalMessages || node.data.conditionalMessages.length === 0) {
    code += '    # Инициализируем переменную для проверки условной клавиатуры\n';
    code += '    use_conditional_keyboard = False\n';
    code += '    conditional_keyboard = None\n';
  }

  // НОВАЯ ЛОГИКА: Сбор ввода как дополнительная функциональность к обычным кнопкам
  
  // Определяем есть ли обычные кнопки у узла
  const hasRegularButtons = node.data.keyboardType !== "none" && node.data.buttons && node.data.buttons.length > 0;
  
  // Определяем включен ли сбор пользовательского ввода ИЛИ текстовый ввод
  const hasInputCollection = node.data.collectUserInput === true || node.data.enableTextInput === true;
  
  // Добавляем логирование для отладки (используем Python переменные)
  code += `    has_regular_buttons = ${toPythonBoolean(hasRegularButtons)}\n`;
  code += `    has_input_collection = ${toPythonBoolean(hasInputCollection)}\n`;
  code += `    logging.info(f"DEBUG: generateKeyboard для узла ${node.id} - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=${node.data.collectUserInput}, enableTextInput=${node.data.enableTextInput}")\n`;
  
  // CASE 1: Есть обычные кнопки + сбор ввода = обычные кнопки работают + дополнительно сохраняются как ответы
  if (hasRegularButtons && hasInputCollection) {
    // Проверяем, есть ли условная клавиатура
    code += '    \n';
    code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
    code += '    if use_conditional_keyboard:\n';
    code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
    code += '    else:\n';
    
    // Отправляем обычные кнопки как обычно
    if (node.data.keyboardType === "reply") {
      code += '        # Создаем reply клавиатуру (+ дополнительный сбор ответов включен)\n';
      code += '        builder = ReplyKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "contact" && button.requestContact) {
          code += `        builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
        } else if (button.action === "location" && button.requestLocation) {
          code += `        builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
        } else {
          code += `        builder.add(KeyboardButton(text="${button.text}"))\n`;
        }
      });
      
      const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
      const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
      code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
      code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      
    } else if (node.data.keyboardType === "inline") {
      code += '        # Создаем inline клавиатуру (+ дополнительный сбор ответов включен)\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        } else if (button.action === 'command') {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
        }
      });
      
      code += '        builder.adjust(2)  # Используем 2 колонки для консистентности\n';
      code += '        keyboard = builder.as_markup()\n';
      code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
    }
    
    // Дополнительно настраиваем сбор ответов с полной структурой ожидания ввода
    code += '    \n';
    code += '    # Дополнительно: настраиваем полную структуру ожидания ввода для узла с кнопками\n';
    code += '    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n';
    const inputType = node.data.inputType || 'text';
    const inputVariable = node.data.inputVariable || `response_${node.id}`;
    const inputTargetNodeId = node.data.inputTargetNodeId || '';
    code += `    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
    code += `        "type": "${inputType}",\n`;
    code += `        "variable": "${inputVariable}",\n`;
    code += '        "save_to_database": True,\n';
    code += `        "node_id": "${node.id}",\n`;
    code += `        "next_node_id": "${inputTargetNodeId}",\n`;
    code += `        "min_length": ${node.data.minLength || 0},\n`;
    code += `        "max_length": ${node.data.maxLength || 0},\n`;
    code += '        "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
    code += '        "success_message": "✅ Спасибо за ваш ответ!"\n';
    code += '    }\n';
    code += `    logging.info(f"✅ Состояние ожидания настроено для узла с кнопками: ${inputType} ввод для переменной ${inputVariable} (узел ${node.id})")\n`;
    
    return code;
  }
  
  // CASE 2: Только сбор ввода БЕЗ обычных кнопок = специальные кнопки для сбора или текстовый ввод
  else if (!hasRegularButtons && hasInputCollection) {
    
    // Если настроены специальные кнопки ответа
    if (node.data.responseType === 'buttons' && node.data.responseOptions && node.data.responseOptions.length > 0) {
      const buttonType = node.data.inputButtonType || 'inline';
      
      if (buttonType === 'reply') {
        code += '    \n';
        code += '    # Создаем reply клавиатуру для сбора ответов\n';
        code += '    builder = ReplyKeyboardBuilder()\n';
        node.data.responseOptions.forEach(option => {
          code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
        });
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
        code += `    await message.answer(text, reply_markup=keyboard${parseMode})\n`;
        
      } else {
        // inline кнопки для сбора ответов
        code += '    \n';
        code += '    # Создаем inline клавиатуру для сбора ответов\n';
        code += '    builder = InlineKeyboardBuilder()\n';
        node.data.responseOptions.forEach(option => {
          const callbackData = `input_${node.id}_${option.id}`;
          code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="${callbackData}"))\n`;
        });
        
        // Автоматическое распределение колонок
        const columns = calculateOptimalColumns(node.data.responseOptions, node.data);
        code += `    builder.adjust(${columns})\n`;
        code += '    keyboard = builder.as_markup()\n';
        code += `    await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      }
      
    } else {
      // Текстовый ввод
      code += `    await message.answer(text${parseMode})\n`;
    }
    
    // Устанавливаем состояние ожидания ввода
    code += '    \n';
    code += '    # Устанавливаем состояние ожидания ввода с полной структурой\n';
    code += '    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n';
    const inputType = node.data.inputType || 'text';
    const inputVariable = node.data.inputVariable || `response_${node.id}`;
    const inputTargetNodeId = node.data.inputTargetNodeId || '';
    code += `    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
    code += `        "type": "${inputType}",\n`;
    code += `        "variable": "${inputVariable}",\n`;
    code += '        "save_to_database": True,\n';
    code += `        "node_id": "${node.id}",\n`;
    code += `        "next_node_id": "${inputTargetNodeId}",\n`;
    code += `        "min_length": ${node.data.minLength || 0},\n`;
    code += `        "max_length": ${node.data.maxLength || 0},\n`;
    code += '        "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
    code += '        "success_message": "✅ Спасибо за ваш ответ!"\n';
    code += '    }\n';
    code += `    logging.info(f"✅ Состояние ожидания настроено: ${inputType} ввод для переменной ${inputVariable} (узел ${node.id})")\n`;
    
    return code;
  }
  
  // CASE 3: Только обычные кнопки БЕЗ сбора ввода = работает как раньше
  else {
    code += `    # DEBUG: Узел ${node.id} - hasRegularButtons=${toPythonBoolean(hasRegularButtons)}, hasInputCollection=${toPythonBoolean(hasInputCollection)}\n`;
    code += `    logging.info(f"DEBUG: Узел ${node.id} обработка кнопок - keyboardType=${node.data.keyboardType}, buttons=${node.data.buttons ? node.data.buttons.length : 0}")\n`;
    // Проверяем, есть ли условная клавиатура
    code += '    \n';
    code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
    code += '    if use_conditional_keyboard:\n';
    code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
    code += '    else:\n';
    
    if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      // Проверяем, есть ли множественный выбор
      if (node.data.allowMultipleSelection) {
        code += '        # Создаем reply клавиатуру с поддержкой множественного выбора\n';
        code += '        builder = ReplyKeyboardBuilder()\n';
        
        // Разделяем кнопки на опции выбора и обычные кнопки
        const selectionButtons = node.data.buttons.filter(button => button.action === 'selection');
        const regularButtons = node.data.buttons.filter(button => button.action !== 'selection');
        
        // Добавляем кнопки для множественного выбора
        selectionButtons.forEach(button => {
          code += `        builder.add(KeyboardButton(text="${button.text}"))\n`;
        });
        
        // Добавляем обычные кнопки
        regularButtons.forEach(button => {
          if (button.action === "contact" && button.requestContact) {
            code += `        builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
          } else if (button.action === "location" && button.requestLocation) {
            code += `        builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
          } else {
            code += `        builder.add(KeyboardButton(text="${button.text}"))\n`;
          }
        });
        
        // Добавляем кнопку завершения, если есть опции выбора
        if (selectionButtons.length > 0) {
          const continueText = node.data.continueButtonText || 'Готово';
          code += `        builder.add(KeyboardButton(text="${continueText}"))\n`;
        }
        
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
        code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
        
        // Инициализируем состояние множественного выбора
        if (selectionButtons.length > 0) {
          code += '        \n';
          code += '        # Инициализируем состояние множественного выбора\n';
          code += '        user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n';
          code += `        user_data[message.from_user.id]["multi_select_${node.id}"] = []\n`;
          code += `        user_data[message.from_user.id]["multi_select_node"] = "${node.id}"\n`;
          code += `        user_data[message.from_user.id]["multi_select_type"] = "reply"\n`;
        }
      } else {
        // Обычная reply клавиатура
        code += '        builder = ReplyKeyboardBuilder()\n';
        node.data.buttons.forEach(button => {
          if (button.action === "contact" && button.requestContact) {
            code += `        builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
          } else if (button.action === "location" && button.requestLocation) {
            code += `        builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
          } else {
            code += `        builder.add(KeyboardButton(text="${button.text}"))\n`;
          }
        });
        
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
        code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      }
    } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Проверяем, есть ли множественный выбор
      if (node.data.allowMultipleSelection) {
        // Добавляем универсальную функцию замены переменных для доступа к user_vars
        code += generateUniversalVariableReplacement('        ');
        
        // Добавляем логику загрузки ранее выбранных интересов
        const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';
        
        code += '        # Загружаем ранее выбранные интересы из базы данных для восстановления состояния\n';
        code += '        if user_id not in user_data:\n';
        code += '            user_data[user_id] = {}\n';
        code += '        \n';
        code += '        # Получаем сохраненные интересы из базы данных\n';
        code += '        saved_interests = []\n';
        code += '        if user_vars:\n';
        code += '            # Ищем интересы в любой переменной, которая может их содержать\n';
        code += '            for var_name, var_data in user_vars.items():\n';
        code += '                if "интерес" in var_name.lower() or var_name == "interests" or var_name == "' + multiSelectVariable + '":\n';
        code += '                    if isinstance(var_data, dict) and "value" in var_data:\n';
        code += '                        interests_str = var_data["value"]\n';
        code += '                    elif isinstance(var_data, str):\n';
        code += '                        interests_str = var_data\n';
        code += '                    else:\n';
        code += '                        interests_str = str(var_data) if var_data else ""\n';
        code += '                    \n';
        code += '                    if interests_str:\n';
        code += '                        saved_interests = [interest.strip() for interest in interests_str.split(",")]\n';
        code += '                        logging.info(f"Восстановлены интересы из БД: {saved_interests}")\n';
        code += '                        break\n';
        code += '        \n';
        code += '        # Инициализируем состояние множественного выбора с сохраненными интересами\n';
        code += `        user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy()\n`;
        code += `        user_data[user_id]["multi_select_node"] = "${node.id}"\n`;
        code += '        logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")\n';
        code += '        \n';
        
        code += '        # Создаем inline клавиатуру с поддержкой множественного выбора\n';
        code += '        builder = InlineKeyboardBuilder()\n';
        
        // Разделяем кнопки на опции выбора и обычные кнопки
        const selectionButtons = node.data.buttons.filter(button => button.action === 'selection');
        const regularButtons = node.data.buttons.filter(button => button.action !== 'selection');
        
        // Добавляем кнопки для множественного выбора с логикой галочек
        selectionButtons.forEach(button => {
          const buttonValue = button.target || button.id || button.text;
          const safeVarName = buttonValue.toLowerCase().replace(/[^a-z0-9]/g, '_');
          code += `        # Проверяем каждый интерес и добавляем галочку если он выбран\n`;
          code += `        logging.info(f"🔧 /START: Проверяем галочку для кнопки '${button.text}' в списке: {saved_interests}")\n`;
          code += `        ${safeVarName}_selected = "${button.text}" in saved_interests\n`;
          code += `        logging.info(f"🔍 /START: РЕЗУЛЬТАТ для '${button.text}': selected={${safeVarName}_selected}")\n`;
          code += `        ${safeVarName}_text = "✅ ${button.text}" if ${safeVarName}_selected else "${button.text}"\n`;
          code += `        logging.info(f"📱 /START: СОЗДАЕМ КНОПКУ: text='{${safeVarName}_text}'")\n`;
          code += `        builder.add(InlineKeyboardButton(text=${safeVarName}_text, callback_data="multi_select_start_${buttonValue}"))\n`;
        });
        
        // Добавляем обычные кнопки
        regularButtons.forEach(button => {
          if (button.action === "url") {
            code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
          } else if (button.action === 'goto') {
            const callbackData = button.target || button.id || 'no_action';
            code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
          } else if (button.action === 'command') {
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
          }
        });
        code += '        \n';
        
        // Добавляем кнопку завершения, если есть опции выбора
        if (selectionButtons.length > 0) {
          const continueText = node.data.continueButtonText || 'Готово';
          code += `        builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
        }
        
        // Автоматическое распределение колонок
        // Для множественного выбора учитываем все кнопки: селекции + регулярные + "Готово"
        const allButtons = [...selectionButtons, ...regularButtons];
        if (selectionButtons.length > 0) {
          allButtons.push({ text: node.data.continueButtonText || 'Готово' });
        }
        const columns = calculateOptimalColumns(allButtons, node.data);
        code += `        builder.adjust(${columns})\n`;
        code += '        keyboard = builder.as_markup()\n';
        code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
        
        // Состояние множественного выбора уже инициализировано выше с сохраненными значениями
      } else {
        // Обычная inline клавиатура
        code += '        # Создаем inline клавиатуру с кнопками\n';
        code += `        logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${node.id} с ${node.data.buttons ? node.data.buttons.length : 0} кнопками")\n`;
        code += '        builder = InlineKeyboardBuilder()\n';
        node.data.buttons.forEach(button => {
          if (button.action === "url") {
            code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
          } else if (button.action === 'goto') {
            // Если есть target, используем его, иначе используем ID кнопки как callback_data
            const callbackData = button.target || button.id || 'no_action';
            code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
          } else if (button.action === 'command') {
            // Для кнопок команд создаем специальную callback_data
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
          }
        });
        
        // Автоматическое распределение колонок
        const columns = calculateOptimalColumns(node.data.buttons, node.data);
        code += `        builder.adjust(${columns})\n`;
        code += '        keyboard = builder.as_markup()\n';
        code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      }
    } else {
      // Без клавиатуры
      code += `        await message.answer(text${parseMode})\n`;
    }
  }
  
  return code;
}

export function validateBotStructure(botData: BotData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { nodes, connections } = botData;

  // Check if there's a start node
  const startNodes = (nodes || []).filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push("Бот должен содержать хотя бы одну стартовую команду");
  }
  if (startNodes.length > 1) {
    errors.push("Бот может содержать только одну стартовую команду");
  }

  // Validate each node
  nodes.forEach(node => {
    if (!node.data.messageText && node.type !== 'condition') {
      errors.push(`Узел "${node.id}" должен содержать текст сообщения`);
    }

    // Validate commands
    if ((node.type === 'start' || node.type === 'command') && node.data.command) {
      const commandValidation = validateCommand(node.data.command);
      if (!commandValidation.isValid) {
        errors.push(...commandValidation.errors.map(err => `Команда "${node.data.command}": ${err}`));
      }
    }

    // Validate buttons
    node.data.buttons.forEach(button => {
      if (!button.text.trim()) {
        errors.push(`Кнопка в узле "${node.id}" должна содержать текст`);
      }
      if (button.action === 'url' && !button.url) {
        errors.push(`Кнопка "${button.text}" должна содержать URL`);
      }
      if (button.action === 'goto' && !button.target) {
        errors.push(`Кнопка "${button.text}" должна содержать цель перехода`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCommand(command: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!command) {
    errors.push('Команда не может быть пустой');
    return { isValid: false, errors };
  }
  
  if (!command.startsWith('/')) {
    errors.push('Команда должна начинаться с символа "/"');
  }
  
  if (command.length < 2) {
    errors.push('Команда должна содержать хотя бы один символ после "/"');
  }
  
  if (command.length > 32) {
    errors.push('Команда не может быть длиннее 32 символов');
  }
  
  // Проверка на допустимые символы
  const validPattern = /^\/[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!validPattern.test(command)) {
    errors.push('Команда может содержать только латинские буквы, цифры и подчёркивания');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generateRequirementsTxt(): string {
  const lines = [
    '# Telegram Bot Requirements - Updated compatible versions',
    '# Install with: pip install -r requirements.txt',
    '# If you get Rust compilation errors, use: pip install --only-binary=all -r requirements.txt',
    '',
    '# Core dependencies (using newer versions to avoid Rust compilation issues)',
    'aiogram>=3.21.0',
    'aiohttp>=3.12.13',
    'requests>=2.32.4',
    'python-dotenv>=1.0.0',
    'aiofiles>=23.2.1',
    'asyncpg>=0.29.0',
    '',
    '# Note: These versions have pre-compiled wheels and do not require Rust',
    '# If you still encounter issues, try:',
    '# pip install --upgrade pip setuptools wheel',
    '# pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles asyncpg',
    '',
    '# Optional dependencies for extended functionality',
    '# redis>=5.0.1  # For session storage',
    '# motor>=3.3.2  # For MongoDB',
    '# pillow>=10.1.0  # For image processing'
  ];
  return lines.join('\n');
}

export function generateReadme(botData: BotData, botName: string): string {
  const commandNodes = (botData.nodes || []).filter(node => 
    (node.type === 'start' || node.type === 'command') && node.data.command
  );
  
  let readme = '# ' + botName + '\n\n';
  readme += 'Telegram бот, созданный с помощью TelegramBot Builder.\n\n';
  readme += '## Описание\n\n';
  readme += 'Этот бот содержит ' + botData.nodes.length + ' узлов и ' + botData.connections.length + ' соединений.\n\n';
  readme += '### Команды бота\n\n';

  commandNodes.forEach(node => {
    const command = node.data.command || '/unknown';
    const description = node.data.description || 'Описание отсутствует';
    readme += '- `' + command + '` - ' + description + '\n';
    
    if (node.data.adminOnly) {
      readme += '  - 🔒 Только для администраторов\n';
    }
    if (node.data.isPrivateOnly) {
      readme += '  - 👤 Только в приватных чатах\n';
    }
    if (node.data.requiresAuth) {
      readme += '  - 🔐 Требует авторизации\n';
    }
  });

  readme += '\n## Установка\n\n';
  readme += '1. Клонируйте или скачайте файлы проекта\n';
  readme += '2. Установите зависимости:\n';
  readme += '   ```bash\n';
  readme += '   pip install -r requirements.txt\n';
  readme += '   ```\n\n';
  readme += '3. Создайте файл `.env` и добавьте настройки:\n';
  readme += '   ```\n';
  readme += '   BOT_TOKEN=your_bot_token_here\n';
  readme += '   DATABASE_URL=postgresql://user:password@localhost:5432/bot_db\n';
  readme += '   ```\n\n';
  readme += '4. Настройте базу данных PostgreSQL (опционально):\n';
  readme += '   - Создайте базу данных PostgreSQL\n';
  readme += '   - Обновите DATABASE_URL в .env файле\n';
  readme += '   - Бот автоматически создаст необходимые таблицы при запуске\n';
  readme += '   - Если БД недоступна, бот будет использовать локальное хранилище\n\n';
  readme += '5. Запустите бота:\n';
  readme += '   ```bash\n';
  readme += '   python bot.py\n';
  readme += '   ```\n\n';
  
  readme += '## Настройка\n\n';
  readme += '### Получение токена бота\n\n';
  readme += '1. Найдите [@BotFather](https://t.me/BotFather) в Telegram\n';
  readme += '2. Отправьте команду `/newbot`\n';
  readme += '3. Следуйте инструкциям для создания нового бота\n';
  readme += '4. Скопируйте полученный токен\n\n';
  
  readme += '### Настройка команд в @BotFather\n\n';
  readme += '1. Отправьте команду `/setcommands` в @BotFather\n';
  readme += '2. Выберите своего бота\n';
  readme += '3. Скопируйте и отправьте следующие команды:\n\n';
  readme += '```\n';
  readme += generateBotFatherCommands(botData.nodes);
  readme += '\n```\n\n';
  
  readme += '## Структура проекта\n\n';
  readme += '- `bot.py` - Основной файл бота\n';
  readme += '- `requirements.txt` - Зависимости Python\n';
  readme += '- `config.yaml` - Конфигурационный файл\n';
  readme += '- `README.md` - Документация\n';
  readme += '- `Dockerfile` - Для контейнеризации (опционально)\n\n';
  
  readme += '## Функциональность\n\n';
  readme += '### Статистика\n\n';
  readme += '- **Всего узлов**: ' + botData.nodes.length + '\n';
  readme += '- **Команд**: ' + commandNodes.length + '\n';
  readme += '- **Сообщений**: ' + (botData.nodes || []).filter(n => n.type === 'message').length + '\n';
  readme += '- **Фото**: ' + (botData.nodes || []).filter(n => n.type === 'photo').length + '\n';
  readme += '- **Кнопок**: ' + botData.nodes.reduce((sum, node) => sum + node.data.buttons.length, 0) + '\n\n';
  
  readme += '### Безопасность\n\n';
  readme += 'Бот включает следующие функции безопасности:\n';
  readme += '- Проверка администраторских прав\n';
  readme += '- Ограничения на приватные чаты\n';
  readme += '- Система авторизации пользователей\n\n';
  
  readme += '## Разработка\n\n';
  readme += 'Этот бот создан с использованием:\n';
  readme += '- [aiogram 3.x](https://docs.aiogram.dev/) - современная библиотека для Telegram Bot API\n';
  readme += '- Python 3.8+\n';
  readme += '- Асинхронное программирование\n\n';
  
  readme += '## Лицензия\n\n';
  readme += 'Сгенерировано с помощью TelegramBot Builder\n';

  return readme;
}

export function generateDockerfile(): string {
  const lines = [
    '# Dockerfile для Telegram бота',
    'FROM python:3.11-slim',
    '',
    '# Установка системных зависимостей',
    'RUN apt-get update && apt-get install -y \\',
    '    gcc \\',
    '    && rm -rf /var/lib/apt/lists/*',
    '',
    '# Создание рабочей директории',
    'WORKDIR /app',
    '',
    '# Копирование requirements.txt и установка зависимостей',
    'COPY requirements.txt .',
    'RUN pip install --no-cache-dir -r requirements.txt',
    '',
    '# Копирование исходного кода',
    'COPY . .',
    '',
    '# Создание пользователя для безопасности',
    'RUN adduser --disabled-password --gecos \'\' botuser',
    'RUN chown -R botuser:botuser /app',
    'USER botuser',
    '',
    '# Запуск бота',
    'CMD ["python", "bot.py"]'
  ];
  return lines.join('\n');
}

export function generateConfigYaml(botName: string): string {
  const lines = [
    '# Конфигурация бота',
    'bot:',
    '  name: "' + botName + '"',
    '  description: "Telegram бот, созданный с помощью TelegramBot Builder"',
    '',
    '# Настройки логирования',
    'logging:',
    '  level: INFO',
    '  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"',
    '',
    '# Настройки базы данных (опционально)',
    'database:',
    '  # type: sqlite',
    '  # url: "sqlite:///bot.db"',
    '',
    '  # type: postgresql',
    '  # host: localhost',
    '  # port: 5432',
    '  # name: botdb',
    '  # user: botuser',
    '  # password: botpass',
    '',
    '# Настройки Redis (опционально)',
    'redis:',
    '  # host: localhost',
    '  # port: 6379',
    '  # db: 0',
    '  # password: ""',
    '',
    '# Настройки webhook (для продакшена)',
    'webhook:',
    '  # enabled: false',
    '  # host: "0.0.0.0"',
    '  # port: 8080',
    '  # path: "/webhook"',
    '  # url: "https://yourdomain.com/webhook"',
    '',
    '# Настройки администраторов',
    'admins:',
    '  - 123456789  # Замените на реальные Telegram ID администраторов',
    '',
    '# Дополнительные настройки',
    'settings:',
    '  timezone: "UTC"',
    '  language: "ru"',
    '  debug: false'
  ];
  return lines.join('\n');
}

