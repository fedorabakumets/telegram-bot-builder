import { Button } from './bot-generator';
import { calculateOptimalColumns, formatTextForPython, generateButtonText, toPythonBoolean } from './format';
import { generateInlineKeyboardCode } from './Keyboard';

export function multiselectcheck(code: string, nodes: any[], allNodeIds: any[]) {
    code += '    # Проверяем, находится ли пользователь в режиме множественного выбора\n';
    code += '    if user_id in user_data and "multi_select_node" in user_data[user_id]:\n';
    code += '        node_id = user_data[user_id]["multi_select_node"]\n';
    code += '        multi_select_type = user_data[user_id].get("multi_select_type", "selection")\n';
    code += '        user_input = message.text\n';
    code += '        logging.info(f"🔍 Проверяем режим множественного выбора для пользователя {user_id}: node_id={node_id}, type={multi_select_type}")\n';
    code += '        \n';

    // Добавляем обработку кнопок "Готово" для разных узлов
    nodes.forEach((node, _idx) => {
        if (node.data && node.data.allowMultipleSelection) {
            const continueText = node.data.continueButtonText || 'Готово';
            code += `        if node_id == "${node.id}" and user_input == "${continueText}":\n`;
            code += `            # Завершение множественного выбора для узла ${node.id}\n`;
            code += `            selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n`;
            code += `            if selected_options:\n`;
            code += `                selected_text = ", ".join(selected_options)\n`;
            code += `                await save_user_data_to_db(user_id, "${node.data.multiSelectVariable || `multi_select_${node.id}`}", selected_text)\n`;
            code += `            \n`;
            code += `            # Очищаем состояние\n`;
            code += `            user_data[user_id].pop(f"multi_select_{node_id}", None)\n`;
            code += `            user_data[user_id].pop("multi_select_node", None)\n`;
            code += `            user_data[user_id].pop("multi_select_type", None)\n`;
            code += `            user_data[user_id].pop("multi_select_variable", None)\n`;
            code += `            \n`;

            if (node.data.continueButtonTarget) {
                const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
                if (targetNode) {
                    code += `            # Переход к следующему узлу\n`;
                    if (targetNode.type === 'message') {
                        const messageText = targetNode.data.messageText || "Продолжение...";
                        const formattedText = formatTextForPython(messageText);
                        code += `            text = ${formattedText}\n`;

                        // Заменяем переменные в тексте
                        code += '            user_vars = await get_user_from_db(user_id)\n';
                        code += '            if not user_vars:\n';
                        code += '                user_vars = user_data.get(user_id, {})\n';
                        code += '            if not isinstance(user_vars, dict):\n';
                        code += '                user_vars = {}\n';
                        code += '            # Создаем объединенный словарь переменных\n';
                        code += '            all_user_vars = {}\n';
                        code += '            if user_vars and isinstance(user_vars, dict):\n';
                        code += '                all_user_vars.update(user_vars)\n';
                        code += '            local_user_vars = user_data.get(user_id, {})\n';
                        code += '            if isinstance(local_user_vars, dict):\n';
                        code += '                all_user_vars.update(local_user_vars)\n';
                        code += '            # Заменяем переменные в тексте\n';
                        code += '            text = replace_variables_in_text(text, all_user_vars)\n';

                        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
                            code += '            await message.answer(text, reply_markup=keyboard)\n';
                        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                            code += '            builder = ReplyKeyboardBuilder()\n';
                            targetNode.data.buttons.forEach((btn: Button) => {
                                code += `            builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                            });
                            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                            code += `            keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                            code += '            await message.answer(text, reply_markup=keyboard)\n';
                        } else {
                            code += '            await message.answer(text)\n';
                        }
                    } else if (targetNode.type === 'command') {
                        const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
                        code += `            await handle_command_${safeCommandName}(message)\n`;
                    }
                }
            }
            code += `            return\n`;
            code += `        \n`;
        }
    });

    // Обработка кнопок выбора для разных узлов
    nodes.forEach((node) => {
        if (node.data && node.data.allowMultipleSelection && node.data.buttons) {
            const selectionButtons = node.data.buttons.filter((btn: any) => btn.action === 'selection');

            if (selectionButtons.length > 0) {
                code += `        if node_id == "${node.id}":\n`;

                selectionButtons.forEach((button: any) => {
                    code += `            # Проверяем текст кнопки, убирая галочку при необходимости\n`;
                    code += `            clean_user_input = user_input.replace("✅ ", "").strip()\n`;
                    code += `            if clean_user_input == "${button.text}":\n`;
                    code += `                if f"multi_select_{node_id}" not in user_data[user_id]:\n`;
                    code += `                    user_data[user_id][f"multi_select_{node_id}"] = []\n`;
                    code += `                \n`;
                    code += `                selected_list = user_data[user_id][f"multi_select_{node_id}"]  # Variable used below to manage selections\n`;
                    code += `                if "${button.text}" in selected_list:\n`;
                    code += `                    selected_list.remove("${button.text}")\n`;
                    code += `                    await message.answer("❌ Убрано: ${button.text}")\n`;
                    code += `                else:\n`;
                    code += `                    selected_list.append("${button.text}")\n`;
                    code += `                    await message.answer("✅ Выбрано: ${button.text}")\n`;
                    code += `                \n`;
                    code += `                # Обновляем клавиатуру с галочками\n`;
                    code += `                builder = ReplyKeyboardBuilder()  # Variable used for building keyboard\n`;
                    code += `                \n`;

                    // Добавляем кнопки выбора с галочками
                    node.data.buttons.filter((btn: any) => btn.action === 'selection').forEach((selBtn: any) => {
                        code += `                builder.add(KeyboardButton(text=f"{'✅ ' if '${selBtn.text}' in selected_list else ''}${selBtn.text}"))\n`;
                    });

                    // Добавляем кнопку "Готово" если есть кнопки выбора
                    if (node.data.buttons.some((btn: any) => btn.action === 'selection')) {
                        const continueText = node.data.continueButtonText || 'Готово';
                        code += `                builder.add(KeyboardButton(text="${continueText}"))  # используем builder\n`;
                    }

                    // Добавляем обычные кнопки
                    node.data.buttons.filter((btn: any) => btn.action !== 'selection').forEach((regBtn: any) => {
                        code += `                builder.add(KeyboardButton(text="${regBtn.text}"))  # используем builder\n`;
                    });

                    // Применяем настройки клавиатуры
                    const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard !== false);
                    const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard === true);

                    // Вычисляем оптимальное количество колонок для клавиатуры
                    const allButtons = [...node.data.buttons];
                    const columns = calculateOptimalColumns(allButtons, node.data);
                    code += `                builder.adjust(${columns})\n`;
                    code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})  # builder variable is used here\n`;

                    // Отправляем сообщение с обновленной клавиатурой
                    const messageText = node.data.messageText || "Выберите опции:";
                    const formattedText = formatTextForPython(messageText);
                    code += `                text = ${formattedText}\n`;

                    // Заменяем пе��еменные в тексте
                    code += '                user_vars = await get_user_from_db(user_id)\n';
                    code += '                if not user_vars:\n';
                    code += '                    user_vars = user_data.get(user_id, {})\n';
                    code += '                if not isinstance(user_vars, dict):\n';
                    code += '                    user_vars = {}\n';
                    code += '                # Создаем объединенный словарь переменных\n';
                    code += '                all_user_vars = {}\n';
                    code += '                if user_vars and isinstance(user_vars, dict):\n';
                    code += '                    all_user_vars.update(user_vars)\n';
                    code += '                local_user_vars = user_data.get(user_id, {})\n';
                    code += '                if isinstance(local_user_vars, dict):\n';
                    code += '                    all_user_vars.update(local_user_vars)\n';
                    code += '                # Заменяем переменные в тексте\n';
                    code += '                text = replace_variables_in_text(text, all_user_vars)\n';

                    code += `                await message.answer(text, reply_markup=keyboard)\n`;
                    code += `                return\n`;
                    code += `            \n`;
                });
            }
        }
    });

    // Обработка обычных кнопок (goto) в режиме множественного выбора
    code += '    # Обработка обычных кнопок (goto) в режиме множественного выбора\n';
    code += '    if user_id in user_data and "multi_select_node" in user_data[user_id]:\n';
    code += '        node_id = user_data[user_id]["multi_select_node"]\n';
    code += '        user_input = message.text\n';
    code += '        \n';

    // Добавляем обработку кнопок с действием "goto"
    nodes.forEach((node) => {
        if (node.data && node.data.allowMultipleSelection && node.data.buttons && Array.isArray(node.data.buttons)) {
            const gotoButtons = node.data.buttons.filter((btn: any) => btn.action === 'goto' && btn.target);

            if (gotoButtons.length > 0) {
                code += `        if node_id == "${node.id}":\n`;

                gotoButtons.forEach((button: any) => {
                    const targetNode = nodes.find((n: any) => n.id === button.target);
                    if (targetNode) {
                        code += `            if user_input == "${button.text}":\n`;
                        code += `                # Сохраняем текущее состояние выбора перед переходом\n`;
                        code += `                selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n`;
                        code += `                if selected_options:\n`;
                        code += `                    selected_text = ", ".join(selected_options)\n`;
                        code += `                    await save_user_data_to_db(user_id, "${node.data.multiSelectVariable || `multi_select_${node.id}`}", selected_text)\n`;
                        code += `                # Очищаем состояние множественного выбора перед переходом\n`;
                        code += `                user_data[user_id].pop(f"multi_select_{node_id}", None)\n`;
                        code += `                user_data[user_id].pop("multi_select_node", None)\n`;
                        code += `                user_data[user_id].pop("multi_select_type", None)\n`;
                        code += `                user_data[user_id].pop("multi_select_variable", None)\n`;

                        if (targetNode.type === 'command') {
                            const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
                            code += `                await handle_command_${safeCommandName}(message)\n`;
                        } else {
                            // Для обычных узлов создаем фиктивный callback и вызываем соответствующий обработчик
                            code += '                import types as aiogram_types\n';
                            code += '                fake_callback = aiogram_types.SimpleNamespace(\n';
                            code += '                    id="multi_select_goto",\n';
                            code += '                    from_user=message.from_user,\n';
                            code += '                    chat_instance="",\n';
                            code += `                    data="${button.target}",\n`;
                            code += '                    message=message,\n';
                            code += '                    answer=lambda *args, **kwargs: None\n';
                            code += '                )\n';
                            code += `                await handle_callback_${button.target.replace(/[^a-zA-Z0-9_]/g, '_')}(fake_callback)\n`;
                        }
                        code += `                return\n`;
                    }
                });
            }
        }
    });

    code += '    \n';
    code += '    # Если пользователь не находится в режиме множественного выбора, продолжаем стандартную обработку\n';
    return code;
}
