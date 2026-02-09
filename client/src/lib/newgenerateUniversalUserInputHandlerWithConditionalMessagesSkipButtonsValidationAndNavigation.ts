import { Button } from './bot-generator';
import { formatTextForPython, stripHtmlTags, toPythonBoolean, generateButtonText, generateWaitingStateCode, calculateOptimalColumns } from './format';
import { generateInlineKeyboardCode } from './Keyboard';
import { generateReplyHideAfterClickHandler } from './Keyboard/generateReplyHideAfterClickHandler';
import { hasPhotoInput, generatePhotoHandlerCode, hasVideoInput, generateVideoHandlerCode, hasAudioInput, generateAudioHandlerCode, hasDocumentInput, generateDocumentHandlerCode } from './MediaHandler';
import { generateUniversalVariableReplacement, generateCheckUserVariableFunction } from './utils';
import { hasInputCollection } from './utils/hasInputCollection';

export function newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(nodes: any[], code: string, allNodeIds: any[], connections: any[], generateAdHocInputCollectionHandler: () => void, generateContinuationLogicForButtonBasedInput: () => string, generateUserInputValidationAndContinuationLogic: () => void, generateStateTransitionAndRenderLogic: () => void) {
  if (hasInputCollection(nodes || [])) {
    code += '\n\n# Универсальный обработчик пользовательского ввода\n';
    code += '@dp.message(F.text)\n';
    code += 'async def handle_user_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
    code += '    \n';
    code += '    # Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick\n';
    code += `    ${generateReplyHideAfterClickHandler(nodes)}\n`;
    code += '    \n';
    /**
     * Обработчик условных сообщений
     * Проверяет, ожидает ли пользователь ввод для условного сообщения,
     * обрабатывает кнопки skipDataCollection и сохраняет ответы пользователя
     */
    code += '    # Проверяем, ожидаем ли мы ввод для условного сообщения\n';
    code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
    code += '        config = user_data[user_id]["waiting_for_conditional_input"]\n';
    code += '        user_text = message.text\n';
    code += '        \n';

    /**
     * Проверка кнопок skipDataCollection
     * Ищет нажатую кнопку среди кнопок пропуска сбора данных
     * и выполняет переход к указанному узлу без сохранения данных
     */
    code += '        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n';
    code += '        skip_buttons = config.get("skip_buttons", [])\n';
    code += '        skip_button_target = None\n';
    code += '        for skip_btn in skip_buttons:\n';
    code += '            if skip_btn.get("text") == user_text:\n';
    code += '                skip_button_target = skip_btn.get("target")\n';
    code += '                logging.info(f"⏭️ Нажата кнопка с skipDataCollection: {user_text} -> {skip_button_target}")\n';
    code += '                break\n';
    code += '        \n';

    /**
     * Навигация при нажатии кнопки пропуска
     * Очищает состояние ожидания и переходит к целевому узлу кнопки
     */
    code += '        # Если нажата кнопка пропуска - переходим к её target без сохранения\n';
    code += '        if skip_button_target:\n';
    code += '            # Очищаем состояние ожидания\n';
    code += '            del user_data[user_id]["waiting_for_conditional_input"]\n';
    code += '            \n';
    code += '            # Переходим к целевому узлу кнопки\n';
    code += '            try:\n';
    code += '                logging.info(f"🚀 Переходим к узлу кнопки skipDataCollection: {skip_button_target}")\n';
    code += '                import types as aiogram_types\n';
    code += '                fake_callback = aiogram_types.SimpleNamespace(\n';
    code += '                    id="skip_button_nav",\n';
    code += '                    from_user=message.from_user,\n';
    code += '                    chat_instance="",\n';
    code += '                    data=skip_button_target,\n';
    code += '                    message=message,\n';
    code += '                    answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
    code += '                )\n';

    // Генерируем навигацию для кнопок skipDataCollection
    if (nodes.length > 0) {
      nodes.forEach((targetNode, idx) => {
        const cond = idx === 0 ? 'if' : 'elif';
        const safeFnName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `                ${cond} skip_button_target == "${targetNode.id}":\n`;
        code += `                    await handle_callback_${safeFnName}(fake_callback)\n`;
      });
      code += '                else:\n';
      code += '                    logging.warning(f"Неизвестный целевой узел кнопки skipDataCollection: {skip_button_target}")\n';
    }

    code += '            except Exception as e:\n';
    code += '                logging.error(f"Ошибка при переходе к узлу кнопки skipDataCollection {skip_button_target}: {e}")\n';
    code += '            return\n';
    /**
     * Сохранение ответа пользователя
     * Сохраняет введенный текст в пользовательские данные и базу данных
     * с поддержкой автоматического именования переменных
     */
    code += '        \n';
    code += '        # Сохраняем текстовый ввод для условного сообщения (обычный случай без skipDataCollection)\n';
    code += '        condition_id = config.get("condition_id", "unknown")\n';
    code += '        next_node_id = config.get("next_node_id")\n';
    code += '        \n';
    code += '        # Сохраняем ответ пользователя\n';
    code += '        timestamp = get_moscow_time()\n';
    code += '        # Используем переменную из конфигурации или создаем автоматическую\n';
    code += '        input_variable = config.get("input_variable", "")\n';
    code += '        if input_variable:\n';
    code += '            variable_name = input_variable\n';
    code += '        else:\n';
    code += '            variable_name = f"conditional_response_{condition_id}"\n';
    code += '        \n';
    code += '        # Сохраняем в пользовательские данные\n';
    code += '        user_data[user_id][variable_name] = user_text\n';
    code += '        \n';
    code += '        # Сохраняем в базу данных\n';
    code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, user_text)\n';
    code += '        if saved_to_db:\n';
    code += '            logging.info(f"✅ Условный ответ сохранен в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
    code += '        else:\n';
    code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
    code += '        \n';
    code += '        # Очищаем состояние ожидания\n';
    code += '        del user_data[user_id]["waiting_for_conditional_input"]\n';
    code += '        \n';
    code += '        logging.info(f"Получен ответ на условное сообщение: {variable_name} = {user_text}")\n';
    code += '        \n';

    /**
     * Навигация после сохранения ответа
     * Переходит к следующему узлу если указан, с поддержкой команд
     */
    code += '        # Переходим к следующему узлу если указан\n';
    code += '        if next_node_id:\n';
    code += '            try:\n';
    code += '                logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
    code += '                \n';
    code += '                # Проверяем, является ли это командой\n';
    code += '                if next_node_id == "profile_command":\n';
    code += '                    logging.info("Переход к команде /profile")\n';
    code += '                    # Проверяем существование profile_handler перед вызовом\n';
    code += '                    profile_func = globals().get("profile_handler")\n';
    code += '                    if profile_func:\n';
    code += '                        await profile_func(message)\n';
    code += '                    else:\n';
    code += '                        logging.warning("profile_handler не найден, пропускаем вызов")\n';
    code += '                        await message.answer("Команда /profile не найдена")\n';
    code += '                else:\n';
    code += '                    # Создаем фиктивный callback для навигации к обычному узлу\n';
    code += '                    import types as aiogram_types\n';
    code += '                    fake_callback = aiogram_types.SimpleNamespace(\n';
    code += '                        id="conditional_nav",\n';
    code += '                        from_user=message.from_user,\n';
    code += '                        chat_instance="",\n';
    code += '                        data=next_node_id,\n';
    code += '                        message=message,\n';
    code += '                        answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
    code += '                    )\n';
    code += '                    \n';

    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `                    ${condition} next_node_id == "${targetNode.id}":\n`;

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
        if (targetNode.data.allowMultipleSelection === true) {
          // Для узлов с множественным выбором создаем прямую навигацию
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                        # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
          code += `                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: ${targetNode.id}")\n`;
          code += `                        text = ${formattedText}\n`;

          // Замена переменных
          code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
          code += generateUniversalVariableReplacement('                        ');

          // Инициализируем состояние множественного выбора
          code += `                        # Инициализируем состояние множественного выбора\n`;
          code += `                        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
          code += `                        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
          code += `                        user_data[user_id]["multi_select_type"] = "selection"\n`;
          if (targetNode.data.multiSelectVariable) {
            code += `                        user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
          }

          // Создаем inline клавиатуру с кнопками выбора
          if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
            code += `                        # Заменяем все переменные в тексте\n`;
            code += `                        text = replace_variables_in_text(text, user_vars)\n`;
            code += `                        await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
            code += `                        # Заменяем все переменные в тексте\n`;
            code += `                        text = replace_variables_in_text(text, user_vars)\n`;
            code += `                        await message.answer(text)\n`;
          }
          code += `                        logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
        } else {
          // Для обычных узлов проверяем сначала, собирают ли они ввод
          if (targetNode.data.collectUserInput === true) {
            // Проверяем, есть ли условные сообщения для этого узла
            const hasConditionalMessages = targetNode.data.enableConditionalMessages &&
              targetNode.data.conditionalMessages &&
              targetNode.data.conditionalMessages.length > 0;

            if (hasConditionalMessages) {
              // Для узлов с условными сообщениями генерируем встроенную логику проверки
              code += `                        # Узел с условными сообщениями - проверяем условия\n`;
              code += `                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: ${targetNode.id}")\n`;
              code += `                        user_data_dict = await get_user_from_db(user_id) or {}\n`;
              code += `                        user_data_dict.update(user_data.get(user_id, {}))\n`;

              // Генерируем логику проверки условий встроенно
              const conditionalMessages = targetNode.data.conditionalMessages.sort((a: { priority: any; }, b: { priority: any; }) => (b.priority || 0) - (a.priority || 0));

              code += generateCheckUserVariableFunction('                        ');

              // Генерируем условия
              code += `                        conditional_met = False\n`;
              for (let i = 0; i < conditionalMessages.length; i++) {
                const condition = conditionalMessages[i];
                const variableNames = condition.variableNames && condition.variableNames.length > 0
                  ? condition.variableNames
                  : (condition.variableName ? [condition.variableName] : []);
                const logicOperator = condition.logicOperator || 'AND';
                const conditionKeyword = i === 0 ? 'if' : 'elif';

                if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                  code += `                        ${conditionKeyword} (\n`;
                  for (let j = 0; j < variableNames.length; j++) {
                    const varName = variableNames[j];
                    const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                    code += `                            check_user_variable_inline("${varName}", user_data_dict)[0]${operator}\n`;
                  }
                  code += `                        ):\n`;
                  code += `                            conditional_met = True\n`;

                  // Генерируем текст и клавиатуру для условия
                  const cleanedText = stripHtmlTags(condition.messageText);
                  const formattedText = formatTextForPython(cleanedText);
                  code += `                            text = ${formattedText}\n`;

                  // Заменяем переменные
                  for (const varName of variableNames) {
                    code += `                            _, var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} = check_user_variable_inline("${varName}", user_data_dict)\n`;
                    code += `                            if "{${varName}}" in text and var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} is not None:\n`;
                    code += `                                text = text.replace("{${varName}}", var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')})\n`;
                  }

                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                  code += `                            # Заменяем все переменные в тексте\n`;
                  code += `                            text = replace_variables_in_text(text, user_data_dict)\n`;

                  // Когда условие выполнено (переменная уже есть), отмечаем это
                  code += `                            conditional_met = True\n`;
                  code += `                            logging.info(f"✅ Условие выполнено: переменная суяесявует")\n`;

                  // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода
                  const shouldWaitForInput = condition.waitForTextInput === true;

                  if (shouldWaitForInput) {
                    // Показываем сообщение и настраиваем ожидание ввода
                    code += `                            # waitForTextInput=true: показываем сообщение и ждем ввода\n`;

                    const inputVariable = condition.textInputVariable || targetNode.data.inputVariable || `response_${targetNode.id}`;
                    const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;

                    // Проверяем, есть ли кнопки в условном сообщении
                    const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;

                    if (hasConditionalButtons) {
                      // Генерируем клавиатуру с кнопками из условного сообщения
                      code += `                            # Генерируем клавиатуру с кнопками из условного сообщения\n`;
                      code += `                            builder = ReplyKeyboardBuilder()\n`;

                      for (const button of condition.buttons) {
                        let buttonText = button.text || 'Кнопка';
                        const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');

                        // Заменяем переменные в тексте кнопки
                        let hasVariable = false;
                        for (const varName of variableNames) {
                          if (buttonText.includes(`{${varName}}`)) {
                            code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                            code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                            code += `                            if btn_var_value is not None:\n`;
                            code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                            buttonText = `btn_text_${safeButtonId}`;
                            hasVariable = true;
                            break;
                          }
                        }

                        if (!hasVariable) {
                          buttonText = `"${buttonText}"`;
                        }

                        code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                      }

                      code += `                            builder.adjust(1)\n`;
                      // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                      const conditionOneTimeKeyboard1 = toPythonBoolean(condition.oneTimeKeyboard === true);
                      code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard1})\n`;

                      // Отправляем сообщение с клавиатурой
                      const mainMessageText = targetNode.data.messageText || 'Выберите действие';
                      const mainFormattedText = formatTextForPython(mainMessageText);
                      code += `                            main_text = ${mainFormattedText}\n`;
                      code += `                            await message.answer(main_text, reply_markup=keyboard)\n`;

                      // Устанавливаем ожидание ввода, даже если есть клавиатура
                      // Пользователь может ввести текст вместо нажатия кнопки
                      code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                      code += `                                "type": "text",\n`;
                      code += `                                "variable": "${inputVariable}",\n`;
                      code += `                                "save_to_database": True,\n`;
                      code += `                                "node_id": "${targetNode.id}",\n`;
                      code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                      code += `                            }\n`;
                      code += `                            logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id}")\n`;
                    } else {
                      // Нет кнопок - показываем сообщение и ждем текстового ввода
                      code += `                            # Если условный текст пустой, используем основное сообщение узла\n`;
                      code += `                            if text and text.strip():\n`;
                      code += `                                await message.answer(text)\n`;
                      code += `                            else:\n`;

                      // Используем основное сообщение узла
                      const mainMessageText = targetNode.data.messageText || 'Введите данные';
                      const mainFormattedText = formatTextForPython(mainMessageText);
                      code += `                                main_text = ${mainFormattedText}\n`;

                      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                      code += `                                # Заменяем все переменные в тексте\n`;
                      code += `                                main_text = replace_variables_in_text(main_text, user_data_dict)\n`;

                      code += `                                await message.answer(main_text)\n`;
                      code += `                            \n`;

                      code += `                            # Настраиваем ожидание ввода для условного сообщения\n`;
                      code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                      code += `                                "type": "text",\n`;
                      code += `                                "variable": "${inputVariable}",\n`;
                      code += `                                "save_to_database": True,\n`;
                      code += `                                "node_id": "${targetNode.id}",\n`;
                      code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                      code += `                            }\n`;
                      code += `                            logging.info(f"✅ Состояние ожидания настроено: text ввод для переменной ${inputVariable} (условное сообщение, узел ${targetNode.id})")\n`;
                    }
                  } else {
                    // ИСПРАВЛЕНИЕ: Проверяем, есть ли кнопки в условном сообщении
                    const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;

                    if (hasConditionalButtons) {
                      // Если есть условные кнопки - показываем их и НЕ делаем автопереход
                      // Кнопки сами ведут к целевым узлам
                      code += `                            # Условное сообщение с кнопками: показываем клавиатуру\n`;
                      code += `                            builder = ReplyKeyboardBuilder()\n`;

                      for (const button of condition.buttons) {
                        let buttonText = button.text || 'Кнопка';
                        const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');

                        // Заменяем переменные в тексте кнопки
                        let hasVariable = false;
                        for (const varName of variableNames) {
                          if (buttonText.includes(`{${varName}}`)) {
                            code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                            code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                            code += `                            if btn_var_value is not None:\n`;
                            code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                            buttonText = `btn_text_${safeButtonId}`;
                            hasVariable = true;
                            break;
                          }
                        }

                        if (!hasVariable) {
                          buttonText = `"${buttonText}"`;
                        }

                        code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                      }

                      code += `                            builder.adjust(1)\n`;
                      // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                      const conditionOneTimeKeyboard2 = toPythonBoolean(condition.oneTimeKeyboard === true);
                      code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard2})\n`;
                      code += `                            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, node_id="${targetNode.id}")\n`;
                      code += `                            logging.info(f"✅ Показана условная клавиатура (кнопяи ведут напрямую, автопереход НЕ выполняется)")\n`;
                    } else {
                      // Нет кнопок - автоматически переходим к следующему узлу
                      const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;
                      if (nextNodeAfterCondition) {
                        code += `                            # Переменная уже существует, автоматически переходим к узлу: ${nextNodeAfterCondition}\n`;
                        code += `                            logging.info(f"✅ Условие выполнено: переменная существует, автоматически переходим к следующему узлу")\n`;
                        code += `                            # Рекурсивно обрабатываем следующий узел через ту же систему навигации\n`;
                        code += `                            next_node_id_auto = "${nextNodeAfterCondition}"\n`;
                        code += `                            logging.info(f"я Автоматический переход к уялу: {next_node_id_auto}")\n`;
                      } else {
                        code += `                            # Переменная яуществует, но слядующий узел не указан - завершаем обработяу\n`;
                      }
                    }
                  }
                }
              }

              // Fallback если условия не выпоянены
              code += `                        if not conditional_met:\n`;
              code += `                            # Условие не выполнено - показываем основнояя сообщение\n`;
              const messageText = targetNode.data.messageText || 'Сообщение';
              const formattedText = formatTextForPython(messageText);
              code += `                            text = ${formattedText}\n`;
              code += `                            await message.answer(text)\n`;

              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const inputTargetNodeId = targetNode.data.inputTargetNodeId;
              code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
              code += `                                "type": "text",\n`;
              code += `                                "modes": ["text"],\n`;
              code += `                                "variable": "${inputVariable}",\n`;
              code += `                                "save_to_database": True,\n`;
              code += `                                "node_id": "${targetNode.id}",\n`;
              code += `                                "next_node_id": "${inputTargetNodeId || ''}"\n`;
              code += `                            }\n`;
              code += `                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
            } else {
              const messageText = targetNode.data.messageText || 'Сообщение';
              const formattedText = formatTextForPython(messageText);

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: У узла есть кяяопки - показываем ях И настраиваем ожидание ввода
              if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += `                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа\n`;
                code += `                        logging.info(f"✅ Показаны кнопки для узла ${targetNode.id} с collectUserInput=true")\n`;
                code += `                        text = ${formattedText}\n`;

                // Дояяяяавляем замену переменных
                code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
                code += generateUniversalVariableReplacement('                        ');

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Генерируем правильный тип клавиатуры в завясимости от keyboardType
                if (targetNode.data.keyboardType === 'reply') {
                  code += '                        # Создаем reply клавиатуру\n';
                  code += '                        builder = ReplyKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button) => {
                    code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                  });
                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                } else {
                  // Генерируем inline клавиатуру
                  code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
                }
                code += `                        await message.answer(text, reply_markup=keyboard)\n`;

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также яастраиваем waiting_for_input для сохранения ответа кнопки
                const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                // Определяем modes - если есть enableTextInput, добавляем и text и button
                const hasTextInput = targetNode.data.enableTextInput === true;
                const btnModesList = hasTextInput ? "['button', 'text']" : "['button']";
                // Собираем кнопки с skipDataCollection для кнопок
                const skipButtons2572 = (targetNode.data.buttons || [])
                  .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                  .map((btn: any) => ({ text: btn.text, target: btn.target }));
                const skipButtonsJson2572 = JSON.stringify(skipButtons2572);

                code += `                        # Настраиваем ожидание ввода для сохранения ответа кнопки\n`;
                code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
                code += `                            "type": "button",\n`;
                code += `                            "modes": ${hasTextInput ? "['button', 'text']" : "['button']"},\n`;
                code += `                            "variable": "${inputVariable}",\n`;
                code += `                            "save_to_database": True,\n`;
                code += `                            "node_id": "${targetNode.id}",\n`;
                code += `                            "next_node_id": "${inputTargetNodeId || ''}",\n`;
                code += `                            "skip_buttons": ${skipButtonsJson2572}\n`;
                code += `                        }\n`;
                code += `                        logging.info(f"✅ Сояяяятояние ожид����ия настроено: modes=${btnModesList} для пер��менной ${inputVariable} (узел ${targetNode.id})")\n`;
              } else {
                // Обычн����е ожидание ввода если кнопок нет
                code += `                        # Узел собирает пользовательский ввод\n`;
                code += `                        logging.info(f"🔧 Условная навигация к узлу с вводом: ${targetNode.id}")\n`;
                code += `                        text = ${formattedText}\n`;

                // Настраиваем ожидание ввода
                const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                code += `                        await message.answer(text)\n`;
                code += `                        # Настраиваем ожидание ввода\n`;
                code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
                code += `                            "type": "text",\n`;
                code += `                            "modes": ["text"],\n`;
                code += `                            "variable": "${inputVariable}",\n`;
                code += `                            "save_to_database": True,\n`;
                code += `                            "node_id": "${targetNode.id}",\n`;
                code += `                            "next_node_id": "${inputTargetNodeId || ''}"\n`;
                code += `                        }\n`;
                code += `                        logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
              }
            }
          } else {
            // Обычная навигация с простым сообщением
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                        # Обычный узел - отправляем сообщение\n`;
            code += `                        text = ${formattedText}\n`;

            // Добавляем замену переменных
            code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                        ');

            // Проверяем, есть ли reply кнопки
            if (targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += '                        # Создаем reply клавиатуру\n';
              code += '                        builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button) => {
                code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
              });
              const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
              const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
              code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
              code += '                        await message.answer(text, reply_markup=keyboard)\n';
            } else if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += '                        # Создаем inline клавиатуру\n';
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
              code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
              code += '                        await message.answer(text, reply_markup=keyboard)\n';
            } else {
              code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
              code += '                        await message.answer(text)\n';
            }
          }
        }
      });
      code += '                    else:\n';
      code += '                        logging.warning(f"Неизвестныя следующий узел: {next_node_id}")\n';
    } else {
      code += '                    # No nodes available for navigation\n';
      code += '                    logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
    }

    code += '            except Exception as e:\n';
    code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '        \n';
    code += '        return  # Завершаем обработку для условного сообщения\n';
    code += '    \n';
    /**
     * Обработка кнопочных ответов через reply клавиатуру
     * Обрабатывает выбор пользователя из предложенных вариантов reply клавиатуры
     */
    code += '    # Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру\n';
    code += '    if user_id in user_data and "button_response_config" in user_data[user_id]:\n';
    code += '        config = user_data[user_id]["button_response_config"]\n';
    code += '        user_text = message.text\n';
    code += '        \n';

    /**
     * Поиск выбранного варианта
     * Ищет нажатую кнопку среди доступных опций в конфигурации
     */
    code += '        # Ищем выбранный вариант среди доступных опций\n';
    code += '        selected_option = None\n';
    code += '        for option in config.get("options", []):\n';
    code += '            if option["text"] == user_text:\n';
    code += '                selected_option = option\n';
    code += '                break\n';
    code += '        \n';

    /**
     * Обработка выбранного варианта
     * Сохраняет выбор пользователя в структурированном формате
     */
    code += '        if selected_option:\n';
    code += '            selected_value = selected_option["value"]\n';
    code += '            selected_text = selected_option["text"]\n';
    code += '            \n';
    code += '            # Сохраняем ответ пользователя\n';
    code += '            variable_name = config.get("variable", "button_response")\n';
    code += '            timestamp = get_moscow_time()\n';
    code += '            node_id = config.get("node_id", "unknown")\n';
    code += '            \n';

    /**
     * Создание структурированного ответа
     * Формирует объект с метаданными о выборе пользователя
     */
    code += '            # Создаем структурированный ответ\n';
    code += '            response_data = {\n';
    code += '                "value": selected_value,\n';
    code += '                "text": selected_text,\n';
    code += '                "type": "button_choice",\n';
    code += '                "timestamp": timestamp,\n';
    code += '                "nodeId": node_id,\n';
    code += '                "variable": variable_name\n';
    code += '            }\n';
    code += '            \n';
    code += '            # Сохраняем в пользовательские данные\n';
    code += '            user_data[user_id][variable_name] = response_data\n';
    code += '            \n';
    code += '            # Сохраняем в базу данных если включено\n';
    code += '            if config.get("save_to_database"):\n';
    code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
    code += '                if saved_to_db:\n';
    code += '                    logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
    code += '                else:\n';
    code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
    code += '            \n';

    /**
     * Подтверждение выбора
     * Отправляет сообщение об успешном выборе и удаляет клавиатуру
     */
    code += '            # Отправляем сообщение об успехе\n';
    code += '            success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
    code += '            await message.answer(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())\n';
    code += '            \n';
    code += '            # Очищаем состояние\n';
    code += '            del user_data[user_id]["button_response_config"]\n';
    code += '            \n';
    code += '            logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")\n';
    code += '            \n';

    /**
     * Навигация на основе действия кнопки
     * Выполняет различные действия в зависимости от типа выбранной кнопки
     */
    code += '            # Навигация на основе действия кнопки\n';
    code += '            option_action = selected_option.get("action", "goto")\n';
    code += '            option_target = selected_option.get("target", "")\n';
    code += '            option_url = selected_option.get("url", "")\n';
    code += '            \n';

    /**
     * Обработка различных типов действий
     * Поддерживает переходы по URL, выполнение команд и навигацию к узлам
     */
    code += '            if option_action == "url" and option_url:\n';
    code += '                # Открытие ссылки\n';
    code += '                url = option_url\n';
    code += '                keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
    code += '                    [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]\n';
    code += '                ])\n';
    code += '                await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)\n';
    code += '            elif option_action == "command" and option_target:\n';

    /**
     * Выполнение команды
     * Создает фиктивное сообщение и вызывает соответствующий обработчик команды
     */
    code += '                # Выполнение команды\n';
    code += '                command = option_target\n';
    code += '                # Создаем фиктивное сообщение для выполнения команды\n';
    code += '                import types as aiogram_types\n';
    code += '                fake_message = aiogram_types.SimpleNamespace(\n';
    code += '                    from_user=message.from_user,\n';
    code += '                    chat=message.chat,\n';
    code += '                    text=command,\n';
    code += '                    message_id=message.message_id\n';
    code += '                )\n';
    code += '                \n';

    // Добавляем обработку различных команд для reply клавиатур
    const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
    commandNodes.forEach((cmdNode, cmdIndex) => {
      const condition = cmdIndex === 0 ? 'if' : 'elif';
      code += `                ${condition} command == "${cmdNode.data.command}":\n`;
      code += `                    try:\n`;
      code += `                        await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
      code += `                    except Exception as e:\n`;
      code += `                        logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
    });
    if (commandNodes.length > 0) {
      code += `                else:\n`;
      code += `                    logging.warning(f"Неизвестная команда: {command}")\n`;
    }

    code += '            elif option_action == "goto" and option_target:\n';
    code += '                # Переход к узлу\n';
    code += '                target_node_id = option_target\n';
    code += '                try:\n';
    code += '                    # Вызываем обработчик для целевого узла\n';

    // Генерируем логику навигации для ответов на кнопки ответов  
    if (nodes.length > 0) {
      nodes.forEach((btnNode, btnIndex) => {
        const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const condition = btnIndex === 0 ? 'if' : 'elif';
        code += `                    ${condition} target_node_id == "${btnNode.id}":\n`;
        code += `                        await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))\n`;
      });
      code += '                    else:\n';
      code += '                        logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
    } else {
      code += '                    pass  # No nodes to handle\n';
    }
    code += '                except Exception as e:\n';
    code += '                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
    code += '            else:\n';
    code += '                # Fallback к старой системе next_node_id если нет action\n';
    code += '                next_node_id = config.get("next_node_id")\n';
    code += '                if next_node_id:\n';
    code += '                    try:\n';
    code += '                        # Вызываем обработчик для следующего узла\n';

    if (nodes.length > 0) {
      nodes.forEach((btnNode, btnIndex) => {
        const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const condition = btnIndex === 0 ? 'if' : 'elif';
        code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
        code += `                            await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))\n`;
      });
      code += '                        else:\n';
      code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
    } else {
      code += '                        pass  # No nodes to handle\n';
    }
    code += '                    except Exception as e:\n';
    code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '            return\n';
    code += '        else:\n';
    code += '            # Неверный выбор - показываем доступные варианты\n';
    code += '            available_options = [option["text"] for option in config.get("options", [])]\n';
    code += '            options_text = "\\n".join([f"• {opt}" for opt in available_options])\n';
    code += '            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\\n\\n{options_text}")\n';
    code += '            return\n';
    code += '    \n';
    /**
     * Обработка кнопок пропуска для медиа-узлов
     * Специальная обработка для узлов, ожидающих медиа-файлы (фото/видео/аудио/документы)
     * когда пользователь нажимает reply-кнопку с skipDataCollection
     */
    code += '    # ИСПРАВЛЕНИЕ: Проверяем pending_skip_buttons для медиа-узлов (фото/видео/аудио)\n';
    code += '    # Эта проверка нужна когда узел ожидает медиа, но пользователь нажал reply-кнопку с skipDataCollection\n';
    code += '    if user_id in user_data and "pending_skip_buttons" in user_data[user_id]:\n';
    code += '        pending_buttons = user_data[user_id]["pending_skip_buttons"]\n';
    code += '        user_text = message.text\n';

    /**
     * Поиск нажатой кнопки пропуска
     * Проверяет, была ли нажата одна из кнопок пропуска для медиа-узла
     */
    code += '        for skip_btn in pending_buttons:\n';
    code += '            if skip_btn.get("text") == user_text:\n';
    code += '                skip_target = skip_btn.get("target")\n';
    code += '                logging.info(f"⏭️ Нажата кнопка skipDataCollection для медиа-узла: {user_text} -> {skip_target}")\n';

    /**
     * Очистка состояний ожидания медиа
     * Удаляет все состояния, связанные с ожиданием медиа-файлов
     */
    code += '                # Очищаем pending_skip_buttons и любые медиа-ожидания\n';
    code += '                if "pending_skip_buttons" in user_data[user_id]:\n';
    code += '                    del user_data[user_id]["pending_skip_buttons"]\n';
    code += '                # Проверяем и очищаем waiting_for_input если тип соответствует медиа\n';
    code += '                if "waiting_for_input" in user_data[user_id]:\n';
    code += '                    waiting_config = user_data[user_id]["waiting_for_input"]\n';
    code += '                    if isinstance(waiting_config, dict) and waiting_config.get("type") in ["photo", "video", "audio", "document"]:\n';
    code += '                        del user_data[user_id]["waiting_for_input"]\n';

    /**
     * Навигация после пропуска медиа
     * Переходит к целевому узлу после нажатия кнопки пропуска
     */
    code += '                # Переходим к целевому узлу\n';
    code += '                if skip_target:\n';
    code += '                    try:\n';
    code += '                        logging.info(f"🚀 Переходим к узлу skipDataCollection медиа: {skip_target}")\n';
    code += '                        import types as aiogram_types\n';
    code += '                        fake_callback = aiogram_types.SimpleNamespace(\n';
    code += '                            id="skip_media_nav",\n';
    code += '                            from_user=message.from_user,\n';
    code += '                            chat_instance="",\n';
    code += '                            data=skip_target,\n';
    code += '                            message=message,\n';
    code += '                            answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
    code += '                        )\n';

    // Добавляем навигацию для skip_buttons медиа-узлов
    if (nodes.length > 0) {
      nodes.forEach((mediaSkipNode, mediaSkipIdx) => {
        const mediaSkipCond = mediaSkipIdx === 0 ? 'if' : 'elif';
        const mediaSkipFnName = mediaSkipNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `                        ${mediaSkipCond} skip_target == "${mediaSkipNode.id}":\n`;
        code += `                            await handle_callback_${mediaSkipFnName}(fake_callback)\n`;
      });
      code += '                        else:\n';
      code += '                            logging.warning(f"Неизвестный целевой узел skipDataCollection медиа: {skip_target}")\n';
    }

    code += '                    except Exception as e:\n';
    code += '                        logging.error(f"Ошибка при переходе к узлу skipDataCollection медиа {skip_target}: {e}")\n';
    code += '                return\n';
    code += '    \n';
    /**
     * Универсальная система ожидания ввода
     * Проверяет состояние ожидания ввода и обрабатывает различные типы входных данных
     */
    code += '    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)\n';
    code += '    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]\n';
    code += '    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")\n';
    code += '    if user_id in user_data and "waiting_for_input" in user_data[user_id]:\n';
    code += '        # Обрабатываем ввод через универсальную систему\n';
    code += '        waiting_config = user_data[user_id]["waiting_for_input"]\n';
    code += '        \n';
    code += '        # Проверяем, что пользователь все еще находится в состоянии ожидания ввода\n';
    code += '        if not waiting_config:\n';
    code += '            return  # Состояние ожидания пустое, игнорируем\n';
    code += '        \n';

    /**
     * Обработка различных форматов конфигурации
     * Поддерживает новый формат (словарь) и старый формат (строка) для об��атной совместимости
     */
    code += '        # Проверяем формат конфигурации - новый (словарь) или старый (строка)\n';
    code += '        if isinstance(waiting_config, dict):\n';
    code += '            # Новый формат - извлекаем данные из словаря\n';
    code += '            waiting_node_id = waiting_config.get("node_id")\n';
    code += '            input_type = waiting_config.get("type", "text")\n';
    code += '            variable_name = waiting_config.get("variable", "user_response")\n';
    code += '            save_to_database = waiting_config.get("save_to_database", False)\n';
    code += '            min_length = waiting_config.get("min_length", 0)\n';
    code += '            max_length = waiting_config.get("max_length", 0)\n';
    code += '            next_node_id = waiting_config.get("next_node_id")\n';
    code += '            \n';

    /**
     * Проверка типа ввода медиа
     * Если ожидается медиа-файл, текстовый обработчи���������������� должен проигнорировать сообщение
     */
    code += '            # ИСПРАВЛЕНИЕ: Проверяем, является ли тип ввода медиа (фото, видео, аудио, документ)\n';
    code += '            # Если да, то текстовый обработчик не должен его обрабатывать\n';
    code += '            if input_type in ["photo", "video", "audio", "document"]:\n';
    code += '                logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")\n';
    code += '                return\n';
    code += '        else:\n';
    code += '            # Старый формат - waiting_config это строка с node_id\n';
    code += '            waiting_node_id = waiting_config\n';
    code += '            input_type = user_data[user_id].get("input_type", "text")\n';
    code += '            variable_name = user_data[user_id].get("input_variable", "user_response")\n';
    code += '            save_to_database = user_data[user_id].get("save_to_database", False)\n';
    code += '            min_length = 0\n';
    code += '            max_length = 0\n';
    code += '            next_node_id = user_data[user_id].get("waiting_input_target_node_id") or user_data[user_id].get("input_target_node_id")\n';
    code += '        \n';
    code += '        user_text = message.text\n';
    code += '        \n';

    /**
     * Обработка кнопок skipDataCollection в универсальной системе
     * Проверяет нажатые кнопки и выполняет переход без сохранения данных
     */
    code += '        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n';
    code += '        if isinstance(waiting_config, dict):\n';
    code += '            skip_buttons = waiting_config.get("skip_buttons", [])\n';
    code += '            for skip_btn in skip_buttons:\n';
    code += '                if skip_btn.get("text") == user_text:\n';
    code += '                    skip_target = skip_btn.get("target")\n';
    code += '                    logging.info(f"⏭️ Нажата кнопка skipDataCollection в waiting_for_input: {user_text} -> {skip_target}")\n';
    code += '                    # Очищаем состояние ожидания\n';
    code += '                    if "waiting_for_input" in user_data[user_id]:\n';
    code += '                        del user_data[user_id]["waiting_for_input"]\n';
    code += '                    # Переходим к целевому узлу\n';
    code += '                    if skip_target:\n';
    code += '                        try:\n';
    code += '                            logging.info(f"🚀 Переходим к узлу skipDataCollection: {skip_target}")\n';
    code += '                            import types as aiogram_types\n';
    code += '                            fake_callback = aiogram_types.SimpleNamespace(\n';
    code += '                                id="skip_button_nav",\n';
    code += '                                from_user=message.from_user,\n';
    code += '                                chat_instance="",\n';
    code += '                                data=skip_target,\n';
    code += '                                message=message,\n';
    code += '                                answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
    code += '                            )\n';

    // Добавляем навигацию для кнопок skipDataCollection
    if (nodes.length > 0) {
      nodes.forEach((skipNode, skipIdx) => {
        const skipCond = skipIdx === 0 ? 'if' : 'elif';
        const skipFnName = skipNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `                            ${skipCond} skip_target == "${skipNode.id}":\n`;
        code += `                                await handle_callback_${skipFnName}(fake_callback)\n`;
      });
      code += '                            else:\n';
      code += '                                logging.warning(f"Неизвестный целевой узел skipDataCollection: {skip_target}")\n';
    }

    code += '                        except Exception as e:\n';
    code += '                            logging.error(f"Ошибка при переходе к узлу skipDataCollection {skip_target}: {e}")\n';
    code += '                    return\n';
    /**
     * Валидация входных данных
     * Проверяет формат email, номера телефона, числовых значений
     * и ограничения по длине текста
     */
    code += '        \n';
    code += '        # Валидация для нового формата\n';
    code += '        if isinstance(waiting_config, dict):\n';

    /**
     * Валидация длины текста
     * Проверяет минимальную и максимальную длину введенного текста
     */
    code += '            # Валидация длины\n';
    code += '            if min_length > 0 and len(user_text) < min_length:\n';
    code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
    code += '                await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
    code += '                return\n';
    code += '            \n';
    code += '            if max_length > 0 and len(user_text) > max_length:\n';
    code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
    code += '                await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
    code += '                return\n';
    code += '            \n';

    /**
     * Валидация типа ввода
     * Проверяет соответствие введенных данных указанному типу (email, phone, number)
     */
    code += '            # Валидация типа ввода\n';
    code += '            if input_type == "email":\n';
    code += '                import re\n';
    code += '                email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
    code += '                if not re.match(email_pattern, user_text):\n';
    code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
    code += '                    await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
    code += '                    return\n';
    code += '            elif input_type == "number":\n';
    code += '                try:\n';
    code += '                    float(user_text)\n';
    code += '                except ValueError:\n';
    code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
    code += '                    await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
    code += '                    return\n';
    code += '            elif input_type == "phone":\n';
    code += '                import re\n';
    code += '                phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
    code += '                if not re.match(phone_pattern, user_text):\n';
    code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
    code += '                    await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
    code += '                    return\n';

    /**
     * Сохранение проверенных данных
     * Сохраняет валидированные данные в пользовательские данные и базу данных
     */
    code += '            \n';
    code += '            # Сохраняем ответ для нового формата\n';
    code += '            timestamp = get_moscow_time()\n';
    code += '            response_data = user_text\n';
    code += '            \n';
    code += '            # Сохраняем в пользовательские данные\n';
    code += '            user_data[user_id][variable_name] = response_data\n';
    code += '            \n';
    code += '            # Сохраняем в базу данных если включено\n';
    code += '            if save_to_database:\n';
    code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
    code += '                if saved_to_db:\n';
    code += '                    logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
    code += '                else:\n';
    code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
    code += '            \n';

    /**
     * Отправка подтверждающего сообщения
     * Отправляет пользователю сообщение об успешном сохранении данных
     */
    code += '            # Отправляем подтверждающее сообщение только если оно задано\n';
    code += '            success_message = waiting_config.get("success_message", "")\n';
    code += '            if success_message:\n';
    code += '                logging.info(f"DEBUG: Отправляем подтверждение с текстом: {success_message}")\n';
    code += '                await message.answer(success_message)\n';
    code += '                logging.info(f"✅ Отправлено подтверждение: {success_message}")\n';
    code += '            \n';

    /**
     * Очистка состояния ожидания
     * Удаляет состояние ожидания ввода после успешной обработки
     */
    code += '            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем старое состояние ожидания перед навигацией\n';
    code += '            if "waiting_for_input" in user_data[user_id]:\n';
    code += '                del user_data[user_id]["waiting_for_input"]\n';
    code += '            \n';
    code += '            logging.info(f"✅ Переход к следующему узлу выполнен успешно")\n';
    code += '            logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
    code += '            \n';

    /**
     * Навигация к следующему узлу
     * Переходит к следующему узлу диалога с поддержкой автопереходов
     */
    code += '            # Навигация к следующему узлу для нового формата\n';
    code += '            if next_node_id:\n';
    code += '                try:\n';

    /**
     * Цикл автопереходов
     * Поддерживает последовательные переходы между узлами без участия пользователя
     */
    code += '                    # Цикл для поддержки автопереходов\n';
    code += '                    while next_node_id:\n';
    code += '                        logging.info(f"🚀 Переходим к узлу: {next_node_id}")\n';
    code += '                        current_node_id = next_node_id\n';
    code += '                        next_node_id = None  # Сбрасываем, будет установлен при автопереходе\n';
    code += '                        # Проверяем навигацию к узлам\n';

    // Функция для генерации отступов (решение архитектора)
    const getIndents = (baseLevel: number) => {
      const indent = (level: number) => '    '.repeat(level);
      return {
        whileIndent: indent(baseLevel), // 24 пробела - уровень while
        conditionIndent: indent(baseLevel), // 24 пробела - уровень if/elif
        bodyIndent: indent(baseLevel + 1), // 28 пробелов - тело if/elif
      };
    };

    const { conditionIndent, bodyIndent } = getIndents(6);

    // Добавляем навигацию для каждого узла
    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `${conditionIndent}${condition} current_node_id == "${targetNode.id}":\n`;

        if (targetNode.type === 'message') {
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
          if (targetNode.data.allowMultipleSelection === true) {
            // Для узлов с множественным выбором создаем прямую навигацию
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `${bodyIndent}# Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
            code += `${bodyIndent}logging.info(f"🔧 Переходим к узлу с множественным выбором: ${targetNode.id}")\n`;
            code += `${bodyIndent}text = ${formattedText}\n`;

            // Замена переменных
            code += `${bodyIndent}user_data[user_id] = user_data.get(user_id, {})\n`;
            code += generateUniversalVariableReplacement(bodyIndent);

            // Инициализируем состояние множественного выбора
            code += `${bodyIndent}# Инициализируем состояние множественного выбора\n`;
            code += `${bodyIndent}user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
            code += `${bodyIndent}user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
            code += `${bodyIndent}user_data[user_id]["multi_select_type"] = "selection"\n`;
            if (targetNode.data.multiSelectVariable) {
              code += `${bodyIndent}user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
            }

            // Создаем inline клавиатуру с кнопками выбора
            if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += generateInlineKeyboardCode(targetNode.data.buttons, bodyIndent, targetNode.id, targetNode.data, allNodeIds);
              code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `${bodyIndent}await message.answer(text)\n`;
            }
            code += `${bodyIndent}logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
          } else {
            const messageText = targetNode.data.messageText || 'Сообщение';
            const cleanedMessageText = stripHtmlTags(messageText);
            const formattedText = formatTextForPython(cleanedMessageText);
            code += `${bodyIndent}text = ${formattedText}\n`;

            // Применяем замену переменных
            code += `${bodyIndent}# Замена переменных в тексте\n`;
            code += generateUniversalVariableReplacement(bodyIndent);

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
            code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
            code += `${bodyIndent}text = replace_variables_in_text(text, user_vars)\n`;

            // Если узел message собирает ввод, настраиваем ожидание
            if (targetNode.data.collectUserInput === true) {
              // Определяем тип ввода - если включены медиа-типы, используем их, иначе текст
              if (targetNode.data.enablePhotoInput) {
              } else if (targetNode.data.enableVideoInput) {
              } else if (targetNode.data.enableAudioInput) {
              } else if (targetNode.data.enableDocumentInput) {
              } else {
              }
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const inputTargetNodeId = targetNode.data.inputTargetNodeId;

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда устанавливаем состояние ожидания ввода для collectUserInput=true
              code += `${bodyIndent}# Устанавливаем состояние ожидания ввода для узла ${targetNode.id}\n`;
              if (targetNode && targetNode.data) {
                code += generateWaitingStateCode(targetNode, bodyIndent);
              }
              code += `${bodyIndent}logging.info(f"✅ Узел ${targetNode.id} настроен для сбора ввода (collectUserInput=true)")\n`;

              // Если у узла есть кнопки, показываем их ВМЕСТЕ с ожиданием ввода
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += `${bodyIndent}# У узла есть inline кнопки - показываем их вместе с ожиданием ввода\n`;
                code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

                // Добавляем кнопки для узла с collectUserInput + buttons
                targetNode.data.buttons.forEach((btn: Button) => {
                  if (btn.action === "goto" && btn.target) {
                    const callbackData = `${btn.target}`;
                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === "url" && btn.url) {
                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
                  } else if (btn.action === "command" && btn.target) {
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });

                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `${bodyIndent}builder.adjust(${columns})\n`;
                code += `${bodyIndent}keyboard = builder.as_markup()\n`;
                code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                code += `${bodyIndent}logging.info(f"✅ Показаны inline кнопки для узла ${targetNode.id} с collectUserInput (ожидание ввода активно)")\n`;
              } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                // Проверяем, есть ли условные сообщения
                if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                  code += `${bodyIndent}# Узел с условными сообщениями - проверяем условия\n`;
                  code += `${bodyIndent}logging.info(f"🔧 Обработка узла с условными сообщениями: ${targetNode.id}")\n`;
                  code += `${bodyIndent}user_data_dict = await get_user_from_db(user_id) or {}\n`;
                  code += `${bodyIndent}user_data_dict.update(user_data.get(user_id, {}))\n`;
                  code += `${bodyIndent}# Функция для проверки переменных пользователя (уже определена ранее)\n`;

                  // Генерируем проверку условий
                  code += `${bodyIndent}conditional_met = False\n`;

                  const sortedConditions = [...targetNode.data.conditionalMessages].sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
                  sortedConditions.forEach((condition: any, condIndex: number) => {
                    const ifKeyword = condIndex === 0 ? 'if' : 'if';

                    if (condition.condition === 'user_data_exists' && condition.variableName) {
                      code += `${bodyIndent}${ifKeyword} (\n`;
                      code += `${bodyIndent}    check_user_variable_inline("${condition.variableName}", user_data_dict)[0]\n`;
                      code += `${bodyIndent}):\n`;
                      code += `${bodyIndent}    conditional_met = True\n`;

                      // Условная клавиатура
                      if (condition.buttons && condition.buttons.length > 0) {
                        code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;
                        condition.buttons.forEach((btn: Button) => {
                          code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                        });
                        const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                        const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                        code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                        code += `${bodyIndent}    main_text = text\n`;

                        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                        code += `${bodyIndent}    # Заменяем все переменные в тексте\n`;
                        code += `${bodyIndent}    main_text = replace_variables_in_text(main_text, user_data_dict)\n`;

                        code += `${bodyIndent}    await message.answer(main_text, reply_markup=keyboard)\n`;

                        // Проверяем, нужно ли собирать ввод для условного сообщения
                        const condCollectInput = condition.collectUserInput === true || condition.waitForTextInput === true || condition.enableTextInput === true;
                        if (condCollectInput) {
                          code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id} (сбор ответов НАСТРОЕН)")\n`;
                          code += `${bodyIndent}    # Настраиваем ожидание ввода для условного сообщения\n`;
                          const condInputVariable = condition.textInputVariable || condition.inputVariable || condition.variableName || targetNode.data.inputVariable || `response_${targetNode.id}`;
                          const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;

                          // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true
                          const condSkipButtons = (condition.buttons || [])
                            .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                            .map((btn: any) => ({ text: btn.text, target: btn.target }));
                          const condSkipButtonsJson = JSON.stringify(condSkipButtons);

                          code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
                          code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
                          code += `${bodyIndent}        "type": "text",\n`;
                          code += `${bodyIndent}        "variable": "${condInputVariable}",\n`;
                          code += `${bodyIndent}        "save_to_database": True,\n`;
                          code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
                          code += `${bodyIndent}        "next_node_id": "${nextNodeAfterCondition || ''}",\n`;
                          code += `${bodyIndent}        "skip_buttons": ${condSkipButtonsJson}\n`;
                          code += `${bodyIndent}    }\n`;
                          code += `${bodyIndent}    logging.info(f"🔧 Установлено ожидание ввода для условного сообщения: {user_data[message.from_user.id]['waiting_for_input']}")\n`;
                        } else {
                          code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id} (сбор ответов НЕ настроен - кнопки ведут напрямую)")\n`;
                        }
                      }
                    }
                  });

                  // Если условие не выполнено - показываем основную клавиатуру
                  code += `${bodyIndent}if not conditional_met:\n`;
                  code += `${bodyIndent}    # Условие не выполнено - показываем основное сообщение\n`;
                  code += `${bodyIndent}    # ИСПяАВЛЕяИЕ: яя узла еять reply кнопки - показяваем их вместо ожидания тттекста\n`;
                  code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;

                  // Добавляем кнопки для reply клавиатуры
                  targetNode.data.buttons.forEach((btn: Button) => {
                    if (btn.action === "contact" && btn.requestContact) {
                      code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                    } else if (btn.action === "location" && btn.requestLocation) {
                      code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                    } else {
                      code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                    }
                  });

                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                  code += `${bodyIndent}    # Заменяем все переменные в тексте\n`;
                  code += `${bodyIndent}    text = replace_variables_in_text(text, user_vars)\n`;
                  code += `${bodyIndent}    await message.answer(text, reply_markup=keyboard)\n`;
                  code += `${bodyIndent}    logging.info(f"✅ Показана основная reply клавиатура для узла ${targetNode.id}")\n`;

                  // Настройка ожидания ввода для основной клавиатуры
                  if (targetNode.data.enableTextInput === true || targetNode.data.collectUserInput === true) {
                    // ИСПРАВЛЕНИЕ: Используем массив modes для поддержки и кнопок и тттекста
                    const hasReplyButtons = targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0;
                    const modes: string[] = [];
                    if (hasReplyButtons) modes.push('button');
                    if (targetNode.data.enableTextInput === true || !hasReplyButtons) modes.push('text');
                    const modesStr = modes.map(m => `"${m}"`).join(', ');
                    const primaryType = modes[0];

                    code += `${bodyIndent}    # Настраиваем ожидание ввода для message узла с reply кнопками\n`;
                    code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
                    code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
                    code += `${bodyIndent}        "type": "${primaryType}",\n`;
                    code += `${bodyIndent}        "modes": [${modesStr}],\n`;
                    code += `${bodyIndent}        "variable": "${inputVariable}",\n`;
                    code += `${bodyIndent}        "save_to_database": True,\n`;
                    code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
                    code += `${bodyIndent}        "next_node_id": "${inputTargetNodeId}",\n`;
                    code += `${bodyIndent}        "min_length": 0,\n`;
                    code += `${bodyIndent}        "max_length": 0,\n`;
                    code += `${bodyIndent}        "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
                    code += `${bodyIndent}        "success_message": ""\n`;
                    code += `${bodyIndent}    }\n`;
                    const modesForLog = modes.map(m => `'${m}'`).join(', ');
                    code += `${bodyIndent}    logging.info(f"✅ Состояние ожидания настроено: modes=[${modesForLog}] для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
                  }
                } else {
                  // Нет условных сообщений - стандартная обработка
                  code += `${bodyIndent}# ИСПРАВЛЕНИЕ: У узла есть reply кнопки - показываем их вместо ожидания тттекста\n`;
                  code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

                  // Добавляем кнопки для reply клавиатуры
                  targetNode.data.buttons.forEach((btn: Button) => {
                    if (btn.action === "contact" && btn.requestContact) {
                      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                    } else if (btn.action === "location" && btn.requestLocation) {
                      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                    } else {
                      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                    }
                  });

                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                  code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
                  code += `${bodyIndent}text = replace_variables_in_text(text, user_vars)\n`;
                  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                  code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для узла ${targetNode.id} с collectUserInput")\n`;

                  // ИСПРАВЛЕНИЕ: Если включен сбор ввода, настраиваем ожидание даже при наличии кнопок
                  if (targetNode.data.enableTextInput === true || targetNode.data.enablePhotoInput === true ||
                    targetNode.data.enableVideoInput === true || targetNode.data.enableAudioInput === true ||
                    targetNode.data.enableDocumentInput === true || targetNode.data.collectUserInput === true) {
                    code += `${bodyIndent}# Настраиваем ожидание ввода для message узла с reply кнопками (используем универсальную функцию)\n`;
                    if (targetNode && targetNode.data) {
                      code += generateWaitingStateCode(targetNode, bodyIndent);
                    }
                  }
                }
              } else {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
                code += `${bodyIndent}text = replace_variables_in_text(text, user_vars)\n`;
                code += `${bodyIndent}await message.answer(text)\n`;

                // Настраиваем ожидание ввода ТОЛЬКО если нет кнопок (используем универсальную функцию)
                code += `${bodyIndent}# Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)\n`;
                if (targetNode && targetNode.data) {
                  code += generateWaitingStateCode(targetNode, bodyIndent);
                }
              }
            } else {
              // Если узел не собирает ввод, проверяем есть ли inline или reply кнопки
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += `${bodyIndent}# Создаем inline клавиатуру\n`;
                code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

                // Добавляем кнопки
                targetNode.data.buttons.forEach((btn: Button) => {
                  if (btn.action === "goto" && btn.target) {
                    const callbackData = `${btn.target}`;
                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === "url" && btn.url) {
                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
                  } else if (btn.action === "command" && btn.target) {
                    // КРИТИЧяяСКОЕ ИСПРАВЛЕНИЕ: Добавляем яоддержку кнопок команд
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `${bodyIndent}logging.info(f"Создана кнопка команды: ${btn.text} -> ${commandCallback}")\n`;
                    code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });

                // ВОССТАНОВ��ЕНИЕ: Добав��яем ум��ое р���сположение кнопок по колонкам
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `${bodyIndent}builder.adjust(${columns})\n`;
                code += `${bodyIndent}keyboard = builder.as_markup()\n`;
                code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
              } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += `${bodyIndent}# Создаем reply клавиатуру\n`;
                code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

                // Добавляем кнопки для reply клавиатуры
                targetNode.data.buttons.forEach((btn: Button) => {
                  if (btn.action === "contact" && btn.requestContact) {
                    code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                  } else if (btn.action === "location" && btn.requestLocation) {
                    code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                  } else {
                    code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                  }
                });

                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
                code += `${bodyIndent}text = replace_variables_in_text(text, user_vars)\n`;
                code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для переходного узла")\n`;
              } else {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
                code += `${bodyIndent}text = replace_variables_in_text(text, user_vars)\n`;
                code += `${bodyIndent}await message.answer(text)\n`;
              }

              // Очищаем состояние ожидания ввода после успешного перехода для message узлов без сбора ввода
              if (!targetNode.data.collectUserInput) {
                code += `${bodyIndent}# НЕ отправляем сообщение об успехе здесь - это делается в старом формате\n`;
                code += `${bodyIndent}# Очищаем сястояние ожидания ввода после уяпеянояо перехода\n`;
                code += `${bodyIndent}if "waiting_for_input" in user_data[user_id]:\n`;
                code += `${bodyIndent}    del user_data[user_id]["waiting_for_input"]\n`;
                code += `${bodyIndent}\n`;
                code += `${bodyIndent}logging.info("✅ Переход к следующему уялу выполнен успешно")\n`;
              }

              // АВТОПЕРЕХОД: Если у узля есть autoTransitionTo, сразу вызываем callback обработчик
              if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                // Проверяяям, нужно ли выполнять автопереход - только если collectUserInput=true
                if (targetNode.data.collectUserInput !== false) {
                  const autoTargetId = targetNode.data.autoTransitionTo;
                  const autoSafeFunctionName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
                  code += `${bodyIndent}\n`;
                  code += `${bodyIndent}# ⚡ Автопереход к узлу ${autoTargetId} (только если collectUserInput=true)\n`;
                  code += `${bodyIndent}logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                  code += `${bodyIndent}import types as aiogram_types\n`;
                  code += `${bodyIndent}async def noop(*args, **kwargs):\n`;
                  code += `${bodyIndent}    return None\n`;
                  code += `${bodyIndent}fake_message = aiogram_types.SimpleNamespace(\n`;
                  code += `${bodyIndent}    chat=aiogram_types.SimpleNamespace(id=message.from_user.id),\n`;
                  code += `${bodyIndent}    message_id=message.message_id,\n`;
                  code += `${bodyIndent}    delete=noop,\n`;
                  code += `${bodyIndent}    edit_text=noop,\n`;
                  code += `${bodyIndent}    answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)\n`;
                  code += `${bodyIndent})\n`;
                  code += `${bodyIndent}fake_callback = aiogram_types.SimpleNamespace(\n`;
                  code += `${bodyIndent}    id="auto_transition",\n`;
                  code += `${bodyIndent}    from_user=message.from_user,\n`;
                  code += `${bodyIndent}    chat_instance="",\n`;
                  code += `${bodyIndent}    data="${autoTargetId}",\n`;
                  code += `${bodyIndent}    message=fake_message,\n`;
                  code += `${bodyIndent}    answer=noop\n`;
                  code += `${bodyIndent})\n`;
                  code += `${bodyIndent}await handle_callback_${autoSafeFunctionName}(fake_callback)\n`;
                } else {
                  code += `${bodyIndent}# Автопереход пропущен: collectUserInput=false\n`;
                  code += `${bodyIndent}logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                  code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
                }
              } else {
                code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
              }
            }
          } // Закрываем блок else для allowMultipleSelection
        } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
          const inputPrompt = formatTextForPython(targetNode.data.messageText || "Введите ваш ответ:");
          code += `${bodyIndent}prompt_text = ${inputPrompt}\n`;
          code += `${bodyIndent}await message.answer(prompt_text)\n`;

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяяям collectUserInput перед установкой waiting_for_input
          const msgNodeCollectInput = targetNode.data.collectUserInput === true ||
            targetNode.data.enableTextInput === true ||
            targetNode.data.enablePhotoInput === true ||
            targetNode.data.enableVideoInput === true ||
            targetNode.data.enableAudioInput === true ||
            targetNode.data.enableDocumentInput === true;

          if (msgNodeCollectInput) {
            code += `${bodyIndent}# Устанавливаея нояяое ожидание ввода (collectUserInput=true)\n`;
            code += `${bodyIndent}user_data[user_id]["waiting_for_input"] = {\n`;
            code += `${bodyIndent}    "type": "${targetNode.data.inputType || 'text'}",\n`;
            code += `${bodyIndent}    "variable": "${targetNode.data.inputVariable || 'user_response'}",\n`;
            code += `${bodyIndent}    "save_to_database": True,\n`;
            code += `${bodyIndent}    "node_id": "${targetNode.id}",\n`;
            const nextConnection = connections.find(conn => conn.source === targetNode.id);
            if (nextConnection) {
              code += `${bodyIndent}    "next_node_id": "${nextConnection.target}",\n`;
            } else {
              code += `${bodyIndent}    "next_node_id": None,\n`;
            }
            code += `${bodyIndent}    "min_length": ${targetNode.data.minLength || 0},\n`;
            code += `${bodyIndent}    "max_length": ${targetNode.data.maxLength || 0},\n`;
            code += `${bodyIndent}    "retry_message": "Пожаляйста, попробуйте еще раз.",\n`;
            code += `${bodyIndent}    "success_message": ""\n`;
            code += `${bodyIndent}}\n`;
          } else {
            code += `${bodyIndent}# Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
          }
          code += `${bodyIndent}break  # Выходим из цикла после настройки ожидания ввода\n`;
        } else if (targetNode.type === 'command') {
          // Для узлов команд яызываем соответствующий обработчик
          const commandName = targetNode.data.command?.replace('/', '') || 'unknown';
          const handlerName = `${commandName}_handler`;
          code += `${bodyIndent}# Выполняяем команду ${targetNode.data.command}\n`;
          code += `${bodyIndent}from types import SimpleNamespace\n`;
          code += `${bodyIndent}fake_message = SimpleNamespace()\n`;
          code += `${bodyIndent}fake_message.from_user = message.from_user\n`;
          code += `${bodyIndent}fake_message.chat = message.chat\n`;
          code += `${bodyIndent}fake_message.date = message.date\n`;
          code += `${bodyIndent}fake_message.answer = message.answer\n`;
          code += `${bodyIndent}await ${handlerName}(fake_message)\n`;
          code += `${bodyIndent}break  # Выходим из цикла после вяполяеняя команды\n`;
        } else {
          code += `${bodyIndent}logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
          code += `${bodyIndent}break  # Выходим из цикла для неизвестного типа узла\n`;
        }
      });

      code += '                        else:\n';
      code += '                            logging.warning(f"Неизвестный узел: {current_node_id}")\n';
      code += '                            break  # Выходим из цикла при неизвестном узле\n';
    } else {
      code += '                        # No nodes available for navigation\n';
      code += '                        logging.warning(f"Нет доступных узлов для навигации")\n';
      code += '                        break\n';
    }

    code += '                except Exception as e:\n';
    code += '                    logging.error(f"Ошибка при переходе к узлу: {e}")\n';
    code += '            \n';
    code += '            return  # Завершаем обработку для нового формата\n';
    code += '        \n';
    code += '        # Обработка старого формата (для совместимости)\n';
    code += '        # Находим узел для получения настроек\n';

    // Генерируем проверку для каждого узла с универсальным сбором ввода (старый формат)
    const inputNodes = (nodes || []).filter(node => node.data.collectUserInput);
    code += `        logging.info(f"DEBUG old format: checking inputNodes: ${inputNodes.map(n => n.id).join(', ')}")\n`;
    inputNodes.forEach((node, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      code += `        ${condition} waiting_node_id == "${node.id}":\n`;

      // Добавляем валидацию если есть
      if (node.data.inputValidation) {
        if (node.data.minLength && node.data.minLength > 0) {
          code += `            if len(user_text) < ${node.data.minLength}:\n`;
          code += `                await message.answer("❌ Слишком короткий ответ (минимум ${node.data.minLength} символов). Попробуйте еще раз.")\n`;
          code += `                return\n`;
        }
        if (node.data.maxLength && node.data.maxLength > 0) {
          code += `            if len(user_text) > ${node.data.maxLength}:\n`;
          code += `                await message.answer("❌ Слишком длинный ответ (максимум ${node.data.maxLength} символов). Попробуйте еще раз.")\n`;
          code += `                return\n`;
        }
      }

      // Валидация типа ввода
      if (node.data.inputType === 'email') {
        code += `            import re\n`;
        code += `            email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n`;
        code += `            if not re.match(email_pattern, user_text):\n`;
        code += `                await message.answer("❌ Неверный формат email. Попробуйте еще раз.")\n`;
        code += `                return\n`;
      } else if (node.data.inputType === 'number') {
        code += `            try:\n`;
        code += `                float(user_text)\n`;
        code += `            except ValueError:\n`;
        code += `                await message.answer("❌ Введите корректное число. Попробуйте еще раз.")\n`;
        code += `                return\n`;
      } else if (node.data.inputType === 'phone') {
        code += `            import re\n`;
        code += `            phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n`;
        code += `            if not re.match(phone_pattern, user_text):\n`;
        code += `                await message.answer("❌ Неверный формат телефона. Попробуйте еще раз.")\n`;
        code += `                return\n`;
      }

      // Сохранение ответа
      const variableName = node.data.inputVariable || 'user_response';
      code += `            \n`;
      code += `            # Сохраняем ответ пользователя\n`;
      code += `            import datetime\n`;
      code += `            timestamp = get_moscow_time()\n`;
      code += `            \n`;
      code += `            # Сохраняем простое значение для совместимости с логикой профиля\n`;
      code += `            response_data = user_text  # Простое значение вместо сложного объекта\n`;
      code += `            \n`;
      code += `            # Сохраняем в пользовательские данные\n`;
      code += `            user_data[user_id]["${variableName}"] = response_data\n`;
      code += `            \n`;

      // Сохранение в базу данных (всегда включено для collectUserInput)
      code += `            # Сохраняем в базу данных\n`;
      code += `            saved_to_db = await update_user_data_in_db(user_id, "${variableName}", response_data)\n`;
      code += `            if saved_to_db:\n`;
      code += `                logging.info(f"✅ Данные сохранены в БД: ${variableName} = {user_text} (пользователь {user_id})")\n`;
      code += `            else:\n`;
      code += `                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
      code += `            \n`;

      code += `            \n`;
      code += `            logging.info(f"Получен пользовательский ввод: ${variableName} = {user_text}")\n`;
      code += `            \n`;

      // Навигация к следующему узлу
      if (node.data.inputTargetNodeId) {
        code += `            # Переходим к следующему узлу\n`;
        code += `            try:\n`;

        // Найдем целевой узел для навигации
        const targetNode = nodes.find(n => n.id === node.data.inputTargetNodeId);
        if (targetNode) {
          if (targetNode.type === 'message') {
            // Для message узлов отправляем сообщение напрямую
            const messageText = targetNode.data.messageText || 'Выберите действие';
            const formattedText = formatTextForPython(messageText);
            code += `                # Отправляем сообщение для узла ${targetNode.id}\n`;
            code += `                text = ${formattedText}\n`;

            // Если целевой узел тоже собирает ввод, настраиваем новое ожидание
            if (targetNode.data.collectUserInput === true) {
              const nextInputType = targetNode.data.inputType || 'text';
              const nextInputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const nextInputTargetNodeId = targetNode.data.inputTargetNodeId;

              code += `                # Настраиваем новое ожидание ввода для узла ${targetNode.id}\n`;
              code += `                user_data[user_id]["waiting_for_input"] = {\n`;
              code += `                    "type": "${nextInputType}",\n`;
              code += `                    "variable": "${nextInputVariable}",\n`;
              code += `                    "save_to_database": True,\n`;
              code += `                    "node_id": "${targetNode.id}",\n`;
              code += `                    "next_node_id": "${nextInputTargetNodeId || ''}",\n`;
              code += `                    "min_length": 0,\n`;
              code += `                    "max_length": 0,\n`;
              code += `                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
              code += `                    "success_message": ""\n`;
              code += `                }\n`;
              code += `                \n`;
            }

            if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              // Используем универсальную функцию для создания inline клавиатуры
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += `                # Заменяем все переменные в тексте\n`;
              code += `                text = replace_variables_in_text(text, user_vars)\n`;
              code += `                await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
              code += `                # Заменяем все переменные в тексте\n`;
              code += `                text = replace_variables_in_text(text, user_vars)\n`;
              code += `                await message.answer(text)\n`;
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем состояние ТОЛЬКО если целевой узел НЕ собирает ввод
            if (!targetNode.data.collectUserInput) {
              code += `                # Очищаем состояние ожидания ввода после успешного перехода\n`;
              code += `                if "waiting_for_input" in user_data[user_id]:\n`;
              code += `                    del user_data[user_id]["waiting_for_input"]\n`;
              if (node.data.inputType) {
                code += `                if "input_type" in user_data[user_id]:\n`;
                code += `                    del user_data[user_id]["input_type"]\n`;
              }
            }
            code += `                \n`;
            code += `                logging.info("✅ Переход к следующему узлу выполнен успешно")\n`;
          } else {
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
            if (targetNode.data.allowMultipleSelection === true) {
              // Для узлов с множественным выбором создаем прямую навигацию
              const messageText = targetNode.data.messageText || 'Сообщение';
              const formattedText = formatTextForPython(messageText);
              code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
              code += `                text = ${formattedText}\n`;

              // Замена переменных
              code += '                user_data[user_id] = user_data.get(user_id, {})\n';
              code += generateUniversalVariableReplacement('                ');

              // Инициализируем состояние множественного выбора
              code += `                # Инициализируем состояние множественного выбора\n`;
              code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
              code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
              code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
              if (targetNode.data.multiSelectVariable) {
                code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
              }

              // Создаем inline клавиатуру с кнопками выбора
              if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                code += `                # Заменяем все переменные в тексте\n`;
                code += `                text = replace_variables_in_text(text, user_vars)\n`;
                code += `                await message.answer(text, reply_markup=keyboard)\n`;
              } else {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обязательно вызываем замену переменных в тексте
                code += `                # Заменяем все переменные в тексте\n`;
                code += `                text = replace_variables_in_text(text, user_vars)\n`;
                code += `                await message.answer(text)\n`;
              }
              code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
            } else {
              // Для обычных узлов используем обычную навигацию
              const messageText = targetNode.data.messageText || 'Сообщение';
              const formattedText = formatTextForPython(messageText);
              code += `                # Обычный узел - отправляем сообщение\n`;
              code += `                text = ${formattedText}\n`;

              // Добавляем замену переменных
              code += '                user_data[user_id] = user_data.get(user_id, {})\n';
              code += generateUniversalVariableReplacement('                ');

              // Создаем inline клавиатуру если есть кнопки
              if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                code += `                await message.answer(text, reply_markup=keyboard)\n`;
              } else {
                code += '                await message.answer(text)\n';
              }
              code += `                logging.info(f"✅ Ввод навигация к обычному узлу: ${targetNode.id}")\n`;
            }
          }
        } else {
          // Если целевой узел не найден, добавляем заглушку
          code += `                logging.warning(f"Целево�� узел {node.data.inputTargetNodeId} не найде��")\n`;
          code += `                await message.answer("❌ Ошибка перехода: целевой узел не найден")\n`;
        }

        code += `            except Exception as e:\n`;
        code += `                logging.error(f"Ошябка при переходе к следующему узлу: {e}")\n`;
        code += `            return\n`;
      } else {
        // Если inputTargetNodeId равен null, это конец цепочки - это нормально
        code += `            # Конец цепочки ввода - завершаем обработку\n`;
        code += `            logging.info("Завершена цепочка сбора пользовательских данных")\n`;
        code += `            return\n`;
      }
    });

    generateAdHocInputCollectionHandler();

    // Добавляем навигацию к целевому узлу
    const navigationCode = generateContinuationLogicForButtonBasedInput();
    // Генерируем обработчики для медиа-файлов
    if (hasPhotoInput(nodes || [])) {
      let photoCode = generatePhotoHandlerCode();
      photoCode = photoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
      code += photoCode;
    }
    if (hasVideoInput(nodes || [])) {
      let videoCode = generateVideoHandlerCode();
      videoCode = videoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
      code += videoCode;
    }
    if (hasAudioInput(nodes || [])) {
      let audioCode = generateAudioHandlerCode();
      audioCode = audioCode.replace('            # (зде��ь будет сгенерированный код навигации)', navigationCode);
      code += audioCode;
    }
    if (hasDocumentInput(nodes || [])) {
      let docCode = generateDocumentHandlerCode();
      docCode = docCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
      code += docCode;
    }


    generateUserInputValidationAndContinuationLogic();

    // ��енерируем логику навигации для каждого типа узла
    generateStateTransitionAndRenderLogic();
  }
  return code;
}
