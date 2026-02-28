import { Button } from './bot-generator';
import { formatTextForPython, generateButtonText, stripHtmlTags, toPythonBoolean } from './bot-generator/format';
import { generateInlineKeyboardCode } from './bot-generator/Keyboard';
import { generateUniversalVariableReplacement } from './utils';
import { generateCheckUserVariableFunction } from './bot-generator/database';

export function handleConditionalNavigationAndInputCollection(nodes: any[], code: string, allNodeIds: any[]) {
    if (nodes.length > 0) {
        nodes.forEach((targetNode, index) => {
            const condition = index === 0 ? 'if' : 'elif';
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
                const universalVarCodeLines1: string[] = [];
                generateUniversalVariableReplacement(universalVarCodeLines1, '                        ');
                code += universalVarCodeLines1.join('\n');

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
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                    code += `                        # Заменяем все переменные в тексте\n`;
                    code += `                        text = replace_variables_in_text(text, user_vars)\n`;
                    code += `                        await message.answer(text, reply_markup=keyboard)\n`;
                } else {
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                    code += `                        # Заменяем все переменные в тексте\n`;
                    code += `                        text = replace_variables_in_text(text, user_vars)\n`;
                    code += `                        await message.answer(text)\n`;
                }
                code += `                        logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
            } else {
                // Для обычных узлов проверяем сначала, собирают ли они ввод
                if (targetNode.data.collectUserInput === true) {
                    // Проверяем, есть ли условные сообщения для этого узла
                    const hasConditionalMessages = targetNode.data.enableConditionalMessages &&
                        targetNode.data.conditionalMessages &&
                        targetNode.data.conditionalMessages.length > 0;

                    if (hasConditionalMessages) {
                        // Для узлов с условными сообщениями генерируем встроенную логику проверки
                        code += `                        # Узел с условными сообщениями - проверяем условия\n`;
                        code += `                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: ${targetNode.id}")\n`;
                        code += `                        user_data_dict = await get_user_from_db(user_id) or {}\n`;
                        code += `                        user_data_dict.update(user_data.get(user_id, {}))\n`;

                        // Генерируем логику проверки условий встроенно
                        const conditionalMessages = targetNode.data.conditionalMessages.sort((a: { priority: any; }, b: { priority: any; }) => (b.priority || 0) - (a.priority || 0));

                        code += generateCheckUserVariableFunction('                        ');

                        // Генерируем условия
                        code += `                        conditional_met = False\n`;
                        for (let i = 0; i < conditionalMessages.length; i++) {
                            const condition = conditionalMessages[i];
                            const variableNames = condition.variableNames && condition.variableNames.length > 0
                                ? condition.variableNames
                                : (condition.variableName ? [condition.variableName] : []);
                            const logicOperator = condition.logicOperator || 'AND';
                            const conditionKeyword = i === 0 ? 'if' : 'elif';

                            if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                                code += `                        ${conditionKeyword} (\n`;
                                for (let j = 0; j < variableNames.length; j++) {
                                    const varName = variableNames[j];
                                    const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                                    code += `                            check_user_variable_inline("${varName}", user_data_dict)[0]${operator}\n`;
                                }
                                code += `                        ):\n`;
                                code += `                            conditional_met = True\n`;

                                // Генерируем текст и клавиатуру для условия
                                const cleanedText = stripHtmlTags(condition.messageText);
                                const formattedText = formatTextForPython(cleanedText);
                                code += `                            text = ${formattedText}\n`;

                                // Заменяем переменные
                                for (const varName of variableNames) {
                                    code += `                            _, var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} = check_user_variable_inline("${varName}", user_data_dict)\n`;
                                    code += `                            if "{${varName}}" in text and var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} is not None:\n`;
                                    code += `                                text = text.replace("{${varName}}", var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')})\n`;
                                }

                                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                                code += `                            # Заменяем все переменные в тексте\n`;
                                code += `                            text = replace_variables_in_text(text, user_data_dict)\n`;

                                // Когда условие выполнено (переменная уже есть), отмечаем это
                                code += `                            conditional_met = True\n`;
                                code += `                            logging.info(f"✅ Условие выполнено: переменная суяесявует")\n`;

                                // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода
                                const shouldWaitForInput = condition.waitForTextInput === true;

                                if (shouldWaitForInput) {
                                    // Показываем сообщение и настраиваем ожидание ввода
                                    code += `                            # waitForTextInput=true: показываем сообщение и ждем ввода\n`;

                                    const inputVariable = condition.textInputVariable || targetNode.data.inputVariable || `response_${targetNode.id}`;
                                    const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;

                                    // Проверяем, есть ли кнопки в условном сообщении
                                    const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;

                                    if (hasConditionalButtons) {
                                        // Генерируем клавиатуру с кнопками из условного сообщения
                                        code += `                            # Генерируем клавиатуру с кнопками из условного сообщения\n`;
                                        code += `                            builder = ReplyKeyboardBuilder()\n`;

                                        for (const button of condition.buttons) {
                                            let buttonText = button.text || 'Кнопка';
                                            const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');

                                            // Заменяем переменные в тексте кнопки
                                            let hasVariable = false;
                                            for (const varName of variableNames) {
                                                if (buttonText.includes(`{${varName}}`)) {
                                                    code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                                                    code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                                                    code += `                            if btn_var_value is not None:\n`;
                                                    code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                                                    buttonText = `btn_text_${safeButtonId}`;
                                                    hasVariable = true;
                                                    break;
                                                }
                                            }

                                            if (!hasVariable) {
                                                buttonText = `"${buttonText}"`;
                                            }

                                            code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                                        }

                                        code += `                            builder.adjust(1)\n`;
                                        // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                                        const conditionOneTimeKeyboard1 = toPythonBoolean(condition.oneTimeKeyboard === true);
                                        code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard1})\n`;

                                        // Отправляем сообщение с клавиатурой
                                        const mainMessageText = targetNode.data.messageText || 'Выберите действие';
                                        const mainFormattedText = formatTextForPython(mainMessageText);
                                        code += `                            main_text = ${mainFormattedText}\n`;
                                        code += `                            await message.answer(main_text, reply_markup=keyboard)\n`;

                                        // Устанавливаем ожидание ввода, даже если есть клавиатура
                                        // Пользователь может ввести текст вместо нажатия кнопки
                                        code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                                        code += `                                "type": "text",\n`;
                                        code += `                                "variable": "${inputVariable}",\n`;
                                        code += `                                "save_to_database": True,\n`;
                                        code += `                                "node_id": "${targetNode.id}",\n`;
                                        code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                                        code += `                            }\n`;
                                        code += `                            logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id}")\n`;
                                    } else {
                                        // Нет кнопок - показываем сообщение и ждем текстового ввода
                                        code += `                            # Если условный текст пустой, используем основное сообщение узла\n`;
                                        code += `                            if text and text.strip():\n`;
                                        code += `                                await message.answer(text)\n`;
                                        code += `                            else:\n`;

                                        // Используем основное сообщение узла
                                        const mainMessageText = targetNode.data.messageText || 'Введите данные';
                                        const mainFormattedText = formatTextForPython(mainMessageText);
                                        code += `                                main_text = ${mainFormattedText}\n`;

                                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                                        code += `                                # Заменяем все переменные в тексте\n`;
                                        code += `                                main_text = replace_variables_in_text(main_text, user_data_dict)\n`;

                                        code += `                                await message.answer(main_text)\n`;
                                        code += `                            \n`;

                                        code += `                            # Настраиваем ожидание ввода для условного сообщения\n`;
                                        code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                                        code += `                                "type": "text",\n`;
                                        code += `                                "variable": "${inputVariable}",\n`;
                                        code += `                                "save_to_database": True,\n`;
                                        code += `                                "node_id": "${targetNode.id}",\n`;
                                        code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                                        code += `                            }\n`;
                                        code += `                            logging.info(f"✅ Состояние ожидания настроено: text ввод для переменной ${inputVariable} (условное сообщение, узел ${targetNode.id})")`;
                                        code += '\n';
                                    }
                                } else {
                                    // ИСПРАВЛЕНИЕ: Проверяем, есть ли кнопки в условном сообщении
                                    const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;

                                    if (hasConditionalButtons) {
                                        // Если есть условные кнопки - показываем их и НЕ делаем автопереход
                                        // Кнопки сами ведут к целевым узлам
                                        code += `                            # Условное сообщение с кнопками: показываем клавиатуру\n`;
                                        code += `                            builder = ReplyKeyboardBuilder()\n`;

                                        for (const button of condition.buttons) {
                                            let buttonText = button.text || 'Кнопка';
                                            const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');

                                            // Заменяем переменные в тексте кнопки
                                            let hasVariable = false;
                                            for (const varName of variableNames) {
                                                if (buttonText.includes(`{${varName}}`)) {
                                                    code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                                                    code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                                                    code += `                            if btn_var_value is not None:\n`;
                                                    code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                                                    buttonText = `btn_text_${safeButtonId}`;
                                                    hasVariable = true;
                                                    break;
                                                }
                                            }

                                            if (!hasVariable) {
                                                buttonText = `"${buttonText}"`;
                                            }

                                            code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                                        }

                                        code += `                            builder.adjust(1)\n`;
                                        // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                                        const conditionOneTimeKeyboard2 = toPythonBoolean(condition.oneTimeKeyboard === true);
                                        code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard2})\n`;
                                        code += `                            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, node_id="${targetNode.id}")\n`;
                                        code += `                            logging.info(f"✅ Показана условная клавиатура (кнопяи ведут напрямую, автопереход НЕ выполняется)")\n`;
                                    } else {
                                        // Нет кнопок - автоматически переходим к следующему узлу
                                        const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;
                                        if (nextNodeAfterCondition) {
                                            code += `                            # Переменная уже существует, автоматически переходим к узлу: ${nextNodeAfterCondition}\n`;
                                            code += `                            logging.info(f"✅ Условие выполнено: переменная существует, автоматически переходим к следующему узлу")\n`;
                                            code += `                            # Рекурсивно обрабатываем следующий узел через ту же систему навигации\n`;
                                            code += `                            next_node_id_auto = "${nextNodeAfterCondition}"\n`;
                                            code += `                            logging.info(f"я Автоматический переход к уялу: {next_node_id_auto}")\n`;
                                        } else {
                                            code += `                            # Переменная яуществует, но слядующий узел не указан - завершаем обработяу\n`;
                                        }
                                    }
                                }
                            }
                        }

                        // Fallback если условия не выпоянены
                        code += `                        if not conditional_met:\n`;
                        code += `                            # Условие не выполнено - показываем основнояя сообщение\n`;
                        const messageText = targetNode.data.messageText || 'Сообщение';
                        const formattedText = formatTextForPython(messageText);
                        code += `                            text = ${formattedText}\n`;
                        code += `                            await message.answer(text)\n`;

                        const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                        const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                        code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                        code += `                                "type": "text",\n`;
                        code += `                                "modes": ["text"],\n`;
                        code += `                                "variable": "${inputVariable}",\n`;
                        code += `                                "save_to_database": True,\n`;
                        code += `                                "node_id": "${targetNode.id}",\n`;
                        code += `                                "next_node_id": "${inputTargetNodeId || ''}"\n`;
                        code += `                            }\n`;
                        code += `                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${inputVariable} (узел ${targetNode.id})")`;
                        code += '\n';
                    } else {
                        const messageText = targetNode.data.messageText || 'Сообщение';
                        const formattedText = formatTextForPython(messageText);

                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: У узла есть кяяопки - показываем ях И настраиваем ожидание ввода
                        if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            code += `                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа\n`;
                            code += `                        logging.info(f"✅ Показаны кнопки для узла ${targetNode.id} с collectUserInput=true")\n`;
                            code += `                        text = ${formattedText}\n`;

                            // Добавляем замену переменных
                            code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
                            const universalVarCodeLines2: string[] = [];
                            generateUniversalVariableReplacement(universalVarCodeLines2, '                        ');
                            code += universalVarCodeLines2.join('\n');

                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Генерируем правильный тип клавиатуры в завясимости от keyboardType
                            if (targetNode.data.keyboardType === 'reply') {
                                code += '                        # Создаем reply клавиатуру\n';
                                code += '                        builder = ReplyKeyboardBuilder()\n';
                                targetNode.data.buttons.forEach((btn: Button) => {
                                    code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                                });
                                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                                code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                            } else {
                                // Генерируем inline клавиатуру
                                code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
                            }
                            code += `                        await message.answer(text, reply_markup=keyboard)\n`;

                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также яастраиваем waiting_for_input для сохранения ответа кнопки
                            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                            const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                            // Определяем modes - если есть enableTextInput, добавляем и text и button
                            const hasTextInput = targetNode.data.enableTextInput === true;
                            const btnModesList = hasTextInput ? "['button', 'text']" : "['button']";
                            // Собираем кнопки с skipDataCollection для кнопок
                            const skipButtons2572 = (targetNode.data.buttons || [])
                                .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                                .map((btn: any) => ({ text: btn.text, target: btn.target }));
                            const skipButtonsJson2572 = JSON.stringify(skipButtons2572);

                            code += `                        # Настраиваем ожидание ввода для сохранения ответа кнопки\n`;
                            code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
                            code += `                            "type": "button",\n`;
                            code += `                            "modes": ${hasTextInput ? "['button', 'text']" : "['button']"},\n`;
                            code += `                            "variable": "${inputVariable}",\n`;
                            code += `                            "save_to_database": True,\n`;
                            code += `                            "node_id": "${targetNode.id}",\n`;
                            code += `                            "next_node_id": "${inputTargetNodeId || ''}",\n`;
                            code += `                            "skip_buttons": ${skipButtonsJson2572}\n`;
                            code += `                        }\n`;
                            code += `                        logging.info(f"✅ Сояяяятояние ожидzzzzия настроено: modes=${btnModesList} для перzzменной ${inputVariable} (узел ${targetNode.id})")\n`;
                        } else {
                            // Обычнzzzzе ожидание ввода если кнопок нет
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
                            code += `                            "modes": ["text"],\n`;
                            code += `                            "variable": "${inputVariable}",\n`;
                            code += `                            "save_to_database": True,\n`;
                            code += `                            "node_id": "${targetNode.id}",\n`;
                            code += `                            "next_node_id": "${inputTargetNodeId || ''}"\n`;
                            code += `                        }\n`;
                            code += `                        logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${inputVariable} (узел ${targetNode.id})")`;
                            code += '\n';
                        }
                    }
                } else {
                    // Обычная навигация с простым сообщением
                    const messageText = targetNode.data.messageText || 'Сообщение';
                    const formattedText = formatTextForPython(messageText);
                    code += `                        # Обычный узел - отправляем сообщение\n`;
                    code += `                        text = ${formattedText}\n`;

                    // Добавляем замену переменных
                    code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
                    const universalVarCodeLines3: string[] = [];
                    generateUniversalVariableReplacement(universalVarCodeLines3, '                        ');
                    code += universalVarCodeLines3.join('\n');

                    // Проверяем, есть ли reply кнопки
                    if (targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                        code += '                        # Создаем reply клавиатуру\n';
                        code += '                        builder = ReplyKeyboardBuilder()\n';
                        targetNode.data.buttons.forEach((btn: Button) => {
                            code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                        });
                        const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                        const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                        code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                        code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
                        code += '                        await message.answer(text, reply_markup=keyboard)\n';
                    } else if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                        code += '                        # Создаем inline клавиатуру\n';
                        code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
                        code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
                        code += '                        await message.answer(text, reply_markup=keyboard)\n';
                    } else {
                        code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
                        code += '                        await message.answer(text)\n';
                    }
                }
            }
        });
        code += '                    else:\n';
        code += '                        logging.warning(f"Неизвестныя следующий узел: {next_node_id}")\n';
    } else {
        code += '                    # No nodes available for navigation\n';
        code += '                    logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
    }
    return code;
}
