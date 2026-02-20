import { processInputTargetNavigation } from './processInputTargetNavigation';
import { generateSaveToUserIdsCode } from './generate/generateSaveToUserIds';

export function processUserInputWithValidationAndSave(nodes: any[], code: string, allNodeIds: any[]) {
    const inputNodes = (nodes || []).filter(node => node.data.collectUserInput);
    code += `        logging.info(f"DEBUG old format: checking inputNodes: ${inputNodes.map(n => n.id).join(', ')}")\n`;
    code += `        logging.info(f"DEBUG: waiting_node_id = {waiting_node_id}")\n`;
    code += `        logging.info(f"DEBUG: waiting_config = {waiting_config}")\n`;
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
        code += `                logging.info(f"✅ Данные сохранены в БД: ${variableName} = {user_text} (пользователь {user_id}, узел {waiting_node_id})")\n`;
        code += `            else:\n`;
        code += `                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
        code += `            \n`;

        // Сохранение ID в таблицу user_ids для рассылки
        if (node.data.saveToUserIds) {
            const saveCode = generateSaveToUserIdsCode(node, '            ');
            code += `\n${saveCode}\n`;
        }

        code += `            \n`;
        code += `            logging.info(f"Получен пользовательский ввод: ${variableName} = {user_text}, узел: {waiting_node_id}")\n`;
        code += `            \n`;

        // Навигация к следующему узлу
        code = processInputTargetNavigation(node, code, nodes, allNodeIds);
    });
    return code;
}
