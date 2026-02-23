import { answersave } from './answersave';
import { generateDatabaseVariablesCode } from './Broadcast/generateDatabaseVariables';
import { handleConditionalNavigationAndInputCollection } from './handleConditionalNavigationAndInputCollection';
import { handleNodeNavigationAndInputProcessing } from './handleNodeNavigationAndInputProcessing';
import { generateReplyHideAfterClickHandler } from './Keyboard/generateReplyHideAfterClickHandler';
import { mediafiles } from './MediaHandler/mediafiles';
import { multiselectcheck } from './multiselectcheck';
import { navigateaftersave } from './navigateaftersave';
import { processUserInputWithValidationAndSave } from './processUserInputWithValidationAndSave';
import { skip_button_target, skipDataCollection, skipDataCollectionnavigate } from './skipDataCollection';
import { generateUniversalVariableReplacement } from './utils';
import { hasInputCollection } from './utils/hasInputCollection';

// Функция для проверки наличия кнопок с URL-ссылками
function hasUrlButtons(nodes: any[]): boolean {
  for (const node of nodes) {
    if (node.data?.buttons && Array.isArray(node.data.buttons)) {
      for (const button of node.data.buttons) {
        if (button.action === 'url' && button.url) {
          return true;
        }
      }
    }
  }
  return false;
}

