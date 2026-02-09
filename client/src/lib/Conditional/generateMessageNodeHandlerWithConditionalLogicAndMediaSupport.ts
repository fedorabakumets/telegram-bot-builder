/**
 * Модуль для генерации обработчика узла сообщения с поддержкой условной логики и медиафайлов
 *
 * Этот модуль предоставляет функцию для создания кода обработчика узла сообщения,
 * который может включать условные сообщения, клавиатуры и прикрепленные медиафайлы.
 *
 * @module generateMessageNodeHandlerWithConditionalLogicAndMediaSupport
 */

import { generateConditionalMessageLogic } from '.';
import { isLoggingEnabled } from '../bot-generator';
import { formatTextForPython, generateAttachedMediaSendCode, generateWaitingStateCode, getParseMode, stripHtmlTags } from '../format';
import { generateInlineKeyboardCode, generateReplyKeyboardCode } from '../Keyboard';
import { generateUniversalVariableReplacement } from '../utils';

/**
 * Генерирует обработчик для узла сообщения с поддержкой условной логики и медиафайлов
 *
 * @param {any} targetNode - Узел, для которого генерируется обработчик
 * @param {string} code - Исходный код, в который будет добавлен новый функционал
 * @param {any[]} allNodeIds - Массив всех идентификаторов узлов
 * @param {any[]} connections - Массив соединений между узлами
 * @param {Map<string, {type: string; variable: string}>} mediaVariablesMap - Карта переменных медиафайлов
 * @param {any} actualNodeId - Идентификатор текущего узла
 * @returns {string} Обновленный код с добавленной логикой обработки узла сообщения
 */
