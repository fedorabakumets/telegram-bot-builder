import { Node } from '@shared/schema';
import { formatTextForPython, toPythonBoolean } from '../format';
import { generateInlineKeyboardCode } from '.';
import { calculateOptimalColumns } from './calculateOptimalColumns';

/**
 * Checks if there are any nodes with multi-select reply buttons.
 * @param nodes - The array of nodes to check.
 * @returns True if at least one multi-select reply node exists, false otherwise.
 */
const hasMultiSelectReplyNodes = (nodes: Node[]): boolean => {
    return nodes.some(node => node.data.keyboardType === 'reply' && node.data.allowMultipleSelection);
};

/**
 * Generates the Python code for a handler that manages multi-select reply buttons.
 * @param nodes - All nodes in the bot flow.
 * @param allNodeIds - An array of all node IDs.
 * @param isLoggingEnabled - A function to check if logging is enabled.
 * @returns A string containing the generated Python code for the handler.
 */
export function generateMultiSelectReplyHandler(
    nodes: Node[],
    allNodeIds: string[],
    isLoggingEnabled: () => boolean,
): string {
    let code = '';

    if (!hasMultiSelectReplyNodes(nodes || [])) {
        return '';
    }
    
    const multiSelectNodes = (nodes || []).filter(
        (node: Node) => node.data.allowMultipleSelection && node.data.keyboardType === 'reply'
    );

    code += '# Обработчик для reply кнопок множественного выбора\n';
    code += '@dp.message()\n';
    code += 'async def handle_multi_select_reply(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    user_input = message.text\n';
    code += '    \n';
    code += '    # Проверяем, находится ли пользователь в режиме множественного выбора reply\n';
    code += '    logging.info(f"🔍 Проверяем режим множественного выбора для пользователя {user_id}: {user_data.get(user_id, {})}")\n';
    code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';
    code += '        node_id = user_data[user_id]["multi_select_node"]\n';
    code += '        \n';

    // Проверяем, является ли это кнопкой завершения
    multiSelectNodes.forEach((node: Node) => {
        const continueText = node.data.continueButtonText || 'Готово';
        const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
        code += `        if node_id == "${node.id}" and user_input == "${continueText}":\n`;
        code += `            # Завершение множественного выбора для узла ${node.id}\n`;
        code += `            selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n`;
        code += `            if selected_options:\n`;
        code += `                selected_text = ", ".join(selected_options)\n`;
        code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
        code += `            \n`;
        code += `            # Очищаем состояние\n`;
        code += `            user_data[user_id].pop(f"multi_select_{node_id}", None)\n`;
        code += `            user_data[user_id].pop("multi_select_node", None)\n`;
        code += `            user_data[user_id].pop("multi_select_type", None)\n`;
        code += `            \n`;

        if (node.data.continueButtonTarget) {
            const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
            if (targetNode) {
                code += `            # Переход к следующему узлу\n`;
                if (targetNode.type === 'message') {
                    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик в reply mode`);
                    const messageText = targetNode.data.messageText || "Продолжение...";
                    const formattedText = formatTextForPython(messageText);
                    code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
                    code += `            text = ${formattedText}\n`;

                    if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для reply mode ${targetNode.id}`);
                        code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для reply mode\n`;
                        code += `            # Загружаем пользовательские данные для клавиатуры\n`;
                        code += `            user_vars = await get_user_from_db(user_id)\n`;
                        code += `            if not user_vars:\n`;
                        code += `                user_vars = user_data.get(user_id, {})
`;
                        code += `            if not isinstance(user_vars, dict):\n`;
                        code += `                user_vars = {}\n`;
                        code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
                        code += `            await message.answer(text, reply_markup=keyboard)\n`;
                    } else {
                        code += `            await message.answer(text)\n`;
                    }
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
    multiSelectNodes.forEach((node: Node) => {
        const selectionButtons = node.data.buttons?.filter((btn: { action: string; }) => btn.action === 'selection') || [];

        if (selectionButtons.length > 0) {
            code += `        if node_id == "${node.id}":\n`;
            selectionButtons.forEach((button: { text: any; }) => {
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
                code += `                # Добавляем кнопки выбора с галочками (используем selected_list)\n`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                node.data.buttons?.filter((btn: { action: string; }) => btn.action === 'selection').forEach((selBtn: { text: string; }) => {
                    code += `                builder.add(KeyboardButton(text=f"{'✅ ' if '${selBtn.text}' in selected_list else ''}${selBtn.text}"))\n`;
                });
                // Добавляем кнопку "Готово" если есть кнопки выбора
                if (node.data.buttons?.some((btn: { action: string; }) => btn.action === 'selection')) {
                    const continueText = node.data.continueButtonText || 'Готово';
                    code += `                builder.add(KeyboardButton(text="${continueText}"))  # используем builder\n`;
                }
                // Добавляем обычные кнопки
                node.data.buttons?.filter((btn: { action: string; }) => btn.action !== 'selection').forEach((regBtn: { text: string; }) => {
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
                code += `                text = """${node.data.messageText || "Выберите опции:"}"""\n`;
                code += `                await message.answer(text, reply_markup=keyboard)\n`;
                code += `                return\n`;
                code += `            \n`;
            });
        }
    });

    code += '    \n';
    code += '    # Обработка обычных кнопок (goto) в режиме множественного выбора\n';
    code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';
    code += '        node_id = user_data[user_id]["multi_select_node"]\n';
    code += '        # Ищем узел, чтобы получить информацию о кнопках\n';

    // Добавляем обработку кнопок с действием "goto"
    multiSelectNodes.forEach((node: Node) => {
        if (node.data.buttons && Array.isArray(node.data.buttons)) {
            const gotoButtons = node.data.buttons.filter((btn: any) => btn.action === 'goto' && btn.target);

            if (gotoButtons.length > 0) {
                code += `        if node_id == "${node.id}":\n`;

                gotoButtons.forEach((button: any) => {
                    const targetNode = nodes.find((n: Node) => n.id === button.target);
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
                            // Проверяем, существует ли целевой узел перед вызовом обработчика
                            const targetExists = nodes.some(n => n.id === button.target);
                            if (targetExists) {
                              code += `                await handle_callback_${button.target.replace(/[^a-zA-Z0-9_]/g, '_')}(fake_callback)\n`;
                            } else {
                              code += `                logging.warning(f"⚠️ Целевой узел не найден: {button.target}, завершаем переход")\n`;
                              code += `                await message.answer("Переход завершен")\n`;
                            }
                        }
                        code += `                return\n`;
                    }
                });
            }
        }
    });

    code += '    \n';
    code += '    # Если пользователь не находится в режиме множественного выбора, передаем дальше по цепочке обработчиков\n';
    code += '    # Проверяем, находится ли пользователь в режиме ожидания ввода\n';
    code += '    if user_id in user_data and "waiting_for_input" in user_data[user_id]:\n';
    code += '        # Пользователь ожидает ввод, но не в режиме множественного выбора - передаем дальше\n';
    code += '        pass\n';
    code += '    else:\n';
    code += '        # Пользователь не в режиме ожидания ввода и не в режиме множественного выбора - передаем дальше\n';
    code += '        pass\n';
    code += '\n';

    return code;
}