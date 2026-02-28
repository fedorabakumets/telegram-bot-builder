/**
 * @fileoverview Генерация интерактивных callback обработчиков
 * 
 * Модуль создаёт Python-код для обработки callback-запросов от inline кнопок,
 * включая условные сообщения, множественный выбор и автопереходы.
 * 
 * @module bot-generator/transitions/generate-interactive-callback-handlers
 */

import { generateCallbackHandlerStart, generateCollectUserInputFlag } from './callback-handler';
import { generateMultiSelectDoneButton, generateMultiSelectInit, generateMultiSelectReplyKeyboard, generateMultiSelectInlineKeyboard } from './multi-select';
import { generateSkipDataCollectionCheck } from './skip-data-collection';
import { generateMessageTextPreparation, generateDatabaseVarsGet } from './message-text';
import { generateConditionalMessagesCheck } from './conditional-messages';
import { generateMediaVariablesSetup } from './media-variables';
import { generateAutoTransitionCheck, generateAutoTransitionCode } from './auto-transition';
import { generateBroadcastHandler } from './broadcast';
import { Button, isLoggingEnabled } from '../../bot-generator';
import { generateBroadcastInline } from '../Broadcast/BotApi/generateBroadcastHandler';
import { generateCheckUserVariableFunction } from '../database';
import { formatTextForPython, generateButtonText, generateUniqueShortId, generateWaitingStateCode, stripHtmlTags, toPythonBoolean } from '../format';
import { generateBroadcastClientInline } from '../Broadcast/Client/generateBroadcastClientHandler';
import { generateDatabaseVariablesCode } from '../Broadcast/generateDatabaseVariables';
import { generateHandleNodeFunctions } from '../../generate/generateHandleNodeFunctions';
import { generateHideAfterClickMiddleware } from '../../generate/generateHideAfterClickHandler';
import { calculateOptimalColumns, generateInlineKeyboardCode } from '../Keyboard';
import { generateAttachedMediaSendCode } from '../MediaHandler';
import { generateUniversalVariableReplacement } from '../utils';

/**
 * Генерирует интерактивные callback обработчики с поддержкой условных сообщений,
 * множественного выбора и автопереходов
 * 
 * @param inlineNodes - Массив inline узлов
 * @param allReferencedNodeIds - Set всех referenced ID узлов
 * @param allConditionalButtons - Set всех условных кнопок
 * @param code - Текущий код
 * @param processNodeButtonsAndGenerateHandlers - Функция обработки кнопок
 * @param nodes - Массив всех узлов
 * @param allNodeIds - Массив всех ID узлов
 * @param connections - Массив соединений
 * @param userDatabaseEnabled - Включена ли БД пользователей
 * @param mediaVariablesMap - Карта медиа-переменных
 * @returns Сгенерированный Python-код
 */
