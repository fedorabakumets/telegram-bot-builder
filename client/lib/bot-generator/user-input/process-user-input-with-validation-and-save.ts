/**
 * @fileoverview Генерация сохранения пользовательского ввода с валидацией
 *
 * Модуль создаёт Python-код для сохранения введённых пользователем данных
 * с поддержкой валидации и различных режимов сохранения.
 *
 * @module bot-generator/user-input/process-user-input-with-validation-and-save
 */

import { generateSaveToDatabaseTable } from '../database/generateSaveToDatabaseTable';

/**
 * Генерирует Python-код для сохранения пользовательского ввода с валидацией
 * @param nodes - Массив узлов для генерации
 * @param code - Исходный код для добавления
 * @returns Обновлённый код
 */
export function processUserInputWithValidationAndSave(nodes: any[], code: string) {
    const inputNodes = (nodes || []).filter(node => node.data.collectUserInput);
    
    // Обработка для каждого узла с collectUserInput
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

        // Генерируем код сохранения с учётом appendVariable
        const saveCode = generateSaveToDatabaseTable({
          variableName,
          valueExpression: 'response_data',
          appendExpression: String(node.data.appendVariable || false),
          indent: '            ',
          isVariableNameDynamic: false
        });
        code += saveCode;
        code += `            \n`;
        code += `            # Обновляем all_user_vars после сохранения переменной\n`;
        code += `            all_user_vars["${variableName}"] = user_data[user_id]["${variableName}"]\n`;
        code += `            \n`;
        code += `            logging.info(f"✅ Данные сохранены в БД: {variableName} = {response_data} (пользователь {user_id}, узел {waiting_node_id})")\n`;
        code += `            \n`;
        code += `            \n`;
        code += `            logging.info(f"Получен пользовательский ввод: ${variableName} = {user_text}, узел: {waiting_node_id}")\n`;
    });
    return code;
}