export function newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(nodes: any[], code: string, allNodeIds: any[], connections: any[], generateAdHocInputCollectionHandler: () => void, generateContinuationLogicForButtonBasedInput: () => string, generateUserInputValidationAndContinuationLogic: () => void, generateStateTransitionAndRenderLogic: () => void) {
  // Проверяем, есть ли кнопки с URL-ссылками в проекте
  const hasUrlButtonsInProject = hasUrlButtons(nodes);

  if (hasInputCollection(nodes || [])) {
    code += '\n\n# Универсальный обработчик пользовательского ввода\n';
    code += '@dp.message(F.text)\n';
    code += 'async def handle_user_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    \n';
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ', true);
    code += universalVarCodeLines.join('\n');
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
    code = skipDataCollection(code);

    /**
     * Навигация при нажатии кнопки пропуска
     * Очищает состояние ожидания и переходит к целевому узлу кнопки
     */
    code = skip_button_target(code);

    // Генерируем навигацию для кнопок skipDataCollection
    code = skipDataCollectionnavigate(nodes, code);

    code += '            except Exception as e:\n';
    code += '                logging.error(f"Ошибка при переходе к узлу кнопки skipDataCollection {skip_button_target}: {e}")\n';
    code += '            return\n';
    /**
     * Сохранение ответа пользователя
     * Сохраняет введенный текст в пользовательские данные и базу данных
     * с поддержкой автоматического именования переменных
     */
    code = answersave(code);

    /**
     * Навигация после сохранения ответа
     * Переходит к следующему узлу если указан, с поддержкой команд
     */
    code = navigateaftersave(code);

    code = handleConditionalNavigationAndInputCollection(nodes, code, allNodeIds);

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
    if (hasUrlButtonsInProject) {
      code += '            if option_action == "url" and option_url:\n';
      code += '                # Открытие ссылки\n';
      code += '                url = option_url\n';
      code += '                keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
      code += '                    [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]\n';
      code += '                ])\n';
      code += '                await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)\n';
      code += '            elif option_action == "command" and option_target:\n';
    } else {
      code += '            if option_action == "command" and option_target:\n';
    }

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
        // Проверяем, существует ли целевой узел перед вызовом обработчика
        const targetExists = nodes.some(n => n.id === btnNode.id);
        if (targetExists) {
          code += `                        await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))\n`;
        } else {
          code += `                        logging.warning(f"⚠️ Целевой узел не найден: {btnNode.id}, завершаем переход")\n`;
          code += `                        await message.answer("Переход завершен")\n`;
        }
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
        // Проверяем, существует ли целевой узел перед вызовом обработчика
        const targetExists = nodes.some(n => n.id === btnNode.id);
        if (targetExists) {
          code += `                            await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))\n`;
        } else {
          code += `                            logging.warning(f"⚠️ Целевой узел не найден: {btnNode.id}, завершаем переход")\n`;
          code += `                            await message.answer("Переход завершен")\n`;
        }
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
    code += '                            answer=lambda *args, **kwargs: asyncio.sleep(0)\n';
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
     * Проверка состояния множественного выбора
     * Сначала проверяем, находится ли пользователь в режиме множественного выбора
     * Если да, передаем управление специальному обработчику
     */
    code = multiselectcheck(code, nodes, allNodeIds);
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

    // Добавляем получение переменных из БД перед обработкой
    code += '        \n';
    code += '        # Получаем переменные из базы данных (user_ids_list, user_ids_count)\n';
    code += generateDatabaseVariablesCode('        ');
    code += '        \n';

    /**
     * Обработка различных форматов конфигурации
     * Поддерживает новый формат (словарь) и старый формат (строка) для обzzатной совместимости
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
     * Если ожидается медиа-файл, текстовый обработчиzzzzzzzzzzzzzzzz должен проигнорировать сообщение
     */
    code += '            # ИСПРАВЛЕНИЕ: Проверяем, является ли тип ввода медиа (фото, видео, аудио, документ)\n';
    code += '            # Если да, то текстовый обработчик не должен его обрабатывать\n';
    code += '            if input_type in ["photo", "video", "audio", "document"]:\n';
    code += '                logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")\n';
    code += '                return\n';
    code += '        else:\n';
    code += '            # Старый формат - waiting_config эzzо строка с node_id\n';
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
    code += '                                answer=lambda *args, **kwargs: asyncio.sleep(0)\n';
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
     * Сохранение ID в таблицу user_ids для рассылки
     * Если узел имеет saveToUserIds=true, сохраняем ID в отдельную таблицу
     */
    code += '            # Сохранение ID в таблицу user_ids для рассылки\n';
    code += '            if waiting_node_id == "BMsBsZJr-pWxjMB_rl33z":  # Узел добавления ID\n';
    code += '                try:\n';
    code += '                    async with db_pool.acquire() as conn:\n';
    code += '                        await conn.execute(\n';
    code += '                            """\n';
    code += '                            INSERT INTO user_ids (user_id, source)\n';
    code += '                            VALUES ($1, $2)\n';
    code += '                            ON CONFLICT (user_id) DO NOTHING\n';
    code += '                            """,\n';
    code += '                            int(user_text),\n';
    code += "                            'bot'\n";
    code += '                        )\n';
    code += '                        logging.info(f"✅ ID {user_text} вставлен в таблицу user_ids")\n';
    code += '                except ValueError:\n';
    code += '                    logging.error(f"❌ Ошибка: введённое значение не является числом: {user_text}")\n';
    code += '                except Exception as e:\n';
    code += '                    logging.error(f"❌ Ошибка сохранения ID в базу: {e}")\n';
    code += '            \n';

    /**
     * Сохранение ID в CSV файл
     * Если узел имеет saveToCsv=true, записываем ID в CSV файл проекта
     */
    code += '            # Сохранение ID в CSV файл для рассылки\n';
    code += '            try:\n';
    code += '                import os\n';
    code += '                # Путь к файлу CSV в папке проекта\n';
    code += '                # PROJECT_DIR уже определён как папка проекта (например, bots/импортированный_проект_0312_40_35)\n';
    code += '                csv_file = os.path.join(PROJECT_DIR, \'user_ids.csv\')\n';
    code += '                # Проверяем, есть ли уже такой ID в файле\n';
    code += '                id_exists = False\n';
    code += '                if os.path.exists(csv_file):\n';
    code += '                    with open(csv_file, \'r\', encoding=\'utf-8\') as f:\n';
    code += '                        existing_ids = [line.strip() for line in f if line.strip()]\n';
    code += '                        if str(user_text).strip() in existing_ids:\n';
    code += '                            id_exists = True\n';
    code += '                            logging.info(f"⚠️ ID {user_text} уже есть в CSV, пропускаем")\n';
    code += '                # Записываем ID в файл (один ID в строке)\n';
    code += '                if not id_exists:\n';
    code += '                    with open(csv_file, \'a\', encoding=\'utf-8\') as f:\n';
    code += '                        f.write(f"{user_text}\\n")\n';
    code += '                    logging.info(f"✅ ID {user_text} записан в CSV файл: {csv_file}")\n';
    code += '            except Exception as e:\n';
    code += '                logging.error(f"❌ Ошибка записи в CSV: {e}")\n';
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
    code = handleNodeNavigationAndInputProcessing(nodes, code, conditionIndent, bodyIndent, allNodeIds, connections);

    code += '                except Exception as e:\n';
    code += '                    logging.error(f"Ошибка при переходе к узлу: {e}")\n';
    code += '            \n';
    code += '            return  # Завершаем обработку для нового формата\n';
    code += '        \n';
    code += '        # Обработка старого формата (для совместимости)\n';
    code += '        # Находим узел для получения настроек\n';

    // Генерируем проверку для каждого узла с универсальным сбором ввода (старый формат)
    code = processUserInputWithValidationAndSave(nodes, code, allNodeIds);

    generateAdHocInputCollectionHandler();

    // Добавляем навигацию к целевому узлу
    const navigationCode = generateContinuationLogicForButtonBasedInput();
    // Генерируем обработчики для медиа-файлов
    code = mediafiles(nodes, navigationCode, code);


    generateUserInputValidationAndContinuationLogic();

    // zzенерируем логику навигации для каждого типа узла
    generateStateTransitionAndRenderLogic();
  }
  return code;
}





