import { BotData, Node } from '@shared/schema';
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

// Функция для правильного экранирования строк в JSON контексте
function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для вычисления оптимального количества колонок для кнопок
function calculateOptimalColumns(buttons: any[], nodeData?: any): number {
  if (!buttons || buttons.length === 0) return 1;
  
  const totalButtons = buttons.length;
  
  // Если это множественный выбор, всегда используем 2 колонки для консистентности
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
function generateInlineKeyboardCode(buttons: any[], indentLevel: string, nodeId?: string, nodeData?: any): string {
  if (!buttons || buttons.length === 0) return '';
  
  let code = '';
  code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;
  
  buttons.forEach((button, index) => {
    if (button.action === "url") {
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto') {
      const baseCallbackData = button.target || button.id || 'no_action';
      // Для кнопок goto всегда используем target как callback_data без суффиксов
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${baseCallbackData}"))\n`;
    } else if (button.action === 'command') {
      const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
    } else if (button.action === 'selection') {
      const callbackData = nodeId ? `multi_select_${nodeId}_${button.target || button.id}` : `selection_${button.target || button.id}`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
    } else {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
    }
  });
  
  // Автоматическое распределение колонок с учетом данных узла
  const columns = calculateOptimalColumns(buttons, nodeData);
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

export function generatePythonCode(botData: BotData, botName: string = "MyBot"): string {
  const { nodes, connections } = botData;
  
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
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
  code += 'from aiogram.enums import ParseMode\n';
  code += 'from typing import Optional\n';
  code += 'import asyncpg\n';
  code += 'from datetime import datetime, timezone, timedelta\n';
  code += 'import json\n\n';
  
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
    }
    // Note: user-input and message nodes are handled via callback handlers, not as separate command handlers
  });

  // Generate synonym handlers for commands
  const nodesWithSynonyms = (nodes || []).filter(node => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.synonyms && 
    node.data.synonyms.length > 0
  );

  if (nodesWithSynonyms.length > 0) {
    code += '\n# Обработчики синонимов команд\n';
    nodesWithSynonyms.forEach(node => {
      if (node.data.synonyms) {
        node.data.synonyms.forEach((synonym: string) => {
          code += generateSynonymHandler(node, synonym);
        });
      }
    });
  }

  // Generate callback handlers for inline buttons AND input target nodes
  const inlineNodes = nodes.filter(node => 
    node.data.keyboardType === 'inline' && node.data.buttons.length > 0
  );

  // Also collect all target nodes from user input collections
  const inputTargetNodeIds = new Set<string>();
  nodes.forEach(node => {
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
  nodes.forEach(node => {
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
  connections.forEach(connection => {
    if (connection.target) {
      allReferencedNodeIds.add(connection.target);
    }
  });

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
          
          // Find target node (может быть null если нет target)
          const targetNode = button.target ? nodes.find(n => n.id === button.target) : null;
          
          // Mark this button ID as processed
          processedCallbacks.add(callbackData);
          
          // Создаем обработчик для каждой кнопки используя target как callback_data
          const actualCallbackData = button.target || callbackData;
          
          // Mark the target node as processed ONLY if we create a handler for it
          if (button.target) {
            processedCallbacks.add(button.target);
            console.log(`Узел ${button.target} добавлен в processedCallbacks из inline кнопок`);
          }
          
          code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_"))\n`;
          // Создаем безопасное имя функции на основе target или button ID
          const safeFunctionName = actualCallbackData.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          
          // УДАЛЕНО: Старая специальная обработка для кнопок "Изменить выбор" и "Начать заново"
          // Теперь используется новый обработчик команд cmd_start
          if (actualCallbackData === 'start' && (button.text === "✏️ Изменить выбор" || button.text === "🔄 Начать заново")) {
            // Пропускаем - эти кнопки теперь обрабатываются в разделе обработчиков команд
            return code;
          }
          
          // Правильная логика сохранения переменной на основе кнопки
          code += '    user_id = callback_query.from_user.id\n';
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';
          
          // Определяем переменную для сохранения на основе родительского узла
          const parentNode = node; // Используем текущий узел как родительский
          
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
              
              // Проверяем, есть ли у узла inline кнопки (только если нет условной клавиатуры)
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if keyboard is None:\n';
                code += '        # Создаем inline клавиатуру для целевого узла\n';
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
                code += '        builder.adjust(2)  # Используем 2 колонки для консистентности\n';
                code += '        keyboard = builder.as_markup()\n';
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
              const inputSuccessMessage = targetNode.data.inputSuccessMessage || "Спасибо за ваш ответ!";
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
                code += '        "success_message": "Спасибо за ваш ответ!"\n';
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
                    }
                  });
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
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем inline клавиатуру\n';
                  code += '        builder = InlineKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn, index) => {
                    if (btn.action === "url") {
                      code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                    } else if (btn.action === 'goto') {
                      // Если есть target, используем его, иначе используем ID кнопки как callback_data
                      const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                      code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                    }
                  });
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
    
    // CRITICAL FIX: Ensure interests_result gets a handler
    // Remove interests_result from processedCallbacks to force handler creation
    processedCallbacks.delete('interests_result');
    if (!processedCallbacks.has('interests_result')) {
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
        
        // Handle buttons if any
        if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
          code += '    # Create inline keyboard\n';
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
        code += '\n';
      }
    }

    // Now generate callback handlers for all remaining referenced nodes that don't have inline buttons
    allReferencedNodeIds.forEach(nodeId => {
      if (!processedCallbacks.has(nodeId)) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          // ВАЖНО: Не создаваем обработчик для "start", если он уже был создан ранее (избегаем дублирования)
          if (nodeId === 'start') {
            console.log(`Пропускаем создание дублированной функции для узла ${nodeId} - уже создана ранее`);
            return; // Пропускаем создание дублированной функции
          }
          
          processedCallbacks.add(nodeId);
          
          // Create callback handler for this node that can handle multiple buttons
          const safeFunctionName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `\n@dp.callback_query(lambda c: c.data == "${nodeId}" or c.data.startswith("${nodeId}_btn_"))\n`;
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          
          // Обычная обработка узлов без специальной логики
          code += '    user_id = callback_query.from_user.id\n';
          
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
          
          // Handle buttons if any
          if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '    # Create inline keyboard\n';
            code += '    builder = InlineKeyboardBuilder()\n';
            targetNode.data.buttons.forEach((btn, index) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
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
          
          // ИСПРАВЛЕНИЕ: Правильная переадресация к целевому узлу
          // Кнопка должна вести к узлу, указанному в её target
          const shouldRedirect = true;
          const redirectTarget = nodeId; // nodeId - это уже целевой узел кнопки
          
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
                  const messageText = navTargetNode.data.messageText || 'Сообщение';
                  const formattedText = formatTextForPython(messageText);
                  code += `            nav_text = ${formattedText}\n`;
                  code += '            await callback_query.message.edit_text(nav_text)\n';
                  
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
                    code += '                    "success_message": "Спасибо за ваш ответ!"\n';
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
                  } else {
                    // Обычный узел без условных сообщений
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
        }
      }
    });
  }
  
  // Generate handlers for reply keyboard buttons
  const replyNodes = nodes.filter(node => 
    node.data.keyboardType === 'reply' && node.data.buttons.length > 0
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
  const userInputNodes = nodes.filter(node => 
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
        const commandNodes = nodes.filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
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
      code += `                        await handle_callback_${safeFunctionName}(fake_callback)\n`;
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
  const commandNodes = nodes.filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
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
  code += '        if current_node_id in processed_inputs:\n';
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
  code += '            next_node_id = user_data[user_id].get("input_target_node_id")\n';
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
  code += '            # НЕ отправляем сообщение об успехе здесь и НЕ очищаем состояние\n';
  code += '            # Это будет сделано после успешного перехода к следующему узлу\n';
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
          
          code += '                        await message.answer(text)\n';
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
          code += '                            "success_message": "Спасибо за ваш ответ!"\n';
          code += '                        }\n';
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
              }
            });
            
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
        code += '                            "success_message": "Спасибо за ваш ответ!"\n';
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
  const inputNodes = nodes.filter(node => node.data.collectUserInput);
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
            code += `                    "success_message": "Спасибо за ваш ответ!"\n`;
            code += `                }\n`;
            code += `                \n`;
          }
          
          if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += `                builder = InlineKeyboardBuilder()\n`;
            
            // Добавляем логику для умного расположения кнопок
            code += '                # Функция для определения количества колонок на основе текста кнопок\n';
            code += '                def calculate_keyboard_width(buttons_data):\n';
            code += '                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])\n';
            code += '                    if max_text_length <= 6:  # Короткие тексты\n';
            code += '                        return 3  # 3 колонки\n';
            code += '                    elif max_text_length <= 12:  # Средние тексты\n';
            code += '                        return 2  # 2 колонки\n';
            code += '                    else:  # Длинные тексты\n';
            code += '                        return 1  # 1 колонка\n';
            code += '                \n';
            
            // Создаем массив текстов кнопок для расчета
            const targetButtonTexts = targetNode.data.buttons.map(btn => btn.text || 'Кнопка');
            code += `                button_texts = [${targetButtonTexts.map(text => `"${text}"`).join(', ')}]\n`;
            code += '                keyboard_width = calculate_keyboard_width(button_texts)\n';
            code += '                \n';
            
            targetNode.data.buttons.forEach(button => {
              const buttonText = button.text || 'Кнопка';
              const buttonTarget = button.target || button.id;
              code += `                builder.add(InlineKeyboardButton(text="${buttonText}", callback_data="${buttonTarget}"))\n`;
            });
            code += '                builder.adjust(keyboard_width)  # Умное расположение кнопок\n';
            code += `                keyboard = builder.as_markup()\n`;
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
          // Для других типов узлов используем callback
          const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `                # Создаем фиктивный callback_query для навигации\n`;
          code += `                import types as aiogram_types\n`;
          code += `                import asyncio\n`;
          code += `                fake_callback = aiogram_types.SimpleNamespace(\n`;
          code += `                    id="input_nav",\n`;
          code += `                    from_user=message.from_user,\n`;
          code += `                    chat_instance="",\n`;
          code += `                    data="${targetNode.id}",\n`;
          code += `                    message=message,\n`;
          code += `                    answer=lambda text="", show_alert=False: asyncio.sleep(0)\n`;
          code += `                )\n`;
          code += `                await handle_callback_${safeFunctionName}(fake_callback)\n`;
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
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Сохраняем любой текст как дополнительный ответ\n';
  code += '        timestamp = get_moscow_time()\n';
  code += '        \n';
  code += '        response_data = user_text  # Простое значение\n';
  code += '        \n';
  code += '        # Сохраняем в пользовательские данные\n';
  code += '        user_data[user_id][f"{input_variable}_additional"] = response_data\n';
  code += '        \n';
  code += '        # Уведомляем пользователя\n';
  code += '        await message.answer("✅ Дополнительный комментарий сохранен!")\n';
  code += '        \n';
  code += '        logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")\n';
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
  code += '    success_message = input_config.get("success_message", "Спасибо за ваш ответ!")\n';
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
          code += '                builder = InlineKeyboardBuilder()\n';
          
          // Добавляем логику для умного расположения кнопок
          code += '                # Функция для определения количества колонок на основе текста кнопок\n';
          code += '                def calculate_keyboard_width(buttons_data):\n';
          code += '                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])\n';
          code += '                    if max_text_length <= 6:  # Короткие тексты\n';
          code += '                        return 3  # 3 колонки\n';
          code += '                    elif max_text_length <= 12:  # Средние тексты\n';
          code += '                        return 2  # 2 колонки\n';
          code += '                    else:  # Длинные тексты\n';
          code += '                        return 1  # 1 колонка\n';
          code += '                \n';
          
          // Создаем массив текстов кнопок для расчета
          const buttonTexts = targetNode.data.buttons.map(btn => btn.text);
          code += `                button_texts = [${buttonTexts.map(text => `"${text}"`).join(', ')}]\n`;
          code += '                keyboard_width = calculate_keyboard_width(button_texts)\n';
          code += '                \n';
          
          targetNode.data.buttons.forEach(button => {
            if (button.action === "url") {
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
            } else if (button.action === 'goto') {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
            } else if (button.action === 'command') {
              // Для кнопок команд создаем специальную callback_data
              const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
              code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
            }
          });
          code += '                builder.adjust(keyboard_width)  # Умное расположение кнопок\n';
          code += '                keyboard = builder.as_markup()\n';
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
          
          // Добавляем логику для умного расположения кнопок
          code += '                # Функция для определения количества колонок на основе текста кнопок\n';
          code += '                def calculate_keyboard_width(buttons_data):\n';
          code += '                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])\n';
          code += '                    if max_text_length <= 6:  # Короткие тексты\n';
          code += '                        return 3  # 3 колонки\n';
          code += '                    elif max_text_length <= 12:  # Средние тексты\n';
          code += '                        return 2  # 2 колонки\n';
          code += '                    else:  # Длинные тексты\n';
          code += '                        return 1  # 1 колонка\n';
          code += '                \n';
          
          // Создаем массив текстов кнопок для расчета
          const responseButtonTexts = responseOptions.map(option => option.text || option);
          code += `                button_texts = [${responseButtonTexts.map(text => `"${text}"`).join(', ')}]\n`;
          code += '                keyboard_width = calculate_keyboard_width(button_texts)\n';
          code += '                \n';
          
          responseOptions.forEach((option, index) => {
            const optionValue = option.value || option.text;
            code += `                builder.add(InlineKeyboardButton(text="${option.text}", callback_data="response_${targetNode.id}_${index}"))\n`;
          });
          
          if (allowSkip) {
            code += `                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="skip_${targetNode.id}"))\n`;
          }
          
          code += '                builder.adjust(keyboard_width)  # Умное расположение кнопок\n';
          code += '                keyboard = builder.as_markup()\n';
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
          code += '                    "success_message": "Спасибо за ваш ответ!",\n';
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
          code += '                    "success_message": "Спасибо за ваш ответ!",\n';
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

  // Добавляем обработчики для кнопок команд (типа cmd_start)
  const commandButtons = new Set<string>();
  nodes.forEach(node => {
    if (node.data.buttons) {
      node.data.buttons.forEach(button => {
        if (button.action === 'command' && button.target) {
          const commandCallback = `cmd_${button.target.replace('/', '')}`;
          commandButtons.add(commandCallback);
        }
      });
    }
  });
  
  if (commandButtons.size > 0) {
    code += '\n# Обработчики для кнопок команд\n';
    
    commandButtons.forEach(commandCallback => {
      const command = commandCallback.replace('cmd_', '');
      code += `\n@dp.callback_query(lambda c: c.data == "${commandCallback}")\n`;
      code += `async def handle_${commandCallback}(callback_query: types.CallbackQuery):\n`;
      code += '    await callback_query.answer()\n';
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

  // Добавляем функцию profile_handler с поддержкой variableLabel
  code += '\n\n# Обработчик команды профиля с поддержкой variableLabel\n';
  code += '@dp.message(Command("profile"))\n';
  code += 'async def profile_handler(message: types.Message):\n';
  code += '    user_id = message.from_user.id\n';
  code += '    \n';
  code += '    # Получаем данные пользователя из базы данных\n';
  code += '    user_record = await get_user_from_db(user_id)\n';
  code += '    if not user_record:\n';
  code += '        user_record = user_data.get(user_id, {})\n';
  code += '    \n';
  code += '    # Извлекаем пользовательские данные\n';
  code += '    if isinstance(user_record, dict):\n';
  code += '        if "user_data" in user_record:\n';
  code += '            if isinstance(user_record["user_data"], str):\n';
  code += '                try:\n';
  code += '                    import json\n';
  code += '                    user_vars = json.loads(user_record["user_data"])\n';
  code += '                except (json.JSONDecodeError, TypeError):\n';
  code += '                    user_vars = {}\n';
  code += '            elif isinstance(user_record["user_data"], dict):\n';
  code += '                user_vars = user_record["user_data"]\n';
  code += '            else:\n';
  code += '                user_vars = {}\n';
  code += '        else:\n';
  code += '            user_vars = user_record\n';
  code += '    else:\n';
  code += '        user_vars = {}\n';
  code += '    \n';
  code += '    if not user_vars:\n';
  code += '        await message.answer("👤 Профиль недоступен\\n\\nПохоже, вы еще не прошли опрос. Пожалуйста, введите /start чтобы заполнить профиль.")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Формируем сообщение профиля с поддержкой variableLabel\n';
  code += '    profile_text = "👤 Ваш профиль:\\n\\n"\n';
  code += '    \n';
  
  // Отображаем все доступные переменные (удалена поддержка устаревшего типа узла 'input')
  code += '    # Отображаем все доступные переменные\n';
  code += '    for var_name, var_data in user_vars.items():\n';
  code += '        if isinstance(var_data, dict) and "value" in var_data:\n';
  code += '            value = var_data["value"]\n';
  code += '        else:\n';
  code += '            value = var_data\n';
  code += '        profile_text += f"{var_name}: {value}\\n"\n';
  
  code += '    \n';
  code += '    await message.answer(profile_text)\n';
  code += '    logging.info(f"Профиль отображен для пользователя {user_id}")\n';
  code += '\n';

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
  const multiSelectNodes = nodes.filter(node => 
    node.data.allowMultipleSelection && node.data.continueButtonTarget
  );
  
  // Обработчик для inline кнопок множественного выбора
  code += '@dp.callback_query(lambda c: c.data.startswith("multi_select_"))\n';
  code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
  code += '    await callback_query.answer()\n';
  code += '    user_id = callback_query.from_user.id\n';
  code += '    callback_data = callback_query.data\n';
  code += '    \n';
  code += '    if callback_data.startswith("multi_select_done_"):\n';
  code += '        # Завершение множественного выбора\n';
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
    code += '        # Определяем следующий узел для каждого node_id\n';
    multiSelectNodes.forEach(node => {
      code += `        if node_id == "${node.id}":\n`;
      
      // Сначала проверяем continueButtonTarget
      if (node.data.continueButtonTarget) {
        const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
        if (targetNode) {
          code += `            # Переход к узлу ${targetNode.id}\n`;
          if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
            const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `            await handle_callback_${safeFunctionName}(callback_query)\n`;
          } else if (targetNode.type === 'command') {
            const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
            code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
          }
        }
      } else {
        // Если нет continueButtonTarget, ищем соединения
        const nodeConnections = connections.filter(conn => conn.source === node.id);
        if (nodeConnections.length > 0) {
          const targetNode = nodes.find(n => n.id === nodeConnections[0].target);
          if (targetNode) {
            code += `            # Переход к узлу ${targetNode.id} через соединение\n`;
            if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
              const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
              code += `            await handle_callback_${safeFunctionName}(callback_query)\n`;
            } else if (targetNode.type === 'command') {
              const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
              code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            }
          }
        }
      }
    });
  }
  
  code += '        return\n';
  code += '    \n';
  code += '    # Обработка выбора опции\n';
  code += '    parts = callback_data.split("_")\n';
  code += '    if len(parts) >= 3:\n';
  code += '        node_id = parts[2]\n';
  code += '        button_id = "_".join(parts[3:]) if len(parts) > 3 else parts[2]\n';
  code += '        \n';
  code += '        # Инициализируем список выбранных опций с восстановлением из БД\n';
  code += '        if user_id not in user_data:\n';
  code += '            user_data[user_id] = {}\n';
  code += '        \n';
  code += '        # Восстанавливаем ранее выбранные опции из базы данных\n';
  code += '        if f"multi_select_{node_id}" not in user_data[user_id]:\n';
  code += '            # Загружаем сохраненные данные из базы\n';
  code += '            user_vars = await get_user_from_db(user_id)\n';
  code += '            saved_selections = []\n';
  code += '            \n';
  code += '            if user_vars:\n';
  code += '                # Ищем переменную с интересами\n';
  code += '                for var_name, var_data in user_vars.items():\n';
  code += '                    if "интерес" in var_name.lower() or var_name == "interests" or var_name.startswith("multi_select_"):\n';
  code += '                        if isinstance(var_data, dict) and "value" in var_data:\n';
  code += '                            saved_str = var_data["value"]\n';
  code += '                        elif isinstance(var_data, str):\n';
  code += '                            saved_str = var_data\n';
  code += '                        else:\n';
  code += '                            saved_str = str(var_data) if var_data else ""\n';
  code += '                        \n';
  code += '                        if saved_str:\n';
  code += '                            saved_selections = [item.strip() for item in saved_str.split(",")]\n';
  code += '                            break\n';
  code += '            \n';
  code += '            user_data[user_id][f"multi_select_{node_id}"] = saved_selections\n';
  code += '        \n';
  code += '        # Находим текст кнопки по button_id\n';
  code += '        button_text = None\n';
  
  // Добавляем маппинг кнопок для каждого узла с множественным выбором
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    if (selectionButtons.length > 0) {
      code += `        if node_id == "${node.id}":\n`;
      selectionButtons.forEach(button => {
        // Используем target или id для маппинга, как в генераторе клавиатуры
        const buttonValue = button.target || button.id || button.text;
        code += `            if button_id == "${buttonValue}":\n`;
        code += `                button_text = "${button.text}"\n`;
      });
    }
  });
  
  code += '        \n';
  code += '        if button_text:\n';
  code += '            selected_list = user_data[user_id][f"multi_select_{node_id}"]\n';
  code += '            if button_text in selected_list:\n';
  code += '                # Убираем из выбранных\n';
  code += '                selected_list.remove(button_text)\n';
  code += '            else:\n';
  code += '                # Добавляем к выбранным\n';
  code += '                selected_list.append(button_text)\n';
  code += '            \n';
  code += '            # Обновляем клавиатуру с галочками\n';
  code += '            builder = InlineKeyboardBuilder()\n';
  
  // Генерируем обновление клавиатуры для каждого узла
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    const regularButtons = node.data.buttons?.filter(btn => btn.action !== 'selection') || [];
    
    if (selectionButtons.length > 0) {
      code += `            if node_id == "${node.id}":\n`;
      
      // Добавляем логику для умного расположения кнопок
      code += `                # Оптимальное количество колонок для кнопок интересов\n`;
      const allButtons = [...selectionButtons];
      allButtons.push({ text: node.data.continueButtonText || 'Готово' });
      const optimalColumns = calculateOptimalColumns(allButtons, node.data);
      code += `                keyboard_width = ${optimalColumns}  # Консистентное количество колонок для множественного выбора\n`;
      code += `                \n`;
      
      // Добавляем кнопки выбора с автоматическим расположением
      code += `                # Добавляем кнопки выбора с умным расположением\n`;
      selectionButtons.forEach((button, index) => {
        const buttonValue = button.target || button.id || button.text;
        const safeVarName = buttonValue.toLowerCase().replace(/[^a-z0-9]/g, '_');
        code += `                # Проверяем каждый интерес и добавляем галочку если он выбран\n`;
        code += `                ${safeVarName}_selected = any("${button.text}" in interest or "${buttonValue.toLowerCase()}" in interest.lower() for interest in selected_list)\n`;
        code += `                ${safeVarName}_text = "✅ ${button.text}" if ${safeVarName}_selected else "${button.text}"\n`;
        code += `                builder.add(InlineKeyboardButton(text=${safeVarName}_text, callback_data="multi_select_${node.id}_${buttonValue}"))\n`;
      });
      
      // Добавляем обычные кнопки
      regularButtons.forEach(button => {
        if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        } else if (button.action === 'url') {
          code += `                builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'command') {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `                builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
        }
      });
      
      // Добавляем кнопку завершения
      const continueText = node.data.continueButtonText || 'Готово';
      code += `                builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
      
      // Применяем ширину клавиатуры ПОСЛЕ добавления всех кнопок
      code += `                builder.adjust(keyboard_width)\n`;
    }
  });
  
  code += '            \n';
  code += '            keyboard = builder.as_markup()\n';
  code += '            await callback_query.message.edit_reply_markup(reply_markup=keyboard)\n';
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
          const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `            await handle_callback_${safeFunctionName}(types.CallbackQuery(id="multi_select", from_user=message.from_user, chat_instance="", data="${targetNode.id}", message=message))\n`;
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
      code += '        # Создаем inline клавиатуру с кнопками\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      
      // Добавляем логику для умного расположения кнопок
      code += '        # Функция для определения количества колонок на основе текста кнопок\n';
      code += '        def calculate_keyboard_width(buttons_data):\n';
      code += '            max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])\n';
      code += '            if max_text_length <= 6:  # Короткие тексты\n';
      code += '                return 3  # 3 колонки\n';
      code += '            elif max_text_length <= 12:  # Средние тексты\n';
      code += '                return 2  # 2 колонки\n';
      code += '            else:  # Длинные тексты\n';
      code += '                return 1  # 1 колонка\n';
      code += '        \n';
      
      // Создаем массив текстов кнопок для расчета
      const photoButtonTexts = node.data.buttons.map(btn => btn.text);
      code += `        button_texts = [${photoButtonTexts.map(text => `"${text}"`).join(', ')}]\n`;
      code += '        keyboard_width = calculate_keyboard_width(button_texts)\n';
      code += '        \n';
      
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        builder.adjust(keyboard_width)  # Умное расположение кнопок\n';
      code += '        keyboard = builder.as_markup()\n';
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
      code += '        builder = InlineKeyboardBuilder()\n';
      
      // Добавляем логику для умного расположения кнопок
      code += '        # Функция для определения количества колонок на основе текста кнопок\n';
      code += '        def calculate_keyboard_width(buttons_data):\n';
      code += '            max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])\n';
      code += '            if max_text_length <= 6:  # Короткие тексты\n';
      code += '                return 3  # 3 колонки\n';
      code += '            elif max_text_length <= 12:  # Средние тексты\n';
      code += '                return 2  # 2 колонки\n';
      code += '            else:  # Длинные тексты\n';
      code += '                return 1  # 1 колонка\n';
      code += '        \n';
      
      // Создаем массив текстов кнопок для расчета
      const videoButtonTexts = node.data.buttons.map(btn => btn.text);
      code += `        button_texts = [${videoButtonTexts.map(text => `"${text}"`).join(', ')}]\n`;
      code += '        keyboard_width = calculate_keyboard_width(button_texts)\n';
      code += '        \n';
      
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        builder.adjust(keyboard_width)  # Умное расположение кнопок\n';
      code += '        keyboard = builder.as_markup()\n';
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

function generateKeyboard(node: Node): string {
  let code = '';
  
  // Добавляем поддержку условных сообщений для клавиатуры
  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += generateUniversalVariableReplacement('    ');
    code += '    text = replace_variables_in_text(text, user_vars)\n';
    code += '    \n';
    code += '    # Проверка условных сообщений для клавиатуры\n';
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
  
  // Определяем включен ли сбор пользовательского ввода  
  const hasInputCollection = node.data.collectUserInput === true;
  
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
        }
      });
      
      code += '        builder.adjust(2)  # Используем 2 колонки для консистентности\n';
      code += '        keyboard = builder.as_markup()\n';
      code += `        await message.answer(text, reply_markup=keyboard${parseMode})\n`;
    }
    
    // Дополнительно настраиваем сбор ответов
    code += '    \n';
    code += '    # Дополнительно: настраиваем сбор пользовательских ответов\n';
    code += '    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n';
    code += `    user_data[message.from_user.id]["input_collection_enabled"] = True\n`;
    code += `    user_data[message.from_user.id]["input_node_id"] = "${node.id}"\n`;
    if (node.data.inputVariable) {
      code += `    user_data[message.from_user.id]["input_variable"] = "${node.data.inputVariable}"\n`;
    }
    
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
    code += '    # Устанавливаем состояние ожидания ввода\n';
    code += '    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n';
    code += `    user_data[message.from_user.id]["waiting_for_input"] = "${node.id}"\n`;
    if (node.data.inputType) {
      code += `    user_data[message.from_user.id]["input_type"] = "${node.data.inputType}"\n`;
    }
    
    return code;
  }
  
  // CASE 3: Только обычные кнопки БЕЗ сбора ввода = работает как раньше
  else {
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
          code += `        ${safeVarName}_selected = any("${button.text}" in interest or "${buttonValue.toLowerCase()}" in interest.lower() for interest in saved_interests)\n`;
          code += `        ${safeVarName}_text = "✅ ${button.text}" if ${safeVarName}_selected else "${button.text}"\n`;
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
  const startNodes = nodes.filter(node => node.type === 'start');
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
  const commandNodes = botData.nodes.filter(node => 
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
  readme += '- **Сообщений**: ' + botData.nodes.filter(n => n.type === 'message').length + '\n';
  readme += '- **Фото**: ' + botData.nodes.filter(n => n.type === 'photo').length + '\n';
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

