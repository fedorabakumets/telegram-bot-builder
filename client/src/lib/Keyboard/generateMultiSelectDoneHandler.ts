import { Node, Button } from '@shared/schema';
import { formatTextForPython, generateUniqueShortId, toPythonBoolean } from '../format';
import { generateInlineKeyboardCode } from '.';

export function generateMultiSelectDoneHandler(
    nodes: Node[],
    multiSelectNodes: Node[],
    allNodeIds: string[],
    isLoggingEnabled: () => boolean,
): string {
    let code = '';
    if (multiSelectNodes.length > 0) {
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

        multiSelectNodes.forEach((node: Node) => {
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
                    code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Переходим к узлу '${continueButtonTarget}'")\n`;
                    code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Тип целевого узла: ${targetNode?.type || 'неизвестно'}")\n`;
                    code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: allowMultipleSelection: ${targetNode?.data?.allowMultipleSelection || false}")\n`;
                    code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Есть ли кнопки: ${targetNode?.data?.buttons?.length || 0}")\n`;
                    code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: keyboardType: ${targetNode?.data?.keyboardType || 'нет'}")\n`;

                    if (targetNode.data.allowMultipleSelection) {
                        const multiSelectKeyboardType = targetNode.data.keyboardType || "inline";
                        code += `        # Узел ${continueButtonTarget} поддерживает множественный выбор - сохраняем состояние\n`;
                        code += `        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Инициализируем множественный выбор для узла ${targetNode.id}")\n`;
                        code += `        if user_id not in user_data:\n`;
                        code += `            user_data[user_id] = {}\n`;
                        code += `        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
                        code += `        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
                        code += `        user_data[user_id]["multi_select_type"] = "${multiSelectKeyboardType}"\n`;
                        code += `        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Состояние множественного выбора установлено для узла ${targetNode.id}")\n`;
                    }

                    if (targetNode.type === 'message') {
                        const messageText = targetNode.data.messageText || "Выберите опции:";
                        const formattedText = formatTextForPython(messageText);

                        code += `        # Отправляем сообщение для следующего узла с ожиданием пользовательского ввода\n`;
                        code += `        text = ${formattedText}\n`;
                        code += `        \n`;
                        code += `        # Инициализируем состояние множественного выбора для следующего узла\n`;

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
                            code += `            user_data_field = user_record.get("user_data", {})
`;
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
                            code += `                    saved_selections = [sel.strip() for sel in var_data.split(",") if sel.strip()]
`;
                            code += `        \n`;
                            const multiSelectKeyboardType = targetNode.data.keyboardType || "reply";
                            code += `        # Инициализируем состояние с восстановленными значениями\n`;
                            code += `        user_data[user_id]["multi_select_${targetNode.id}"] = saved_selections.copy()\n`;
                            code += `        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
                            code += `        user_data[user_id]["multi_select_type"] = "${multiSelectKeyboardType}"\n`;
                            code += `        user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
                            code += `        \n`;

                            if (multiSelectKeyboardType === 'reply') {
                                code += `        builder = ReplyKeyboardBuilder()\n`;
                                targetNode.data.buttons.forEach((button: Button) => {
                                    if (button.action === 'selection') {
                                        const cleanText = button.text.replace(/"/g, '\\"');
                                        code += `        # Кнопка выбора: ${cleanText}\n`;
                                        code += `        selected_mark = "✅ " if "${cleanText}" in user_data[user_id]["multi_select_${targetNode.id}"] else ""\n`;
                                        code += `        button_text = f"{selected_mark}${cleanText}"\n`;
                                        code += `        builder.add(KeyboardButton(text=button_text))\n`;
                                    }
                                });
                                const continueText = targetNode.data.continueButtonText || 'Готово';
                                code += `        builder.add(KeyboardButton(text="${continueText}"))\n`;
                                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard !== false);
                                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard === true);
                                code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                                code += `        \n`;
                                code += `        await bot.send_message(user_id, text, reply_markup=keyboard)\n`;
                            } else {
                                code += `        builder = InlineKeyboardBuilder()\n`;
                                targetNode.data.buttons.forEach((button: Button, index: number) => {
                                    if (button.action === 'selection') {
                                        const cleanText = button.text.replace(/"/g, '\\"');
                                        const callbackData = `ms_${generateUniqueShortId(targetNode.id, allNodeIds || [])}_${(button.target || button.id || `btn${index}`).slice(-8)}`.replace(/[^a-zA-Z0-9_]/g, '_');
                                        code += `        # Кнопка с галочкой: ${cleanText}\n`;
                                        code += `        selected_mark = "✅ " if "${cleanText}" in user_data[user_id]["multi_select_${targetNode.id}"] else ""\n`;
                                        code += `        button_text = f"{selected_mark}${cleanText}"\n`;
                                        code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data="${callbackData}"))\n`;
                                    }
                                });
                                code += `        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_${targetNode.id}"))\n`;
                                code += `        builder.adjust(2)\n`;
                                code += `        keyboard = builder.as_markup()\n`;
                                code += `        \n`;
                                code += `        await callback_query.message.answer(text, reply_markup=keyboard)\n`;
                            }
                            code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено, ЗАВЕРШАЕМ функцию")\n`;
                            code += `        return\n`;
                        } else {
                            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                                if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
                                code += `        # Добавляем клавиатуру для целевого узла\n`;
                                code += `        # Загружаем пользовательские данные для клавиатуры\n`;
                                code += `        user_vars = await get_user_from_db(user_id)\n`;
                                code += `        if not user_vars:\n`;
                                code += `            user_vars = user_data.get(user_id, {})
`;
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
    }
    return code;
}
