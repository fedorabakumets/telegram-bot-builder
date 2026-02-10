/**
 * @fileoverview Модуль для генерации обработчика узла команды с поддержкой клавиатуры и изображений
 *
 * Этот модуль предоставляет функцию для генерации Python-кода обработчика узла команды,
 * которая:
 * - Обрабатывает команды с различными типами клавиатур (inline)
 * - Поддерживает отправку изображений вместе с сообщениями
 * - Обеспечивает корректную замену переменных в тексте сообщения
 * - Обрабатывает переходы между узлами
 *
 * @module generateCommandNodeHandlerWithKeyboardAndImageSupport
 */

import { Button } from '../bot-generator';
import { calculateOptimalColumns, formatTextForPython, generateButtonText, getParseMode, stripHtmlTags } from '../format';
import { generateUniversalVariableReplacement } from '../utils';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код обработчика узла команды с поддержкой клавиатуры и изображений
 *
 * Функция генерирует Python-код, который:
 * - Обрабатывает команды с различными типами клавиатур (inline)
 * - Поддерживает отправку изображений вместе с сообщениями
 * - Обеспечивает корректную замену переменных в тексте сообщения
 * - Обрабатывает переходы между узлами
 *
 * @param targetNode - Узел конфигурации команды, содержащий настройки и данные команды
 * @param code - Строка с исходным кодом, в которую будет добавлен новый код
 * @param actualNodeId - Идентификатор текущего узла
 *
 * @returns Обновленная строка с Python-кодом
 *
 * @example
 * const targetNode = {
 *   id: "command-node-1",
 *   data: {
 *     command: "/help",
 *     messageText: "Справка по команде",
 *     keyboardType: "inline",
 *     buttons: [
 *       { text: "Назад", action: "goto", target: "main_menu" }
 *     ],
 *     imageUrl: "https://example.com/image.jpg"
 *   }
 * };
 * let code = "";
 * const result = generateCommandNodeHandlerWithKeyboardAndImageSupport(targetNode, code, "node-1");
 * // result теперь содержит Python-код обработчика команды
 */
export function generateCommandNodeHandlerWithKeyboardAndImageSupport(targetNode: any, code: string, actualNodeId: any) {
    const command = targetNode.data.command || '/start';
    const commandMessage = targetNode.data.messageText || `Выполняем команду ${command}`;
    const cleanedCommandMessage = stripHtmlTags(commandMessage);
    const formattedCommandText = formatTextForPython(cleanedCommandMessage);
    const parseMode = getParseMode(targetNode.data.formatMode);

    code += `    # Обрабатываем узел command: ${targetNode.id}\n`;
    code += `    text = ${formattedCommandText}\n`;

    // Применяем универсальную замену переменных
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');

    // Создаем inline клавиатуру для command узла если есть кнопки
    if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += '    # Создаем inline клавиатуру для command узла\n';
        code += '    builder = InlineKeyboardBuilder()\n';
        targetNode.data.buttons.forEach((btn: Button, index: number) => {
            if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
            } else if (btn.action === 'goto') {
                const baseCallbackData = btn.target || btn.id || 'no_action';
                const callbackData = `${baseCallbackData}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
            } else if (btn.action === 'command') {
                const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
            }
        });
        // Добавляем настройку колонок для консистентности
        const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
        code += `    builder.adjust(${columns})\n`;
        code += '    keyboard = builder.as_markup()\n';

        // ИСПРАВЛЕНИЕ: Проверяем наличие изображения в command узле
        if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '') {
            code += `    # Узел command содержит изображение: ${targetNode.data.imageUrl}\n`;
            code += `    image_url = "${targetNode.data.imageUrl}"\n`;
            code += '    # Отправляем сообщение command узла с изображением и клавиатурой\n';
            code += '    try:\n';
            code += `        await bot.send_photo(callback_query.from_user.id, image_url, caption=text, reply_markup=keyboard, node_id="${actualNodeId}"${parseMode})\n`;
            code += '    except Exception:\n';
            code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
        } else {
            code += '    # Отправляем сообщение command узла с клавиатурой\n';
            code += '    try:\n';
            code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})\n`;
            code += '    except Exception:\n';
            code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
        }
    } else {
        // ИСПРАВЛЕНИЕ: Проверяем наличие изображения в command узле без клавиатуры
        if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '') {
            code += `    # Узел command содержит изображение: ${targetNode.data.imageUrl}\n`;
            // Проверяем, является ли URL относительным путем к локальному файлу
            if (targetNode.data.imageUrl.startsWith('/uploads/')) {
                code += `    image_path = get_upload_file_path("${targetNode.data.imageUrl}")\n`;
                code += `    image_url = FSInputFile(image_path)\n`;
            } else {
                code += `    image_url = "${targetNode.data.imageUrl}"\n`;
            }
            code += '    # Отправляем сообщение command узла с изображением\n';
            code += '    try:\n';
            code += `        await bot.send_photo(callback_query.from_user.id, image_url, caption=text, node_id="${actualNodeId}"${parseMode})\n`;
            code += '    except Exception:\n';
            code += `        await callback_query.message.answer(text${parseMode})\n`;
        } else {
            code += '    # Отправляем сообщение command узла без клавиатуры\n';
            code += '    try:\n';
            code += `        await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})\n`;
            code += '    except Exception:\n';
            code += `        await callback_query.message.answer(text${parseMode})\n`;
        }
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const codeLines = code.split('\n');
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'generateCommandNodeHandlerWithKeyboardAndImageSupport.ts');
    return processedCodeLines.join('\n');
}
