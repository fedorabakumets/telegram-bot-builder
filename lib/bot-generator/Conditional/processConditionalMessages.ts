/**
 * @fileoverview Модуль для обработки условных сообщений в узлах Telegram бота
 * 
 * Этот файл содержит функцию, которая генерирует Python-код для обработки
 * условных сообщений в зависимости от состояния переменных пользователя.
 * Поддерживает различные типы условий: проверка существования переменных,
 * отсутствия переменных, равенства значений и содержания подстроки.
 * 
 * @module processConditionalMessages
 */

import { formatTextForPython, getParseMode, stripHtmlTags, toPythonBoolean } from '../format';
import { generateConditionalKeyboard } from './generateConditionalKeyboard';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Обрабатывает массив условных сообщений и генерирует соответствующий Python-код
 * 
 * Функция создает if/elif конструкции для проверки условий, связанных с данными пользователя,
 * и генерирует код для отправки соответствующих сообщений с учетом переменных и клавиатур.
 * 
 * Поддерживаемые типы условий:
 * - user_data_exists: проверяет существование переменной пользователя
 * - user_data_not_exists: проверяет отсутствие переменной пользователя
 * - user_data_equals: проверяет равенство значения переменной
 * - user_data_contains: проверяет содержание подстроки в значении переменной
 * 
 * @param sortedConditions - Массив условных сообщений, отсортированных по приоритету
 * @param nodeData - Данные узла, содержащие основной текст и другие параметры
 * @param code - Исходный код, в который будет добавлен сгенерированный код
 * @param indentLevel - Уровень отступа для генерируемого кода
 * @returns Обновленную строку кода с добавленными условиями
 */
