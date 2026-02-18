import { Node } from '@shared/schema';

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ГЕНЕРАЦИИ
// ============================================================================

// Тип для опций ответа
interface ResponseOption {
  text: string;
  value?: string;
  action?: string;
  target?: string;
  url?: string;
}

/*************  ✨ Windsurf Command 🌟  *************/
/**
 * Генерирует обработчики для кнопочных ответов
 *
 * Зависимости в генерируемом коде:
 * - types: из aiogram.types
 * - user_data: глобальная переменная для хранения данных пользователей
 * - get_moscow_time(): функция получения времени в часовом поясе Москвы
 * - update_user_data_in_db(): асинхронная функция обновления данных пользователя в БД
 * - logging: модуль логирования
 * - handle_callback_*: обработчики для других callback кнопок
 * - start_handler и другие обработчики команд
 */
// Функция для проверки наличия кнопок с URL-ссылками
function hasUrlButtons(nodes: Node[]): boolean {
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

export function generateButtonResponseHandlers(code: string, userInputNodes: Node[], nodes: Node[]): string {
  // Проверяем, есть ли кнопки с URL-ссылками в проекте
  const hasUrlButtonsInProject = hasUrlButtons(nodes);

  userInputNodes.forEach(node => {
    const responseOptions = node.data.responseOptions || [];

    // Обработчики для каждого варианта ответа
    responseOptions.forEach((option, index: number) => {
      // Нормализуем option к объекту ResponseOption
      const normalizedOption: ResponseOption = typeof option === 'string'
        ? { text: option, value: option }
        : option as ResponseOption;

      code += `\n@dp.callback_query(F.data == "response_${node.id}_${index}")\n`;
      const safeFunctionName = `${node.id}_${index}`.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `async def handle_response_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
      code += '    user_id = callback_query.from_user.id\n';
      code += '    \n';
      code += '    # Проверяем настройки кнопочного ответа\n';
      code += '    if user_id not in user_data or "button_response_config" not in user_data[user_id]:\n';
      code += '        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)\n';
      code += '        return\n';
      code += '    \n';
      code += '    config = user_data[user_id]["button_response_config"]\n';
      code += `    selected_value = "${normalizedOption.value || normalizedOption.text}"\n`;
      code += `    selected_text = "${normalizedOption.text}"\n`;
      code += '    \n';
      code += '    # Обработка множественного выбора\n';
      code += '    if config.get("allow_multiple"):\n';
      code += '        # Проверяем, является ли это кнопкой "Готово" для завершения выбора\n';
      code += '        if selected_value == "done":\n';
      code += '            # Завершаем множественный выбор\n';
      code += '            if len(config["selected"]) > 0:\n';
      code += '                # Сохраняем все выбранные элементы\n';
      code += '                variable_name = config.get("variable", "user_response")\n';
      code += '                import datetime\n';
      code += '                timestamp = get_moscow_time()\n';
      code += '                node_id = config.get("node_id", "unknown")\n';
      code += '                \n';
      code += '                # Создаем структурированный ответ для множественного выбора\n';
      code += '                response_data = {\n';
      code += '                    "value": [item["value"] for item in config["selected"]],\n';
      code += '                    "text": [item["text"] for item in config["selected"]],\n';
      code += '                    "type": "multiple_choice",\n';
      code += '                    "timestamp": timestamp,\n';
      code += '                    "nodeId": node_id,\n';
      code += '                    "variable": variable_name\n';
      code += '                }\n';
      code += '                \n';
      code += '                # Сохраняем в пользовательские данные\n';
      code += '                user_data[user_id][variable_name] = response_data\n';
      code += '                \n';
      code += '                # Сохраняем в базу данных если включено\n';
      code += '                if config.get("save_to_database"):\n';
      code += '                    saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
      code += '                    if saved_to_db:\n';
      code += '                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data[\'text\']} (пользователь {user_id})")\n';
      code += '                    else:\n';
      code += '                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
      code += '                \n';
      code += '                # Отправляем сообщение об успехе\n';
      code += '                success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
      code += '                selected_items = ", ".join([item["text"] for item in config["selected"]])\n';
      code += '                await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_items}")\n';
      code += '                \n';
      code += '                logging.info(f"Получен множественный выбор: {variable_name} = {[item[\'text\'] for item in config[\'selected\']]}")\n';
      code += '                \n';
      code += '                # Очищаем состояние\n';
      code += '                del user_data[user_id]["button_response_config"]\n';
      code += '                \n';
      code += '                # Автоматическая навигация к следующему узлу\n';
      code += '                next_node_id = config.get("next_node_id")\n';
      code += '                if next_node_id:\n';
      code += '                    try:\n';
      code += '                        # Вызываем обработчик для следующего узла\n';

      // Добавляем навигацию для кнопки готово
      if (nodes.length > 0) {
        nodes.forEach((btnNode, btnIndex) => {
          const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          const condition = btnIndex === 0 ? 'if' : 'elif';
          code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
          // Проверяем, существует ли целевой узел перед вызовом обработчика
          const targetExists = nodes.some(n => n.id === btnNode.id);
          if (targetExists) {
            code += `                            await handle_callback_${safeFunctionName}(callback_query)\n`;
          } else {
            code += `                            logging.warning(f"⚠️ Целевой узел не найден: {btnNode.id}, завершаем переход")\n`;
            code += `                            await callback_query.message.edit_text("Переход завершен")\n`;
          }
        });

        code += '                        else:\n';
        code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
      } else {
        code += '                        # No nodes available for navigation\n';
        code += '                        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
      }
      code += '                    except Exception as e:\n';
      code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
      code += '                return\n';
      code += '            else:\n';
      code += '                # Если ничего не выбрано, показываем предупреждение\n';
      code += '                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)\n';
      code += '                return\n';
      code += '        else:\n';
      code += '            # Обычная логика множественного выбора\n';
      code += '            if selected_value not in config["selected"]:\n';
      code += '                config["selected"].append({"text": selected_text, "value": selected_value})\n';
      code += '                await callback_query.answer(f"✅ Выбрано: {selected_text}")\n';
      code += '            else:\n';
      code += '                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]\n';
      code += '                await callback_query.answer(f"❌ Убрано: {selected_text}")\n';
      code += '            return  # Не завершаем сбор, позволяем выбрать еще\n';
      code += '    \n';
      code += '    # Сохраняем одиночный выбор\n';
      code += '    variable_name = config.get("variable", "user_response")\n';
      code += '    import datetime\n';
      code += '    timestamp = get_moscow_time()\n';
      code += '    node_id = config.get("node_id", "unknown")\n';
      code += '    \n';
      code += '    # Создаем структурированный ответ\n';
      code += '    response_data = {\n';
      code += '        "value": selected_value,\n';
      code += '        "text": selected_text,\n';
      code += '        "type": "button_choice",\n';
      code += '        "timestamp": timestamp,\n';
      code += '        "nodeId": node_id,\n';
      code += '        "variable": variable_name\n';
      code += '    }\n';
      code += '    \n';
      code += '    # Сохраняем в пользовательские данные\n';
      code += '    user_data[user_id][variable_name] = response_data\n';
      code += '    \n';
      code += '    # Сохраняем в базу данных если включено\n';
      code += '    if config.get("save_to_database"):\n';
      code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
      code += '        if saved_to_db:\n';
      code += '            logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
      code += '        else:\n';
      code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
      code += '    \n';
      code += '    # Отправляем сообщение об успехе\n';
      code += '    success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
      code += '    await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}")\n';
      code += '    \n';
      code += '    # Очищаем состояние\n';
      code += '    del user_data[user_id]["button_response_config"]\n';
      code += '    \n';
      code += '    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")\n';
      code += '    \n';
      code += '    # Навигация на основе индивидуальных настроек кнопки\n';
      code += '    # Находим настройки для этого конкретного варианта ответа\n';
      code += '    options = config.get("options", [])\n';
      code += `    current_option = None\n`;
      code += `    for option in options:\n`;
      code += `        if option.get("callback_data") == "response_${node.id}_${index}":\n`;
      code += `            current_option = option\n`;
      code += `            break\n`;
      code += '    \n';
      code += '    if current_option:\n';
      code += '        option_action = current_option.get("action", "goto")\n';
      code += '        option_target = current_option.get("target", "")\n';
      code += '        option_url = current_option.get("url", "")\n';
      code += '        \n';

      // Добавляем обработку URL-ссылок только если в проекте есть такие кнопки
      if (hasUrlButtonsInProject) {
        code += '        if option_action == "url" and option_url:\n';
        code += '            # Открываем ссылку\n';
        code += '            keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
        code += '                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]\n';
        code += '            ])\n';
        code += '            await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)\n';
        code += '        elif option_action == "command" and option_target:\n';
      } else {
        code += '        if option_action == "command" and option_target:\n';
      }
      code += '            # Выполняем команду\n';
      code += '            command = option_target\n';
      code += '            if not command.startswith("/"):\n';
      code += '                command = "/" + command\n';
      code += '            \n';
      code += '            # Создаем фиктивное сообщение для выполнения команды\n';
      code += '            import aiogram.types as aiogram_types\n';
      code += '            fake_message = aiogram_types.SimpleNamespace(\n';
      code += '                from_user=callback_query.from_user,\n';
      code += '                chat=callback_query.message.chat,\n';
      code += '                text=command,\n';
      code += '                message_id=callback_query.message.message_id\n';
      code += '            )\n';
      code += '            \n';

      // Добавляем обработку различных команд для button responses
      const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
      commandNodes.forEach((cmdNode, cmdIndex) => {
        const condition = cmdIndex === 0 ? 'if' : 'elif';
        code += `            ${condition} command == "${cmdNode.data.command}":\n`;
        code += `                try:\n`;
        code += `                    await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
        code += `                except Exception as e:\n`;
        code += `                    logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
      });
      if (commandNodes.length > 0) {
        code += `            else:\n`;
        code += `                logging.warning(f"Неизвестная команда: {command}")\n`;
      }
      code += '        elif option_action == "goto" and option_target:\n';
      code += '            # Переход к узлу\n';
      code += '            target_node_id = option_target\n';
      code += '            try:\n';
      code += '                # Вызываем обработчик для целевого узла\n';

      // Генерируем логику навигации для ответов на кнопки
      if (nodes.length > 0) {
        nodes.forEach((btnNode, btnIndex) => {
          const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          const condition = btnIndex === 0 ? 'if' : 'elif';
          code += `                ${condition} target_node_id == "${btnNode.id}":\n`;
          // Проверяем, существует ли целевой узел перед вызовом обработчика
          const targetExists = nodes.some(n => n.id === btnNode.id);
          if (targetExists) {
            code += `                    await handle_callback_${safeFunctionName}(callback_query)\n`;
          } else {
            code += `                    logging.warning(f"⚠️ Целевой узел не найден: {btnNode.id}, завершаем переход")\n`;
            code += `                    await callback_query.message.edit_text("Переход завершен")\n`;
          }
        });
        code += '                else:\n';
        code += '                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
      } else {
        code += '                pass  # No nodes to handle\n';
      }
      code += '            except Exception as e:\n';
      code += '                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
      code += '    else:\n';
      code += '        # Fallback к старой системе next_node_id если нет настроек кнопки\n';
      code += '        next_node_id = config.get("next_node_id")\n';
      code += '        if next_node_id:\n';
      code += '            try:\n';
      code += '                # Вызываем обработчик для следующего узла\n';

      if (nodes.length > 0) {
        nodes.forEach((btnNode, btnIndex) => {
          const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          const condition = btnIndex === 0 ? 'if' : 'elif';
          code += `                ${condition} next_node_id == "${btnNode.id}":\n`;
          // Проверяем, существует ли целевой узел перед вызовом обработчика
          const targetExists = nodes.some(n => n.id === btnNode.id);
          if (targetExists) {
            code += `                    await handle_callback_${safeFunctionName}(callback_query)\n`;
          } else {
            code += `                    logging.warning(f"⚠️ Целевой узел не найден: {btnNode.id}, завершаем переход")\n`;
            code += `                    await callback_query.message.edit_text("Переход завершен")\n`;
          }
        });
        code += '                else:\n';
        code += '                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
      } else {
        code += '                pass  # No nodes to handle\n';
      }
      code += '            except Exception as e:\n';
      code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    });

    // Обработчик для кнопки "Пропустить"
    if (node.data.allowSkip) {
      code += `\n@dp.callback_query(F.data == "skip_${node.id}")\n`;
      code += `async def handle_skip_${node.id}(callback_query: types.CallbackQuery):\n`;
      code += '    user_id = callback_query.from_user.id\n';
      code += '    \n';
      code += '    # Проверяем настройки\n';
      code += '    if user_id not in user_data or "button_response_config" not in user_data[user_id]:\n';
      code += '        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)\n';
      code += '        return\n';
      code += '    \n';
      code += '    await callback_query.message.edit_text("⏭️ Ответ пропущен")\n';
      code += '    del user_data[user_id]["button_response_config"]\n';
      code += '    \n';
      code += '    logging.info(f"Пользователь {user_id} пропустил кнопочный ответ")\n';
    }
  });

  return code;
}
