import { formatTextForPython } from './format';
import { generateInlineKeyboardCode } from './Keyboard';
import { generateUniversalVariableReplacement } from './utils';

export function processInputTargetNavigation(node: any, code: string, nodes: any[], allNodeIds: any[]) {
    if (node.data.inputTargetNodeId) {
        code += `            # Переходим к следующему узлу\n`;
        code += `            try:\n`;

        // Найдем целевой узел для навигации
        const targetNode = nodes.find(n => n.id === node.data.inputTargetNodeId);
        if (targetNode) {
            if (targetNode.type === 'message') {
                // Для message узлов отправляем сообщение напрямую
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
                    code += `                    "success_message": ""\n`;
                    code += `                }\n`;
                    code += `                \n`;
                }

                if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                    // Используем универсальную функцию для создания inline клавиатуры
                    code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                    code += `                # Заменяем все переменные в тексте\n`;
                    code += `                text = replace_variables_in_text(text, user_vars)\n`;
                    code += `                await message.answer(text, reply_markup=keyboard)\n`;
                } else {
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                    code += `                # Заменяем все переменные в тексте\n`;
                    code += `                text = replace_variables_in_text(text, user_vars)\n`;
                    code += `                await message.answer(text)\n`;
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем состояние ТОЛЬКО если целевой узел НЕ собирает ввод
                if (!targetNode.data.collectUserInput) {
                    code += `                # Очищаем состояние ожидания ввода после успешного перехода\n`;
                    code += `                if "waiting_for_input" in user_data[user_id]:\n`;
                    code += `                    del user_data[user_id]["waiting_for_input"]\n`;
                    if (node.data.inputType) {
                        code += `                if "input_type" in user_data[user_id]:\n`;
                        code += `                    del user_data[user_id]["input_type"]\n`;
                    }
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
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `                # Заменяем все переменные в тексте\n`;
                        code += `                text = replace_variables_in_text(text, user_vars)\n`;
                        code += `                await message.answer(text, reply_markup=keyboard)\n`;
                    } else {
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `                # Заменяем все переменные в тексте\n`;
                        code += `                text = replace_variables_in_text(text, user_vars)\n`;
                        code += `                await message.answer(text)\n`;
                    }
                    code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
                } else {
                    // Для обычных узлов используем обычную навигацию
                    const messageText = targetNode.data.messageText || 'Сообщение';
                    const formattedText = formatTextForPython(messageText);
                    code += `                # Обычный узел - отправляем сообщение\n`;
                    code += `                text = ${formattedText}\n`;

                    // Добавляем замену переменных
                    code += '                user_data[user_id] = user_data.get(user_id, {})\n';
                    code += generateUniversalVariableReplacement('                ');

                    // Создаем inline клавиатуру если есть кнопки
                    if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                        code += `                await message.answer(text, reply_markup=keyboard)\n`;
                    } else {
                        code += '                await message.answer(text)\n';
                    }
                    code += `                logging.info(f"✅ Ввод навигация к обычному узлу: ${targetNode.id}")\n`;
                }
            }
        } else {
            // Если целевой узел не найден, добавляем заглушку
            code += `                logging.warning(f"Целевоzz узел {node.data.inputTargetNodeId} не найдеzz")\n`;
            code += `                await message.answer("❌ Ошибка перехода: целевой узел не найден")\n`;
        }

        code += `            except Exception as e:\n`;
        code += `                logging.error(f"Ошябка при переходе к следующему узлу: {e}")\n`;
        code += `            return\n`;
    } else {
        // Если inputTargetNodeId равен null, это конец цепочки - это нормально
        code += `            # Конец цепочки ввода - завершаем обработку\n`;
        code += `            logging.info("Завершена цепочка сбора пользовательских данных")\n`;
        code += `            return\n`;
    }
    return code;
}
