import { getParseMode } from '../format/getParseMode';
import { stripHtmlTags } from '../format/stripHtmlTags';
import { formatTextForPython } from '../format/formatTextForPython';
import { generateConditionalKeyboard } from "./generateConditionalKeyboard";
import { toPythonBoolean } from "../format/toPythonBoolean";

// Функция для генерации логики условных сообщений

export function generateConditionalMessageLogic(conditionalMessages: any[], indentLevel: string = '    ', nodeData?: any): string {
  if (!conditionalMessages || conditionalMessages.length === 0) {
    return '';
  }

  let code = '';
  const sortedConditions = [...conditionalMessages].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // НЕ инициализируем conditional_parse_mode и conditional_keyboard здесь
  // Они должны быть инициализированы вызывающей функцией ПЕРЕД вызовом generateConditionalMessageLogic
  // Получаем user_vars для подстановки в кнопки условных сообщений
  code += `${indentLevel}# Инициализируем базовые переменные пользователя если их нет\n`;
  code += `${indentLevel}if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):\n`;
  code += `${indentLevel}    # Получаем объект пользователя из сообщения или callback\n`;
  code += `${indentLevel}    user_obj = None\n`;
  code += `${indentLevel}    if hasattr(locals().get('message'), 'from_user'):\n`;
  code += `${indentLevel}        user_obj = message.from_user\n`;
  code += `${indentLevel}    elif hasattr(locals().get('callback_query'), 'from_user'):\n`;
  code += `${indentLevel}        user_obj = callback_query.from_user\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    if user_obj:\n`;
  code += `${indentLevel}        init_user_variables(user_id, user_obj)\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Подставляем все доступные переменные пользователя в текст кнопок\n`;
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
    // Если текст условного сообщения не указан или пустой, используем основной текст узла
    let messageToUse = condition.messageText || '';
    const cleanedConditionText = stripHtmlTags(messageToUse).trim();
    // Если после очистки текст пустой, используем основной текст узла
    let finalMessageText = '';
    if (!cleanedConditionText) {
      // Используем основной текст узла если условное сообщение пустое
      finalMessageText = nodeData?.messageText || '';
    } else {
      finalMessageText = cleanedConditionText;
    }
    const conditionText = formatTextForPython(finalMessageText);
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

        // Только переопределяем text если условное сообщение не пустое
        const conditionTextValue = finalMessageText.trim();
        if (conditionTextValue) {
          code += `${indentLevel}    text = ${conditionText}\n`;
        } else {
          code += `${indentLevel}    # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)\n`;
        }

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
        code += `${indentLevel}    # ВАЖНО: Логируем состояние условной клавиатуры для отладки\n`;
        code += `${indentLevel}    logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")\n`;

        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;

        // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
        const skipButtons = (condition.buttons || [])
          .filter((btn: any) => btn.skipDataCollection === true && btn.target)
          .map((btn: any) => ({ text: btn.text, target: btn.target }));
        const skipButtonsJson = JSON.stringify(skipButtons);

        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message",\n`;
        code += `${indentLevel}        "skip_buttons": ${skipButtonsJson}\n`;
        code += `${indentLevel}    }\n`;

        // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода ДАЖЕ ЕСЛИ переменная существует
        code += `${indentLevel}    # Настраиваем ожидание ввода для условного сообщения с waitForTextInput\n`;
        if (condition.waitForTextInput) {
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")\n`;
          code += `${indentLevel}        # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход\n`;
          code += `${indentLevel}        # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода\n`;
          code += `${indentLevel}        # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break\n`;
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
        // Это нужно чтобы текстовый обработчик мог обработать кнопки даже когда ожидается фото/видео
        if (skipButtons.length > 0) {
          code += `${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)\n`;
          code += `${indentLevel}    if user_id not in user_data:\n`;
          code += `${indentLevel}        user_data[user_id] = {}\n`;
          code += `${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson}\n`;
          code += `${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")\n`;
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

        // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
        const skipButtons2 = (condition.buttons || [])
          .filter((btn: any) => btn.skipDataCollection === true && btn.target)
          .map((btn: any) => ({ text: btn.text, target: btn.target }));
        const skipButtonsJson2 = JSON.stringify(skipButtons2);

        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message",\n`;
        code += `${indentLevel}        "skip_buttons": ${skipButtonsJson2}\n`;
        code += `${indentLevel}    }\n`;

        // Добавляем код для активации состояния условного ввода для user_data_not_exists
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
        if (skipButtons2.length > 0) {
          code += `${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)\n`;
          code += `${indentLevel}    if user_id not in user_data:\n`;
          code += `${indentLevel}        user_data[user_id] = {}\n`;
          code += `${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson2}\n`;
          code += `${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")\n`;
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

        // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
        const skipButtons3 = (condition.buttons || [])
          .filter((btn: any) => btn.skipDataCollection === true && btn.target)
          .map((btn: any) => ({ text: btn.text, target: btn.target }));
        const skipButtonsJson3 = JSON.stringify(skipButtons3);

        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message",\n`;
        code += `${indentLevel}        "skip_buttons": ${skipButtonsJson3}\n`;
        code += `${indentLevel}    }\n`;

        // Добавляем код для активации состояния условного ввода для user_data_equals
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
        if (skipButtons3.length > 0) {
          code += `${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)\n`;
          code += `${indentLevel}    if user_id not in user_data:\n`;
          code += `${indentLevel}        user_data[user_id] = {}\n`;
          code += `${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson3}\n`;
          code += `${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")\n`;
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

        // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
        const skipButtons4 = (condition.buttons || [])
          .filter((btn: any) => btn.skipDataCollection === true && btn.target)
          .map((btn: any) => ({ text: btn.text, target: btn.target }));
        const skipButtonsJson4 = JSON.stringify(skipButtons4);

        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message",\n`;
        code += `${indentLevel}        "skip_buttons": ${skipButtonsJson4}\n`;
        code += `${indentLevel}    }\n`;

        // Добавляем код для активации состояния условного ввода для user_data_contains
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
        if (skipButtons4.length > 0) {
          code += `${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)\n`;
          code += `${indentLevel}    if user_id not in user_data:\n`;
          code += `${indentLevel}        user_data[user_id] = {}\n`;
          code += `${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson4}\n`;
          code += `${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")\n`;
        }

        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} содержат '${condition.expectedValue || ''}' (${logicOperator})")\n`;
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
