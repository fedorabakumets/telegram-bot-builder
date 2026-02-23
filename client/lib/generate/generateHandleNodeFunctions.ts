import { isLoggingEnabled } from '../bot-generator';
import { generateDatabaseVariablesCode } from '../Broadcast/generateDatabaseVariables';
import { generateConditionalMessageLogic } from '../Conditional';
import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';
import { formatTextForPython, getParseMode, stripHtmlTags } from '../format';
import { generateAttachedMediaSendCode } from '../MediaHandler';

/**
 * Генерирует функции handle_node_* для узлов с условными сообщениями
 * @param nodes - массив всех узлов
 * @param mediaVariablesMap - карта переменных медиа
 * @returns сгенерированный код для функций handle_node_*
 */
export function generateHandleNodeFunctions(nodes: any[], mediaVariablesMap: Map<string, { type: string; variable: string; }>): string {
  let code = '';

  // Находим узлы, которые имеют условные сообщения и collectUserInput = true
  const conditionalNodes = nodes.filter(node =>
    node &&
    node.data?.enableConditionalMessages &&
    node.data?.conditionalMessages &&
    node.data?.conditionalMessages.length > 0 &&
    node.data?.collectUserInput === true
  );

  if (conditionalNodes.length === 0) {
    if (isLoggingEnabled()) console.log('🔍 Нет узлов, требующих функций handle_node_*');
    return code;
  }

  if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: Создаем функции handle_node_* для ${conditionalNodes.length} узлов`);

  conditionalNodes.forEach(node => {
    if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: Создаем handle_node_${node.id} для узла с условными сообщениями`);

    const safeFunctionName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    const messageText = node.data.messageText || "Сообщение";
    const cleanedMessageText = stripHtmlTags(messageText);
    const formattedText = formatTextForPython(cleanedMessageText);
    const parseMode = getParseMode(node.data.formatMode);

    code += `\nasync def handle_node_${safeFunctionName}(message: types.Message):\n`;
    code += '    # Обработчик узла с условными сообщениями\n';
    code += '    user_id = message.from_user.id\n';
    code += `    logging.info(f"🔧 Вызван обработчик узла с условными сообщениями: ${node.id} для пользователя {user_id}")\n`;
    code += '    \n';

    // Инициализируем переменные пользователя
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    \n';

    // Подставляем все доступные переменные пользователя в текст
    code += '    # Подставляем все доступные переменные пользователя в текст\n';
    code += '    user_vars = await get_user_from_db(user_id)\n';
    code += '    if not user_vars:\n';
    code += '        user_vars = user_data.get(user_id, {})\n';
    code += '    if not isinstance(user_vars, dict):\n';
    code += '        user_vars = user_data.get(user_id, {})\n';
    code += '    \n';

    // Создаем объединенный словарь переменных
    code += '    # Создаем объединенный словарь переменных из базы данных и локального хранилища\n';
    code += '    all_user_vars = {}\n';
    code += '    # Добавляем переменные из базы данных\n';
    code += '    if user_vars and isinstance(user_vars, dict):\n';
    code += '        all_user_vars.update(user_vars)\n';
    code += '    # Добавляем переменные из локального хранилища\n';
    code += '    local_user_vars = user_data.get(user_id, {})\n';
    code += '    if isinstance(local_user_vars, dict):\n';
    code += '        all_user_vars.update(local_user_vars)\n';
    code += '    \n';

    // Применяем универсальную замену переменных
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ');
    code += universalVarCodeLines.join('\n');

    // Обработка условных сообщений
    if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
      code += '    # Проверка условных сообщений для навигации\n';
      code += '    conditional_parse_mode = None\n';
      code += '    conditional_keyboard = None\n';
      code += '    user_record = await get_user_from_db(user_id)\n';
      code += '    if not user_record:\n';
      code += '        user_record = user_data.get(user_id, {})\n';
      code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
      code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
      code += '    \n';

      // Используем условное сообщение, если доступно, иначе используем стандартное
      code += '    # Используем условное сообщение если есть подходящее условие\n';
      code += '    if "text" not in locals():\n';
      code += `        text = ${formattedText}\n`;

      // Добавляем получение переменных из БД перед заменой
      code += '    \n';
      code += generateDatabaseVariablesCode('    ');
      code += '    \n';

      code += '    # Заменяем переменные в тексте, используя all_user_vars\n';
      code += '    text = replace_variables_in_text(text, all_user_vars)\n';
      code += '    \n';
      code += '    # Используем условную клавиатуру если есть\n';
      code += '    # Инициализируем переменную conditional_keyboard, если она не была определена\n';
      code += '    if "conditional_keyboard" not in locals():\n';
      code += '        conditional_keyboard = None\n';
      code += '    user_id = message.from_user.id\n';
      code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
      code += '        keyboard = conditional_keyboard\n';
      code += '        user_data[user_id]["_has_conditional_keyboard"] = True\n';
      code += '        logging.info("✅ Используем условную клавиатуру для навигации")\n';
      code += '    else:\n';
      code += '        user_data[user_id]["_has_conditional_keyboard"] = False\n';
    } else {
      code += `    text = ${formattedText}\n`;
      code += '    keyboard = None\n';
    }

    // Устанавливаем переменную изображения для узла
    code += '    # Устанавливаем переменную изображения для узла\n';
    code += '    user_id = message.from_user.id\n';
    code += '    if user_id not in user_data:\n';
    code += '        user_data[user_id] = {}\n';
    if (node.data.imageUrl && node.data.imageUrl !== 'undefined') {
      code += `    user_data[user_id]["image_url_${node.id}"] = "${node.data.imageUrl}"\n`;
      code += `    await update_user_data_in_db(user_id, "image_url_${node.id}", "${node.data.imageUrl}")\n`;
      code += `    logging.info(f"✅ Переменная image_url_${node.id} установлена: ${node.data.imageUrl}")\n`;
    }
    code += '    \n';

    // Устанавливаем переменные из attachedMedia
    if (node.data.attachedMedia && node.data.attachedMedia.length > 0) {
      code += '    # Устанавливаем переменные из attachedMedia\n';
      code += '    user_id = message.from_user.id\n';
      code += '    if user_id not in user_data:\n';
      code += '        user_data[user_id] = {}\n';
      code += `    logging.info(f"✅ Переменные из attachedMedia установлены для узла ${node.id}")\n`;
    }

    // Отправляем сообщение с учетом прикрепленных медиа
    const attachedMedia = node.data.attachedMedia || [];
    if (attachedMedia.length > 0) {
      if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: Узел ${node.id} имеет attachedMedia:`, attachedMedia);

      const mediaCode = generateAttachedMediaSendCode(
        attachedMedia,
        mediaVariablesMap,
        'text',
        node.data.formatMode || '',
        'keyboard if keyboard is not None else None',
        node.id,
        '    ',
        node.data.enableAutoTransition && node.data.autoTransitionTo ? node.data.autoTransitionTo : undefined,
        node.data.collectUserInput === true,
        node.data // передаем данные узла для проверки статических изображений
      );

      if (mediaCode) {
        code += '    # Отправляем сообщение (с проверкой прикрепленного медиа)\n';
        // Заменяем callback_query на message в сгенерированном коде
        const correctedMediaCode = mediaCode.replace(/callback_query/g, 'message');
        code += correctedMediaCode;
      } else {
        // Резервный вариант
        code += '    # Отправляем сообщение (обычное)\n';
        const autoFlag = (node.data.enableAutoTransition && node.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
        code += `    await safe_edit_or_send(None, text, node_id="${node.id}", reply_markup=keyboard if keyboard is not None else None${parseMode}${autoFlag}, message=message)\n`;
      }
    } else {
      code += '    # Отправляем сообщение (обычное)\n';
      const autoFlag = (node.data.enableAutoTransition && node.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
      code += `    await safe_edit_or_send(None, text, node_id="${node.id}", reply_markup=keyboard if keyboard is not None else None${parseMode}${autoFlag}, message=message)\n`;
    }

    // Обработка автоперехода
    if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
      const autoTargetId = node.data.autoTransitionTo;
      const safeFuncName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
      code += '    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла\n';
      code += '    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура\n';
      code += '    user_id = message.from_user.id\n';
      code += '    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n';
      code += '    if has_conditional_keyboard:\n';
      code += `        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")\n`;
      code += '    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n';
      code += `        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${node.id}")\n`;
      code += `    elif user_id in user_data and user_data[user_id].get("collectUserInput_${node.id}", True) == True:\n`;
      code += `        logging.info(f"ℹ️ Узел ${node.id} ожидает ввод (collectUserInput=true), автопереход пропущен")\n`;
      code += '    else:\n';
      code += `        # ⚡ Автопереход к узлу ${autoTargetId}\n`;
      code += `        logging.info(f"⚡ Автопереход от узла ${node.id} к узлу ${autoTargetId}")\n`;
      code += '        try:\n';
      code += `            await handle_node_${safeFuncName}(message)\n`;
      code += `            logging.info(f"✅ Автопереход выполнен: ${node.id} -> ${autoTargetId}")\n`;
      code += '        except Exception as e:\n';
      code += `            logging.error(f"Ошибка при автопереходе к узлу ${autoTargetId}: {e}")\n`;
      code += '            await message.answer("Переход завершен")\n';
      code += '        return\n';
    }

    // Устанавливаем waiting_for_input, так как автопереход не выполнен
    if (node.data.collectUserInput === true) {
      code += '    # Устанавливаем waiting_for_input, так как автопереход не выполнен\n';
      code += '    user_data[user_id] = user_data.get(user_id, {})\n';
      code += '    user_data[user_id]["waiting_for_input"] = {\n';
      code += '        "type": "text",\n';
      code += '        "modes": ["text"],\n';
      code += `        "variable": "${node.data.inputVariable || 'input'}",\n`;
      code += '        "save_to_database": True,\n';
      code += `        "node_id": "${node.id}",\n`;
      code += `        "next_node_id": "${node.data.inputTargetNodeId || ''}",\n`;
      code += '        "min_length": 0,\n';
      code += '        "max_length": 0,\n';
      code += '        "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
      code += '        "success_message": ""\n';
      code += '    }\n';
      code += `    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${node.data.inputVariable || 'input'} (узел ${node.id})")`;
      code += '\n';
    }

    code += '    return\n\n';
  });

  return code;
}