export function processConditionalMessages(sortedConditions: any[], nodeData: any, code: string, indentLevel: string) {
    // Собираем весь код в массив строк для автоматической обработки
    const codeLines: string[] = [];
    
    // Добавляем начальный код, переданный в функцию
    if (code) {
        const initialCodeLines = code.split('\n');
        codeLines.push(...initialCodeLines);
    }
    
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

        codeLines.push(`${indentLevel}# Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}`);

        switch (condition.condition) {
            case 'user_data_exists':
                if (variableNames.length === 0) {
                    codeLines.push(`${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки`);
                    codeLines.push(`${indentLevel}    pass`);
                    break;
                }

                // Создаем единый блок условия с проверками ВНУТРИ
                codeLines.push(`${indentLevel}${conditionKeyword} (`);
                for (let j = 0; j < variableNames.length; j++) {
                    const varName = variableNames[j];
                    const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                    codeLines.push(`${indentLevel}    check_user_variable_inline("${varName}", user_data_dict)[0]${operator}`);
                }
                codeLines.push(`${indentLevel}):`);

                // Внутри блока условия собираем значения переменных
                codeLines.push(`${indentLevel}    # Собираем значения переменных`);
                codeLines.push(`${indentLevel}    variable_values = {}`);
                for (const varName of variableNames) {
                    codeLines.push(`${indentLevel}    _, variable_values["${varName}"] = check_user_variable_inline("${varName}", user_data_dict)`);
                }

                // Только переопределяем text если условное сообщение не пустое
                const conditionTextValue = finalMessageText.trim();
                if (conditionTextValue) {
                    codeLines.push(`${indentLevel}    text = ${conditionText}`);
                } else {
                    codeLines.push(`${indentLevel}    # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)`);
                }

                // Устанавливаем parse_mode для условного сообщения
                const parseMode1 = getParseMode(condition.formatMode || 'text');
                if (parseMode1) {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = "${parseMode1}"`);
                } else {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = None`);
                }

                // Заменяем переменные в тексте
                for (const varName of variableNames) {
                    codeLines.push(`${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:`);
                    codeLines.push(`${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также заменяем все остальные переменные из user_vars
                codeLines.push(`${indentLevel}    # Заменяем все остальные переменные в тексте`);
                codeLines.push(`${indentLevel}    # Заменяем переменные в тексте\n`);
                codeLines.push(`${indentLevel}    # Получаем фильтры переменных для замены\n`);
                codeLines.push(`${indentLevel}    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`);
                codeLines.push(`${indentLevel}    text = replace_variables_in_text(text, all_user_vars, variable_filters)\n`);

                // Добавляем генерацию клавиатуры для условного сообщения
                const keyboardCode = generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
                const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
                codeLines.push(...keyboardLines);
                codeLines.push(`${indentLevel}    # ВАЖНО: Логируем состояние условной клавиатуры для отладки`);
                // codeLines.push(`${indentLevel}    logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")`);
                // Добавляем логику для настройки ожидания текстового ввода
                codeLines.push(`${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения`);

                // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
                const skipButtons = (condition.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                const skipButtonsJson = JSON.stringify(skipButtons);

                codeLines.push(`${indentLevel}    conditional_message_config = {`);
                codeLines.push(`${indentLevel}        "condition_id": "${condition.id}",`);
                codeLines.push(`${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},`);
                codeLines.push(`${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",`);
                codeLines.push(`${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",`);
                codeLines.push(`${indentLevel}        "source_type": "conditional_message",`);
                codeLines.push(`${indentLevel}        "skip_buttons": ${skipButtonsJson}`);
                codeLines.push(`${indentLevel}    }`);

                // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода ДАЖЕ ЕСЛИ переменная существует
                codeLines.push(`${indentLevel}    # Настраиваем ожидание ввода для условного сообщения с waitForTextInput`);
                if (condition.waitForTextInput) {
                    codeLines.push(`${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):`);
                    codeLines.push(`${indentLevel}        if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}            user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config`);
                    // codeLines.push(`${indentLevel}        logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")`);
                    codeLines.push(`${indentLevel}        # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход`);
                    codeLines.push(`${indentLevel}        # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода`);
                    codeLines.push(`${indentLevel}        # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
                // Это нужно чтобы текстовый обработчик мог обработать кнопки даже когда ожидается фото/видео
                if (skipButtons.length > 0) {
                    codeLines.push(`${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)`);
                    codeLines.push(`${indentLevel}    if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}        user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson}`);
                    codeLines.push(`${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")`);
                }

                codeLines.push(`${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} ('${logicOperator}')")`);
                break;

            case 'user_data_not_exists':
                if (variableNames.length === 0) {
                    codeLines.push(`${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки`);
                    codeLines.push(`${indentLevel}    pass`);
                    break;
                }

                // Создаем единый блок условия с проверками ВНУТРИ (инвертированными)
                codeLines.push(`${indentLevel}${conditionKeyword} (`);
                for (let j = 0; j < variableNames.length; j++) {
                    const varName = variableNames[j];
                    const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                    if (logicOperator === 'AND') {
                        codeLines.push(`${indentLevel}    not check_user_variable_inline("${varName}", user_data_dict)[0]${operator}`);
                    } else {
                        codeLines.push(`${indentLevel}    not check_user_variable_inline("${varName}", user_data_dict)[0]${operator}`);
                    }
                }
                codeLines.push(`${indentLevel}):`);

                codeLines.push(`${indentLevel}    text = ${conditionText}`);
                // Устанавливаем parse_mode для условного сообщения
                const parseMode2 = getParseMode(condition.formatMode || 'text');
                if (parseMode2) {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = "${parseMode2}"`);
                } else {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = None`);
                }

                // Добавляем генерацию клавиатуры для условного сообщения
                const keyboardCode2 = generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
                const keyboardLines2 = keyboardCode2.split('\n').filter(line => line.trim());
                codeLines.push(...keyboardLines2);

                // Добавляем логику для настройки ожидания текстового ввода
                codeLines.push(`${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения`);

                // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
                const skipButtons2 = (condition.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                const skipButtonsJson2 = JSON.stringify(skipButtons2);

                codeLines.push(`${indentLevel}    conditional_message_config = {`);
                codeLines.push(`${indentLevel}        "condition_id": "${condition.id}",`);
                codeLines.push(`${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},`);
                codeLines.push(`${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",`);
                codeLines.push(`${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",`);
                codeLines.push(`${indentLevel}        "source_type": "conditional_message",`);
                codeLines.push(`${indentLevel}        "skip_buttons": ${skipButtonsJson2}`);
                codeLines.push(`${indentLevel}    }`);

                // Добавляем код для активации состояния условного ввода для user_data_not_exists
                if (condition.waitForTextInput) {
                    codeLines.push(`${indentLevel}    `);
                    codeLines.push(`${indentLevel}    # Если есть условное сообщение с ожиданием ввода`);
                    codeLines.push(`${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):`);
                    codeLines.push(`${indentLevel}        if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}            user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
                if (skipButtons2.length > 0) {
                    codeLines.push(`${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)`);
                    codeLines.push(`${indentLevel}    if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}        user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson2}`);
                    codeLines.push(`${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")`);
                }

                codeLines.push(`${indentLevel}    logging.info(f"Условие выполнено: переменные ${variableNames} не существуют ('${logicOperator}')")`);
                break;

            case 'user_data_equals':
                if (variableNames.length === 0) {
                    codeLines.push(`${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки`);
                    codeLines.push(`${indentLevel}    pass`);
                    break;
                }

                // Создаем единый блок условия с проверками равенства ВНУТРИ
                codeLines.push(`${indentLevel}${conditionKeyword} (`);
                for (let j = 0; j < variableNames.length; j++) {
                    const varName = variableNames[j];
                    const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                    codeLines.push(`${indentLevel}    check_user_variable_inline("${varName}", user_data_dict)[1] == "${condition.expectedValue || ''}"${operator}`);
                }
                codeLines.push(`${indentLevel}):`);

                // Внутри блока условия собираем значения переменных
                codeLines.push(`${indentLevel}    # Собираем значения переменных`);
                codeLines.push(`${indentLevel}    variable_values = {}`);
                for (const varName of variableNames) {
                    codeLines.push(`${indentLevel}    _, variable_values["${varName}"] = check_user_variable_inline("${varName}", user_data_dict)`);
                }

                codeLines.push(`${indentLevel}    text = ${conditionText}`);
                // Устанавливаем parse_mode для условного сообщения
                const parseMode3 = getParseMode(condition.formatMode || 'text');
                if (parseMode3) {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = "${parseMode3}"`);
                } else {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = None`);
                }

                // Заменяем переменные в тексте
                for (const varName of variableNames) {
                    codeLines.push(`${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:`);
                    codeLines.push(`${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также заменяем все остальные переменные из user_vars
                codeLines.push(`${indentLevel}    # Заменяем все остальные переменные в тексте`);
                codeLines.push(`${indentLevel}    # Заменяем переменные в тексте\n`);
                codeLines.push(`${indentLevel}    # Получаем фильтры переменных для замены\n`);
                codeLines.push(`${indentLevel}    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`);
                codeLines.push(`${indentLevel}    text = replace_variables_in_text(text, all_user_vars, variable_filters)\n`);

                // Добавляем генерацию клавиатуры для условного сообщения
                const keyboardCode3 = generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
                const keyboardLines3 = keyboardCode3.split('\n').filter(line => line.trim());
                codeLines.push(...keyboardLines3);

                // Добавляем логику для настройки ожидания текстового ввода
                codeLines.push(`${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения`);

                // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
                const skipButtons3 = (condition.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                const skipButtonsJson3 = JSON.stringify(skipButtons3);

                codeLines.push(`${indentLevel}    conditional_message_config = {`);
                codeLines.push(`${indentLevel}        "condition_id": "${condition.id}",`);
                codeLines.push(`${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},`);
                codeLines.push(`${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",`);
                codeLines.push(`${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",`);
                codeLines.push(`${indentLevel}        "source_type": "conditional_message",`);
                codeLines.push(`${indentLevel}        "skip_buttons": ${skipButtonsJson3}`);
                codeLines.push(`${indentLevel}    }`);

                // Добавляем код для активации состояния условного ввода для user_data_equals
                if (condition.waitForTextInput) {
                    codeLines.push(`${indentLevel}    `);
                    codeLines.push(`${indentLevel}    # Если есть условное сообщение с ожиданием ввода`);
                    codeLines.push(`${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):`);
                    codeLines.push(`${indentLevel}        if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}            user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
                if (skipButtons3.length > 0) {
                    codeLines.push(`${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)`);
                    codeLines.push(`${indentLevel}    if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}        user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson3}`);
                    codeLines.push(`${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")`);
                }

                codeLines.push(`${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} равны '{condition.expectedValue || ''}' ('${logicOperator}')")`);
                break;

            case 'user_data_contains':
                if (variableNames.length === 0) {
                    codeLines.push(`${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки`);
                    codeLines.push(`${indentLevel}    pass`);
                    break;
                }

                // Создаем единый блок условия с проверками содержания ВНУТРИ
                codeLines.push(`${indentLevel}${conditionKeyword} (`);
                for (let j = 0; j < variableNames.length; j++) {
                    const varName = variableNames[j];
                    const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                    codeLines.push(`${indentLevel}    (check_user_variable_inline("${varName}", user_data_dict)[1] is not None and "${condition.expectedValue || ''}" in str(check_user_variable_inline("${varName}", user_data_dict)[1]))${operator}`);
                }
                codeLines.push(`${indentLevel}):`);

                // Внутри блока условия собираем значения переменных
                codeLines.push(`${indentLevel}    # Собираем значения переменных`);
                codeLines.push(`${indentLevel}    variable_values = {}`);
                for (const varName of variableNames) {
                    codeLines.push(`${indentLevel}    _, variable_values["${varName}"] = check_user_variable_inline("${varName}", user_data_dict)`);
                }

                codeLines.push(`${indentLevel}    text = ${conditionText}`);
                // Устанавливаем parse_mode для условного сообщения
                const parseMode4 = getParseMode(condition.formatMode || 'text');
                if (parseMode4) {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = "${parseMode4}"`);
                } else {
                    codeLines.push(`${indentLevel}    conditional_parse_mode = None`);
                }

                // Заменяем переменные в тексте
                for (const varName of variableNames) {
                    codeLines.push(`${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:`);
                    codeLines.push(`${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также заменяем все остальные переменные из user_vars
                codeLines.push(`${indentLevel}    # Заменяем все остальные переменные в тексте`);
                codeLines.push(`${indentLevel}    # Заменяем переменные в тексте\n`);
                codeLines.push(`${indentLevel}    # Получаем фильтры переменных для замены\n`);
                codeLines.push(`${indentLevel}    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`);
                codeLines.push(`${indentLevel}    text = replace_variables_in_text(text, all_user_vars, variable_filters)\n`);

                // Добавляем генерацию клавиатуры для условного сообщения
                const keyboardCode4 = generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
                const keyboardLines4 = keyboardCode4.split('\n').filter(line => line.trim());
                codeLines.push(...keyboardLines4);

                // Добавляем логику для настройки ожидания текстового ввода
                codeLines.push(`${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения`);

                // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true для пропуска сбора данных
                const skipButtons4 = (condition.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                const skipButtonsJson4 = JSON.stringify(skipButtons4);

                codeLines.push(`${indentLevel}    conditional_message_config = {`);
                codeLines.push(`${indentLevel}        "condition_id": "${condition.id}",`);
                codeLines.push(`${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},`);
                codeLines.push(`${indentLevel}        "input_variable": "${condition.variableName || condition.textInputVariable || ''}",`);
                codeLines.push(`${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",`);
                codeLines.push(`${indentLevel}        "source_type": "conditional_message",`);
                codeLines.push(`${indentLevel}        "skip_buttons": ${skipButtonsJson4}`);
                codeLines.push(`${indentLevel}    }`);

                // Добавляем код для активации состояния условного ввода для user_data_contains
                if (condition.waitForTextInput) {
                    codeLines.push(`${indentLevel}    `);
                    codeLines.push(`${indentLevel}    # Если есть условное сообщение с ожиданием ввода`);
                    codeLines.push(`${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):`);
                    codeLines.push(`${indentLevel}        if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}            user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config`);
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем pending_skip_buttons для медиа-узлов
                if (skipButtons4.length > 0) {
                    codeLines.push(`${indentLevel}    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)`);
                    codeLines.push(`${indentLevel}    if user_id not in user_data:`);
                    codeLines.push(`${indentLevel}        user_data[user_id] = {}`);
                    codeLines.push(`${indentLevel}    user_data[user_id]["pending_skip_buttons"] = ${skipButtonsJson4}`);
                    codeLines.push(`${indentLevel}    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")`);
                }

                codeLines.push(`${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} содержат '{condition.expectedValue || ''}' ('${logicOperator}')")`);
                break;

            default:
                codeLines.push(`${indentLevel}${conditionKeyword} False:  # Неизвестное условие: ${condition.condition}`);
                codeLines.push(`${indentLevel}    pass`);
                break;
        }
    }
    
    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(codeLines, 'processConditionalMessages.ts');
    
    return commentedCodeLines.join('\n');
}
