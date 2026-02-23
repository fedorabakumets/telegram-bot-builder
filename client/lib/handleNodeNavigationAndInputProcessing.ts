import { Button } from './bot-generator';
import { generateDatabaseVariablesCode } from './Broadcast/generateDatabaseVariables';
import { formatTextForPython, generateButtonText, generateWaitingStateCode, stripHtmlTags, toPythonBoolean } from './format';
import { calculateOptimalColumns, generateInlineKeyboardCode } from './Keyboard';
import { generateUniversalVariableReplacement } from './utils';

export function handleNodeNavigationAndInputProcessing(nodes: any[], code: string, conditionIndent: string, bodyIndent: string, allNodeIds: any[], connections: any[]) {
    if (nodes.length > 0) {
        nodes.forEach((targetNode, index) => {
            const condition = index === 0 ? 'if' : 'elif';
            code += `${conditionIndent}${condition} current_node_id == "${targetNode.id}":\n`;

            if (targetNode.type === 'message') {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                if (targetNode.data.allowMultipleSelection === true) {
                    // Для узлов с множественным выбором создаем прямую навигацию
                    const messageText = targetNode.data.messageText || 'Сообщение';
                    const formattedText = formatTextForPython(messageText);
                    code += `${bodyIndent}# Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
                    code += `${bodyIndent}logging.info(f"🔧 Переходим к узлу с множественным выбором: ${targetNode.id}")\n`;
                    code += `${bodyIndent}text = ${formattedText}\n`;

                    // Замена переменных
                    code += `${bodyIndent}user_data[user_id] = user_data.get(user_id, {})\n`;
                    const universalVarCodeLines1: string[] = [];
                    generateUniversalVariableReplacement(universalVarCodeLines1, bodyIndent);
                    code += universalVarCodeLines1.join('\n');

                    // Инициализируем состояние множественного выбора
                    code += `${bodyIndent}# Инициализируем состояние множественного выбора\n`;
                    code += `${bodyIndent}user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
                    code += `${bodyIndent}user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
                    code += `${bodyIndent}user_data[user_id]["multi_select_type"] = "selection"\n`;
                    if (targetNode.data.multiSelectVariable) {
                        code += `${bodyIndent}user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
                    }

                    // Создаем inline клавиатуру с кнопками выбора
                    if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(targetNode.data.buttons, bodyIndent, targetNode.id, targetNode.data, allNodeIds);
                        code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                    } else {
                        code += `${bodyIndent}await message.answer(text)\n`;
                    }
                    code += `${bodyIndent}logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
                } else {
                    const messageText = targetNode.data.messageText || 'Сообщение';
                    const cleanedMessageText = stripHtmlTags(messageText);
                    const formattedText = formatTextForPython(cleanedMessageText);
                    code += `${bodyIndent}text = ${formattedText}\n`;

                    // Получаем переменные из базы данных перед заменой
                    code += `${bodyIndent}\n`;
                    code += `${bodyIndent}# Получаем переменные из базы данных (user_ids_list, user_ids_count)\n`;
                    code += generateDatabaseVariablesCode(bodyIndent);
                    code += `${bodyIndent}\n`;

                    // Применяем замену переменных
                    code += `${bodyIndent}# Замена переменных в тексте\n`;
                    const universalVarCodeLines2: string[] = [];
                    generateUniversalVariableReplacement(universalVarCodeLines2, bodyIndent);
                    code += universalVarCodeLines2.join('\n');

                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                    code += `${bodyIndent}# Заменяем все переменные в тексте, используя all_user_vars\n`;
                    code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars)\n`;

                    // Если узел message собирает ввод, настраиваем ожидание
                    if (targetNode.data.collectUserInput === true) {
                        // Определяем тип ввода - если включены медиа-типы, используем их, иначе текст
                        if (targetNode.data.enablePhotoInput) {
                        } else if (targetNode.data.enableVideoInput) {
                        } else if (targetNode.data.enableAudioInput) {
                        } else if (targetNode.data.enableDocumentInput) {
                        } else {
                        }
                        const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                        const inputTargetNodeId = targetNode.data.inputTargetNodeId;

                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда устанавливаем состояние ожидания ввода для collectUserInput=true
                        code += `${bodyIndent}# Устанавливаем состояние ожидания ввода для узла ${targetNode.id}\n`;
                        if (targetNode && targetNode.data) {
                            code += generateWaitingStateCode(targetNode, bodyIndent);
                        }
                        code += `${bodyIndent}logging.info(f"✅ Узел ${targetNode.id} настроен для сбора ввода (collectUserInput=true)")\n`;

                        // Если у узла есть кнопки, показываем их ВМЕСТЕ с ожиданием ввода
                        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            code += `${bodyIndent}# У узла есть inline кнопки - показываем их вместе с ожиданием ввода\n`;
                            code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

                            // Добавляем кнопки для узла с collectUserInput + buttons
                            targetNode.data.buttons.forEach((btn: Button) => {
                                if (btn.action === "goto" && btn.target) {
                                    const callbackData = `${btn.target}`;
                                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                                } else if (btn.action === "url" && btn.url) {
                                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
                                } else if (btn.action === "command" && btn.target) {
                                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                                }
                            });

                            const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                            code += `${bodyIndent}builder.adjust(${columns})\n`;
                            code += `${bodyIndent}keyboard = builder.as_markup()\n`;
                            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                            code += `${bodyIndent}logging.info(f"✅ Показаны inline кнопки для узла ${targetNode.id} с collectUserInput (ожидание ввода активно)")\n`;
                        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            // Проверяем, есть ли условные сообщения
                            if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                                code += `${bodyIndent}# Узел с условными сообщениями - проверяем условия\n`;
                                code += `${bodyIndent}logging.info(f"🔧 Обработка узла с условными сообщениями: ${targetNode.id}")\n`;
                                code += `${bodyIndent}user_data_dict = await get_user_from_db(user_id) or {}\n`;
                                code += `${bodyIndent}user_data_dict.update(user_data.get(user_id, {}))\n`;
                                code += `${bodyIndent}# Функция для проверки переменных пользователя (уже определена ранее)\n`;

                                // Генерируем проверку условий
                                code += `${bodyIndent}conditional_met = False\n`;

                                const sortedConditions = [...targetNode.data.conditionalMessages].sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
                                sortedConditions.forEach((condition: any, condIndex: number) => {
                                    const ifKeyword = condIndex === 0 ? 'if' : 'if';

                                    if (condition.condition === 'user_data_exists' && condition.variableName) {
                                        code += `${bodyIndent}${ifKeyword} (\n`;
                                        code += `${bodyIndent}    check_user_variable_inline("${condition.variableName}", user_data_dict)[0]\n`;
                                        code += `${bodyIndent}):\n`;
                                        code += `${bodyIndent}    conditional_met = True\n`;

                                        // Условная клавиатура
                                        if (condition.buttons && condition.buttons.length > 0) {
                                            code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;
                                            condition.buttons.forEach((btn: Button) => {
                                                code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                                            });
                                            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                                            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                                            code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                                            code += `${bodyIndent}    main_text = text\n`;

                                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                                            code += `${bodyIndent}    # Заменяем все переменные в тексте\n`;
                                            code += `${bodyIndent}    main_text = replace_variables_in_text(main_text, user_data_dict)\n`;

                                            code += `${bodyIndent}    await message.answer(main_text, reply_markup=keyboard)\n`;

                                            // Проверяем, нужно ли собирать ввод для условного сообщения
                                            const condCollectInput = condition.collectUserInput === true || condition.waitForTextInput === true || condition.enableTextInput === true;
                                            if (condCollectInput) {
                                                code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id} (сбор ответов НАСТРОЕН)")\n`;
                                                code += `${bodyIndent}    # Настраиваем ожидание ввода для условного сообщения\n`;
                                                const condInputVariable = condition.textInputVariable || condition.inputVariable || condition.variableName || targetNode.data.inputVariable || `response_${targetNode.id}`;
                                                const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;

                                                // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true
                                                const condSkipButtons = (condition.buttons || [])
                                                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                                                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                                                const condSkipButtonsJson = JSON.stringify(condSkipButtons);

                                                code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
                                                code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
                                                code += `${bodyIndent}        "type": "text",\n`;
                                                code += `${bodyIndent}        "variable": "${condInputVariable}",\n`;
                                                code += `${bodyIndent}        "save_to_database": True,\n`;
                                                code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
                                                code += `${bodyIndent}        "next_node_id": "${nextNodeAfterCondition || ''}",\n`;
                                                code += `${bodyIndent}        "skip_buttons": ${condSkipButtonsJson}\n`;
                                                code += `${bodyIndent}    }\n`;
                                                code += `${bodyIndent}    logging.info(f"🔧 Установлено ожидание ввода для условного сообщения: {user_data[message.from_user.id]['waiting_for_input']}")\n`;
                                            } else {
                                                code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id} (сбор ответов НЕ настроен - кнопки ведут напрямую)")\n`;
                                            }
                                        }
                                    }
                                });

                                // Если условие не выполнено - показываем основную клавиатуру
                                code += `${bodyIndent}if not conditional_met:\n`;
                                code += `${bodyIndent}    # Условие не выполнено - показываем основное сообщение\n`;
                                code += `${bodyIndent}    # ИСПяАВЛЕяИЕ: яя узла еять reply кнопки - показяваем их вместо ожидания тттекста\n`;
                                code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;

                                // Добавляем кнопки для reply клавиатуры
                                targetNode.data.buttons.forEach((btn: Button) => {
                                    if (btn.action === "contact" && btn.requestContact) {
                                        code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                                    } else if (btn.action === "location" && btn.requestLocation) {
                                        code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                                    } else {
                                        code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                                    }
                                });

                                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                                code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                                code += `${bodyIndent}    # Заменяем все переменные в тексте, используя all_user_vars\n`;
                                code += `${bodyIndent}    text = replace_variables_in_text(text, all_user_vars)\n`;
                                code += `${bodyIndent}    await message.answer(text, reply_markup=keyboard)\n`;
                                code += `${bodyIndent}    logging.info(f"✅ Показана основная reply клавиатура для узла ${targetNode.id}")\n`;

                                // Настройка ожидания ввода для основной клавиатуры
                                if (targetNode.data.enableTextInput === true || targetNode.data.collectUserInput === true) {
                                    // ИСПРАВЛЕНИЕ: Используем массив modes для поддержки и кнопок и тттекста
                                    const hasReplyButtons = targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0;
                                    const modes: string[] = [];
                                    if (hasReplyButtons) modes.push('button');
                                    if (targetNode.data.enableTextInput === true || !hasReplyButtons) modes.push('text');
                                    const modesStr = modes.map(m => `"${m}"`).join(', ');
                                    const primaryType = modes[0];

                                    code += `${bodyIndent}    # Настраиваем ожидание ввода для message узла с reply кнопками\n`;
                                    code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
                                    code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
                                    code += `${bodyIndent}        "type": "${primaryType}",\n`;
                                    code += `${bodyIndent}        "modes": [${modesStr}],\n`;
                                    code += `${bodyIndent}        "variable": "${inputVariable}",\n`;
                                    code += `${bodyIndent}        "save_to_database": True,\n`;
                                    code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
                                    code += `${bodyIndent}        "next_node_id": "${inputTargetNodeId}",\n`;
                                    code += `${bodyIndent}        "min_length": 0,\n`;
                                    code += `${bodyIndent}        "max_length": 0,\n`;
                                    code += `${bodyIndent}        "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
                                    code += `${bodyIndent}        "success_message": ""\n`;
                                    code += `${bodyIndent}    }\n`;
                                    const modesForLog = modes.map(m => `'${m}'`).join(', ');
                                    code += `${bodyIndent}    logging.info(f"✅ Состояние ожидания настроено: modes=[${modesForLog}] для переменной ${inputVariable} (узел ${targetNode.id})")`;
                                    code += '\n';
                                }
                            } else {
                                // Нет условных сообщений - стандартная обработка
                                code += `${bodyIndent}# ИСПРАВЛЕНИЕ: У узла есть reply кнопки - показываем их вместо ожидания тттекста\n`;
                                code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

                                // Добавляем кнопки для reply клавиатуры
                                targetNode.data.buttons.forEach((btn: Button) => {
                                    if (btn.action === "contact" && btn.requestContact) {
                                        code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                                    } else if (btn.action === "location" && btn.requestLocation) {
                                        code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                                    } else {
                                        code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                                    }
                                });

                                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                                code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                                code += `${bodyIndent}# Заменяем все переменные в тексте, используя all_user_vars\n`;
                                code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars)\n`;
                                code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                                code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для узла ${targetNode.id} с collectUserInput")\n`;

                                // ИСПРАВЛЕНИЕ: Если включен сбор ввода, настраиваем ожидание даже при наличии кнопок
                                if (targetNode.data.enableTextInput === true || targetNode.data.enablePhotoInput === true ||
                                    targetNode.data.enableVideoInput === true || targetNode.data.enableAudioInput === true ||
                                    targetNode.data.enableDocumentInput === true || targetNode.data.collectUserInput === true) {
                                    code += `${bodyIndent}# Настраиваем ожидание ввода для message узла с reply кнопками (используем универсальную функцию)\n`;
                                    if (targetNode && targetNode.data) {
                                        code += generateWaitingStateCode(targetNode, bodyIndent);
                                    }
                                }
                            }
                        } else {
                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                            code += `${bodyIndent}# Заменяем все переменные в тексте, используя all_user_vars\n`;
                            code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars)\n`;
                            code += `${bodyIndent}await message.answer(text)\n`;

                            // Настраиваем ожидание ввода ТОЛЬКО если нет кнопок (используем универсальную функцию)
                            code += `${bodyIndent}# Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)\n`;
                            if (targetNode && targetNode.data) {
                                code += generateWaitingStateCode(targetNode, bodyIndent);
                            }
                        }
                    } else {
                        // Если узел не собирает ввод, проверяем есть ли inline или reply кнопки
                        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            code += `${bodyIndent}# Создаем inline клавиатуру\n`;
                            code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

                            // Добавляем кнопки
                            targetNode.data.buttons.forEach((btn: Button) => {
                                if (btn.action === "goto" && btn.target) {
                                    const callbackData = `${btn.target}`;
                                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                                } else if (btn.action === "url" && btn.url) {
                                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
                                } else if (btn.action === "command" && btn.target) {
                                    // КРИТИЧяяСКОЕ ИСПРАВЛЕНИЕ: Добавляем яоддержку кнопок команд
                                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                                    code += `${bodyIndent}logging.info(f"Создана кнопка команды: ${btn.text} -> ${commandCallback}")\n`;
                                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                                }
                            });

                            // ВОССТАНОВzzЕНИЕ: Добавzzяем умzzое рzzzсположение кнопок по колонкам
                            const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                            code += `${bodyIndent}builder.adjust(${columns})\n`;
                            code += `${bodyIndent}keyboard = builder.as_markup()\n`;
                            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            code += `${bodyIndent}# Создаем reply клавиатуру\n`;
                            code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

                            // Добавляем кнопки для reply клавиатуры
                            targetNode.data.buttons.forEach((btn: Button) => {
                                if (btn.action === "contact" && btn.requestContact) {
                                    code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                                } else if (btn.action === "location" && btn.requestLocation) {
                                    code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                                } else {
                                    code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                                }
                            });

                            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                            code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                            code += `${bodyIndent}# Заменяем все переменные в тексте, используя all_user_vars\n`;
                            code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars)\n`;
                            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                            code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для переходного узла")\n`;
                        } else {
                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                            code += `${bodyIndent}# Заменяем все переменные в тексте, используя all_user_vars\n`;
                            code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars)\n`;
                            code += `${bodyIndent}await message.answer(text)\n`;
                        }

                        // Очищаем состояние ожидания ввода после успешного перехода для message узлов без сбора ввода
                        if (!targetNode.data.collectUserInput) {
                            code += `${bodyIndent}# НЕ отправляем сообщение об успехе здесь - это делается в старом формате\n`;
                            code += `${bodyIndent}# Очищаем сястояние ожидания ввода после уяпеянояо перехода\n`;
                            code += `${bodyIndent}if "waiting_for_input" in user_data[user_id]:\n`;
                            code += `${bodyIndent}    del user_data[user_id]["waiting_for_input"]\n`;
                            code += `${bodyIndent}\n`;
                            code += `${bodyIndent}logging.info("✅ Переход к следующему уялу выполнен успешно")\n`;
                        }

                        // АВТОПЕРЕХОД: Если у узля есть autoTransitionTo, сразу вызываем callback обработчик
                        if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                            // Проверяяям, нужно ли выполнять автопереход - только если collectUserInput=true
                            if (targetNode.data.collectUserInput !== false) {
                                const autoTargetId = targetNode.data.autoTransitionTo;
                                const autoSafeFunctionName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
                                code += `${bodyIndent}\n`;
                                code += `${bodyIndent}# ⚡ Автопереход к узлу ${autoTargetId} (только если collectUserInput=true)\n`;
                                code += `${bodyIndent}logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                                code += `${bodyIndent}import types as aiogram_types\n`;
                                code += `${bodyIndent}async def noop(*args, **kwargs):\n`;
                                code += `${bodyIndent}    return None\n`;
                                code += `${bodyIndent}fake_message = aiogram_types.SimpleNamespace(\n`;
                                code += `${bodyIndent}    chat=aiogram_types.SimpleNamespace(id=message.from_user.id),\n`;
                                code += `${bodyIndent}    message_id=message.message_id,\n`;
                                code += `${bodyIndent}    delete=noop,\n`;
                                code += `${bodyIndent}    edit_text=noop,\n`;
                                code += `${bodyIndent}    answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)\n`;
                                code += `${bodyIndent})\n`;
                                code += `${bodyIndent}fake_callback = aiogram_types.SimpleNamespace(\n`;
                                code += `${bodyIndent}    id="auto_transition",\n`;
                                code += `${bodyIndent}    from_user=message.from_user,\n`;
                                code += `${bodyIndent}    chat_instance="",\n`;
                                code += `${bodyIndent}    data="${autoTargetId}",\n`;
                                code += `${bodyIndent}    message=fake_message,\n`;
                                code += `${bodyIndent}    answer=noop\n`;
                                code += `${bodyIndent})\n`;
                                code += `${bodyIndent}await handle_callback_${autoSafeFunctionName}(fake_callback)\n`;
                            } else {
                                code += `${bodyIndent}# Автопереход пропущен: collectUserInput=false\n`;
                                code += `${bodyIndent}logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                                code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
                            }
                        } else {
                            code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
                        }
                    }
                } // Закрываем блок else для allowMultipleSelection
            } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
                const inputPrompt = formatTextForPython(targetNode.data.messageText || "Введите ваш ответ:");
                code += `${bodyIndent}prompt_text = ${inputPrompt}\n`;
                code += `${bodyIndent}await message.answer(prompt_text)\n`;

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяяям collectUserInput перед установкой waiting_for_input
                const msgNodeCollectInput = targetNode.data.collectUserInput === true ||
                    targetNode.data.enableTextInput === true ||
                    targetNode.data.enablePhotoInput === true ||
                    targetNode.data.enableVideoInput === true ||
                    targetNode.data.enableAudioInput === true ||
                    targetNode.data.enableDocumentInput === true;

                if (msgNodeCollectInput) {
                    code += `${bodyIndent}# Устанавливаея нояяое ожидание ввода (collectUserInput=true)\n`;
                    code += `${bodyIndent}user_data[user_id]["waiting_for_input"] = {\n`;
                    code += `${bodyIndent}    "type": "${targetNode.data.inputType || 'text'}",\n`;
                    code += `${bodyIndent}    "variable": "${targetNode.data.inputVariable || 'user_response'}",\n`;
                    code += `${bodyIndent}    "save_to_database": True,\n`;
                    code += `${bodyIndent}    "node_id": "${targetNode.id}",\n`;
                    const nextConnection = connections.find(conn => conn.source === targetNode.id);
                    if (nextConnection) {
                        code += `${bodyIndent}    "next_node_id": "${nextConnection.target}",\n`;
                    } else {
                        code += `${bodyIndent}    "next_node_id": None,\n`;
                    }
                    code += `${bodyIndent}    "min_length": ${targetNode.data.minLength || 0},\n`;
                    code += `${bodyIndent}    "max_length": ${targetNode.data.maxLength || 0},\n`;
                    code += `${bodyIndent}    "retry_message": "Пожаляйста, попробуйте еще раз.",\n`;
                    code += `${bodyIndent}    "success_message": ""\n`;
                    code += `${bodyIndent}}\n`;
                } else {
                    code += `${bodyIndent}# Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                }
                code += `${bodyIndent}break  # Выходим из цикла после настройки ожидания ввода\n`;
            } else if (targetNode.type === 'command') {
                // Для узлов команд яызываем соответствующий обработчик
                const commandName = targetNode.data.command?.replace('/', '') || 'unknown';
                const handlerName = `${commandName}_handler`;
                code += `${bodyIndent}# Выполняяем команду ${targetNode.data.command}\n`;
                code += `${bodyIndent}from types import SimpleNamespace\n`;
                code += `${bodyIndent}fake_message = SimpleNamespace()\n`;
                code += `${bodyIndent}fake_message.from_user = message.from_user\n`;
                code += `${bodyIndent}fake_message.chat = message.chat\n`;
                code += `${bodyIndent}fake_message.date = message.date\n`;
                code += `${bodyIndent}fake_message.answer = message.answer\n`;
                code += `${bodyIndent}await ${handlerName}(fake_message)\n`;
                code += `${bodyIndent}break  # Выходим из цикла после вяполяеняя команды\n`;
            } else {
                code += `${bodyIndent}logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
                code += `${bodyIndent}break  # Выходим из цикла для неизвестного типа узла\n`;
            }
        });

        code += '                        else:\n';
        code += '                            logging.warning(f"Неизвестный узел: {current_node_id}")\n';
        code += '                            break  # Выходим из цикла при неизвестном узле\n';
    } else {
        code += '                        # No nodes available for navigation\n';
        code += '                        logging.warning(f"Нет доступных узлов для навигации")\n';
        code += '                        break\n';
    }
    return code;
}
