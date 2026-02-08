import { isLoggingEnabled, Button, ResponseOption } from './bot-generator';
import { generateConditionalMessageLogic } from './Conditional';
import { stripHtmlTags, formatTextForPython, getParseMode, generateAttachedMediaSendCode, generateWaitingStateCode, generateButtonText, toPythonBoolean, escapeForJsonString, calculateOptimalColumns } from './format';
import { generateInlineKeyboardCode, generateReplyKeyboardCode } from './Keyboard';
import { generateUniversalVariableReplacement } from './utils';

export function newprocessNodeButtonsAndGenerateHandlers(inlineNodes: any[], processedCallbacks: Set<string>, nodes: any[], code: string, allNodeIds: any[], connections: any[], mediaVariablesMap: Map<string, { type: string; variable: string; }>) {
  inlineNodes.forEach(node => {
    node.data.buttons.forEach((button: { action: string; id: any; target: string; text: any; skipDataCollection: boolean; }) => {
      if (button.action === 'goto' && button.id) {
        const callbackData = button.id; // Используем идентификатор кнопки как callback_data














        /**
         * БЛОК 1: Обработка кнопов с действием 'goto'
         * Создает обработчики для навигации между узлами бота
         * Проверяет дублирование callback_data для оптимизации
         */
        // Избегаем дублирования обработчиков для идентификаторов кнопок (не целевых идентификаторов)
        if (processedCallbacks.has(`cb_${callbackData}`)) return;

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Избегаем дублированных обработчиков для target узлов
        // Но только для callback обработчиков, не для команд
        if (button.target && processedCallbacks.has(`cb_${button.target}`)) {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
          return;
        }

        // Находим целевой узел (может быть null если нет target)
        // ИСПРАВЛЕНИЕ: Ищем узел сначала по id, затем по команде
        let targetNode = button.target ? nodes.find(n => n.id === button.target) : null;

        // Если узел не найден по id, пробуем найти по команде
        if (!targetNode && button.target) {
          targetNode = nodes.find(n => n.data.command === `/${button.target}` || n.data.command === button.target);
          if (targetNode && isLoggingEnabled()) {
            console.log(`🔧 ГЕНЕРАТОР: Узел найден по команде ${button.target} -> ${targetNode.id}`);
          }
        }

        // Создаем ��бработчик для каждой кнопки используя target как callback_data
        const actualCallbackData = button.target || callbackData;
        const actualNodeId = targetNode ? targetNode.id : button.target;

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Больше не пропускаем обработчики для кнопок с goto
        // Даже если узел уже был обработан как команда, нам нужен обработчик для перехода по кнопке
        // if (button.target && processedCallbacks.has(button.target)) {
        //   if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
        //   return;
        // }

        // Отмечаем этот идентификатор кнопки как обработанный
        processedCallbacks.add(`cb_${callbackData}`);

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем target в processedCallbacks с префиксом для избежания дублирования callback обработчиков
        if (button.target) {
          processedCallbacks.add(`cb_${button.target}`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${button.target} добавлен в processedCallbacks ДО создания обработчика`);
        }

        // ОТЛАДКА: Проверяем если это interests_result или metro_selection
        if (button.target === 'interests_result') {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для interests_result в основном цикле');
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
        }
        if (button.target === 'metro_selection') {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для metro_selection в основном цикле');
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
        }

        /**
         * БЛОК 2: Обработка множественного выбора
         * Определяет необходимость создания обработчика для кнопки "Готово"
         * при множественном выборе опций пользователем
         */
        // Если целевой узел имеет множественный выбор, добавляем обработку кнопки "done_"
        const isDoneHandlerNeeded = targetNode && targetNode.data.allowMultipleSelection && targetNode.data.continueButtonTarget;
        const shortNodeIdForDone = isDoneHandlerNeeded ? actualCallbackData.slice(-10).replace(/^_+/, '') : '';

        // ЛОГИРОВАНИЕ: Отслеживаем создание обработчиков для interests_result
        if (actualCallbackData === 'interests_result') {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: Создаем обработчик для interests_result!');
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🚨 ГЕНЕРАТОР: Текущие processedCallbacks:', Array.from(processedCallbacks));
        }

        if (isDoneHandlerNeeded) {
          code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_") or c.data == "multi_select_done_${shortNodeIdForDone}")\n`;
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавлен обработчик кнопки "multi_select_done_${shortNodeIdForDone}" для узла ${actualCallbackData}`);
        } else {
          code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_"))\n`;
        }
        // Создаем безопасное имя функции на основе target или button ID
        const safeFunctionName = actualCallbackData.replace(/[^a-zA-Z0-9_]/g, '_');

        if (actualCallbackData === 'interests_result') {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🚨 ГЕНЕРАТОР: Создаем функцию handle_callback_interests_result в ОСНОВНОМ ЦИКЛЕ');
        }

        code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
        code += '    # Безопасное получение данных из callback_query\n';
        code += '    try:\n';
        code += '        user_id = callback_query.from_user.id\n';
        code += '        callback_data = callback_query.data\n';
        code += `        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
        code += '    except Exception as e:\n';
        code += `        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
        code += '        return\n';
        code += '    \n';
        code += '    # Проверяем флаг hideAfterClick для кнопок\n';
        code += `    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных кнопок\n`;
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

        // Добавляем обработку кнопки "done_" для множественного выбора
        if (isDoneHandlerNeeded) {
          code += '    # Проверяем, является ли это кнопкой "Готово" для множественного выбора\n';
          code += `    if callback_data == "multi_select_done_${shortNodeIdForDone}":\n`;
          code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
          code += '        \n';

          // Сохраняем выбранные значения в базу данных
          const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
          code += '        # Сохраняем выбранные значения в базу данных\n';
          code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
          code += '        if selected_options:\n';
          code += '            selected_text = ", ".join(selected_options)\n';
          code += `            \n`;
          code += `            # Универсальная логика аккумуляции для всех множественных выборов\n`;
          code += `            # Загружаем существующие значения\n`;
          code += `            existing_data = await get_user_data_from_db(user_id, "${multiSelectVariable}")\n`;
          code += `            existing_selections = []\n`;
          code += `            if existing_data and existing_data.strip():\n`;
          code += `                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]\n`;
          code += `            \n`;
          code += `            # Объединяем существующие и новые выборы (убираем дубли)\n`;
          code += `            all_selections = list(set(existing_selections + selected_options))\n`;
          code += `            final_text = ", ".join(all_selections)\n`;
          code += `            await update_user_data_in_db(user_id, "${multiSelectVariable}", final_text)\n`;
          code += `            logging.info(f"✅ Аккумулировано в переменную ${multiSelectVariable}: {final_text}")\n`;
          code += '        \n';

          // Очищаем состояние множественного выбора
          code += '        # Очищаем состояние множественного выбора\n';
          code += '        if user_id in user_data:\n';
          code += `            user_data[user_id].pop("multi_select_${actualCallbackData}", None)\n`;
          code += '            user_data[user_id].pop("multi_select_node", None)\n';
          code += '            user_data[user_id].pop("multi_select_type", None)\n';
          code += '            user_data[user_id].pop("multi_select_variable", None)\n';
          code += '        \n';

          // Переход к следующему узлу
          if (targetNode.data.continueButtonTarget) {
            const nextNodeId = targetNode.data.continueButtonTarget;

            // КРИТИЧЕСКАЯ ОТЛАДКА
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР CONTINUEBUTTON DEBUG:`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: targetNode.id = "${targetNode.id}"`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: targetNode.data.continueButtonTarget = "${targetNode.data.continueButtonTarget}"`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: nextNodeId = "${nextNodeId}"`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: actualCallbackData = "${actualCallbackData}"`);

            code += '        # Переход к следующему узлу\n';
            code += `        next_node_id = "${nextNodeId}"\n`;
            code += `        logging.info(f"🚀 DEBUG: targetNode.id=${targetNode.id}, continueButtonTarget=${targetNode.data.continueButtonTarget}, nextNodeId=${nextNodeId}")\n`;

            // ИСПРАВЛЕНИЕ: Специальная логика для metro_selection -> interests_result
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Проверяем metro_selection -> interests_result: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
            if (targetNode.id.includes('metro_selection') && nextNodeId === 'interests_result') {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ Применяем специальную логику metro_selection -> interests_result`);
              code += '        # ИСПРАВЛЕНИЕ: Сохраняем метро выбор и устанавливаем флаг для показа клавиатуры\n';
              code += `        selected_metro = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
              code += '        if user_id not in user_data:\n';
              code += '            user_data[user_id] = {}\n';
              code += '        user_data[user_id]["saved_metro_selection"] = selected_metro\n';
              code += '        user_data[user_id]["show_metro_keyboard"] = True\n';
              code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: targetNode.id={targetNode.id}, nextNodeId={nextNodeId}")\n';
              code += '        logging.info(f"🚇 Сохранили метро выбор: {selected_metro}, установлен флаг show_metro_keyboard=True")\n';
              code += '        \n';
            } else {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ❌ Не применяем специальную логику: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
            }

            // Проверяем, существует ли целевой узел перед вызовом обработчика
            const targetExists = nodes.some(n => n.id === nextNodeId);
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

        // Специальная обработка для кнопок "Изменить выбор" и "Начать заново"
        // Эти кнопки должны обрабатываться как обычные goto кнопки к start узлу
        // Правильная логика сохранения переменной на основе кнопки
        code += `    button_text = "${button.text}"\n`;
        code += '    \n';

        // Определяем переменную для сохранения на основе родительского узла
        const parentNode = node; // Используем текущий узел как родительский




        // Проверяем настройку skipDataCollection для кнопки
        const shouldSkipDataCollection = button.skipDataCollection === true;

        if (!shouldSkipDataCollection) {
          if (parentNode && parentNode.data.inputVariable) {
            const variableName = parentNode.data.inputVariable;

            // Используем текст кнопки как значение переменной
            const variableValue = 'button_text';

            // Сохраняем переменную (если кнопка не имеет флага skipDataCollection, она сохраняется как обычное значение)
            code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
            code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
            code += '    \n';

            // КРИТИЧЕСКИ ВАЖНО: Очищаем состояние ожидания после сохранения переменной
            code += '    # Очищаем состояние ожидания ввода для этой переменной\n';
            code += '    if user_id in user_data:\n';
            code += '        # Удаляем waiting_for_input чтобы текстовый обработчик не перезаписал данные\n';
            code += '        if "waiting_for_input" in user_data[user_id]:\n';
            code += `            if user_data[user_id]["waiting_for_input"] == "${parentNode.id}":\n`;
            code += '                del user_data[user_id]["waiting_for_input"]\n';
            code += `                logging.info(f"Состояние ожидания ввода очищено для переменной ${variableName} (пользователь {user_id})")\n`;
            code += '    \n';
          } else {
            // Резервный вариант: сохраняем кнопку как есть
            code += '    # Сохраняем кнопку в базу данных\n';
            code += '    timestamp = get_moscow_time()\n';
            code += '    response_data = button_text  # Простое значение\n';
            code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
            code += '    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")\n';
          }
        } else {
          code += '    # Кнопка настроена для пропуска сбора данных (skipDataCollection=true)\n';
          code += `    logging.info(f"Кнопка пропущена: {button_text} (не сохраняется из-за skipDataCollection)")\n`;
          code += '    # Устанавливаем флаг, чтобы следующий узел не сохранил переменную\n';
          code += '    user_data[user_id]["skipDataCollectionTransition"] = True\n';
        }
        code += '    \n';

        if (targetNode) {

          /**
           * БЛОК 3: Обработка различных типов целевых узлов
           * Генерирует специфичный код для каждого типа узла:
           * - message: текстовые сообщения с кнопками
           * - sticker: отправка стикеров
           * - voice: голосовые сообщения
           * - animation: анимации/GIF
           * - location: геолокация
           * - contact: контактная информация
           * - user-input: сбор пользовательского ввода
           * - start: начальное сообщение
           * - command: выполнение команд
           */
          // Обрабатываем узла сообщений с действием сохранения переменной
          if (targetNode.type === 'message' && targetNode.data.action === 'save_variable') {
            const action = targetNode.data.action || 'none';
            const variableName = targetNode.data.variableName || '';
            const variableValue = targetNode.data.variableValue || '';
            const successMessage = targetNode.data.successMessage || 'Успешно сохранено!';

            if (action === 'save_variable' && variableName && variableValue) {
              code += `    # Сохраняем переменную "${variableName}" = "${variableValue}"\n`;
              code += `    user_data[user_id]["${variableName}"] = "${variableValue}"\n`;
              code += `    await update_user_variable_in_db(user_id, "${variableName}", "${variableValue}")\n`;
              code += `    logging.info(f"Переменная сохранена: ${variableName} = ${variableValue} (пользователь {user_id})")\n`;
              code += '    \n';

              if (successMessage.includes('\n')) {
                code += `    success_text = """${successMessage}"""\n`;
              } else {
                const escapedMessage = successMessage.replace(/"/g, '\\"');
                code += `    success_text = "${escapedMessage}"\n`;
              }

              // Добавляем замену переменных в сообщении об успехе
              code += `    # Подставляем значения переменных в текст сообщения\n`;
              code += `    if "{${variableName}}" in success_text:\n`;
              code += `        success_text = success_text.replace("{${variableName}}", "${variableValue}")\n`;

              code += '    await callback_query.message.edit_text(success_text)\n';
            }
          }



          // Обрабатываем обычные узла сообщений (например, source_friends, source_search и т.д.)
          else if (targetNode.type === 'message') {
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

            // Добавляем настройку ожидаяия текстового ввода для условных сообщений
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
          }






















          /**
           * БЛОК 7: Обработка специальных типов медиа-узлов
           * Генерирует код для отправки различных типов медиа:
           * - sticker: стикеры Telegram
           * - voice: голосовые сообщения
           * - animation: анимации/GIF
           * - location: геолокация и карты
           * - contact: контактная информация
           */
          // Обрабатываем различные типы целевых узлов
          else if (targetNode.type === 'sticker') {
            const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";

            code += `    sticker_url = "${stickerUrl}"\n`;
            code += '    try:\n';
            code += '        # Проверяем, является ли это локальным файлом\n';
            code += '        if is_local_file(sticker_url):\n';
            code += '            # Отправляем локальный файл\n';
            code += '            file_path = get_local_file_path(sticker_url)\n';
            code += '            if os.path.exists(file_path):\n';
            code += '                sticker_file = FSInputFile(file_path)\n';
            code += '            else:\n';
            code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
            code += '        else:\n';
            code += '            # Используяям URL или file_id для стикеров\n';
            code += '            sticker_file = sticker_url\n';
            code += '        \n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command' && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для sticker nodes
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить стикер")\n';

          } else if (targetNode.type === 'voice') {
            const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
            const duration = targetNode.data.duration || 30;

            code += `    voice_url = "${voiceUrl}"\n`;
            code += `    duration = ${duration}\n`;
            code += '    try:\n';
            code += '        # Проверяем, является ли это локальным файлом\n';
            code += '        if is_local_file(voice_url):\n';
            code += '            # Отправляем локальный файл\n';
            code += '            file_path = get_local_file_path(voice_url)\n';
            code += '            if os.path.exists(file_path):\n';
            code += '                voice_file = FSInputFile(file_path)\n';
            code += '            else:\n';
            code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
            code += '        else:\n';
            code += '            # Используем URL для внешних файлов\n';
            code += '            voice_file = voice_url\n';
            code += '        \n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command' && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для voice nodes
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить голосовое сообщение")\n';

          } else if (targetNode.type === 'animation') {
            const caption = targetNode.data.mediaCaption || "🎬 Анимация";
            const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";

            if (caption.includes('\n')) {
              code += `    caption = """${caption}"""\n`;
            } else {
              const escapedCaption = caption.replace(/"/g, '\\"');
              code += `    caption = "${escapedCaption}"\n`;
            }

            code += `    animation_url = "${animationUrl}"\n`;
            code += '    try:\n';
            code += '        # Проверяем, является ли это локальным файлом\n';
            code += '        if is_local_file(animation_url):\n';
            code += '            # Отпяяяяавляем локальный файл\n';
            code += '            file_path = get_local_file_path(animation_url)\n';
            code += '            if os.path.exists(file_path):\n';
            code += '                animation_file = FSInputFile(file_path)\n';
            code += '            else:\n';
            code += '                raise FileNotFoundError(f"Локальный файл не наяден: {file_path}")\n';
            code += '        else:\n';
            code += '            # Используем URL для внешних файлов\n';
            code += '            animation_file = animation_url\n';
            code += '        \n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command' && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для animation nodes
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить анимацию\\n{caption}")\n';

          } else if (targetNode.type === 'location') {
            let latitude = targetNode.data.latitude || 55.7558;
            let longitude = targetNode.data.longitude || 37.6176;
            const title = targetNode.data.title || "";
            const address = targetNode.data.address || "";
            const mapService = targetNode.data.mapService || 'custom';
            const generateMapPreview = targetNode.data.generateMapPreview !== false;

            code += '    # Определяем координаты на основе выбранного сервиса карт\n';

            if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
              code += `    yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
              code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
              code += '    if extracted_lat and extracted_lon:\n';
              code += '        latitude, longitude = extracted_lat, extracted_lon\n';
              code += '    else:\n';
              code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
            } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
              code += `    google_url = "${targetNode.data.googleMapUrl}"\n`;
              code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
              code += '    if extracted_lat and extracted_lon:\n';
              code += '        latitude, longitude = extracted_lat, extracted_lon\n';
              code += '    else:\n';
              code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
            } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
              code += `    gis_url = "${targetNode.data.gisMapUrl}"\n`;
              code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
              code += '    if extracted_lat and extracted_lon:\n';
              code += '        latitude, longitude = extracted_lat, extracted_lon\n';
              code += '    else:\n';
              code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
            } else {
              code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
            }

            if (title) code += `    title = "${title}"\n`;
            if (address) code += `    address = "${address}"\n`;

            code += '    try:\n';
            code += '        # Удаляем старое сообщение\n';

            code += '        # ятправляем геолокацию\n';
            if (title || address) {
              code += '        await bot.send_venue(\n';
              code += '            callback_query.from_user.id,\n';
              code += '            latitude=latitude,\n';
              code += '            longitude=longitude,\n';
              code += '            title=title,\n';
              code += '            address=address\n';
              code += '        )\n';
            } else {
              code += '        await bot.send_location(\n';
              code += '            callback_query.from_user.id,\n';
              code += '            latitude=latitude,\n';
              code += '            longitude=longitude\n';
              code += '        )\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
            code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n';

            // Генерируем кнопки для картографических сервисов если включено
            if (generateMapPreview) {
              code += '        \n';
              code += '        # Генерируем ссылки на картографические сервисы\n';
              code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
              code += '        \n';
              code += '        # Создаем кнопки для различных карт\n';
              code += '        map_builder = InlineKeyboardBuilder()\n';
              code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
              code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
              code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
              code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';

              if (targetNode.data.showDirections) {
                code += '        # Добавляем кнопки для построения маршрута\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
              }

              code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
              code += '        map_keyboard = map_builder.as_markup()\n';
              code += '        \n';
              code += '        await bot.send_message(\n';
              code += '            callback_query.from_user.id,\n';
              if (targetNode.data.showDirections) {
                code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
              } else {
                code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
              }
              code += '            reply_markup=map_keyboard\n';
              code += '        )\n';
            }

            // Добавляем дополнительные кнопки если они есть
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        \n';
              code += '        # Отправляем дополнительные кнопки\n';
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n';
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошябка отправки местоположения: {e}")\n';
            code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n';

          } else if (targetNode.type === 'contact') {
            const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
            const firstName = targetNode.data.firstName || "Контакт";
            const lastName = targetNode.data.lastName || "";
            const userId = targetNode.data.userId || null;
            const vcard = targetNode.data.vcard || "";

            code += `    phone_number = "${phoneNumber}"\n`;
            code += `    first_name = "${firstName}"\n`;
            if (lastName) code += `    last_name = "${lastName}"\n`;
            if (userId) code += `    user_id = ${userId}\n`;
            if (vcard) code += `    vcard = """${vcard}"""\n`;

            code += '    try:\n';

            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              if (lastName && userId && vcard) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n';
              } else if (lastName) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n';
              }
            } else {
              if (lastName && userId && vcard) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n';
              } else if (lastName) {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n';
              } else {
                code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n';
              }
            }

            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
            code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить контакт")\n';

            /**
             * БЛОК 8: Обработка узлов пользовательского ввода
             * Специализированные узлы для сбора данных от пользователя
             * Поддерживают различные типы ввода:
             * - Текстовый ввод с валидацией
             * - Кнопочный выбор (inline/reply)
             * - Множественный выбор с кнопкой "Готово"
             * - Настройки валидации и таймаутов
             */
          } else if (targetNode.type === 'user-input') {
            // Обрабатываем узла пользовательского ввода
            const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
            const responseType = targetNode.data.responseType || 'text';
            const inputType = targetNode.data.inputType || 'text';
            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const responseOptions = targetNode.data.responseOptions || [];
            const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
            const inputValidation = targetNode.data.inputValidation || '';
            const minLength = targetNode.data.minLength || 0;
            const maxLength = targetNode.data.maxLength || 0;
            const inputTimeout = targetNode.data.inputTimeout || 60;
            const inputRequired = targetNode.data.inputRequired !== false;
            const allowSkip = targetNode.data.allowSkip || false;
            const saveToDatabase = targetNode.data.saveToDatabase || false;
            const inputRetryMessage = targetNode.data.inputRetryMessage || "Пожалуйста, попробуйте еще раз.";
            const inputSuccessMessage = targetNode.data.inputSuccessMessage || "";
            const placeholder = targetNode.data.placeholder || "";

            code += '    # Удаляем старое сообщение\n';
            code += '    \n';

            // Отправляем запрояя пользователю
            const formattedPrompt = formatTextForPython(inputPrompt);
            code += `    text = ${formattedPrompt}\n`;

            if (responseType === 'buttons' && responseOptions.length > 0) {
              // Обработка кнопочного ответа
              const buttonType = targetNode.data.buttonType || 'inline';
              code += '    \n';
              code += '    # Создаем кнопки для выбора ответа\n';

              if (buttonType === 'reply') {
                code += '    builder = ReplyKeyboardBuilder()\n';

                (responseOptions as ResponseOption[]).forEach((option: ResponseOption, _index: number) => {
                  code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
                });

                if (allowSkip) {
                  code += `    builder.add(KeyboardButton(text="⏭️ Пропустить"))\n`;
                }

                code += '    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)\n';
                code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
              } else {
                code += '    builder = InlineKeyboardBuilder()\n';

                (responseOptions as ResponseOption[]).forEach((option: ResponseOption, index: number) => {
                  code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="response_${targetNode.id}_${index}"))\n`;
                });

                if (allowSkip) {
                  code += `    builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="skip_${targetNode.id}"))\n`;
                }

                code += '    keyboard = builder.as_markup()\n';
                code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
              }
              code += '    \n';
              code += '    # Инициализируем пользовательские данные если их нет\n';
              code += '    if callback_query.from_user.id not in user_data:\n';
              code += '        user_data[callback_query.from_user.id] = {}\n';
              code += '    \n';
              // Находим следующий узел для перехода после успешного ввода
              const nextConnection = connections.find(conn => conn.source === targetNode.id);
              const nextNodeId = nextConnection ? nextConnection.target : null;

              code += '    # Сохраняем настройки для обработки ответа\n';
              code += '    user_data[callback_query.from_user.id]["button_response_config"] = {\n';
              code += `        "node_id": "${targetNode.id}",\n`;
              code += `        "variable": "${inputVariable}",\n`;
              code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
              code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
              code += `        "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
              code += `        "next_node_id": "${nextNodeId || ''}",\n`;
              code += '        "options": [\n';
              (responseOptions as ResponseOption[]).forEach((option: ResponseOption, index: number) => {
                const optionValue = option.value || option.text;
                const optionAction = option.action || 'goto';
                const optionTarget = option.target || '';
                const optionUrl = option.url || '';
                code += `            {"index": ${index}, "text": "${escapeForJsonString(option.text)}", "value": "${escapeForJsonString(optionValue)}", "action": "${optionAction}", "target": "${optionTarget}", "url": "${escapeForJsonString(optionUrl)}"},\n`;
              });
              code += '        ],\n';
              code += `        "selected": []\n`;
              code += '    }\n';

            } else {
              // Обработка текстового ввода (оригинальная логика)
              if (placeholder) {
                code += `    placeholder_text = "${placeholder}"\n`;
                code += '    text += f"\\n\\n💡 {placeholder_text}"\n';
              }

              if (allowSkip) {
                code += '    text += "\\n\\n⏭️ Нажмите /skip чтобы пропустить"\n';
              }

              code += '    await bot.send_message(callback_query.from_user.id, text)\n';
              code += '    \n';
              code += '    # Инициализируем пользовательские данные если их нет\n';
              code += '    if callback_query.from_user.id not in user_data:\n';
              code += '        user_data[callback_query.from_user.id] = {}\n';
              code += '    \n';

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем collectUserInput перед установкой waiting_for_input
              const textInputCollect = targetNode.data.collectUserInput === true ||
                targetNode.data.enableTextInput === true ||
                targetNode.data.enablePhotoInput === true ||
                targetNode.data.enableVideoInput === true ||
                targetNode.data.enableAudioInput === true ||
                targetNode.data.enableDocumentInput === true;

              if (textInputCollect) {
                // Находим следующий узел для перехода после успешного ввода
                const nextConnection = connections.find(conn => conn.source === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.target : null;

                code += '    # Настраиваем ожидание ввода (collectUserInput=true)\n';
                code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                code += `        "type": "${inputType}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "validation": "${inputValidation}",\n`;
                code += `        "min_length": ${minLength},\n`;
                code += `        "max_length": ${maxLength},\n`;
                code += `        "timeout": ${inputTimeout},\n`;
                code += `        "required": ${toPythonBoolean(inputRequired)},\n`;
                code += `        "allow_skip": ${toPythonBoolean(allowSkip)},\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "retry_message": "${escapeForJsonString(inputRetryMessage)}",\n`;
                code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                code += `        "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "next_node_id": "${nextNodeId || ''}"\n`;
                code += '    }\n';
              } else {
                code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
              }
            }

            /**
             * БЛОК 9: Обработка start узлов
             * Специальная логика для начальных сообщений бота
             * Поддерживает условные сообщения и различные типы клавиатур
             * Может инициировать процесс сбора данных пользователя
             */
          } else if (targetNode.type === 'start') {
            // Обрабатываем узла начала в запросах обратного вызова - показываем начальное сообщение с кнопками
            const messageText = targetNode.data.messageText || "Добро пожаловать!";
            const cleanedMessageText = stripHtmlTags(messageText);
            const formattedText = formatTextForPython(cleanedMessageText);
            const parseMode = getParseMode(targetNode.data.formatMode);

            code += `    # Обрабатываем узел start: ${targetNode.id}\n`;
            code += `    text = ${formattedText}\n`;

            // Применяем универсальную замену переменных
            code += '    \n';
            code += generateUniversalVariableReplacement('    ');

            // Добавляем поддержку условных сообщений для start узлов
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

            // Создаем inline клавиатуру для start узла (только если нет условной клавиатуры)
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

            // Отправляем сообщение start узла
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

            /**
             * БЛОК 10: Обработка command узлов
             * Специальные узлы для выполнения команд бота
             * Могут содержать текстовые сообщения и кнопки
             * Поддерживают различные форматы сообщений (Markdown, HTML)
             */
          } else if (targetNode.type === 'command') {
            // Обрабатываем узла команд в запросах обратного вызова
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

            /**
             * БЛОК 11: Универсальный обработчик для остальных типов узлов
             * Обрабатывает текстовые сообщения и другие неспециализированные узлы
             * Поддерживает условные сообщения и сбор пользовательского ввода
             * Создает соответствующие клавиатуры (inline/reply) при необходимости
             */
          } else {
            // Универсальный обработчик для узлов сообщений и других текстовых узлов
            code += `    # Обрабатываем узел типа ${targetNode.type}: ${targetNode.id}\n`;

            if (targetNode.type === 'message') {
              // Обрабатываем узла сообщений и другие текстовые узла
              const targetText = targetNode.data.messageText || "Сообщение";
              const cleanedText = stripHtmlTags(targetText);
              const formattedTargetText = formatTextForPython(cleanedText);

              code += `    text = ${formattedTargetText}\n`;

              // Добавляем замену переменных в тексте
              code += generateUniversalVariableReplacement('    ');

              // Добавляем поддержку условных сообщений для keyboard узлов с collectUserInput
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

            // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла (основной цикл)
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
                code += '    # Для reply клавиатуры отправляем новое сообщение\n';
                code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
              }
              code += '    \n';
            } else {
              // Обычное отображение сообщения без сбора ввода
              // Обрабатываем клавиатуру для целевого узла
              code += `    # DEBUG: Узел ${actualNodeId} - hasRegularButtons=${toPythonBoolean(targetNode.data.buttons && targetNode.data.buttons.length > 0)}, hasInputCollection=False\n`;
              code += `    logging.info(f"DEBUG: Узел ${actualNodeId} обработка кнопок - keyboardType=${targetNode.data.keyboardType}, buttons=${targetNode.data.buttons ? targetNode.data.buttons.length : 0}")\n`;
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += `    logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${actualNodeId} с ${targetNode.data.buttons.length} кнопками")\n`;
                code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                code += '    if "keyboard" not in locals() or keyboard is None:\n';
                code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
                // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
                const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', actualNodeId, targetNode.data, allNodeIds);
                code += keyboardCode;
                // Определяем режим форматирования для целевого узла
                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
              } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
                code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                code += '    if "keyboard" not in locals() or keyboard is None:\n';
                code += '        # Создаем reply клавиатуру\n';
                const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', actualNodeId, targetNode.data);
                code += keyboardCode;
                // Определяем режим форматирования для целевого узла
                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
              } else {
                // Определяем режим форматирования для целевого узла
                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                // Для автопереходов отправляем новое сообщение вместо редактирования
                code += `    await callback_query.message.answer(text${parseModeTarget})\n`;
              }
            } // Закрываем else блок для обычного отображения (основной цикл)
          } // Закрываем else блок для обычных текстовых сообщений (основной цикл)
        } else {
          /**
           * БЛОК 12: Обработка кнопки без цели
           * Fallback обработчик для кнопок без настроенного target
           * Показывает уведомление пользователю о том, что кнопка не настроена
           */
          // Кнопка без цели - просто уведомляем пользователя
          code += '    # Кнопка пока никуда не ведет\n';
          code += '    await callback_query.answer("⚠️ Эта кнопка яока не настроена", show_alert=True)\n';
        }
      } else if (button.action === 'command' && button.id) {
        /**
         * БЛОК 13: Обработка кнопок с действием 'command'
         * Создает обработчики для выполнения команд бота через callback кнопки
         * Формирует специальную callback_data с префиксом 'cmd_'
         */
        // Обработка кнопок с действием "command"
        const callbackData = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;

        // Избегаем дублирования обработчиков
        if (processedCallbacks.has(callbackData)) return;
        processedCallbacks.add(callbackData);

        code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
        const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
        code += '    # Проверяем флаг hideAfterClick яяля кнопок\n';
        code += `    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных командных кнопок\n`;
        code += '    await callback_query.answer()\n';
        code += '    user_id = callback_query.from_user.id\n';
        code += '    # Инициализируем базовыя переменные пользователя\n';
        code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
        code += '    \n';
        code += `    button_text = "${button.text}"\n`;
        code += '    \n';
        code += '    # Сохраняем кяопку в базу данных\n';
        code += '    timestamp = get_moscow_time()\n';
        code += '    response_data = button_text\n';
        code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
        code += `    logging.info(f"Команда ${button.target || 'неизвестная'} выполнена через callback кнопку (пользователь {user_id})")\n`;
        code += '    \n';

        // Создаем правильный вызов команды для callback кнопок
        if (button.target) {
          // Определяем команду - убираем ведущий сляяш если есть
          const command = button.target.startsWith('/') ? button.target.replace('/', '') : button.target;
          const handlerName = `${command}_handler`;

          code += `    # Вызываем ${handlerName} правильно через edit_text\n`;
          code += '    # Созяаем специальный объект для редактирования сообщения\n';
          code += '    class FakeMessageEdit:\n';
          code += '        def __init__(self, callback_query):\n';
          code += '            self.from_user = callback_query.from_user\n';
          code += '            self.chat = callback_query.message.chat\n';
          code += '            self.date = callback_query.message.date\n';
          code += '            self.message_id = callback_query.message.message_id\n';
          code += '            self._callback_query = callback_query\n';
          code += '        \n';
          code += '        async def answer(self, text, parse_mode=None, reply_markup=None):\n';
          code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
          code += '        \n';
          code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
          code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
          code += '    \n';
          code += '    fake_edit_message = FakeMessageEdit(callback_query)\n';
          code += `    await ${handlerName}(fake_edit_message)\n`;
        } else {
          code += '    await callback_query.message.edit_text("❌ Команда не найдена")\n';
        }
      }
    });
  });
  return code;
}
