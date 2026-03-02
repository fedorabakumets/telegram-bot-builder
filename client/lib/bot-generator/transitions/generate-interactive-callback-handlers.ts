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
import { generateMultiSelectHandler, generateMultiSelectComplete } from './multi-select-handler';
import { generateBroadcastNodeHandler, isBroadcastNode } from './broadcast-node-handler';
import { generateSkipDataCollectionCheck } from './skip-data-collection';
import { generateConditionalMessagesCheck } from './conditional-messages';
import { hasConditionalMessages } from './conditional-messages-handler';
import { generateMediaVariablesSetup } from './media-variables';
import { generateAutoTransitionCode } from './auto-transition-code';
import { calculateAutoTransitionTarget } from './auto-transition-check';
import { generateNavigationMedia } from './generate-navigation-media';
import { generateNavigationHandler, generateVariableReplacementInText, generateAutoTransitionCheck, generateAutoTransitionCall } from './generate-navigation-handler';
import { generateCommandNavigation } from './generate-command-navigation';
import { generateConditionalMessage } from './generate-conditional-message';
import { generateAllNodesDict, generateBroadcastConfirmationHandler, generateBroadcastDirectHandler } from './broadcast';
import { generateRegularReplyKeyboard, generateRegularInlineKeyboard, generateConditionalKeyboardCheck } from './keyboard';
import { generateMediaSendCode } from './media';
import { generateButtonTextDetection } from './button';
import { generateVariableSaveLogic } from './variable';
import { generateRedirectLogic } from './redirect';
import { generateNavigationErrorHandler, generateUnknownNodeWarning, generateNoNodesAvailableWarning, generateMultiSelectFallbackNavigation, generateRegularFallbackNavigation } from './navigation';
import { generateInputNodeHandling } from './input';
import { isLoggingEnabled } from '../../bot-generator';
import { generateCheckUserVariableFunction } from '../database';
import { formatTextForPython, generateWaitingStateCode } from '../format';
import { generateHandleNodeFunctions } from '../../generate/generateHandleNodeFunctions';
import { generateInlineKeyboardCode } from '../Keyboard';
import { generateAttachedMediaSendCode } from '../MediaHandler';
import { generateUniversalVariableReplacement } from '../utils';
import { generateFullMessagePreparation } from './message-preparation';

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

            // Обработка перехода после множественного выбора
            if (targetNode.data.continueButtonTarget) {
              code += generateMultiSelectHandler({
                nodeId,
                multiSelectVariable,
                continueButtonTarget: targetNode.data.continueButtonTarget,
                nodes
              }, '        ');
            } else {
              code += generateMultiSelectComplete('        ');
            }
            code += '        return\n';
            code += '    \n';
          }

          // ============================================================================
          // ОБРАБОТКА УЗЛОВ РАССЫЛКИ (broadcast)
          // ============================================================================
          if (isBroadcastNode(targetNode.type)) {
            code += generateBroadcastNodeHandler({
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

          // Подготовка текста сообщения и переменных
          code += generateFullMessagePreparation({
            nodeId,
            messageText: targetNode.data?.messageText,
            hasInputVariable: !!targetNode.data?.inputVariable,
            inputVariable: targetNode.data?.inputVariable
          }, '    ');
          code += '\n';

          // ============================================================================
          // ОБРАБОТКА УСЛОВНЫХ СООБЩЕНИЙ
          // ============================================================================
          if (hasConditionalMessages(targetNode.data)) {
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
                resizeKeyboard: targetNode.data.resizeKeyboard,
                oneTimeKeyboard: targetNode.data.oneTimeKeyboard
              }, '    ');
            } else {
              // Inline клавиатура для множественного выбора
              code += generateMultiSelectInlineKeyboard({
                nodeId,
                buttons: targetNode.data.buttons || [],
                allNodeIds,
                nodeData: targetNode.data
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
                code += '    # Проверяем, что это не fake callback (для предотвращения дублирования)\n';
                code += '    if not is_fake_callback:\n';
                code += `        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${replyAutoTransitionTarget}")\n`;
                if (targetExists) {
                  code += `        await handle_callback_${safeFunctionName}(callback_query)\n`;
                } else {
                  code += `        logging.warning(f"⚠️ Узел автоперехода не найден: {replyAutoTransitionTarget}, завершаем переход")\n`;
                  code += `        await callback_query.message.edit_text("Переход завершен")\n`;
                }
                code += `        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${replyAutoTransitionTarget}")\n`;
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

          // ИСПРАВЛЕНИЕ: Для узлов типа start/command не отправляем сообщение в callback обработчике
          // Сообщение уже отправлено в message handler (start_handler/command_handler)
          // Отправляем сообщение только если это не start/command узел
          const isCommandNode = targetNode.type === 'start' || targetNode.type === 'command';
          
          if (!isCommandNode) {
            code += generateMediaSendCode({
              attachedMedia,
              hasStaticImage,
              mediaVariablesMap,
              formatMode: targetNode.data?.formatMode,
              nodeId,
              collectUserInputFlag,
              targetNodeData: targetNode.data
            }, 'text', '    ');
          }

          // ============================================================================
          // СИСТЕМА АВТОПЕРЕХОДОВ
          // ============================================================================
          // Вычисляем цель автоперехода
          const autoTransitionTarget = calculateAutoTransitionTarget(
            nodeId,
            targetNode.data,
            connections
          );

          if (autoTransitionTarget) {
            code += generateAutoTransitionCode({
              autoTransitionTarget,
              nodeId,
              nodes
            }, '        ');
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

          // Генерируем код для поиска текста кнопки
          const sourceNode = nodes.find(n => n && n.data?.buttons && n.data.buttons.some((btn: { target: string; }) => btn.target === nodeId)
          );

          // Если к узлу ведут несколько кнопок, нужно определить, какую именно нажали
          let buttonsToTargetNode = [];
          if (sourceNode) {
            buttonsToTargetNode = sourceNode.data.buttons.filter((btn: { target: string; }) => btn.target === nodeId);
          }

          // ИСПРАВЛЕНИЕ: Генерируем button_display_text всегда если есть sourceNode
          // Но сохраняем в button_click ТОЛЬКО если включен сбор данных
          if (sourceNode) {
            code += '    # Ищем текст кнопки по callback_data\n';

            code += generateButtonTextDetection({
              nodeId,
              buttonsToTargetNode
            }, '    ');

            code += '    \n';
            
            // Сохраняем button_click ТОЛЬКО если включен сбор данных
            const targetNodeForSaveCheck = nodes.find(n => n.id === nodeId);
            const shouldSaveButtonClick = (
              targetNodeForSaveCheck?.data?.collectUserInput === true || 
              targetNodeForSaveCheck?.data?.saveToDatabase === true
            );
            
            if (shouldSaveButtonClick) {
              code += '    # Сохраняем нажатие кнопки в базу данных\n';
              code += '    timestamp = get_moscow_time()\n';
              code += '    response_data = button_display_text  # Простое значение\n';
              code += '    if user_id not in user_data:\n';
              code += '        user_data[user_id] = {}\n';
              code += '    user_data[user_id]["button_click"] = button_display_text\n';
            }
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
                  // Генерация обработки навигации к узлу
                  const navResult = generateNavigationHandler({
                    navTargetNode,
                    indent: '            '
                  });
                  code += navResult.code;

                  // Стандартная обработка (не множественный выбор и не условные сообщения)
                  if (!navResult.needsFullHandler) {
                    // Замена переменных в тексте
                    code += generateVariableReplacementInText('nav_text', 'nav_user_vars', '            ');

                    // Отправка медиа или обычного сообщения
                    code += generateNavigationMedia({
                      navTargetNode,
                      userId: 'callback_query.from_user.id'
                    }, '            ');

                    // Настройка ожидания ввода если collectUserInput=true
                    if (navTargetNode.data.collectUserInput === true) {
                      const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;

                      code += '            # Проверяем, не была ли переменная уже сохранена\n';
                      code += '            user_id = callback_query.from_user.id\n';
                      code += '            if user_id not in user_data:\n';
                      code += '                user_data[user_id] = {}\n';
                      code += `            if "${inputVariable}" not in user_data[user_id] || not user_data[user_id]["${inputVariable}"]:\n`;
                      code += '                # Используем универсальную функцию для настройки ожидания ввода\n';
                      if (navTargetNode && navTargetNode.data) {
                        code += generateWaitingStateCode(navTargetNode, '                ', 'callback_query.from_user.id')
                          .split('\n')
                          .map(line => line ? '            ' + line : '')
                          .join('\n');
                      }
                      code += '            else:\n';
                      code += `                logging.info(f"⏭️ Переменная ${inputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                    }

                    // Автопереход
                    code += generateAutoTransitionCheck(navTargetNode, '            ');
                    if (navTargetNode.data.enableAutoTransition && navTargetNode.data.autoTransitionTo) {
                      code += generateAutoTransitionCall(
                        navTargetNode.data.autoTransitionTo,
                        navTargetNode.id,
                        '            '
                      );
                    }
                  }
                } else if (navTargetNode.type === 'command') {
                  // Обработка навигации к узлу команды
                  code += generateCommandNavigation({ navTargetNode }, '            ');
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

                    // Собираем значения переменных для всех условий
                    code += '            variable_values = {}\n';
                    code += '            user_data_dict = await get_user_from_db(user_id) or {}\n';
                    code += '            user_data_dict.update(user_data.get(user_id, {}))\n\n';

                    // Создаем единую if/elif/else структуру для всех условий
                    for (let i = 0; i < conditionalMessages.length; i++) {
                      const condition = conditionalMessages[i];
                      code += generateConditionalMessage({
                        condition,
                        index: i,
                        navTargetNode,
                        inputTargetNodeId
                      }, '            ');
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
                      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполн���на")\n`;
                    } else {
                      code += generateRegularFallbackNavigation({
                        navTargetNode,
                        userVars: 'user_vars',
                        allNodeIds: [],
                        inputTargetNodeId,
                        userId: 'user_id'
                      }, '                ');
                    }
                  } else {
                    // Обычный узел без условных сообщений
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      code += generateMultiSelectFallbackNavigation({
                        navTargetNode,
                        userVars: 'callback_query.from_user.id',
                        allNodeIds,
                        inputTargetNodeId,
                        userId: 'callback_query.from_user.id'
                      }, '            ');
                    } else {
                      code += generateRegularFallbackNavigation({
                        navTargetNode,
                        userVars: 'callback_query.from_user.id',
                        allNodeIds: [],
                        inputTargetNodeId,
                        userId: 'callback_query.from_user.id'
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


