/**
 * Модуль для генерации обработчика стартового узла с поддержкой условной логики и изображений
 *
 * Этот модуль предоставляет функцию для создания кода обработчика стартового узла,
 * который может содержать условные сообщения и изображения.
 *
 * @module generateStartNodeHandlerWithConditionalLogicAndImages
 */

import { Button } from '../bot-generator';
import { generateConditionalMessageLogic } from '../Conditional';
import { calculateOptimalColumns, formatTextForPython, generateButtonText, getParseMode, stripHtmlTags } from '../format';
import { generateUniversalVariableReplacement } from '../utils';

/**
 * Генерирует обработчик для стартового узла с поддержкой условной логики и изображений
 *
 * @param {any} targetNode - Узел, для которого генерируется обработчик
 * @param {string} code - Исходный код, в который будет добавлен новый функционал
 * @param {any} actualNodeId - Идентификатор текущего узла
 * @returns {string} Обновленный код с добавленной логикой обработки стартового узла
 */
export function generateStartNodeHandlerWithConditionalLogicAndImages(targetNode: any, code: string, actualNodeId: any) {
    const messageText = targetNode.data.messageText || "Добро пожаловать!";
    const cleanedMessageText = stripHtmlTags(messageText);
    const formattedText = formatTextForPython(cleanedMessageText);
    const parseMode = getParseMode(targetNode.data.formatMode);

    // Добавляем комментарий и формирование текста сообщения
    code += `    # Обрабатываем узел start: ${targetNode.id}\n`;
    code += `    text = ${formattedText}\n`;

    // Применяем универсальную замену переменных
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');

    /**
     * Обработка условных сообщений
     * Если в узле включена поддержка условных сообщений, генерируем соответствующую логику
     */
    if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
        code += '    \n';
        code += '    # Проверка условных сообщений для start узла\n';
        code += '    user_record = await get_user_from_db(user_id)\n';
        code += '    if not user_record:\n';
        code += '        user_record = user_data.get(user_id, {})\n';
        code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
        code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
        code += '    \n';

        // Используем условное сообщение, если доступно, иначе используем стандартное
        code += '    # Используем условное сообщение если есть подходящее условие\n';
        code += '    if "text" not in locals():\n';
        code += `        text = ${formattedText}\n`;
        code += '        # Заменяем переменные в основном тексте, если условие не сработало\n';
        code += '        text = replace_variables_in_text(text, user_vars)\n';
        code += '    \n';
        code += '    # Используем условную клавиатуру если есть\n';
        code += '    # Инициализируем переменную conditional_keyboard, если она не была определена\n';
        code += '    if "conditional_keyboard" not in locals():\n';
        code += '        conditional_keyboard = None\n';
        code += '    if conditional_keyboard is not None:\n';
        code += '        keyboard = conditional_keyboard\n';
        code += '    else:\n';
        code += '        keyboard = None\n';
    } else {
        code += '    \n';
        code += '    # Без условных сообщений - используем обычную клавиатуру\n';
        code += '    keyboard = None\n';
    }

    /**
     * Создание inline клавиатуры для start узла
     * Генерируем клавиатуру только если тип клавиатуры inline и есть кнопки
     */
    if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += '    # Проверяем, есть ли условная клявиаяуяа\n';
        code += '    if keyboard is None:\n';
        code += '        # Создаем inline клавиатуру для start узла\n';
        code += '        builder = InlineKeyboardBuilder()\n';
        targetNode.data.buttons.forEach((btn: Button, index: number) => {
            if (btn.action === "url") {
                code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
            } else if (btn.action === 'goto') {
                // Создаем уникальный callback_data для каждой кнопки
                const baseCallbackData = btn.target || btn.id || 'no_action';
                const callbackData = `${baseCallbackData}_btn_${index}`;
                code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
            } else if (btn.action === 'command') {
                // Для кнопок команд создаем специальную callback_data
                const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
            }
        });
        // Добавляем настройку колонок для консистентности
        const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
        code += `        builder.adjust(${columns})\n`;
        code += '        keyboard = builder.as_markup()\n';
    }

    /**
     * Отправка сообщения start узла
     * Обрабатываем отправку как с изображением, так и без
     */
    code += '    # Отправляем сообщение start узла\n';

    // ИСПРАВЛЕНИЕ: Проверяем наличие изображения в узле
    if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '') {
        code += `    # Узел содержит изображение: ${targetNode.data.imageUrl}\n`;
        // Проверяем, является ли URL относительным путем к локальному файлу
        if (targetNode.data.imageUrl.startsWith('/uploads/')) {
            code += `    image_path = get_upload_file_path("${targetNode.data.imageUrl}")\n`;
            code += `    image_url = FSInputFile(image_path)\n`;
        } else {
            code += `    image_url = "${targetNode.data.imageUrl}"\n`;
        }
        code += '    try:\n';
        code += '        if keyboard is not None:\n';
        code += `            await bot.send_photo(callback_query.from_user.id, image_url, caption=text, reply_markup=keyboard, node_id="${actualNodeId}"${parseMode})\n`;
        code += '        else:\n';
        code += `            await bot.send_photo(callback_query.from_user.id, image_url, caption=text, node_id="${actualNodeId}"${parseMode})\n`;
        code += '    except Exception:\n';
        code += '        # Fallback на обычное сообщение при ошибке\n';
        code += '        if keyboard is not None:\n';
        code += `            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
        code += '        else:\n';
        code += `            await callback_query.message.answer(text${parseMode})\n`;
    } else {
        // Обычное текстовое сообщение
        code += '    try:\n';
        code += '        if keyboard is not None:\n';
        code += `            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})\n`;
        code += '        else:\n';
        code += `            await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})\n`;
        code += '    except Exception:\n';
        code += '        if keyboard is not None:\n';
        code += `            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
        code += '        else:\n';
        code += `            await callback_query.message.answer(text${parseMode})\n`;
    }
    return code;
}
