/**
 * Модуль для генерации обработчика узла сообщения с поддержкой клавиатуры и сбора пользовательского ввода
 *
 * Этот модуль предоставляет функцию для создания кода обработчика узла сообщения,
 * который может включать клавиатуру и собирать пользовательский ввод.
 *
 * @module generateMessageNodeHandlerWithKeyboardAndInputCollection
 */

import { Button } from '../bot-generator';
import { generateConditionalMessageLogic } from '../Conditional';
import { formatTextForPython, generateButtonText, generateWaitingStateCode, stripHtmlTags, toPythonBoolean } from '../format';
import { calculateOptimalColumns } from '../Keyboard';
import { generateInlineKeyboardCode, generateReplyKeyboardCode } from '../Keyboard';
import { generateUniversalVariableReplacement } from '../utils';

/**
 * Генерирует обработчик для узла сообщения с поддержкой клавиатуры и сбора пользовательского ввода
 *
 * @param {string} code - Исходный код, в который будет добавлен новый функционал
 * @param {any} targetNode - Узел, для которого генерируется обработчик
 * @param {any} actualNodeId - Идентификатор текущего узла
 * @param {any[]} allNodeIds - Массив всех идентификаторов узлов
 * @returns {string} Обновленный код с добавленной логикой обработки узла сообщения
 */