export function generateMessageNodeHandlerWithConditionalLogicAndMediaSupport(targetNode: any, code: string, allNodeIds: any[], connections: any[], mediaVariablesMap: Map<string, { type: string; variable: string; }>, actualNodeId: any) {
    const messageText = targetNode.data.messageText || "Сообщение";
    const cleanedMessageText = stripHtmlTags(messageText);
    const formattedText = formatTextForPython(cleanedMessageText);
    const parseMode = getParseMode(targetNode.data.formatMode);

    code += `    # Отправляем сообщение для узла ${targetNode.id}\n`;
    code += `    text = ${formattedText}\n`;

    // Применяем универсальную замену переменных
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
    code += '    # Заменяем все переменные в тексте\n';
    code += '    text = replace_variables_in_text(text, user_vars)\n';

    /**
     * БЛОК 4: Поддержка условных сообщений
     * Позволяет показывать разные сообщения на основе данных пользователя
     * и настроенных условий в узле
     */
    // Добавляем поддержку условных сообщений
    if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
        code += '    \n';
        code += '    # Проверка условных сообщений\n';
        code += '    conditional_parse_mode = None\n';
        code += '    conditional_keyboard = None\n';
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
     * Обработка клавиатуры
     * Проверяем тип клавиатуры и генерируем соответствующий код
     */
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем тип клавиатуры и генерируем правильный код
    const hasButtons = targetNode.data.buttons && targetNode.data.buttons.length > 0;
    const keyboardType = targetNode.data.keyboardType;

    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} - кнопок: ${targetNode.data.buttons?.length}, keyboardType: ${keyboardType}`);

    if (hasButtons) {
        code += '    # Проверяем, есть ли условная клавиатура\n';
        code += '    if keyboard is None:\n';
        if (keyboardType === "inline") {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ INLINE клавиатуру для узла ${targetNode.id}`);
            code += '        # Создаем inline клавиатуру\n';
            const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
            code += keyboardCode;
        } else if (keyboardType === "reply") {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ REPLY клавиатуру для узла ${targetNode.id}`);
            code += '        # Создаем reply клавяатуру\n';
            const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data);
            code += keyboardCode;
        }
    }

    /**
     * Настройка ожидания текстового ввода для условных сообщений
     * Если включены условные сообщения, настраиваем ожидание ввода от пользователя
     */
    if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
        code += '    # Настраиваем ожидание текстового ввода для условных сообщений\n';
        code += '    if "conditional_message_config" in locals():\n';
        code += '        # Проверяем, включено ли ожидание текстового ввода\n';
        code += '        wait_for_input = conditional_message_config.get("wait_for_input", False)\n';
        code += '        if wait_for_input:\n';
        code += '            # Получаем следующий узел из условного сообщения или подключений\n';
        code += '            conditional_next_node = conditional_message_config.get("next_node_id")\n';
        code += '            if conditional_next_node:\n';
        code += '                next_node_id = conditional_next_node\n';
        code += '            else:\n';
        const currentNodeConnections = connections.filter(conn => conn.source === targetNode.id);
        if (currentNodeConnections.length > 0) {
            const nextNodeId = currentNodeConnections[0].target;
            code += `                next_node_id = "${nextNodeId}"\n`;
        } else {
            code += '                next_node_id = None\n';
        }
        code += '            \n';
        code += '            # Получаем переменную яля сохранения ввода\n';
        code += '            input_variable = conditional_message_config.get("input_variable")\n';
        code += '            if not input_variable:\n';
        code += '                input_variable = f"conditional_response_{conditional_message_config.get(\'condition_id\', \'unknown\')}"\n';
        code += '            \n';
        code += '            # ястанавливаем сястояние ожидания текстового ввода\n';
        code += '            if user_id not in user_data:\n';
        code += '                user_data[user_id] = {}\n';
        code += '            user_data[user_id]["waiting_for_conditional_input"] = {\n';
        code += '                "node_id": callback_query.data,\n';
        code += '                "condition_id": conditional_message_config.get("condition_id"),\n';
        code += '                "next_node_id": next_node_id,\n';
        code += '                "input_variable": input_variable,\n';
        code += '                "source_type": "conditional_message"\n';
        code += '            }\n';
        code += '            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")\n';
        code += '    \n';
    }

    /**
     * БЛОК 5: Обработка прикрепленных медиа
     * Проверяет наличие attachedMedia в узле и генерирует
     * соответствующий код для отправки медиафайлов
     */
    // Отправляем сообщение с учетом всех условий
    // Проверяем наличие прикяепленных медиа
    const attachedMedia = targetNode.data.attachedMedia || [];

    if (attachedMedia.length > 0) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} ямеет attachedMedia:`, attachedMedia);
        // Генерируям код отправки с медиа
        const parseModeStr = targetNode.data.formatMode || '';
        const keyboardStr = 'keyboard if keyboard is not None else None';
        // Определяем, собирает ли узел ввод (учитываем все типы ввода)
        const collectUserInputFlag = targetNode.data.collectUserInput === true ||
            targetNode.data.enableTextInput === true ||
            targetNode.data.enablePhotoInput === true ||
            targetNode.data.enableVideoInput === true ||
            targetNode.data.enableAudioInput === true ||
            targetNode.data.enableDocumentInput === true;
        const mediaCode = generateAttachedMediaSendCode(
            attachedMedia,
            mediaVariablesMap,
            'text',
            parseModeStr,
            keyboardStr,
            targetNode.id,
            '    ',
            targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo ? targetNode.data.autoTransitionTo : undefined,
            collectUserInputFlag,
            targetNode.data // передаем данные узла для проверки статических изображений
        );

        if (mediaCode) {
            code += '    # КРИТИЧНО: Удаляем reply сообщение ПЕРЕД отправкой нового\n';
            code += '    if user_id in user_data and "_delete_reply_message_id" in user_data[user_id]:\n';
            code += '        try:\n';
            code += '            await bot.delete_message(user_id, user_data[user_id]["_delete_reply_message_id"])\n';
            code += '            logging.info(f"🗑️ Reply сообщение удалено перед отправкой новогя")\n';
            code += '            del user_data[user_id]["_delete_reply_message_id"]\n';
            code += '        except Exception as e:\n';
            code += '            logging.debug(f"Не удалось удалить reply сообщение: {e}")\n';
            code += '    \n';
            code += '    # Отправляем сообщение (с пяяоверкой прякрепленного медиа)\n';
            code += mediaCode;
        } else {
            // Резервный вариант яясли не удалось сгенерировать код медиа
            code += '    # Отправляем сообщение (обычное)\n';
            const autoFlag1 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
            code += `    await safe_edit_or_send(callback_query, text, node_id="${actualNodeId}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag1}${parseMode})\n`;

            // АВТОПЕРЕХОД для fallback случая
            if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                code += `    # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                code += `    logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                code += `    await handle_node_${safeAutoTargetId}(callback_query.message)\n`;
                code += `    return\n`;
            }
        }
    } else {
        // Обычное сообщение без медиа
        code += '    # КРИТИЧНО: Удаляем reply сообщение ПЕРЕД отправкой нового\n';
        code += '    if user_id in user_data and "_delete_reply_message_id" in user_data[user_id]:\n';
        code += '        try:\n';
        code += '            await bot.delete_message(user_id, user_data[user_id]["_delete_reply_message_id"])\n';
        code += '            logging.info(f"🗑️ Reply сообщение удалено перед отправкой нового")\n';
        code += '            del user_data[user_id]["_delete_reply_message_id"]\n';
        code += '        except Exception as e:\n';
        code += '            logging.debug(f"Не удалось удалить reply сообщение: {e}")\n';
        code += '    \n';
        code += '    # Отправляем сообщение\n';
        const autoFlag2 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
        code += `    await safe_edit_or_send(callback_query, text, node_id="${actualNodeId}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag2}${parseMode})\n`;

        // АВяОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
        // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
        // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=false
        if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
            // Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true
            if (targetNode.data.collectUserInput !== false) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                code += '    \n';
                code += '    # Пяоверяем, не ждем ли мы условный ввод перед автопереходом\n';
                code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
                code += '        logging.info(f"⏸️ Автопяреход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")\n';
                code += '    else:\n';
                code += `        # ⚡ Автопереход к узлу ${autoTargetId} (только если collectUserInput=true)\n`;
                code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                code += `        await handle_node_${safeAutoTargetId}(callback_query.message)\n`;
                code += `        return\n`;
            } else {
                code += '    # Автопереход пропущен: collectUserInput=false\n';
                code += `    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
            }
        }
    }

    // КРИТИЧЕСКИ ВАЖНАЯ ЛОГИКА: Если этот узел имеет collectUserInput, настраиваем состояние ожидания
    if (targetNode && targetNode.data && targetNode.data.collectUserInput === true) {

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если у узла есть inline кнопки И НЕТ текстового/медиа ввода, НЕ настраиваем ожидание ввода
        // Для reply кнопояя ВСЕГДА настраиваем ожидание ввода если enableTextInput === true
        const hasInputEnabled = targetNode.data.enableTextInput || targetNode.data.enablePhotoInput ||
            targetNode.data.enableVideoInput || targetNode.data.enableAudioInput ||
            targetNode.data.enableDocumentInput;

        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0 && !hasInputEnabled) {
            code += '    \n';
            code += `    logging.info(f"✅ Узел ${targetNode.id} имеет inline кнопки БЕЗ текстового/медиа ввода - яяЕ настяяаиваем ожидание ввода")\n`;
            code += `    # ИСПРАВЛЕНИЕ: У узла есть inline кнопки без текстового/медиа ввода\n`;
        } else {
            code += '    \n';
            /**
             * БЛОК 6: Управление состоянием ожидания пользовательского ввода
             * Активирует сбор данных от пользователя после отправки сообщения
             * Поддерживает различные типы ввода: текст, фото, видео, аудио, документы
             * Использует универсальную функцию generateWaitingStateCode для настройки
             */
            code += '    # КРИТИЧЕСКИ ВАЖНО: Настраиваем ожидание ввода для message узла с collectUserInput\n';
            code += '    # Используем универсальную функцию для определения правильного типа ввода (text/photo/video/audio/document)\n';
            // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
            if (targetNode && targetNode.data) {
                code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
            }
        }
    }
    return code;
}
