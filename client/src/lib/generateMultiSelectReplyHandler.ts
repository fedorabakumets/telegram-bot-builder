import { Node } from '../../../shared/schema';
import { formatTextForPython } from './format';
import { generateInlineKeyboardCode } from './Keyboard';

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
    code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';
    code += '        node_id = user_data[user_id]["multi_select_node"]\n';
    code += '        \n';

    // Проверяем, является ли это кнопкой завершения
    multiSelectNodes.forEach((node: Node) => {
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

    return code;
}