export function generateMessageNodeHandlerWithKeyboardAndInputCollection(code: string, targetNode: any, actualNodeId: any, allNodeIds: any[]) {
    code += `    # Обрабатываем узел типа ${targetNode.type}: ${targetNode.id}\n`;

    /**
     * Обработка узла сообщения
     * Обрабатываем текст узла, очищаем HTML теги и форматируем для Python
     */
    if (targetNode.type === 'message') {
        // Обрабатываем узла сообщений и другие текстовые узла
        const targetText = targetNode.data.messageText || "Сообщение";
        const cleanedText = stripHtmlTags(targetText);
        const formattedTargetText = formatTextForPython(cleanedText);

        code += `    text = ${formattedTargetText}\n`;

        // Добавляем замену переменных в тексте
        const universalVarCodeLines: string[] = [];
        generateUniversalVariableReplacement(universalVarCodeLines, '    ');
        code += universalVarCodeLines.join('\n');

        /**
         * Поддержка условных сообщений
         * Если в узле включена поддержка условных сообщений, генерируем соответствующую логику
         */
        if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
            code += '    \n';
            code += '    # Проверка условных сообщений для keyboard узла\n';
            code += '    user_record = await get_user_from_db(callback_query.from_user.id)\n';
            code += '    if not user_record:\n';
            code += '        user_record = user_data.get(callback_query.from_user.id, {})\n';
            code += '    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})\n';
            code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
            code += '    \n';

            // Используем условное сообщение, если доступно, иначе используем стандартное
            code += '    # Используем условное сообщение если есть подходящее условие\n';
            code += '    if "text" not in locals():\n';
            code += `        text = ${formattedTargetText}\n`;
            code += '        # Заменяем переменные в основном тексте, если условие не сработало\n';
            code += '        text = replace_variables_in_text(text, user_vars)\n';
            code += '    \n';
            code += '    # Используем условную клавиатуру если есть\n';
            code += '    if conditional_keyboard is not None:\n';
            code += '        keyboard = conditional_keyboard\n';
            code += '    else:\n';
            code += '        keyboard = None\n';
            code += '    \n';
        }
    }

    /**
     * Проверка активации сбора пользовательского ввода
     * Если для узла включена функция сбора пользовательского ввода, настраиваем соответствующую логику
     */
    if (targetNode && targetNode.data && targetNode.data.collectUserInput === true) {
        // Настраиваем сбор пользовательского ввода
        code += '    # Активируем сбор пользовательского ввода (основной цикл)\n';
        code += '    if callback_query.from_user.id not in user_data:\n';
        code += '        user_data[callback_query.from_user.id] = {}\n';
        code += '    \n';
        // Используем helper функцию с правильным контекстом callback_query
        if (targetNode && targetNode.data) {
            code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
        }
        code += '    \n';

        /**
         * Поддержка клавиатуры при активном сборе ввода
         * Создаем клавиатуру нужного типа (inline или reply) с учетом активного сбора ввода
         */
        // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок с проверкой условной клавиатуры
        if (targetNode && targetNode.data && targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '    # Проверяем, есть ли условная клавиатуря для этого узла\n';
            code += '    if "keyboard" not in locals() or keyboard is None:\n';
            code += '        # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)\n';
            code += '        builder = InlineKeyboardBuilder()\n';
            targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                    // Создаем уникальный callback_data для каждой кнопки
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    const uniqueCallbackData = `${callbackData}_btn_${targetNode.data.buttons.indexOf(btn)}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${uniqueCallbackData}"))\n`;
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
            // Определяем режим форматирования для целевого узла
            let parseModeTarget = '';
            if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
            } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
            }
            code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '    # Проверяем, есть ли условная клавиатура для этого узла\n';
            code += '    if "keyboard" not in locals() or keyboard is None:\n';
            code += '        # Создаем reply клавиатуру (+ сбор ввода включен)\n';
            const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', actualNodeId, targetNode.data);
            code += keyboardCode;
            // Определяем режим форматирования для целевого узла
            let parseModeTarget = '';
            if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
            } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
            }
            // NOTE: Отправка сообщения для reply клавиатуры обрабатывается в основной функции
            // await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})
            code += '    # Отправка сообщения для reply клавиатуры обрабатывается в основной функции\n';
            code += '    # Узел metro_selection имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n';
            code += `    logging.info(f"ℹ️ Узел ${actualNodeId} не собирает ответы (collectUserInput=false)")\n`;
            code += `    # Переменная parseModeTarget определена для совместимости: ${parseModeTarget}\n`;
        }
        code += '    \n';
    } else {
        /**
         * Обычное отображение сообщения без сбора ввода
         * Обрабатываем клавиатуру для целевого узла, когда сбор ввода не активирован
         */
        // Обрабатываем клавиатуру для целевого узла
        code += `    # DEBUG: Узел ${actualNodeId} - hasRegularButtons=${toPythonBoolean(targetNode.data.buttons && targetNode.data.buttons.length > 0)}, hasInputCollection=False\n`;
        code += `    logging.info(f"DEBUG: Узел ${actualNodeId} обработка кнопок - keyboardType=${targetNode.data.keyboardType}, buttons=${targetNode.data.buttons ? targetNode.data.buttons.length : 0}")\n`;

        // Определяем режим форматирования для целевого узла
        let parseModeTarget = '';
        if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
            parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
        } else if (targetNode.data.formatMode === 'html') {
            parseModeTarget = ', parse_mode=ParseMode.HTML';
        }

        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
            code += `    logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${actualNodeId} с ${targetNode.data.buttons.length} кнопками")\n`;
            code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
            code += '    if "keyboard" not in locals() or keyboard is None:\n';
            code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
            // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
            const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', actualNodeId, targetNode.data, allNodeIds);
            code += keyboardCode;
            code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
            code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
            code += '    if "keyboard" not in locals() or keyboard is None:\n';
            code += '        # Создаем reply клавиатуру\n';
            const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', actualNodeId, targetNode.data);
            code += keyboardCode;
            // NOTE: Отправка сообщения для reply клавиатуры обрабатывается в основной функции
            // await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})
            // Устанавливаем флаг, что сообщение уже отправлено для reply клавиатуры
            code += '    # Отправка сообщения для reply клавиатуры обрабатывается в основной функции\n';
            code += `    logging.info(f"ℹ️ Узел ${actualNodeId} имеет reply клавиатуру")\n`;
        } else {
            // Для автопереходов отправляем новое сообщение вместо редактирования
            code += `    await callback_query.message.answer(text${parseModeTarget})\n`;
        }
    } // Закрываем else блок для обычного отображения (основной цикл)
    return code;
}
