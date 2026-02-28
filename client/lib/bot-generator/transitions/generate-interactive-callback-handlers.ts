/**
 * @fileoverview Генерация интерактивных callback обработчиков
 * 
 * Модуль создаёт Python-код для обработки callback-запросов от inline кнопок,
 * включая условные сообщения, множественный выбор и автопереходы.
 * 
 * @module bot-generator/transitions/generate-interactive-callback-handlers
 */

import { generateCallbackHandlerStart, generateCollectUserInputFlag } from './callback-handler';
import { generateCallbackHandlerInit } from './callback-handler-init';
import { generateMultiSelectDoneButton, generateMultiSelectInit, generateMultiSelectReplyKeyboard, generateMultiSelectInlineKeyboard } from './multi-select';
import { generateSkipDataCollectionCheck } from './skip-data-collection';
import { generateMessageTextPreparation, generateDatabaseVarsGet } from './message-text';
import { generateConditionalMessagesCheck } from './conditional-messages';
import { generateMediaVariablesSetup } from './media-variables';
import { generateAutoTransitionCheck, generateAutoTransitionCode } from './auto-transition';
import { generateBroadcastHandler, generateAllNodesDict, generateBroadcastConfirmationHandler, generateBroadcastDirectHandler } from './broadcast';
import { generateRegularReplyKeyboard, generateRegularInlineKeyboard, generateConditionalKeyboardCheck } from './keyboard';
import { generateMediaSendCode } from './media';
import { generateButtonTextDetection } from './button';
import { generateVariableSaveLogic } from './variable';
import { generateRedirectLogic } from './redirect';
import { generateNavigationErrorHandler, generateUnknownNodeWarning, generateNoNodesAvailableWarning, generateMultiSelectFallbackNavigation, generateRegularFallbackNavigation } from './navigation';
import { generateInputNodeHandling } from './input';
import { Button, isLoggingEnabled } from '../../bot-generator';
import { generateCheckUserVariableFunction } from '../database';
import { formatTextForPython, generateButtonText, generateWaitingStateCode, stripHtmlTags, toPythonBoolean } from '../format';
import { generateDatabaseVariablesCode } from '../Broadcast/generateDatabaseVariables';
import { generateHandleNodeFunctions } from '../../generate/generateHandleNodeFunctions';
import { generateInlineKeyboardCode } from '../Keyboard';
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
          
          // Инициализация callback обработчика
          code += generateCallbackHandlerInit(nodeId, shortNodeIdForDone, targetNode, '    ');
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
            if (targetNode.data.keyboardType === 'reply') {
              // Генерируем reply клавиатуру
              code += generateRegularReplyKeyboard({
                buttons: targetNode.data.buttons,
                resizeKeyboard: targetNode.data.resizeKeyboard,
                oneTimeKeyboard: targetNode.data.oneTimeKeyboard,
                hasConditionalMessages: targetNode.data?.enableConditionalMessages && targetNode.data?.conditionalMessages && targetNode.data?.conditionalMessages.length > 0
              }, '    ');
              
              // Для reply клавиатуры нужно отправить новое сообщение
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
              code += generateRegularInlineKeyboard({
                buttons: targetNode.data.buttons,
                nodeData: targetNode.data
              }, '    ');
            }
          } else {
            code += '    keyboard = None\n';
          }

          // Проверяем условную клавиатуру и используем её если есть
          code += generateConditionalKeyboardCheck('    ');

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
          const collectUserInputFlag = targetNode.data.collectUserInput === true ||
            targetNode.data.enableTextInput === true ||
            targetNode.data.enablePhotoInput === true ||
            targetNode.data.enableVideoInput === true ||
            targetNode.data.enableAudioInput === true ||
            targetNode.data.enableDocumentInput === true;

          code += generateMediaSendCode({
            attachedMedia,
            hasStaticImage,
            mediaVariablesMap,
            formatMode: targetNode.data?.formatMode,
            nodeId,
            collectUserInputFlag,
            targetNodeData: targetNode.data
          }, 'text', '    ');

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

          // Сохраняем button_click ТОЛЬКО если есть sourceNode (реальная кнопка, а не автопереход)
          if (sourceNode) {
            code += '    # Сохраняем нажатие кнопки в базу данных\n';
            code += '    # Ищем текст кнопки по callback_data\n';
            
            code += generateButtonTextDetection({
              nodeId,
              buttonsToTargetNode
            }, '    ');
            
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

          // Определяем переменную для сохранения на основе кнопки (ТОЛЬКО если есть sourceNode)
          if (sourceNode) {
            code += generateVariableSaveLogic({ nodeId, sourceNode, nodes }, '    ');
          }

          // Определяем логику переадресации
          const currentNode = nodes.find(n => n.id === nodeId);
          
          // Вычисляем shouldRedirect и redirectTarget в TypeScript
          const hasButtons = currentNode && currentNode.data?.buttons && currentNode.data.buttons.length > 0;
          const shouldRedirect = hasButtons && !(currentNode && currentNode.data?.allowMultipleSelection);
          
          let redirectTarget = nodeId;
          if (shouldRedirect) {
            if (currentNode && currentNode.data?.continueButtonTarget) {
              redirectTarget = currentNode.data.continueButtonTarget;
            } else {
              const nodeConnections = connections.filter((conn: any) => conn && conn.source === nodeId);
              if (nodeConnections.length > 0) {
                redirectTarget = nodeConnections[0].target;
              }
            }
          }
          
          code += generateRedirectLogic({ nodeId, currentNode, connections, shouldRedirect, redirectTarget }, '    ');

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
                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в текс��е
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
                        // Проверяем, существует ли целевой узел перед вызовом обработч��ка
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
                      code += generateRegularFallbackNavigation({
                        navTargetNode,
                        userVars: 'user_vars',
                        allNodeIds: [],
                        inputTargetNodeId
                      }, '                ');
                    }
                  } else {
                    // Обычный узел без условных сообщений
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      code += generateMultiSelectFallbackNavigation({
                        navTargetNode,
                        userVars: 'callback_query.from_user.id',
                        allNodeIds,
                        inputTargetNodeId
                      }, '            ');
                    } else {
                      code += generateRegularFallbackNavigation({
                        navTargetNode,
                        userVars: 'callback_query.from_user.id',
                        allNodeIds: [],
                        inputTargetNodeId
                      }, '            ');
                    }
                  }
                } else {
                  code += `            logging.info("Переход к узлу ${navTargetNode.id}")\n`;
                }
              });

              code += generateUnknownNodeWarning('        ');
            } else {
              code += generateNoNodesAvailableWarning('        ');
            }

            code += generateNavigationErrorHandler('    ');
          }
          code += '    \n';

          // ============================================================================
          // ОБРАБОТКА УЗЛОВ СБОРА ВВОДА
          // ============================================================================
          if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
            code += generateInputNodeHandling({ targetNode, connections }, '    ');
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
  const broadcastNode = nodes.find(n => n.type === 'broadcast');

  if (broadcastNode) {
    code += generateAllNodesDict(nodes, '\n');
    code += generateBroadcastConfirmationHandler({ broadcastNode, nodes }, '    ');
    code += generateBroadcastDirectHandler({ broadcastNode, nodes }, '    ');
  }

  // Генерируем функции handle_node_* для узлов с условными сообщениями
  code += generateHandleNodeFunctions(nodes, mediaVariablesMap);

  return code;
}


