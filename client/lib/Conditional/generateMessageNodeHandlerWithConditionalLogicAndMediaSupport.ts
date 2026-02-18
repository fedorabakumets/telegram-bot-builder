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
import { formatTextForPython, generateWaitingStateCode, getParseMode, stripHtmlTags } from '../format';
import { generateAttachedMediaSendCode } from '../MediaHandler';
import { generateInlineKeyboardCode, generateReplyKeyboardCode } from '../Keyboard';
import { generateUniversalVariableReplacement } from '../utils';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

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
    // Собираем весь код в массив строк для автоматической обработки
    const codeLines: string[] = [];
    
    // Добавляем начальный код, переданный в функцию
    if (code) {
        const initialCodeLines = code.split('\n');
        codeLines.push(...initialCodeLines);
    }
    
    const messageText = targetNode.data.messageText || "Сообщение";
    const cleanedMessageText = stripHtmlTags(messageText);
    const formattedText = formatTextForPython(cleanedMessageText);
    const parseMode = getParseMode(targetNode.data.formatMode);

    codeLines.push(`    # Отправляем сообщение для узла ${targetNode.id}`);
    codeLines.push(`    text = ${formattedText}`);

    // Применяем универсальную замену переменных
    codeLines.push('    ');
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ');
    codeLines.push(...universalVarCodeLines);

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
    codeLines.push('    # Заменяем все переменные в тексте');
    codeLines.push('    text = replace_variables_in_text(text, user_vars)');

    /**
     * БЛОК 4: Поддержка условных сообщений
     * Позволяет показывать разные сообщения на основе данных пользователя
     * и настроенных условий в узле
     */
    // Добавляем поддержку условных сообщений
    if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
        codeLines.push('    ');
        codeLines.push('    # Проверка условных сообщений');
        codeLines.push('    conditional_parse_mode = None');
        codeLines.push('    conditional_keyboard = None');
        codeLines.push('    user_record = await get_user_from_db(user_id)');
        codeLines.push('    if not user_record:');
        codeLines.push('        user_record = user_data.get(user_id, {})');
        codeLines.push('    user_data_dict = user_record if user_record else user_data.get(user_id, {})');
        
        const conditionalLogicCode = generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
        const conditionalLogicLines = conditionalLogicCode.split('\n').filter(line => line.trim());
        codeLines.push(...conditionalLogicLines);
        
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
     * Обработка клавиатуры
     * Проверяем тип клавиатуры и генерируем соответствующий код
     */
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем тип клавиатуры и генерируем правильный код
    const hasButtons = targetNode.data.buttons && targetNode.data.buttons.length > 0;
    const keyboardType = targetNode.data.keyboardType;

    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} - кнопок: ${targetNode.data.buttons?.length}, keyboardType: ${keyboardType}`);

    if (hasButtons) {
        codeLines.push('    # Проверяем, есть ли условная клавиатура');
        codeLines.push('    if keyboard is None:');
        if (keyboardType === "inline") {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ INLINE клавиатуру для узла ${targetNode.id}`);
            codeLines.push('        # Создаем inline клавиатуру');
            const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
            const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
            codeLines.push(...keyboardLines);
        } else if (keyboardType === "reply") {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ REPLY клавиатуру для узла ${targetNode.id}`);
            codeLines.push('        # Создаем reply клавяатуру');
            const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data);
            const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
            codeLines.push(...keyboardLines);
        }
    }

    /**
     * Настройка ожидания текстового ввода для условных сообщений
     * Если включены условные сообщения, настраиваем ожидание ввода от пользователя
     */
    if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
        codeLines.push('    # Настраиваем ожидание текстового ввода для условных сообщений');
        codeLines.push('    if "conditional_message_config" in locals():');
        codeLines.push('        # Проверяем, включено ли ожидание текстового ввода');
        codeLines.push('        wait_for_input = conditional_message_config.get("wait_for_input", False)');
        codeLines.push('        if wait_for_input:');
        codeLines.push('            # Получаем следующий узел из условного сообщения или подключений');
        codeLines.push('            conditional_next_node = conditional_message_config.get("next_node_id")');
        codeLines.push('            if conditional_next_node:');
        codeLines.push('                next_node_id = conditional_next_node');
        codeLines.push('            else:');
        const currentNodeConnections = connections.filter(conn => conn.source === targetNode.id);
        if (currentNodeConnections.length > 0) {
            const nextNodeId = currentNodeConnections[0].target;
            codeLines.push(`                next_node_id = "${nextNodeId}"`);
        } else {
            codeLines.push('                next_node_id = None');
        }
        codeLines.push('            ');
        codeLines.push('            # Получаем переменную яля сохранения ввода');
        codeLines.push('            input_variable = conditional_message_config.get("input_variable")');
        codeLines.push('            if not input_variable:');
        codeLines.push('                input_variable = f"conditional_response_{conditional_message_config.get(\'condition_id\', \'unknown\')}"');
        codeLines.push('            ');
        codeLines.push('            # ястанавливаем сястояние ожидания текстового ввода');
        codeLines.push('            if user_id not in user_data:');
        codeLines.push('                user_data[user_id] = {}');
        codeLines.push('            user_data[user_id]["waiting_for_conditional_input"] = {');
        codeLines.push('                "node_id": callback_query.data,');
        codeLines.push('                "condition_id": conditional_message_config.get("condition_id"),');
        codeLines.push('                "next_node_id": next_node_id,');
        codeLines.push('                "input_variable": input_variable,');
        codeLines.push('                "source_type": "conditional_message"');
        codeLines.push('            }');
        codeLines.push('            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")');
        codeLines.push('    ');
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
            codeLines.push('    # КРИТИЧНО: Удаляем reply сообщение ПЕРЕД отправкой нового');
            codeLines.push('    if user_id in user_data and "_delete_reply_message_id" in user_data[user_id]:');
            codeLines.push('        try:');
            codeLines.push('            await bot.delete_message(user_id, user_data[user_id]["_delete_reply_message_id"])');
            codeLines.push('            logging.info(f"🗑️ Reply сообщение удалено перед отправкой новогя")');
            codeLines.push('            del user_data[user_id]["_delete_reply_message_id"]');
            codeLines.push('        except Exception as e:');
            codeLines.push('            logging.debug(f"Не удалось удалить reply сообщение: {e}")');
            codeLines.push('    ');
            codeLines.push('    # Отправляем сообщение (с пяяоверкой прякрепленного медиа)');
            const mediaCodeLines = mediaCode.split('\n').filter(line => line.trim());
            codeLines.push(...mediaCodeLines);
        } else {
            // Резервный вариант яясли не удалось сгенерировать код медиа
            codeLines.push('    # Отправляем сообщение (обычное)');
            const autoFlag1 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
            codeLines.push(`    await safe_edit_or_send(callback_query, text, node_id="${actualNodeId}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag1}${parseMode})`);

            // АВТОПЕРЕХОД для fallback случая
            if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                codeLines.push(`    # ⚡ Автопереход к узлу ${autoTargetId}`);
                codeLines.push(`    logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")`);
                codeLines.push(`    await handle_node_${safeAutoTargetId}(callback_query.message)`);
                codeLines.push(`    return`);
            }
        }
    } else {
        // Обычное сообщение без медиа
        codeLines.push('    # КРИТИЧНО: Удаляем reply сообщение ПЕРЕД отправкой нового');
        codeLines.push('    if user_id in user_data and "_delete_reply_message_id" in user_data[user_id]:');
        codeLines.push('        try:');
        codeLines.push('            await bot.delete_message(user_id, user_data[user_id]["_delete_reply_message_id"])');
        codeLines.push('            logging.info(f"🗑️ Reply сообщение удалено перед отправкой нового")');
        codeLines.push('            del user_data[user_id]["_delete_reply_message_id"]');
        codeLines.push('        except Exception as e:');
        codeLines.push('            logging.debug(f"Не удалось удалить reply сообщение: {e}")');
        codeLines.push('    ');
        codeLines.push('    # Отправляем сообщение');
        const autoFlag2 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
        codeLines.push(`    await safe_edit_or_send(callback_query, text, node_id="${actualNodeId}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag2}${parseMode})`);

        // АВяОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
        // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
        // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=false
        if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
            // Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true
            if (targetNode.data.collectUserInput !== false) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                codeLines.push('    ');
                codeLines.push('    # Пяоверяем, не ждем ли мы условный ввод перед автопереходом');
                codeLines.push('    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:');
                codeLines.push('        logging.info(f"⏸️ Автопяреход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")');
                codeLines.push('    else:');
                codeLines.push(`        # ⚡ Автопереход к узлу ${autoTargetId} (только если collectUserInput=true)`);
                codeLines.push(`        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")`);
                codeLines.push(`        await handle_node_${safeAutoTargetId}(callback_query.message)`);
                codeLines.push(`        return`);
            } else {
                codeLines.push('    # Автопереход пропущен: collectUserInput=false');
                codeLines.push(`    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")`);
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
            codeLines.push('    ');
            codeLines.push(`    logging.info(f"✅ Узел ${targetNode.id} имеет inline кнопки БЕЗ текстового/медиа ввода - яяЕ настяяаиваем ожидание ввода")`);
            codeLines.push(`    # ИСПРАВЛЕНИЕ: У узла есть inline кнопки без текстового/медиа ввода`);
        } else {
            codeLines.push('    ');
            /**
             * БЛОК 6: Управление состоянием ожидания пользовательского ввода
             * Активирует сбор данных от пользователя после отправки сообщения
             * Поддерживает различные типы ввода: текст, фото, видео, аудио, документы
             * Использует универсальную функцию generateWaitingStateCode для настройки
             */
            codeLines.push('    # КРИТИЧЕСКИ ВАЖНО: Настраиваем ожидание ввода для message узла с collectUserInput');
            codeLines.push('    # Используем универсальную функцию для определения правильного типа ввода (text/photo/video/audio/document)');
            // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
            if (targetNode && targetNode.data) {
                const waitingStateCode = generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
                const waitingStateLines = waitingStateCode.split('\n').filter(line => line.trim());
                codeLines.push(...waitingStateLines);
            }
        }
    }
    
    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateMessageNodeHandlerWithConditionalLogicAndMediaSupport.ts');
    
    return commentedCodeLines.join('\n');
}
