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
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует обработчик для стартового узла с поддержкой условной логики и изображений
 *
 * @param {any} targetNode - Узел, для которого генерируется обработчик
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлен новый функционал
 * @param {any} actualNodeId - Идентификатор текущего узла
 */
export function generateStartNodeHandlerWithConditionalLogicAndImages(targetNode: any, codeLines: string[], actualNodeId: any) {
    const messageText = targetNode.data.messageText || "Добро пожаловать!";
    const cleanedMessageText = stripHtmlTags(messageText);
    const formattedText = formatTextForPython(cleanedMessageText);
    const parseMode = getParseMode(targetNode.data.formatMode);

    // Добавляем комментарий и формирование текста сообщения
    codeLines.push(`    # Обрабатываем узел start: ${targetNode.id}`);
    codeLines.push(`    text = ${formattedText}`);

    // Применяем универсальную замену переменных
    codeLines.push('    ');
    const universalVarReplacement = generateUniversalVariableReplacement('    ');
    const universalVarLines = universalVarReplacement.split('\n');
    codeLines.push(...universalVarLines);

    /**
     * Обработка условных сообщений
     * Если в узле включена поддержка условных сообщений, генерируем соответствующую логику
     */
    if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
        codeLines.push('    ');
        codeLines.push('    # Проверка условных сообщений для start узла');
        codeLines.push('    user_record = await get_user_from_db(user_id)');
        codeLines.push('    if not user_record:');
        codeLines.push('        user_record = user_data.get(user_id, {})');
        codeLines.push('    user_data_dict = user_record if user_record else user_data.get(user_id, {})');

        const conditionalLogic = generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
        const conditionalLines = conditionalLogic.split('\n');
        codeLines.push(...conditionalLines);

        codeLines.push('    ');

        // Используем условное сообщение, если доступно, иначе используем стандартное
        codeLines.push('    # Используем условное сообщение если есть подходящее условие');
        codeLines.push('    if "text" not in locals():');
        codeLines.push(`        text = ${formattedText}`);
        codeLines.push('        # Заменяем переменные в основном тексте, если условие не сработало');
        codeLines.push('        text = replace_variables_in_text(text, user_vars)');
        codeLines.push('    ');
        codeLines.push('    # Используем условную клавиатуру если есть');
        codeLines.push('    # Инициализируем переменную conditional_keyboard, если она не была определена');
        codeLines.push('    if "conditional_keyboard" not in locals():');
        codeLines.push('        conditional_keyboard = None');
        codeLines.push('    if conditional_keyboard is not None:');
        codeLines.push('        keyboard = conditional_keyboard');
        codeLines.push('    else:');
        codeLines.push('        keyboard = None');
    } else {
        codeLines.push('    ');
        codeLines.push('    # Без условных сообщений - используем обычную клавиатуру');
        codeLines.push('    keyboard = None');
    }

    /**
     * Создание inline клавиатуры для start узла
     * Генерируем клавиатуру только если тип клавиатуры inline и есть кнопки
     */
    if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        codeLines.push('    # Проверяем, есть ли условная клавиатура');
        codeLines.push('    if keyboard is None:');
        codeLines.push('        # Создаем inline клавиатуру для start узла');
        codeLines.push('        builder = InlineKeyboardBuilder()');
        targetNode.data.buttons.forEach((btn: Button, index: number) => {
            if (btn.action === "url") {
                codeLines.push(`        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))`);
            } else if (btn.action === 'goto') {
                // Создаем уникальный callback_data для каждой кнопки
                const baseCallbackData = btn.target || btn.id || 'no_action';
                const callbackData = `${baseCallbackData}_btn_${index}`;
                codeLines.push(`        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))`);
            } else if (btn.action === 'command') {
                // Для кнопок команд создаем специальную callback_data
                const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                codeLines.push(`        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))`);
            }
        });
        // Добавляем настройку колонок для консистентности
        const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
        codeLines.push(`        builder.adjust(${columns})`);
        codeLines.push('        keyboard = builder.as_markup()');
    }

    /**
     * Отправка сообщения start узла
     * Обрабатываем отправку как с изображением, так и без
     */
    codeLines.push('    # Отправляем сообщение start узла');

    // ИСПРАВЛЕНИЕ: Проверяем наличие изображения в узле
    if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '') {
        codeLines.push(`    # Узел содержит изображение: ${targetNode.data.imageUrl}`);
        // Проверяем, является ли URL относительным путем к локальному файлу
        if (targetNode.data.imageUrl.startsWith('/uploads/')) {
            codeLines.push(`    image_path = get_upload_file_path("${targetNode.data.imageUrl}")`);
            codeLines.push(`    image_url = FSInputFile(image_path)`);
        } else {
            codeLines.push(`    image_url = "${targetNode.data.imageUrl}"`);
        }
        codeLines.push('    try:');
        codeLines.push('        if keyboard is not None:');
        codeLines.push(`            await bot.send_photo(callback_query.from_user.id, image_url, caption=text, reply_markup=keyboard, node_id="${actualNodeId}"${parseMode})`);
        codeLines.push('        else:');
        codeLines.push(`            await bot.send_photo(callback_query.from_user.id, image_url, caption=text, node_id="${actualNodeId}"${parseMode})`);
        codeLines.push('    except Exception:');
        codeLines.push('        # Fallback на обычное сообщение при ошибке');
        codeLines.push('        if keyboard is not None:');
        codeLines.push(`            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})`);
        codeLines.push('        else:');
        codeLines.push(`            await callback_query.message.answer(text${parseMode})`);
    } else {
        // Обычное текстовое сообщение
        codeLines.push('    try:');
        codeLines.push('        if keyboard is not None:');
        codeLines.push(`            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})`);
        codeLines.push('        else:');
        codeLines.push(`            await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})`);
        codeLines.push('    except Exception:');
        codeLines.push('        if keyboard is not None:');
        codeLines.push(`            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})`);
        codeLines.push('        else:');
        codeLines.push(`            await callback_query.message.answer(text${parseMode})`);
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'generateStartNodeHandlerWithConditionalLogicAndImages.ts');

    // Обновляем оригинальный массив
    codeLines.length = 0;
    codeLines.push(...processedCodeLines);
}