export function generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(
  inlineNodes: any[],
  allReferencedNodeIds: Set<string>,
  allConditionalButtons: Set<string>,
  code: string,
  processNodeButtonsAndGenerateHandlers: (processedCallbacks: Set<string>) => void,
  nodes: any[],
  allNodeIds: any[],
  connections: any[],
  userDatabaseEnabled: boolean,
  mediaVariablesMap: Map<string, { type: string; variable: string; }>
): string {
  if (inlineNodes.length > 0 || allReferencedNodeIds.size > 0 || allConditionalButtons.size > 0) {
    // Комментарий "Обработчики inline кнопок" только если действительно есть inline кнопки
    if (inlineNodes.length > 0 || allConditionalButtons.size > 0) {
      code += '\n# Обработчики inline кнопок\n';
    } else {
      // Для автопереходов используем специальный комментарий
      code += '\n# Обработчики автопереходов\n';
    }
    const processedCallbacks = new Set<string>();

    // Пропускаем обработчики условных заполнителей - они конфликтуют с основными обработчиками
    // Основные обработчики обратного вызова ниже будут правильно обрабатывать все взаимодействия с кнопками
    // Затем обрабатываем узла inline кнопок - создаем обработчики для каждого уникального идентификатора кнопки
    processNodeButtonsAndGenerateHandlers(processedCallbacks);

    // ===========================================================================
    // ============================================================================
    // ОСНОВНОЙ ЦИКЛ ГЕНЕРАЦИИ ОБРАБОТЧИКОВ
    // ============================================================================
    // Теперь генерируем обработчики обратного вызова для всех оставшихся ссылочных узлов, которые не имеют inline кнопок
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Обработка allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Уже обработанные callbacks: ${Array.from(processedCallbacks).join(', ')}`);

    allReferencedNodeIds.forEach(nodeId => {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔎 ГЕНЕРАТОР: Проверяем узел ${nodeId}`);
      if (!processedCallbacks.has(nodeId)) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Узел ${nodeId} НЕ был обработан ранее, создаем обработчик`);
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: Найден узел ${nodeId}, тип: ${targetNode.type}`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: allowMultipleSelection: ${targetNode.data.allowMultipleSelection}`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: keyboardType: ${targetNode.data.keyboardType}`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: кнопок: ${targetNode.data.buttons?.length || 0}`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: continueButtonTarget: ${targetNode.data.continueButtonTarget || 'нет'}`);



          // ИСПРАВЛЕНИЕ: Создаем handle_callback_* для ВСЕХ узлов включая 'start'
          // start_handler обрабатывает команду /start (message handler)
          // handle_callback_start обрабатывает навигацию через callback (callback handler)
          // Это разные функции, поэтому нужно создавать handle_callback_start для навигации
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`Создаем handle_callback_${nodeId} для узла ${nodeId} (включая start для навигации)`);



          processedCallbacks.add(`cb_${nodeId}`);

          // Создаем обработчик обратного вызова для этого узла
          const shortNodeIdForDone = String(nodeId).slice(-10).replace(/^_+/, '');
          code += generateCallbackHandlerStart(nodeId, shortNodeIdForDone, '');
          code += '    \n';
          code += '    # Проверяем флаг hideAfterClick для кнопок\n';
          code += `    ${generateHideAfterClickMiddleware(targetNode)}\n`;
          code += '    \n';
          code += '    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)\n';
          code += '    try:\n';
          code += '        await callback_query.answer()\n';
          code += '    except Exception:\n';
          code += '        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)\n';
          code += '    \n';
          code += '    # Инициализируем базовые переменные пользователя\n';
          code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
          code += '    \n';

          // Устанавливаем флаг collectUserInput для текущего узла
          code += generateCollectUserInputFlag(nodeId, targetNode.data, '    ');
          code += '    \n';

          // ============================================================================
          // ОБРАБОТКА МНОЖЕСТВЕННОГО ВЫБОРА
          // ============================================================================
          // Добавляем обработку кнопки "Готово" для множественного выбора
          if (targetNode.data?.allowMultipleSelection) {
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            code += generateMultiSelectDoneButton({
              nodeId,
              multiSelectVariable,
              continueButtonTarget: targetNode.data.continueButtonTarget
            }, '    ');
            
            // Переход к следующему узлу
            if (targetNode.data.continueButtonTarget) {
              const nextNodeId = targetNode.data.continueButtonTarget;
              // Проверяем, существует ли целевой узел перед вызовом обработчика
              const targetExists = nodes.some(n => n.id === nextNodeId);
              code += '        # Переход к следующему узлу\n';
              code += `        next_node_id = "${nextNodeId}"\n`;
              code += '        try:\n';
              if (targetExists) {
                code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
              } else {
                code += `            logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")\n`;
                code += `            await callback_query.message.edit_text("Переход завершен")\n`;
              }
              code += '        except Exception as e:\n';
              code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
              code += `            await callback_query.message.edit_text("Переход завершен")\n`;
            } else {
              code += '        # Завершение множественного выбора\n';
              code += `        await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
            }
            code += '        return\n';
            code += '    \n';
          }

          // ============================================================================
          // ОБРАБОТКА УЗЛОВ РАССЫЛКИ (broadcast)
          // ============================================================================
          if (targetNode.type === 'broadcast') {
            code += generateBroadcastHandler({
              nodeId,
              enableConfirmation: targetNode.data?.enableConfirmation,
              confirmationText: targetNode.data?.confirmationText
            }, '    ');
          }

          // Обычная обработка узлов без специальной логики
          // Определяем переменную для сохранения на основе родительского узла
          if (targetNode && targetNode.data?.inputVariable) {
            const variableName = targetNode.data.inputVariable;
            const variableValue = 'callback_query.data';

            // Проверяем skipDataCollection
            code += generateSkipDataCollectionCheck(variableName, variableValue, '    ');
          }

          code += generateMessageTextPreparation({ nodeId, messageText: targetNode.data?.messageText }, '    ');

          // Получаем переменные из базы данных перед заменой
          code += generateDatabaseVarsGet('    ');
          code += generateDatabaseVariablesCode('    ');
          code += '    \n';

          const universalVarCodeLines: string[] = [];
          generateUniversalVariableReplacement(universalVarCodeLines, '    ');
          code += universalVarCodeLines.join('\n');

          // ============================================================================
          // ОБРАБОТКА УСЛОВНЫХ СООБЩЕНИЙ
          // ============================================================================
          if (targetNode.data?.enableConditionalMessages && targetNode.data?.conditionalMessages && targetNode.data?.conditionalMessages.length > 0) {
            code += generateConditionalMessagesCheck({
              conditionalMessages: targetNode.data.conditionalMessages
            }, '    ');
          }

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, есть ли условная клавиатура
          // Не оборачиваем код в if - вместо ятого просто используем условную клавиатуру при отправке
          // ИСПРАВЛЕНИЕ: Добавляем специальную обработку для узлов с множественным выбором
          // ============================================================================
          // ГЕНЕРАЦИЯ КЛАВИАТУР (INLINE/REPLY)
          // ============================================================================
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Все узла с кнопками selection обрабатываются как множественный выбор
          const hasSelectionButtons = targetNode.data?.buttons && targetNode.data.buttons.some((btn: { action: string; }) => btn.action === 'selection');
          if (targetNode.data?.allowMultipleSelection || hasSelectionButtons) {
            // Узел с множественным выбором - создаем специальную клавиатуру
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: ========================================`);
            const reason = hasSelectionButtons ? 'ИМЕЕТ КНОПКИ SELECTION' : 'ИМЕЕТ allowMultipleSelection=true';
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: УЗЕЛ ${nodeId} ${reason}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: ЭТО ПРАВИЛЬяЫЙ ПУТЬ ВЫПОЛНЕНИЯ!`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔘 ГЕНЕРАТОР: Кнопки узла ${nodeId}:`, targetNode.data.buttons?.map((b: { text: any; action: any; }) => `${b.text} (action: ${b.action})`)?.join(', ') || 'НЕТ КНОПОК');
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget для ${nodeId}: ${targetNode.data.continueButtonTarget}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: multiSelectVariable для ${nodeId}: ${targetNode.data.multiSelectVariable}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons: ${hasSelectionButtons}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: ========================================`);

            // Инициализация состояния множественного выбора
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_selection';
            const multiSelectKeyboardType = targetNode.data.keyboardType || 'reply';

            code += generateMultiSelectInit({
              nodeId,
              multiSelectVariable,
              multiSelectKeyboardType
            }, '    ');

            // ИСПРАВЛЕНИЕ: Проверяем тип клавиатуры и генерируем соответствующий код
            if (multiSelectKeyboardType === 'reply') {
              // Reply клавиатура для множественного выбора
              code += generateMultiSelectReplyKeyboard({
                nodeId,
                buttons: targetNode.data.buttons || [],
                continueButtonText: targetNode.data.continueButtonText,
                resizeKeyboard: targetNode.data.resizeKeyboard,
                oneTimeKeyboard: targetNode.data.oneTimeKeyboard
              }, '    ');
            } else {
              // Inline клавиатура для множественного выбора
              code += generateMultiSelectInlineKeyboard({
                nodeId,
                buttons: targetNode.data.buttons || [],
                allNodeIds
              }, '    ');
            }

          } else if (targetNode.data?.keyboardType !== 'none' && targetNode.data?.buttons && targetNode.data?.buttons.length > 0) {
            // Обычные кнопки без множественного выбора
            // ИСПРАВЛЕНИЕ: Проверяем keyboardType узла и генерируем соответствующую клавиатуру
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ генерируем клавиатуру если keyboardType === 'none'
            if (targetNode.data.keyboardType === 'reply') {
              // Генерируем reply клавиатуру
              code += '    # Create reply keyboard\n';

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, была ли уже создана условная клавиатура
              if (targetNode.data?.enableConditionalMessages && targetNode.data?.conditionalMessages && targetNode.data?.conditionalMessages.length > 0) {
                // Инициализируем переменную conditional_keyboard, если она не была определена
                code += '    if "conditional_keyboard" not in locals():\n';
                code += '        conditional_keyboard = None\n';
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '        logging.info("✅ Используем уяловную reply клавиатуру")\n';
                code += '    else:\n';
                code += '        # Условная клавиатура не создана, используем обычную\n';
                code += '        builder = ReplyKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button) => {
                  if (btn.action === "contact" && btn.requestContact) {
                    code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                  } else if (btn.action === "location" && btn.requestLocation) {
                    code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                  } else {
                    code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                  }
                });
                // Автоматическое распределение колонок для reply клавиатуры
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `        builder.adjust(${columns})\n`;
                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                code += '        logging.info("✅ Используем обычную reply клавиатуру")\n';
              } else {
                // Нет условных сообщений, просто создаем обычную клавиатуру
                code += '    # Удаляем старое сообщение и отправляем новое с reply клавиатурой\n';
                code += '    builder = ReplyKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button) => {
                  if (btn.action === "contact" && btn.requestContact) {
                    code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                  } else if (btn.action === "location" && btn.requestLocation) {
                    code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                  } else {
                    code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                  }
                });
                // Автоматическое распределение колонок для reply клавиатуры
                const columns2 = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `    builder.adjust(${columns2})\n`;
                const resizeKeyboard2 = toPythonBoolean(targetNode.data.resizeKeyboard);
                const oneTimeKeyboard2 = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard2}, one_time_keyboard=${oneTimeKeyboard2})\n`;
              }
              code += '    # Для reply клавиатуры нужно отправить новое сообщение\n';
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += '    # Заменяем все переменные в тексте\n';
              code += '    text = replace_variables_in_text(text, user_vars)\n';
              // NOTE: Отправка сообщения для reply клавиатуры обрабатывается в другом месте
              // await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)

              // Проверяем автопереход для reply клавиатуры
              const currentNodeForReplyAutoTransition = nodes.find(n => n.id === nodeId);
              let replyAutoTransitionTarget: string | null = null;
              if (currentNodeForReplyAutoTransition?.data.enableAutoTransition && currentNodeForReplyAutoTransition?.data.autoTransitionTo) {
                replyAutoTransitionTarget = currentNodeForReplyAutoTransition.data.autoTransitionTo;
              } else if (currentNodeForReplyAutoTransition && (!currentNodeForReplyAutoTransition.data.buttons || currentNodeForReplyAutoTransition.data.buttons.length === 0)) {
                const outgoingConnections = connections.filter(conn => conn && conn.source === nodeId);
                if (outgoingConnections.length === 1) {
                  replyAutoTransitionTarget = outgoingConnections[0].target;
                }
              }

              if (replyAutoTransitionTarget) {
                // Проверяем, существует ли целевой узел перед вызовом обработчика
                const targetExists = nodes.some(n => n.id === replyAutoTransitionTarget);
                const safeFunctionName = replyAutoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
                code += '    \n';
                code += '    # АВТОПЕРЕХОД после reply клавиатуры\n';
                code += `    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${replyAutoTransitionTarget}")\n`;
                if (targetExists) {
                  code += `    await handle_callback_${safeFunctionName}(callback_query)\n`;
                } else {
                  code += `    logging.warning(f"⚠️ Узел автоперехода не найден: {replyAutoTransitionTarget}, завершаем переход")\n`;
                  code += `    await callback_query.message.edit_text("Переход завершен")\n`;
                }
                code += `    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${replyAutoTransitionTarget}")\n`;
              }

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Настраиваем waiting_for_input яяля targetNode ТОЛЬКяя если collectUserInput=true
              const targetCollectInputReply = targetNode.data.collectUserInput === true ||
                targetNode.data.enableTextInput === true ||
                targetNode.data.enablePhotoInput === true ||
                targetNode.data.enableVideoInput === true ||
                targetNode.data.enableAudioInput === true ||
                targetNode.data.enableDocumentInput === true;

              if (targetCollectInputReply) {
                const targetInputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const targetSaveToDb = targetNode.data.saveToDatabase !== false;

                code += '    \n';
                code += '    # Настройка waiting_for_input для узла с reply клавиатурой (collectUserInput=true)\n';
                code += '    user_id = callback_query.from_user.id\n';
                code += '    if user_id not in user_data:\n';
                code += '        user_data[user_id] = {}\n';

                // Определяем modes для ввода
                const modes: string[] = [];
                if (targetNode.data.keyboardType === 'reply' && targetNode.data.buttons?.length > 0) {
                  modes.push('button');
                }
                if (targetNode.data.enableTextInput !== false) {
                  modes.push('text');
                }
                if (targetNode.data.enablePhotoInput) modes.push('photo');
                if (targetNode.data.enableVideoInput) modes.push('video');
                if (targetNode.data.enableAudioInput) modes.push('audio');
                if (targetNode.data.enableDocumentInput) modes.push('document');

                const modesStr = modes.length > 0 ? modes.map(m => `'${m}'`).join(', ') : "'button', 'text'";

                // Собираем кнопки с skipDataCollection для reply клавиатуры
                const skipButtons = (targetNode.data.buttons || [])
                  .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                  .map((btn: any) => ({ text: btn.text, target: btn.target }));
                const skipButtonsJson = JSON.stringify(skipButtons);

                code += `    user_data[user_id]["waiting_for_input"] = {\n`;
                code += `        "type": "button",\n`;
                code += `        "modes": [${modesStr}],\n`;
                code += `        "variable": "${targetInputVariable}",\n`;
                code += `        "save_to_database": ${targetSaveToDb ? 'True' : 'False'},\n`;
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "next_node_id": "",\n`;
                code += `        "skip_buttons": ${skipButtonsJson}\n`;
                code += `    }\n`;
                code += `    logging.info(f"✅ Состояние ожидания настроено: modes=[${modesStr}] для переменной ${targetInputVariable} (узел ${targetNode.id})")\n`;
              } else {
                code += '    \n';
                code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                code += `    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;

                // Проверяем, есть ли прикрепленные медиафайлы и отправляем соответствующим образом
                const attachedMedia = targetNode.data.attachedMedia || [];
                if (attachedMedia.length > 0) {
                  // Обновляем user_vars, чтобы включить только что установленные переменные медиа
                  code += '    # Обновляем user_vars, чтобы включить только что установленные переменные медиа\n';
                  code += '    user_vars = await get_user_from_db(callback_query.from_user.id)\n';
                  code += '    if not user_vars:\n';
                  code += '        user_vars = user_data.get(callback_query.from_user.id, {})\n';
                  code += '    # get_user_from_db теперь возвращает уже обработанные user_data\n';
                  code += '    if not isinstance(user_vars, dict):\n';
                  code += '        user_vars = user_data.get(callback_query.from_user.id, {})\n';

                  // Используем generateAttachedMediaSendCode для отправки медиа
                  const parseModeStr = targetNode.data.formatMode || 'HTML';
                  const keyboardStr = 'keyboard';
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
                    nodeId,
                    '    ',
                    undefined, // автопереход обрабатывается отдельно
                    collectUserInputFlag,
                    targetNode.data // передаем данные узла для проверки статических изображений
                  );

                  if (mediaCode) {
                    code += '    # Отправляем сообщение (с проверкой прикрепленного медиа)\n';
                    code += mediaCode;
                  } else {
                    // Резервный вариант если не удалось сгенерировать код медиа
                    code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                  }
                } else {
                  // Обычная отправка без медиа
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                }

                // Убираем return, чтобы автопереходы могли работать
                return; // Но оставляем return для завершения функции
              }

              // Если collectUserInput=true, продолжаем выполнение и отправляем сообщение с медиа
              // Проверяем, есть ли прикрепленные медиафайлы и отправляем соответствующим образом
              const attachedMedia = targetNode.data.attachedMedia || [];
              if (attachedMedia.length > 0) {
                // Используем generateAttachedMediaSendCode для отправки медиа
                const parseModeStr = targetNode.data.formatMode || 'HTML';
                const keyboardStr = 'keyboard';
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
                  nodeId,
                  '    ',
                  undefined, // автопереход обрабатывается отдельно
                  collectUserInputFlag,
                  targetNode.data // передаем данные узла для проверки статических изображений
                );

                if (mediaCode) {
                  code += '    # Отправляем сообщение (с проверкой прикрепленного медиа)\n';
                  code += mediaCode;
                }
              }
            } else {
              // Генерируем inline клавиатуру (по умолчанию)
              code += '    # Create inline keyboard\n';
              code += '    builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "goto" && btn.target) {
                  const btnCallbackData = `${btn.target}_btn_${index}`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                } else if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === "command" && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `    # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                } else if (btn.action === "selection") {
                  // Добавляем поддержку кнопок выбора для обычных узлов
                  const callbackData = `multi_select_${nodeId}_${btn.target || btn.id}`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              // Автоматическое распределение колонок для обычных кнопок
              const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
              code += `    builder.adjust(${columns})\n`;
              code += '    keyboard = builder.as_markup()\n';
            }
          } else {
            code += '    keyboard = None\n';
          }

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем условную клавиатуру и используем её если есть
          code += '    \n';
          code += '    # Проверяем, есть ли условная клавиатура для использования\n';
          code += '    # Инициализируем переменную conditional_keyboard, если она не была определена\n';
          code += '    if "conditional_keyboard" not in locals():\n';
          code += '        conditional_keyboard = None\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    if user_id not in user_data:\n';
          code += '        user_data[user_id] = {}\n';
          code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
          code += '        keyboard = conditional_keyboard\n';
          code += '        user_data[user_id]["_has_conditional_keyboard"] = True\n';
          code += '        logging.info("✅ Используем условную клавиатуру для навигации")\n';
          code += '    else:\n';
          code += '        user_data[user_id]["_has_conditional_keyboard"] = False\n';
          code += '    \n';

          // ============================================================================
          // ОБРАБОТКА МЕДИА-КОНТЕНТА
          // ============================================================================
          // Устанавливаем переменные медиа для узла
          code += generateMediaVariablesSetup({
            nodeId,
            imageUrl: targetNode.data?.imageUrl,
            videoUrl: targetNode.data?.videoUrl,
            audioUrl: targetNode.data?.audioUrl,
            documentUrl: targetNode.data?.documentUrl,
            attachedMedia: targetNode.data?.attachedMedia,
            userDatabaseEnabled
          }, '    ');

          // ИСПРАВЛЕНИЕ: Проверяем наличие прикрепленных медиа ИЛИ статического изображения перед отправкой
          const attachedMedia = targetNode.data?.attachedMedia || [];
          const hasStaticImage = targetNode.data?.imageUrl && targetNode.data.imageUrl.trim() !== '';

          if (attachedMedia.length > 0 || hasStaticImage) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} имеет attachedMedia:`, attachedMedia, 'или статическое изображение:', hasStaticImage);
            // Генерируем код отправки с медиа
            const parseModeStr = targetNode.data?.formatMode || '';
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
              nodeId,
              '    ',
              undefined, // автопяяреход обрабатывается отдельно ниже
              collectUserInputFlag,
              targetNode.data // передаем данные узла для проверки статических изобраяяений
            );

            if (mediaCode) {
              code += '    # Отправляем сообщение (с проверкой прикрепленного медиа)\n';
              code += mediaCode;
            } else {
              // Резервный вариант если не удалось сгенерировать код медиа
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Не удалось сгенерировать код медиа для узла ${nodeId}, используем обычную отправку`);
              code += '    # Отправляем сообщение\n';
              code += '    try:\n';
              code += '        if keyboard:\n';
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += '            # Заменяем все переменныяя в яяексяяе\n';
              code += '            text = replace_variables_in_text(text, user_vars)\n';
              code += '            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатяяяв при автопереходах)\n';
              // КяяИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += '            # Заменяем все переменные в тексте\n';
              code += '            text = replace_variables_in_text(text, user_vars)\n';
              code += '            await callback_query.message.answer(text)\n';
              code += '    except Exception as e:\n';
              code += '        logging.debug(f"Ошибка отправки сообщения: {e}")\n';
              code += '        if keyboard:\n';
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += '            # Заменяем все переменные в тексте\n';
              code += '            text = replace_variables_in_text(text, user_vars)\n';
              code += '            await callback_query.message.answer(text, reply_markup=keyboard)\n';
              code += '        else:\n';
              // КРяяТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += '            # Заменяем все переменные в тексте\n';
              code += '            text = replace_variables_in_text(text, user_vars)\n';
              code += '            await callback_query.message.answer(text)\n';
              code += '    \n';
            }
          } else {
            // Обычное сообщение без медиа
            // Отправляем сообщение с клавиатурой
            code += '    # Отправляем сообщение\n';
            code += '    try:\n';
            code += '        if keyboard:\n';
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
            code += '            # Заменяем все переменные в тексте\n';
            code += '            text = replace_variables_in_text(text, user_vars)\n';
            code += '            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n';
            code += '        else:\n';
            code += '            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автояяереходах)\n';
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязатеяяяьно вызываем заменяя переменных в тексте
            code += '            # Заменяем все переменные в тексте\n';
            code += '            text = replace_variables_in_text(text, user_vars)\n';
            code += '            await callback_query.message.answer(text)\n';
            code += '    except Exception as e:\n';
            code += '        logging.debug(f"Ошибка отправки сообщения: {e}")\n';
            code += '        if keyboard:\n';
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
            code += '            # Заменяем все переменные в тексте\n';
            code += '            text = replace_variables_in_text(text, user_vars)\n';
            code += '            await callback_query.message.answer(text, reply_markup=keyboard)\n';
            code += '        else:\n';
            // КРИТИЧЕяяКОЕ ИСПРАяяЛЕНИЕ: Обязательно вызываем замену переменных в тексте
            code += '            # Заменяем все переменные в яяексте\n';
            code += '            text = replace_variables_in_text(text, user_vars)\n';
            code += '            await callback_query.message.answer(text)\n';
            code += '    \n';
          }

          // ============================================================================
          // СИСТЕМА АВТОПЕРЕХОДОВ
          // ============================================================================
          const currentNodeForAutoTransition = nodes.find(n => n.id === nodeId);
          let autoTransitionTarget: string | null = null;

          // Проверяем явный автопереход через флаг
          if (currentNodeForAutoTransition?.data?.enableAutoTransition && currentNodeForAutoTransition?.data?.autoTransitionTo) {
            autoTransitionTarget = currentNodeForAutoTransition.data.autoTransitionTo;
          }
          // Если узел без кнопок и имеет одно соединение — делаем автопереход
          else if (currentNodeForAutoTransition && (!currentNodeForAutoTransition.data?.buttons || currentNodeForAutoTransition.data?.buttons.length === 0)) {
            const outgoingConnections = connections.filter(conn => conn && conn.source === nodeId);
            if (outgoingConnections.length === 1) {
              autoTransitionTarget = outgoingConnections[0].target;
            }
          }

          code += generateAutoTransitionCheck({ nodeId, targetNode, nodes, connections }, '    ');

          if (autoTransitionTarget) {
            const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
            code += generateAutoTransitionCode(autoTransitionTarget, nodeId, targetNode, '    ');
            code += `        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTarget}")\n`;
            // Проверяем, существует ли целевой узел перед вызовом обработчика
            const targetExists = nodes.some(n => n.id === autoTransitionTarget);
            if (targetExists) {
              code += `        await handle_callback_${safeFunctionName}(callback_query)\n`;
            } else {
              code += `        logging.warning(f"⚠️ Узел автоперехода не найден: {autoTransitionTarget}, завершаем переход")\n`;
              code += `        await callback_query.message.edit_text("Переход завершен")\n`;
            }
            code += `        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTarget}")\n`;
            code += `        return\n`;
            code += '    \n';
          }

          // ИСПРАВЛЕНИЕ: Если автопереход не произошел, устанавливаем состояние ожидания
          const collectInputAfterTransitionCheck = targetNode.data?.collectUserInput !== false ||
            targetNode.data.enableTextInput === true ||
            targetNode.data.enablePhotoInput === true ||
            targetNode.data.enableVideoInput === true ||
            targetNode.data.enableAudioInput === true ||
            targetNode.data.enableDocumentInput === true;

          if (collectInputAfterTransitionCheck) {
            code += '    # Устанавливаем waiting_for_input, так как автопереход не выполнен\n';
            if (targetNode && targetNode.data) {
              code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
            }
          }

          // ============================================================================
          // СОХРАНЕНИЕ ДАННЫХ И НАВИГАЦИЯ
          // ============================================================================
          // Сохраняем нажатие кнопки в базу данных ТОЛЬКО если это реальнаяя кнопка
          code += '    user_id = callback_query.from_user.id\n';
          code += '    \n';

          // Генерируем код для поиска яттекста кнопки
          const sourceNode = nodes.find(n => n && n.data?.buttons && n.data.buttons.some((btn: { target: string; }) => btn.target === nodeId)
          );

          // Если к узлу ведут несколько кнопоя, нужно определить, какую именяо нажали
          let buttonsToTargetNode = [];
          if (sourceNode) {
            buttonsToTargetNode = sourceNode.data.buttons.filter((btn: { target: string; }) => btn.target === nodeId);
          }

          // Сохраняем button_click ТОЛЬКО если есть sourceNode (реальнаяя кнопка, а не автопереход)
          if (sourceNode) {
            code += '    # Сохраняем нажатие кнопки в базу данных\n';
            code += '    # Ищем текят кнопки по callback_data\n';

            if (buttonsToTargetNode.length > 1) {
              // Несколько кнопяк ведут к одному узлу - создяем логику определения по callback_data
              code += `    # Определяем тякст кнопки по callback_data\n`;
              code += `    button_display_text = "Неизвестная кнопка"\n`;
              buttonsToTargetNode.forEach((button: Button, index: number) => {
                // Проверяем по суффиксу _btn_index в callback_data
                code += `    if callback_query.data.endswith("_btn_${index}"):\n`;
                code += `        button_display_text = "${button.text}"\n`;
              });

              // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ищем кнопку по точному соответствию callback_data с nodeId
              code += `    # Дополнительная проверка по точному соответствию callback_data\n`;
              buttonsToTargetNode.forEach((button: Button) => {
                code += `    if callback_query.data == "${nodeId}":\n`;
                // Для случая когда несколько кнопок вядут к одному узлу, используем первую найденную
                code += `        button_display_text = "${button.text}"\n`;
              });
            } else {
              const button = sourceNode.data.buttons.find((btn: Button) => btn.target === nodeId);
              if (button) {
                code += `    button_display_text = "${button.text}"\n`;
              } else {
                code += `    button_display_text = "Кнопка ${nodeId}"\n`;
              }
            }
            code += '    \n';
            code += '    # Сохраняем ответ в базу данных\n';

            code += '    timestamp = get_moscow_time()\n';
            code += '    \n';
            code += '    response_data = button_display_text  # Простое значение\n';
            code += '    \n';
            code += '    # Сохраняем в пользовательские данные\n';
            code += '    if user_id not in user_data:\n';
            code += '        user_data[user_id] = {}\n';
            code += '    user_data[user_id]["button_click"] = button_display_text\n';
          }

          // Определяем переменную для сохя��нения на основе кнопки (ТОЛЬКО есяи есть sourceNode)
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ сохраняем переменную если показана условная клавиатура
          // Нужно дождаться, пока пользователь нажмёт кнопку на условной клавиатуре
          if (sourceNode) {
            code += '    \n';
            code += '    # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, была ли показана условная клавиатура\n';
            code += '    # Если да - НЕ сохраняем переменную сейчас, ждём выбора пользователя\n';
            code += '    has_conditional_keyboard_for_save = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n';
            code += '    if not has_conditional_keyboard_for_save:\n';

            const parentNode = nodes.find(n => n.data.buttons && n.data.buttons.some((btn: { target: string; }) => btn.target === nodeId)
            );

            let variableName = 'button_click';
            let variableValue = 'button_display_text';

            // КРИТИЧЕСКИ ВАЖНО: специальная логика для шаблона "Федя"
            if (nodeId === 'source_search') {
              variableName = 'источник';
              variableValue = '"🔍 Поиск в интернете"';
            } else if (nodeId === 'source_friends') {
              variableName = 'источник';
              variableValue = '"👥 Друзья"';
            } else if (nodeId === 'source_ads') {
              variableName = 'источник';
              variableValue = '"📱 Реклама"';
            } else if (parentNode && parentNode.data.inputVariable) {
              variableName = parentNode.data.inputVariable;

              // Ищем конкретную кнопку и её значение
              const button = parentNode.data.buttons.find((btn: { target: string; }) => btn.target === nodeId);
              if (button) {
                // Определяем значение переменной в зависимости от кнопки
                if (button.id === 'btn_search' || nodeId === 'source_search') {
                  variableValue = '"из инетя"';
                } else if (button.id === 'btn_friends' || nodeId === 'source_friends') {
                  variableValue = '"friends"';
                } else if (button.id === 'btn_ads' || nodeId === 'source_ads') {
                  variableValue = '"ads"';
                } else if (variableName === 'пол') {
                  // Специальная логика для переменной "пол"
                  if (button.text === 'Мужчина' || button.text === '👨 Мужчина') {
                    variableValue = '"Мужчина"';
                  } else if (button.text === 'Женщина' || button.text === '👩 Женщина') {
                    variableValue = '"Женщина"';
                  } else {
                    variableValue = `"${button.text}"`;
                  }
                } else {
                  variableValue = 'button_display_text';
                }
              }
            }

            code += '        # Сохраняем в базу данных с правильным именем переяенной\n';
            code += `        await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
            code += `        logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
            code += '    else:\n';
            code += '        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")\n';
            code += '    \n';
          }

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Для узлов с множественным выбором НЕ делаем автоматической переадресации
          const currentNode = nodes.find(n => n.id === nodeId);

          // Для узлов с множественным выбором - НЕ делаем автоматический переход при первичном заходе в узел
          // ИСПРАВЛЕНИЕ: редирект только для узлов с кнопками, чтобы избежать дублирования сообщений при автопереходах
          const hasButtons = currentNode && currentNode.data?.buttons && currentNode.data.buttons.length > 0;
          const shouldRedirect = hasButtons && !(currentNode && currentNode.data.allowMultipleSelection);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Узел ${nodeId} hasButtons: ${hasButtons}, allowMultipleSelection: ${currentNode?.data.allowMultipleSelection}, shouldRedirect: ${shouldRedirect}`);

          let redirectTarget = nodeId; // По умолчанию остаемся в том же уяле

          if (shouldRedirect) {
            if (currentNode && currentNode.data.continueButtonTarget) {
              // Для обычных узлов используем continueButtonTarget если есть
              redirectTarget = currentNode.data.continueButtonTarget;
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит к continueButtonTarget ${redirectTarget}`);
            } else {
              // Для обычных узлов ищем следующий узел через соединения
              const nodeConnections = connections.filter(conn => conn && conn.source === nodeId);
              if (nodeConnections.length > 0) {
                redirectTarget = nodeConnections[0].target;
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит через соединение к ${redirectTarget}`);
              } else {
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} остается в том же узле (нет соединений)`);
              }
            }
          } else {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} без кнопок или с множественным выбором - НЕ делаем автоматическую переадресацию`);
          }

          // ============================================================================
          // СИСТЕМА ПЕРЕАДРЕСАЦИИ
          // ============================================================================
          if (shouldRedirect && redirectTarget && redirectTarget !== nodeId) {
            code += '    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных\n';
            code += `    next_node_id = "${redirectTarget}"\n`;
            code += '    try:\n';
            code += '        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")\n';

            // Добавляем навигацию для каждого узла
            if (nodes.length > 0) {
              nodes.forEach((navTargetNode, index) => {
                const condition = index === 0 ? 'if' : 'elif';
                code += `        ${condition} next_node_id == "${navTargetNode.id}":\n`;

                if (navTargetNode.type === 'message') {
                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                  if (navTargetNode.data.allowMultipleSelection === true) {
                    // Для узлов с множественным выбором вызываем полноценный обработчик
                    const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                    code += `            # Узел с множественным выбором - вызываем полноценный обработчик\n`;
                    code += `            logging.info(f"🔧 Callback навигация к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                    code += `            await handle_callback_${safeFunctionName}(callback_query)\n`;
                  } else {
                    // Проверяем, есть ли условные сообщения для этого узла
                    const hasConditionalMessages = navTargetNode.data.enableConditionalMessages &&
                      navTargetNode.data.conditionalMessages &&
                      navTargetNode.data.conditionalMessages.length > 0;

                    if (hasConditionalMessages && navTargetNode.data.collectUserInput === true) {
                      // Для узлов с условными сообщениями вызываем полноценный обработчик
                      const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                      code += `            # Узел с условными сообщениями - вызываем полноценный обработчик\n`;
                      code += `            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: ${navTargetNode.id}")\n`;
                      code += `            await handle_node_${safeFunctionName}(callback_query.message)\n`;
                    } else {
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `            nav_text = ${formattedText}\n`;

                      // Добавляем замену переменных в nav_text
                      code += '            # Подставляем переменные пользователя в текст\n';
                      code += '            nav_user_vars = await get_user_from_db(callback_query.from_user.id)\n';
                      code += '            if not nav_user_vars:\n';
                      code += '                nav_user_vars = user_data.get(callback_query.from_user.id, {})\n';
                      code += '            if not isinstance(nav_user_vars, dict):\n';
                      code += '                nav_user_vars = {}\n';
                      code += '            # Заменяем переменные в nav_text\n';
                      code += '            for var_name, var_data in nav_user_vars.items():\n';
                      code += '                placeholder = "{" + var_name + "}"\n';
                      code += '                if placeholder in nav_text:\n';
                      code += '                    if isinstance(var_data, dict) and "value" in var_data:\n';
                      code += '                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n';
                      code += '                    elif var_data is not None:\n';
                      code += '                        var_value = str(var_data)\n';
                      code += '                    else:\n';
                      code += '                        var_value = var_name\n';
                      code += '                    nav_text = nav_text.replace(placeholder, var_value)\n';

                      // Проверяем, есть ли прикрепленные медиа
                      const hasAttachedMedia = navTargetNode.data.attachedMedia && navTargetNode.data.attachedMedia.length > 0;

                      if (hasAttachedMedia) {
                        // Генерируем код для отправки медиа
                        const attachedMedia = navTargetNode.data.attachedMedia;
                        code += '            # Проверяем наличие прикрепленного медиа\n';
                        code += `            nav_attached_media = None\n`;
                        code += `            if nav_user_vars and "${attachedMedia[0]}" in nav_user_vars:\n`;
                        code += `                media_data = nav_user_vars["${attachedMedia[0]}"]\n`;
                        code += `                if isinstance(media_data, dict) and "value" in media_data:\n`;
                        code += `                    # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа\n`;
                        code += `                    if "photoUrl" in media_data and media_data["photoUrl"]:\n`;
                        code += `                        nav_attached_media = media_data["photoUrl"]\n`;
                        code += `                    elif "videoUrl" in media_data and media_data["videoUrl"]:\n`;
                        code += `                        nav_attached_media = media_data["videoUrl"]\n`;
                        code += `                    elif "audioUrl" in media_data and media_data["audioUrl"]:\n`;
                        code += `                        nav_attached_media = media_data["audioUrl"]\n`;
                        code += `                    elif "documentUrl" in media_data and media_data["documentUrl"]:\n`;
                        code += `                        nav_attached_media = media_data["documentUrl"]\n`;
                        code += `                    else:\n`;
                        code += `                        nav_attached_media = media_data["value"]\n`;
                        code += `                elif isinstance(media_data, str):\n`;
                        code += `                    nav_attached_media = media_data\n`;
                        code += `            if nav_attached_media and str(nav_attached_media).strip():\n`;
                        code += `                logging.info(f"📎 Отправка медиа из переменной ${attachedMedia[0]}: {nav_attached_media}")\n`;
                        code += `                # Проверяем, является ли медиа относительным путем к локальному файлу\n`;
                        code += `                if str(nav_attached_media).startswith('/uploads/'):\n`;
                        code += `                    nav_attached_media_path = get_upload_file_path(nav_attached_media)\n`;
                        code += `                    nav_attached_media_url = FSInputFile(nav_attached_media_path)\n`;
                        code += `                    await bot.send_photo(callback_query.from_user.id, nav_attached_media_url, caption=nav_text)\n`;
                        code += `                else:\n`;
                        code += `                    await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)\n`;
                        code += `            else:\n`;
                        code += `                logging.info("📝 Медиа не найдено, отправка текстового сообщения")\n`;
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `                # Заменяем все переменные в тексте\n`;
                        code += `                nav_text = replace_variables_in_text(nav_text, user_vars)\n`;
                        code += `                await callback_query.message.edit_text(nav_text)\n`;
                      } else {
                        // Проверяем, есть ли reply кнопки
                        if (navTargetNode.data.keyboardType === 'reply' && navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                          code += '            # Удаляем старое сообщение и отправляем новое с reply клавиатурой\n';
                          code += '            builder = ReplyKeyboardBuilder()\n';
                          navTargetNode.data.buttons.forEach((button: Button) => {
                            if (button.action === "contact" && button.requestContact) {
                              code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                            } else if (button.action === "location" && button.requestLocation) {
                              code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                            } else {
                              code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                            }
                          });
                          const resizeKeyboard = toPythonBoolean(navTargetNode.data.resizeKeyboard);
                          const oneTimeKeyboard = toPythonBoolean(navTargetNode.data.oneTimeKeyboard);
                          code += `            keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                          code += '            # Заменяем все переменные в тексте\n';
                          code += '            nav_text = replace_variables_in_text(nav_text, user_vars)\n';
                          code += '            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)\n';
                        } else {
                          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                          code += '            # Заменяем все переменные в тексте\n';
                          code += '            nav_text = replace_variables_in_text(nav_text, user_vars)\n';
                          code += '            await callback_query.message.edit_text(nav_text)\n';
                        }
                      }

                      // Если узел message собирает ввод, настраиваем ожидание
                      if (navTargetNode.data.collectUserInput === true) {
                        const inputType = navTargetNode.data.inputType || 'text';
                        // ИСПРАВЛЕНИЕ: Берем inputVariable именно из целевого узла, а не из родительского
                        const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;

                        code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                        code += '            user_id = callback_query.from_user.id\n';
                        code += '            if user_id not in user_data:\n';
                        code += '                user_data[user_id] = {}\n';
                        code += `            # Проверяем, не была ли переменная ${inputVariable} уже сохранена\n`;
                        code += `            if "${inputVariable}" not in user_data[user_id] or not user_data[user_id]["${inputVariable}"]:\n`;
                        code += '                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода\n';
                        code += `                # Тип ввода: ${inputType}\n`;
                        // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
                        if (navTargetNode && navTargetNode.data) {
                          code += generateWaitingStateCode(navTargetNode, '                ', 'callback_query.from_user.id').split('\n').map(line => line ? '            ' + line : '').join('\n');
                        }
                        code += '            else:\n';
                        code += `                logging.info(f"⏭️ Переменная ${inputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                      }

                      // АВТОПЕРЕХОД: Если у узла есть enableAutoTransition, переходим к следующему узлу
                      if (navTargetNode.data.enableAutoTransition && navTargetNode.data.autoTransitionTo) {
                        const autoTargetId = navTargetNode.data.autoTransitionTo;
                        const safeAutoTargetId = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
                        code += '            \n';
                        code += '            # Проверяем, не ждем ли мы ввод перед автопереходом\n';
                        code += '            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n';
                        code += `                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${navTargetNode.id}")\n`;
                        code += '            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)\n';
                        // ИСПРАВЛЕНИЕ: Используем фактическое значение collectUserInput из узла, а не значение по умолчанию
                        const navCollectUserInputValue = navTargetNode.data.collectUserInput === true;
                        code += `            elif user_id in user_data and user_data[user_id].get("collectUserInput_${navTargetNode.id}", ${toPythonBoolean(navCollectUserInputValue)}) == True:\n`;
                        code += `                logging.info(f"ℹ️ Узел ${navTargetNode.id} ожидает ввод (collectUserInput=true), автопереход пропущен")\n`;
                        code += '            else:\n';
                        code += `                # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                        code += `                logging.info(f"⚡ Автопереход от узла ${navTargetNode.id} к узлу ${autoTargetId}")\n`;
                        // Проверяем, существует ли целевой узел перед вызовом обработчика
                        const targetExists = nodes.some(n => n.id === autoTargetId);
                        if (targetExists) {
                          code += `                await handle_callback_${safeAutoTargetId}(callback_query)\n`;
                        } else {
                          code += `                logging.warning(f"⚠️ Узел автоперехода не найден: {autoTargetId}, завершаем переход")\n`;
                          code += `                await callback_query.message.edit_text("Переход завершен")\n`;
                        }
                        code += `                logging.info(f"✅ Автопереход выполнен: ${navTargetNode.id} -> ${autoTargetId}")\n`;
                        code += '                return\n';
                      }
                    }
                  }
                } else if (navTargetNode.type === 'command') {
                  // Для узлов команд вызываем соответствующий обработчик
                  const commandName = navTargetNode.data.command?.replace('/', '') || 'unknown';
                  const handlerName = `${commandName}_handler`;
                  code += `            # Выполняем команду ${navTargetNode.data.command}\n`;
                  code += '            from types import SimpleNamespace\n';
                  code += '            fake_message = SimpleNamespace()\n';
                  code += '            fake_message.from_user = callback_query.from_user\n';
                  code += '            fake_message.chat = callback_query.message.chat\n';
                  code += '            fake_message.date = callback_query.message.date\n';
                  code += '            fake_message.answer = callback_query.message.answer\n';
                  code += `            await ${handlerName}(fake_message)\n`;
                } else if (navTargetNode.type === 'message' && (navTargetNode.data.enableTextInput ||
                  navTargetNode.data.enablePhotoInput ||
                  navTargetNode.data.enableVideoInput ||
                  navTargetNode.data.enableAudioInput ||
                  navTargetNode.data.enableDocumentInput)) {
                  // Обрабатываем уялы ввода тттекста/медиа с поддержкой условных сообщений
                  const messageText = navTargetNode.data.messageText || 'Введите ваш ответ:';
                  const inputTargetNodeId = navTargetNode.data.inputTargetNodeId || '';

                  // Проверяем, есть ли условные сообщения для этого узла
                  const hasConditionalMessages = navTargetNode.data.enableConditionalMessages &&
                    navTargetNode.data.conditionalMessages &&
                    navTargetNode.data.conditionalMessages.length > 0;

                  if (hasConditionalMessages) {
                    // Если есть условные сообщения, генерируем их обработку
                    code += '            # Узел с условными сообщениями - проверяем условия\n';
                    code += '            user_id = callback_query.from_user.id\n';
                    code += '            user_data_dict = await get_user_from_db(user_id) or {}\n';
                    code += '            user_data_dict.update(user_data.get(user_id, {}))\n\n';

                    // Добавляем определение функции check_user_variable_inline
                    code += generateCheckUserVariableFunction('            ');

                    // Генерируем условную логику для этого узла
                    const conditionalMessages = navTargetNode.data.conditionalMessages.sort((a: { priority: any; }, b: { priority: any; }) => (b.priority || 0) - (a.priority || 0));

                    // Создаем единую if/elif/else структуру для всех условий
                    for (let i = 0; i < conditionalMessages.length; i++) {
                      const condition = conditionalMessages[i];
                      const cleanedConditionText = stripHtmlTags(condition.messageText);
                      const conditionText = formatTextForPython(cleanedConditionText);
                      const conditionKeyword = i === 0 ? 'if' : 'elif';

                      // Получаем имена переменных - поддержка как нового формата массива, так и устаревшей единичной переменной
                      const variableNames = condition.variableNames && condition.variableNames.length > 0
                        ? condition.variableNames
                        : (condition.variableName ? [condition.variableName] : []);

                      const logicOperator = condition.logicOperator || 'AND';

                      code += `            # Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;

                      if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                        // Создаем единый блок условия с проверками ВНУТРИ
                        code += `            ${conditionKeyword} (\n`;
                        for (let j = 0; j < variableNames.length; j++) {
                          const varName = variableNames[j];
                          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                          code += `                check_user_variable_inline("${varName}", user_data_dict)[0]${operator}\n`;
                        }
                        code += `            ):\n`;

                        // Внутри блока условия собираем значения переменных
                        code += `                # Собираем значения переменных\n`;
                        code += `                variable_values = {}\n`;
                        for (const varName of variableNames) {
                          code += `                _, variable_values["${varName}"] = check_user_variable_inline("${varName}", user_data_dict)\n`;
                        }

                        code += `                text = ${conditionText}\n`;

                        // Заменяем переменные в тексте
                        for (const varName of variableNames) {
                          code += `                if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
                          code += `                    text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
                        }

                        // Генерируем клавиатуру для условного сообщения если она есть
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, не установлено ли keyboardType="none" на РОДИТЕЛЬСКОМ узле
                        const shouldGenerateKeyboard = navTargetNode.data.keyboardType !== 'none' && condition.keyboardType && condition.keyboardType !== 'none' && condition.buttons && condition.buttons.length > 0;
                        if (shouldGenerateKeyboard) {
                          code += '                # Создаем клавиатуру для уяяловного сообщения\n';

                          if (condition.keyboardType === 'inline') {
                            code += '                builder = InlineKeyboardBuilder()\n';
                            condition.buttons.forEach((button: Button) => {
                              if (button.action === "url") {
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
                              } else if (button.action === 'goto') {
                                const callbackData = button.target || button.id || 'no_action';
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                              } else if (button.action === 'command') {
                                // Для кнопок команд создаем специальную callback_data
                                const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
                              } else {
                                const callbackData = button.target || button.id || 'no_action';
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                              }
                            });
                            code += '                conditional_keyboard = builder.as_markup()\n';
                            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                            code += '                # Заменяем все переменные в тексте\n';
                            code += '                text = replace_variables_in_text(text, user_data_dict)\n';
                            code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                          } else if (condition.keyboardType === 'reply') {
                            code += '                builder = ReplyKeyboardBuilder()\n';
                            condition.buttons.forEach((button: Button) => {
                              if (button.action === "contact" && button.requestContact) {
                                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                              } else if (button.action === "location" && button.requestLocation) {
                                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                              } else {
                                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                              }
                            });
                            // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                            const conditionOneTimeKeyboard = toPythonBoolean(condition.oneTimeKeyboard === true);
                            code += `                conditional_keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard})\n`;
                            code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                          }
                        } else {
                          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                          code += '                # Заменяем все переменные в тексте\n';
                          code += '                text = replace_variables_in_text(text, user_data_dict)\n';
                          code += '                await bot.send_message(user_id, text)\n';
                        }

                        // Настраиваем ожидание текстового ввода для условного сообщения (если нужно)
                        if (condition.waitForTextInput) {
                          // ИСПРАВЛЕНИЕ: Используем переменную из условия или из целевого узла
                          const conditionalInputVariable = condition.textInputVariable || navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                          code += `                # Настраиваем ожидание текстового ввода для условного сообщения\n`;
                          code += `                user_data[user_id]["waiting_for_input"] = {\n`;
                          code += `                    "type": "text",\n`;
                          code += `                    "variable": "${conditionalInputVariable}",\n`;
                          code += `                    "save_to_database": True,\n`;
                          code += `                    "node_id": "${navTargetNode.id}",\n`;
                          code += `                    "next_node_id": "${condition.nextNodeAfterInput || inputTargetNodeId}"\n`;
                          code += `                }\n`;
                          code += `                logging.info(f"🔧 Настроено условное ожидание ввода для переменной: ${conditionalInputVariable} (узел ${navTargetNode.id})")\n`;
                        }
                      }
                    }

                    // Резервное сообщение
                    code += `            else:\n`;
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором создаем прямую навигацию
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `                # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                      code += `                logging.info(f"🔧 Fallback переход к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += `                text = ${formattedText}\n`;

                      // Замена переменных
                      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
                      const universalVarCodeLines2: string[] = [];
                      generateUniversalVariableReplacement(universalVarCodeLines2, '                ');
                      code += universalVarCodeLines2.join('\n');

                      // Инициализируем состояние множественного выбора
                      code += `                # Инициализируем состояние множественного выбора\n`;
                      code += `                user_data[user_id]["multi_select_${navTargetNode.id}"] = []\n`;
                      code += `                user_data[user_id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                      code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
                      if (navTargetNode.data.multiSelectVariable) {
                        code += `                user_data[user_id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                      }

                      // Создаем inline клавиатуру с кнопками выбора
                      if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(navTargetNode.data.buttons, '                ', navTargetNode.id, navTargetNode.data, allNodeIds);
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `                # Заменяем все переменные в тексте\n`;
                        code += `                text = replace_variables_in_text(text, user_vars)\n`;
                        code += `                await bot.send_message(user_id, text, reply_markup=keyboard)\n`;
                      } else {
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обяяяательно вызываем замену переменных в тексте
                        code += `                # Заменяем все переменные в тексте\n`;
                        code += `                text = replace_variables_in_text(text, user_vars)\n`;
                        code += `                await bot.send_message(user_id, text)\n`;
                      }
                      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
                    } else {
                      const formattedText = formatTextForPython(messageText);
                      // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                      const fallbackInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                      code += `                # Fallback сообщение\n`;
                      code += `                nav_text = ${formattedText}\n`;
                      // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                      if (navTargetNode.data.collectUserInput === true) {
                        code += `                # ИСПРАВЛЕНИЕ: Проверяем, не была ли перемеяяная уже сохранена inline кнопкой\n`;
                        code += `                if "${fallbackInputVariable}" not in user_data[user_id] or not user_data[user_id]["${fallbackInputVariable}"]:\n`;
                        code += `                    # Настраиваем ожидание ввода\n`;
                        code += `                    user_data[user_id]["waiting_for_input"] = {\n`;
                        code += `                        "type": "text",\n`;
                        code += `                        "variable": "${fallbackInputVariable}",\n`;
                        code += `                        "save_to_database": True,\n`;
                        code += `                        "node_id": "${navTargetNode.id}",\n`;
                        code += `                        "next_node_id": "${inputTargetNodeId}"\n`;
                        code += `                    }\n`;
                        code += `                    logging.info(f"🔧 Настроено fallback ожидание ввода для переменной: ${fallbackInputVariable} (узел ${navTargetNode.id})")\n`;
                        code += `                else:\n`;
                        code += `                    logging.info(f"⏭️ Переменная ${fallbackInputVariable} уже сохранена, пропускаем fallback ожидание ввода")\n`;
                      } else {
                        code += `                logging.info(f"Fallback переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                      }
                      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                      code += `                # Заменяем все переменные в тексте\n`;
                      code += `                nav_text = replace_variables_in_text(nav_text, user_vars)\n`;
                      code += `                await bot.send_message(user_id, nav_text)\n`;
                    }
                  } else {
                    // Обычный узел без условных сообщений
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имяяет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором создаем прямую навигацию
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `            # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                      code += `            logging.info(f"🔧 Переходим к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += `            text = ${formattedText}\n`;

                      // Замена переменных
                      code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                      const universalVarCodeLines3: string[] = [];
                      generateUniversalVariableReplacement(universalVarCodeLines3, '            ');
                      code += universalVarCodeLines3.join('\n');

                      // Инициализируем состояние множественного выбора
                      code += `            # Инициализируем состояние множественного выбора\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_${navTargetNode.id}"] = []\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_type"] = "selection"\n`;
                      if (navTargetNode.data.multiSelectVariable) {
                        code += `            user_data[callback_query.from_user.id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                      }

                      // Создаем inline клавиатуру с кнопками выбора
                      if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(navTargetNode.data.buttons, '            ', navTargetNode.id, navTargetNode.data, allNodeIds);
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `            # Заменяем все переменныяя в тексте\n`;
                        code += `            text = replace_variables_in_text(text, user_vars)\n`;
                        code += `            await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n`;
                      } else {
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `            # Заменяем все переменные в тексте\n`;
                        code += `            text = replace_variables_in_text(text, user_vars)\n`;
                        code += `            await bot.send_message(callback_query.from_user.id, text)\n`;
                      }
                      code += `            logging.info(f"✅ яярямая навигация к узлу множественного выбора ${navTargetNode.id} вяяполяяена")\n`;
                    } else {
                      const formattedText = formatTextForPython(messageText);
                      code += `            nav_text = ${formattedText}\n`;

                      // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                      if (navTargetNode.data.collectUserInput === true) {
                        // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                        const regularInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                        code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                        code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                        code += `            if "${regularInputVariable}" not in user_data[callback_query.from_user.id] or not user_data[callback_query.from_user.id]["${regularInputVariable}"]:\n`;
                        code += '                # Настраиваем ожидание ввода\n';
                        code += '                user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                        code += '                    "type": "text",\n';
                        code += `                    "variable": "${regularInputVariable}",\n`;
                        code += '                    "save_to_database": True,\n';
                        code += `                    "node_id": "${navTargetNode.id}",\n`;
                        code += `                    "next_node_id": "${inputTargetNodeId}"\n`;
                        code += '                }\n';
                        code += `                logging.info(f"🔧 Настроено ожидание ввода для переменной: ${regularInputVariable} (узел ${navTargetNode.id})")\n`;
                        code += '            else:\n';
                        code += `                logging.info(f"⏭️ Переменная ${regularInputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                      } else {
                        code += `            logging.info(f"Переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                      }
                      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                      code += '            # Заменяем все переменняяе в тексте\n';
                      code += '            nav_text = replace_variables_in_text(nav_text, user_vars)\n';
                      code += '            await bot.send_message(callback_query.from_user.id, nav_text)\n';
                    }
                  }
                } else {
                  code += `            logging.info("Переход к узлу ${navTargetNode.id}")\n`;
                }
              });

              code += '        else:\n';
              code += '            logging.warning(f"Неизяяестныяя следующий узел: {next_node_id}")\n';
            } else {
              code += '        # No nodes available for navigation\n';
              code += '        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"яяшибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")\n';
            code += '    \n';
            code += '    return  # Завершаем обработку после переадресации\n';
          }
          code += '    \n';

          // ============================================================================
          // ОБРАБОТКА УЗЛОВ СБОРА ВВОДА
          // ============================================================================
          // Генерируем ответ на основе типа узла
          if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
            // Обрабатываем узла сбора ввода
            const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пяяяжалуйяяяа, введите ваш отяяяет:";
            const responseType = targetNode.data.responseType || 'text';
            // Определяем тип ввода - если включены медиа-типы, используем их, иначе текст
            let inputType = 'text';
            if (targetNode.data.enablePhotoInput) {
              inputType = 'photo';
            } else if (targetNode.data.enableVideoInput) {
              inputType = 'video';
            } else if (targetNode.data.enableAudioInput) {
              inputType = 'audio';
            } else if (targetNode.data.enableDocumentInput) {
              inputType = 'document';
            } else {
              inputType = targetNode.data.inputType || 'text';
            }
            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const saveToDatabase = targetNode.data.saveToDatabase || false;

            code += '    # Удаляем старое сообщение\n';
            code += '    \n';

            const formattedPrompt = formatTextForPython(inputPrompt);
            code += `    text = ${formattedPrompt}\n`;

            if (responseType === 'text') {
              code += '    # ИСПРАВЛЕНИЕ: Не отправляем сообщение второй раз, если оно уже было отправлено ранее в обработчике\n';
              code += '    # Вместо этого, просто настраиваем ожидание ввода\n';

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем collectUserInput перед установкой waiting_for_input
              const inlineTextCollect = targetNode.data.collectUserInput === true ||
                targetNode.data.enableTextInput === true ||
                targetNode.data.enablePhotoInput === true ||
                targetNode.data.enableVideoInput === true ||
                targetNode.data.enableAudioInput === true ||
                targetNode.data.enableDocumentInput === true;

              if (inlineTextCollect) {
                // Находим следующий узел через соединения
                const nextConnection = connections.find(conn => conn.source === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.target : null;

                // ИСПОЛЬЗУЕМ inputTargetNodeId из данных узла, если nextConnection не найден
                const finalNextNodeId = nextNodeId || targetNode.data.inputTargetNodeId || '';

                code += '    # Настраиваем ожидание ввода (collectUserInput=true)\n';
                code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                code += `        "type": "${inputType}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "next_node_id": "${finalNextNodeId}"\n`;
                code += '    }\n';
              } else {
                code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
              }
            }
          }

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем обязательный return в конец функции
          code += '    return\n';
        }
      }
    });
  }

  // ============================================================================
  // ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ПОДТВЕРЖДЕНИЯ РАССЫЛКИ
  // ============================================================================
  // Находим первый broadcast узел для генерации обработчиков
  const broadcastNode = nodes.find(n => n.type === 'broadcast');

  if (broadcastNode) {
    // Создаём словарь всех узлов для автоперехода
    code += '\n# Словарь всех узлов для автоперехода\n';
    code += 'all_nodes_dict = {\n';
    nodes.forEach(node => {
      const messageText = node.data?.messageText || '';
      const attachedMedia = node.data?.attachedMedia || [];
      const imageUrl = node.data?.imageUrl || '';
      const audioUrl = node.data?.audioUrl || '';
      const videoUrl = node.data?.videoUrl || '';
      const documentUrl = node.data?.documentUrl || '';
      const autoTransitionTo = node.data?.autoTransitionTo || '';
      const mediaStr = attachedMedia.length > 0 ? JSON.stringify(attachedMedia) : '[]';
      const imageUrlStr = imageUrl ? `"${imageUrl}"` : '""';
      const audioUrlStr = audioUrl ? `"${audioUrl}"` : '""';
      const videoUrlStr = videoUrl ? `"${videoUrl}"` : '""';
      const documentUrlStr = documentUrl ? `"${documentUrl}"` : '""';
      const autoTransitionStr = autoTransitionTo ? `"${autoTransitionTo}"` : '""';
      code += `    "${node.id}": {"id": "${node.id}", "text": ${formatTextForPython(messageText)}, "attachedMedia": ${mediaStr}, "imageUrl": ${imageUrlStr}, "audioUrl": ${audioUrlStr}, "videoUrl": ${videoUrlStr}, "documentUrl": ${documentUrlStr}, "autoTransitionTo": ${autoTransitionStr}},\n`;
    });
    code += '}\n';
    code += '\n';

    // Генерируем обработчик для кнопок подтверждения
    code += '# Глобальный обработчик подтверждения рассылки\n';
    code += '@dp.callback_query(lambda c: c.data == "broadcast_confirm_yes" or c.data == "broadcast_confirm_no")\n';
    code += 'async def handle_broadcast_confirmation(callback_query: types.CallbackQuery):\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    logging.info(f"📢 Подтверждение рассылки от пользователя {user_id}: {callback_query.data}")\n';
    code += '    \n';
    code += '    if callback_query.data == "broadcast_confirm_yes":\n';
    const broadcastApiType1 = (broadcastNode.data as any)?.broadcastApiType || 'bot';
    code += (broadcastApiType1 === 'client' ? generateBroadcastClientInline(broadcastNode, nodes, '        ') : generateBroadcastInline(broadcastNode, nodes, '        ')) + '\n';
    code += '    else:\n';
    code += '        await callback_query.message.edit_text("❌ Рассылка отменена")\n';
    code += '    \n';

    // Генерируем обработчик для прямой рассылки (без подтверждения)
    code += '# Обработчик для прямой рассылки (без подтверждения)\n';
    code += 'async def handle_broadcast_direct(callback_query: types.CallbackQuery):\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    logging.info(f"📢 Прямая рассылка от пользователя {user_id}")\n';
    code += '    \n';
    code += '    # Получаем переменные из базы данных\n';
    code += generateDatabaseVariablesCode('    ');
    code += '    \n';
    const broadcastApiType2 = (broadcastNode.data as any)?.broadcastApiType || 'bot';
    code += (broadcastApiType2 === 'client' ? generateBroadcastClientInline(broadcastNode, nodes, '    ') : generateBroadcastInline(broadcastNode, nodes, '    ')) + '\n';
    code += '    \n';
  }

  // Генерируем функции handle_node_* для узлов с условными сообщениями
  code += generateHandleNodeFunctions(nodes, mediaVariablesMap);

  return code;
}


