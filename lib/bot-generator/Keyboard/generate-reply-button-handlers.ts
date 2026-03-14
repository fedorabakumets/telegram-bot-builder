import { Button, Node } from '@shared/schema';
import { generateConditionalMessageLogic } from "../Conditional";
import { generateSaveToDatabaseTable } from '../database/generateSaveToDatabaseTable';
import { generateUniversalVariableReplacement } from "../database/generateUniversalVariableReplacement";
import { formatTextForPython, generateButtonText, generateWaitingStateCode, toPythonBoolean } from "../format";
import { getAdjustCode } from './getAdjustCode';
import { checkAutoTransition } from "../utils/checkAutoTransition";

export function generateReplyButtonHandlers(nodes: Node[] | undefined): string {
  let code = '';
  const replyNodes = (nodes || []).filter(node =>
    node && node.data?.keyboardType === 'reply' && node.data?.buttons && node.data?.buttons.length > 0
  );

  if (replyNodes.length > 0) {
    code += '\n# Обработчики reply кнопок\n';
    const processedReplyButtons = new Set<string>();

    replyNodes.forEach(node => {
      (node.data.buttons || []).forEach((button: any) => {
        const buttonText = button.text;

        // Избегаем дублирования обработчиков
        if (processedReplyButtons.has(buttonText)) return;
        processedReplyButtons.add(buttonText);

        // Обрабатываем все типы кнопок, не только goto
        if (button.action === 'goto' && button.target) {

          // Находим целевой узел
          const targetNode = (nodes || []).find(n => n.id === button.target);
          if (targetNode) {
            code += `\n@dp.message(lambda message: message.text == "${buttonText}")\n`;
            // Создаем безопасное имя функции на основе button ID
            const safeFunctionName = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `async def handle_reply_${safeFunctionName}(message: types.Message):\n`;

            // Проверяем, есть ли узлы с мультивыбором в боте, чтобы избежать вызова несуществующей функции
            const hasMultiSelectNodes = (nodes || []).some((node: any) =>
              node.data?.allowMultipleSelection === true && node.data?.keyboardType === 'reply'
            );

            // Проверяем, находится ли пользователь в режиме мультивыбора
            code += '    user_id = message.from_user.id\n';
            code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';

            if (hasMultiSelectNodes) {
              code += '        # Пользователь в режиме мультивыбора, передаем управление общему обработчику\n';
              code += '        await handle_multi_select_reply(message)\n';
              code += '        return\n';
            } else {
              // Если нет узлов с мультивыбором, просто выходим из режима мультивыбора
              code += '        # Пользователь в режиме мультивыбора, но нет узлов с мультивыбором - очищаем состояние\n';
              code += '        user_data[user_id].pop("multi_select_node", None)\n';
              code += '        user_data[user_id].pop("multi_select_type", None)\n';
              code += '        user_data[user_id].pop(f"multi_select_{user_data[user_id].get("multi_select_node", "")}", None)\n';
            }
            code += '    \n';

            // Генерируем ответ для целевого узла
            const targetText = targetNode.data.messageText || "Сообщение";
            const formattedTargetText = formatTextForPython(targetText);
            code += `    text = ${formattedTargetText}\n`;

            // Добавляем замену переменных для reply кнопок
            code += '    user_id = message.from_user.id\n';

            const skipDataCollection = button.skipDataCollection === true;
            code += `    skip_collection = ${toPythonBoolean(skipDataCollection)}\n`;
            code += '    \n';

            // ИСПРАВЛЕНИЕ: Добавляем ReplyKeyboardRemove для кнопок с hideAfterClick
            const hideAfterClick = button.hideAfterClick === true;
            code += '    \n';
            code += '    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:\n';
            code += '        waiting_config = user_data[user_id]["waiting_for_input"]\n';
            code += '        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []\n';
            code += '        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""\n';
            code += '        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):\n';
            code += '            variable_name = waiting_config.get("variable", "button_response")\n';
            code += `            button_text = "${buttonText}"\n`;
            code += '            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")\n';
            code += '            \n';
            code += '            # Сохраняем в пользовательские данные\n';
            code += '            user_data[user_id][variable_name] = button_text\n';
            code += '            \n';
            code += '            # Сохраняем в базу данных (в соответствующую таблицу или user_data)\n';
            const saveCode = generateSaveToDatabaseTable({
              variableName: 'variable_name',
              valueExpression: 'button_text',
              indent: '            ',
              isVariableNameDynamic: true
            });
            code += saveCode;
            code += '            \n';
            code += '            # Очищаем состояние ожидания после сохранения\n';
            code += '            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")\n';
            code += '            del user_data[user_id]["waiting_for_input"]\n';
            code += '        elif isinstance(waiting_config, dict):\n';
            code += '            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")\n';
            code += '    elif skip_collection:\n';
            code += `        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")\n`;
            code += '    \n';

            const universalVarCodeLines1: string[] = [];
            generateUniversalVariableReplacement(universalVarCodeLines1, { node: targetNode, indentLevel: '    ' });
            code += universalVarCodeLines1.join('\n');

            // Устанавливаем переменные из attachedMedia для целевого узла
            if (targetNode.data.attachedMedia && Array.isArray(targetNode.data.attachedMedia)) {
              code += '    # Устанавливаем переменные из attachedMedia\n';
              code += '    user_id = message.from_user.id\n';
              code += '    if user_id not in user_data:\n';
              code += '        user_data[user_id] = {}\n';

              targetNode.data.attachedMedia.forEach((mediaVar: string) => {
                if (mediaVar.startsWith('image_url_')) {
                  // Уже обрабатывается ниже
                } else if (mediaVar.startsWith('video_url_')) {
                  code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.videoUrl}"\n`;
                } else if (mediaVar.startsWith('audio_url_')) {
                  code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.audioUrl}"\n`;
                } else if (mediaVar.startsWith('document_url_')) {
                  code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.documentUrl}"\n`;
                }
              });

              code += `    logging.info(f"✅ Переменные из attachedMedia установлены для узла ${targetNode.id}")\n`;
              code += '    \n';
            }

            // Проверяем, является ли узел узлом с множественным выбором
            const isMultiSelectNode = targetNode.data.allowMultipleSelection === true;

            if (isMultiSelectNode) {
              // Для узлов с множественным выбором вызываем соответствующий обработчик
              code += '    # Узел является узлом с множественным выбором\n';
              code += '    # Создаем фиктивный callback и вызываем соответствующий обработчик\n';
              code += '    class MockCallback:\n';
              code += '        def __init__(self, data, user, msg):\n';
              code += '            self.data = data\n';
              code += '            self.from_user = user\n';
              code += '            self.message = msg\n';
              code += '        async def answer(self):\n';
              code += '            pass  # Mock метод, ничего не делаем\n';
              code += '        async def edit_text(self, text, **kwargs):\n';
              code += '            try:\n';
              code += '                return await self.message.edit_text(text, **kwargs)\n';
              code += '            except Exception as e:\n';
              code += '                logging.warning(f"Не удалось отредактировать сообщение: {e}")\n';
              code += '                return await self.message.answer(text, **kwargs)\n';
              code += '    \n';
              code += `    mock_callback = MockCallback("${targetNode.id}", message.from_user, message)\n`;
              // Проверяем, существует ли целевой узел перед вызовом обработчика
              const targetExists = (nodes || []).some(n => n.id === targetNode.id);
              if (targetExists) {
                code += `    await handle_callback_${targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}(mock_callback)\n`;
                // Скрываем клавиатуру если установлен флаг hideAfterClick
                if (hideAfterClick) {
                  code += '    # Скрываем клавиатуру после нажатия кнопки\n';
                  code += '    await message.answer(".", reply_markup=ReplyKeyboardRemove())\n';
                }
              } else {
                code += `    logging.warning(f"⚠️ Целевой узел не найден: {targetNode.id}, завершаем переход")\n`;
                code += `    await message.answer("Переход завершен")\n`;
              }
              // Скрываем клавиатуру если установлен флаг hideAfterClick
              if (hideAfterClick) {
                code += '    # Скрываем клавиатуру после нажатия кнопки (отправляем пустое сообщение с ReplyKeyboardRemove)\n';
                code += '    try:\n';
                code += '        await bot.send_message(message.chat.id, ".", reply_markup=ReplyKeyboardRemove())\n';
                code += '    except Exception:\n';
                code += '        pass\n';
              }
            } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              // Проверяем, есть ли статическое изображение в целевом узле
              if (targetNode.data?.imageUrl && targetNode.data.imageUrl.trim() !== '' && targetNode.data.imageUrl !== 'undefined') {
                code += `    # Узел содержит изображение: ${targetNode.data.imageUrl}\n`;
                // Проверяем, является ли URL относительным путем к локальному файлу
                if (targetNode.data.imageUrl.startsWith('/uploads/')) {
                  code += `    image_path = get_upload_file_path("${targetNode.data.imageUrl}")\n`;
                  code += `    image_url = FSInputFile(image_path)\n`;
                } else {
                  code += `    image_url = "${targetNode.data.imageUrl}"\n`;
                }

                code += '    builder = ReplyKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button) => {
                  code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                });
                code += `    ${getAdjustCode(targetNode.data.buttons, targetNode.data)}\n`;
                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

                const targetCollectInput = targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true;

                if (targetCollectInput) {
                  const targetVarName = targetNode.data.inputVariable || `response_${targetNode.id}`;
                  code += '    \n';
                  const skipButtons = (targetNode.data.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                  const skipButtonsJson = JSON.stringify(skipButtons);

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

                  let primaryInputType = 'button';
                  if (targetNode.data.enablePhotoInput) primaryInputType = 'photo';
                  else if (targetNode.data.enableVideoInput) primaryInputType = 'video';
                  else if (targetNode.data.enableAudioInput) primaryInputType = 'audio';
                  else if (targetNode.data.enableDocumentInput) primaryInputType = 'document';
                  else if (targetNode.data.enableTextInput !== false) primaryInputType = 'text';

                  const modesStr = modes.length > 0 ? modes.map(m => `'${m}'`).join(', ') : "'button', 'text'";

                  code += '    # Устанавливаем waiting_for_input для целевого узла (collectUserInput=true)\n';
                  code += `    user_data[user_id]["waiting_for_input"] = {\n`;
                  code += `        "type": "${primaryInputType}",\n`;
                  code += `        "modes": [${modesStr}],\n`;
                  code += `        "variable": "${targetVarName}",\n`;
                  code += `        "save_to_database": True,\n`;
                  code += `        "node_id": "${targetNode.id}",\n`;
                  code += `        "appendVariable": ${toPythonBoolean(targetNode.data.appendVariable || false)},\n`;
                  code += `        "skip_buttons": ${skipButtonsJson}\n`;
                  code += `    }\n`;
                  code += `    logging.info(f"✅ Состояние ожидания настроено: type='${primaryInputType}', modes=[${modesStr}] для переменной ${targetVarName} (узел ${targetNode.id})")`;
                  code += '\n';
                } else {
                  code += '    \n';
                  code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                  code += `    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                }

                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += `    await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseModeTarget})\n`;
                // Скрываем клавиатуру если установлен флаг hideAfterClick
                if (hideAfterClick) {
                  code += '    # Скрываем клавиатуру после нажатия кнопки (используем zero-width space)\n';
                  code += '    await message.answer("\\u200B", reply_markup=ReplyKeyboardRemove())\n';
                }
              } else {
                // Старая логика без изображения
                code += '    builder = ReplyKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button) => {
                  code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                });
                code += `    ${getAdjustCode(targetNode.data.buttons, targetNode.data)}\n`;
                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

                const targetCollectInput = targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true;

                if (targetCollectInput) {
                  const targetVarName = targetNode.data.inputVariable || `response_${targetNode.id}`;
                  code += '    \n';
                  const skipButtons = (targetNode.data.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                  const skipButtonsJson = JSON.stringify(skipButtons);

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

                  let primaryInputType = 'button';
                  if (targetNode.data.enablePhotoInput) primaryInputType = 'photo';
                  else if (targetNode.data.enableVideoInput) primaryInputType = 'video';
                  else if (targetNode.data.enableAudioInput) primaryInputType = 'audio';
                  else if (targetNode.data.enableDocumentInput) primaryInputType = 'document';
                  else if (targetNode.data.enableTextInput !== false) primaryInputType = 'text';

                  const modesStr = modes.length > 0 ? modes.map(m => `'${m}'`).join(', ') : "'button', 'text'";

                  code += '    # Устанавливаем waiting_for_input для целевого узла (collectUserInput=true)\n';
                  code += `    user_data[user_id]["waiting_for_input"] = {\n`;
                  code += `        "type": "${primaryInputType}",\n`;
                  code += `        "modes": [${modesStr}],\n`;
                  code += `        "variable": "${targetVarName}",\n`;
                  code += `        "save_to_database": True,\n`;
                  code += `        "node_id": "${targetNode.id}",\n`;
                  code += `        "appendVariable": ${toPythonBoolean(targetNode.data.appendVariable || false)},\n`;
                  code += `        "skip_buttons": ${skipButtonsJson}\n`;
                  code += `    }\n`;
                  code += `    logging.info(f"✅ Состояние ожидания настроено: type='${primaryInputType}', modes=[${modesStr}] для переменной ${targetVarName} (узел ${targetNode.id})")`;
                  code += '\n';
                } else {
                  code += '    \n';
                  code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                  code += `    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                }

                let parseModeTarget = '';
                if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                  parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                } else if (targetNode.data.formatMode === 'html') {
                  parseModeTarget = ', parse_mode=ParseMode.HTML';
                }
                code += `    await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
                // Скрываем клавиатуру если установлен флаг hideAfterClick
                if (hideAfterClick) {
                  code += '    # Скрываем клавиатуру после нажатия кнопки (используем zero-width space)\n';
                  code += '    await message.answer("\\u200B", reply_markup=ReplyKeyboardRemove())\n';
                }
              }

            } else if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              // Проверяем, является ли узел узлом с множественным выбором
              const isMultiSelectNode = targetNode.data.allowMultipleSelection === true;

              if (isMultiSelectNode) {
                // Для узлов с множественным выбором вызываем соответствующий обработчик
                code += '    # Узел является узлом с множественным выбором\n';
                code += '    # Создаем фиктивный callback и вызываем соответствующий обработчик\n';
                code += '    class MockCallback:\n';
                code += '        def __init__(self, data, user, msg):\n';
                code += '            self.data = data\n';
                code += '            self.from_user = user\n';
                code += '            self.message = msg\n';
                code += '        async def answer(self):\n';
                code += '            pass  # Mock метод, ничего не делаем\n';
                code += '        async def edit_text(self, text, **kwargs):\n';
                code += '            try:\n';
                code += '                return await self.message.edit_text(text, **kwargs)\n';
                code += '            except Exception as e:\n';
                code += '                logging.warning(f"Не удалось отредактировать сообщение: {e}")\n';
                code += '                return await self.message.answer(text, **kwargs)\n';
                code += '    \n';
                code += `    mock_callback = MockCallback("${targetNode.id}", message.from_user, message)\n`;
                // Проверяем, существует ли целевой узел перед вызовом обработчика
                const targetExists = (nodes || []).some(n => n.id === targetNode.id);
                if (targetExists) {
                  code += `    await handle_callback_${targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}(mock_callback)\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '    # Скрываем клавиатуру после нажатия кнопки\n';
                    code += '    await message.answer(".", reply_markup=ReplyKeyboardRemove())\n';
                  }
                } else {
                  code += `    logging.warning(f"⚠️ Целевой узел не найден: {targetNode.id}, завершаем переход")\n`;
                  code += `    await message.answer("Переход завершен")\n`;
                }
              } else {
                // Устанавливаем переменные из attachedMedia для целевого узла
                if (targetNode.data.attachedMedia && Array.isArray(targetNode.data.attachedMedia)) {
                  code += '    # Устанавливаем переменные из attachedMedia\n';
                  code += '    user_id = message.from_user.id\n';
                  code += '    if user_id not in user_data:\n';
                  code += '        user_data[user_id] = {}\n';

                  targetNode.data.attachedMedia.forEach((mediaVar: string) => {
                    if (mediaVar.startsWith('image_url_')) {
                      // Уже обрабатывается ниже
                    } else if (mediaVar.startsWith('video_url_')) {
                      code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.videoUrl}"\n`;
                    } else if (mediaVar.startsWith('audio_url_')) {
                      code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.audioUrl}"\n`;
                    } else if (mediaVar.startsWith('document_url_')) {
                      code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.documentUrl}"\n`;
                    }
                  });

                  code += `    logging.info(f"✅ Переменные из attachedMedia установлены для узла ${targetNode.id}")\n`;
                  code += '    \n';
                }

                // Проверяем, есть ли статическое изображение в целевом узле
                const hasStaticImage = targetNode.data?.imageUrl && targetNode.data.imageUrl.trim() !== '' && targetNode.data.imageUrl !== 'undefined';

                if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                  code += '    # Проверка условных сообщений для целевого узла\n';
                  code += '    user_record = await get_user_from_db(user_id)\n';
                  code += '    if not user_record:\n';
                  code += '        user_record = user_data.get(user_id, {})\n';
                  code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                  code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                  code += '    \n';
                  code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
                  code += '    use_conditional_keyboard = conditional_keyboard is not None\n';
                } else {
                  code += '    use_conditional_keyboard = False\n';
                  code += '    conditional_keyboard = None\n';
                }

                // Генерируем inline клавиатуру
                code += '    builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    const commandName = btn.target ? btn.target.replace('/', '') : 'unknown';
                    const callbackData = `cmd_${commandName}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  }
                });
                code += `    ${getAdjustCode(targetNode.data.buttons, targetNode.data)}\n`;
                code += '    keyboard = builder.as_markup()\n';

                // Если есть статическое изображение, отправляем его с клавиатурой
                if (hasStaticImage) {
                  code += `    # Узел содержит статическое изображение: ${targetNode.data.imageUrl}\n`;
                  // Проверяем, является ли URL относительным путем к локальному файлу
                  if (targetNode.data.imageUrl?.startsWith('/uploads/') && targetNode.data.imageUrl !== 'undefined') {
                    code += `    image_path = get_upload_file_path("${targetNode.data.imageUrl}")\n`;
                    code += `    image_url = FSInputFile(image_path)\n`;
                  } else if (targetNode.data.imageUrl && targetNode.data.imageUrl !== 'undefined') {
                    code += `    image_url = "${targetNode.data.imageUrl}"\n`;
                  }

                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }

                  code += `    await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseModeTarget})\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '    # Скрываем клавиатуру после нажатия кнопки\n';
                    code += '    await message.answer(".", reply_markup=ReplyKeyboardRemove())\n';
                  }
                } else {
                  // Нет изображения, отправляем текст с клавиатурой
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }

                  code += '    if use_conditional_keyboard:\n';
                  code += `        await message.answer(text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '        # Скрываем клавиатуру после нажатия кнопки (используем zero-width space)\n';
                    code += '        await message.answer("\\u200B", reply_markup=ReplyKeyboardRemove())\n';
                  }
                  code += '    else:\n';
                  code += `        await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '        # Скрываем клавиатуру после нажатия кнопки (используем zero-width space)\n';
                    code += '        await message.answer("\\u200B", reply_markup=ReplyKeyboardRemove())\n';
                  }
                }

                // Устанавливаем состояние ожидания ввода для inline клавиатуры
                if (targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true) {
                  code += '    \n';
                  if (targetNode && targetNode.data) {
                    code += generateWaitingStateCode(targetNode, '    ', 'message.from_user.id');
                  }
                }
              }

            } else {
              // Проверяем, является ли узел узлом с множественным выбором
              const isMultiSelectNode = targetNode.data.allowMultipleSelection === true;

              if (isMultiSelectNode) {
                // Для узлов с множественным выбором вызываем соответствующий обработчик
                code += '    # Узел является узлом с множественным выбором\n';
                code += '    # Создаем фиктивный callback и вызываем соответствующий обработчик\n';
                code += '    class MockCallback:\n';
                code += '        def __init__(self, data, user, msg):\n';
                code += '            self.data = data\n';
                code += '            self.from_user = user\n';
                code += '            self.message = msg\n';
                code += '        async def answer(self):\n';
                code += '            pass  # Mock метод, ничего не делаем\n';
                code += '        async def edit_text(self, text, **kwargs):\n';
                code += '            try:\n';
                code += '                return await self.message.edit_text(text, **kwargs)\n';
                code += '            except Exception as e:\n';
                code += '                logging.warning(f"Не удалось отредактировать сообщение: {e}")\n';
                code += '                return await self.message.answer(text, **kwargs)\n';
                code += '    \n';
                code += `    mock_callback = MockCallback("${targetNode.id}", message.from_user, message)\n`;
                // Проверяем, существует ли целевой узел перед вызовом обработчика
                const targetExists = (nodes || []).some(n => n.id === targetNode.id);
                if (targetExists) {
                  code += `    await handle_callback_${targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}(mock_callback)\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '    # Скрываем клавиатуру после нажатия кнопки\n';
                    code += '    await message.answer(".", reply_markup=ReplyKeyboardRemove())\n';
                  }
                } else {
                  code += `    logging.warning(f"⚠️ Целевой узел не найден: {targetNode.id}, завершаем переход")\n`;
                  code += `    await message.answer("Переход завершен")\n`;
                }
              } else {
                // Устанавливаем переменные из attachedMedia для целевого узла
                if (targetNode.data.attachedMedia && Array.isArray(targetNode.data.attachedMedia)) {
                  code += '    # Устанавливаем переменные из attachedMedia\n';
                  code += '    user_id = message.from_user.id\n';
                  code += '    if user_id not in user_data:\n';
                  code += '        user_data[user_id] = {}\n';

                  targetNode.data.attachedMedia.forEach((mediaVar: string) => {
                    if (mediaVar.startsWith('image_url_')) {
                      // Уже обрабатывается ниже
                    } else if (mediaVar.startsWith('video_url_')) {
                      code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.videoUrl}"\n`;
                    } else if (mediaVar.startsWith('audio_url_')) {
                      code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.audioUrl}"\n`;
                    } else if (mediaVar.startsWith('document_url_')) {
                      code += `    user_data[user_id]["${mediaVar}"] = "${targetNode.data.documentUrl}"\n`;
                    }
                  });

                  code += `    logging.info(f"✅ Переменные из attachedMedia установлены для узла ${targetNode.id}")\n`;
                  code += '    \n';
                }

                // Проверяем, есть ли статическое изображение в целевом узле
                if (targetNode.data?.imageUrl && targetNode.data.imageUrl.trim() !== '' && targetNode.data.imageUrl !== 'undefined') {
                  code += `    # Узел содержит изображение: ${targetNode.data.imageUrl}\n`;
                  // Проверяем, является ли URL относительным путем к локальному файлу
                  if (targetNode.data.imageUrl?.startsWith('/uploads/') && targetNode.data.imageUrl !== 'undefined') {
                    code += `    image_path = get_upload_file_path("${targetNode.data.imageUrl}")\n`;
                    code += `    image_url = FSInputFile(image_path)\n`;
                  } else if (targetNode.data.imageUrl && targetNode.data.imageUrl !== 'undefined') {
                    code += `    image_url = "${targetNode.data.imageUrl}"\n`;
                  }

                  if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                    code += '    # Проверка условных сообщений для целевого узла\n';
                    code += '    conditional_parse_mode = None\n';
                    code += '    conditional_keyboard = None\n';
                    code += '    user_record = await get_user_from_db(user_id)\n';
                    code += '    if not user_record:\n';
                    code += '        user_record = user_data.get(user_id, {})\n';
                    code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                    code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                    code += '    \n';
                  }
                  code += '    if "conditional_keyboard" not in locals():\n';
                  code += '        conditional_keyboard = None\n';
                  code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';

                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `        await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '        # Скрываем клавиатуру после нажатия кнопки (используем zero-width space)\n';
                    code += '        await message.answer("\\u200B", reply_markup=ReplyKeyboardRemove())\n';
                  }
                  code += '    else:\n';
                  code += `        await bot.send_photo(message.chat.id, image_url, caption=text${parseModeTarget})\n`;
                  // Скрываем клавиатуру если установлен флаг hideAfterClick
                  if (hideAfterClick) {
                    code += '        # Скрываем клавиатуру после нажатия кнопки (используем zero-width space)\n';
                    code += '        await message.answer("\\u200B", reply_markup=ReplyKeyboardRemove())\n';
                  }
                } else {
                  if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                    code += '    # Проверка условных сообщений для целевого узла\n';
                    code += '    conditional_parse_mode = None\n';
                    code += '    conditional_keyboard = None\n';
                    code += '    user_record = await get_user_from_db(user_id)\n';
                    code += '    if not user_record:\n';
                    code += '        user_record = user_data.get(user_id, {})\n';
                    code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                    code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                    code += '    \n';
                  }
                  code += '    if "conditional_keyboard" not in locals():\n';
                  code += '        conditional_keyboard = None\n';
                  code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';

                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `        await message.answer(text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
                  code += '    else:\n';
                  code += `        await message.answer(text, reply_markup=ReplyKeyboardRemove()${parseModeTarget})\n`;
                }

                if (targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true) {
                  code += '    \n';
                  if (targetNode && targetNode.data) {
                    code += generateWaitingStateCode(targetNode, '    ', 'message.from_user.id');
                  }
                }
              }

              // Проверяем, нужно ли выполнить автопереход из целевого узла
              const autoTransitionResult = checkAutoTransition(targetNode, nodes || []);
              if (autoTransitionResult.shouldTransition && autoTransitionResult.targetNode) {
                const autoTargetNode = autoTransitionResult.targetNode;
                code += '    \n';
                code += '    # Проверяем, нужно ли выполнить автопереход из текущего узла\n';
                // ИСПРАВЛЕНИЕ: Используем фактическое значение collectUserInput из узла, а не значение по умолчанию
                const collectUserInputValue = targetNode.data.collectUserInput === true;
                code += `    if user_id in user_data and user_data[user_id].get("collectUserInput_${targetNode.id}", ${toPythonBoolean(collectUserInputValue)}) == True:\n`;
                code += `        logging.info(f"ℹ️ Узел ${targetNode.id} ожидает ввод (collectUserInput=true), автопереход пропущен")\n`;
                code += '    else:\n';
                code += `        # ⚡ Автопереход к узлу ${autoTargetNode.id} (автопереход из узла ${targetNode.id})\n`;
                code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetNode.id}")\n`;

                // Определяем тип целевого узла и генерируем соответствующий код вызова
                if (autoTargetNode.type === 'command') {
                  code += `        await handle_command_${autoTargetNode.data.command?.replace('/', '')?.replace(/[^a-zA-Z0-9_]/g, '_')}(message)\n`;
                } else {
                  // Для обычных узлов создаем фиктивный callback и вызываем соответствующий обработчик
                  code += '        import types as aiogram_types\n';
                  code += '        fake_callback = aiogram_types.SimpleNamespace(\n';
                  code += '            id="auto_transition",\n';
                  code += '            from_user=message.from_user,\n';
                  code += '            chat_instance="",\n';
                  code += `            data="${autoTargetNode.id}",\n`;
                  code += '            message=message,\n';
                  code += '            answer=lambda *args, **kwargs: None\n';
                  code += '        )\n';

                  // Генерируем вызов обработчика для целевого узла
                  // Проверяем, существует ли целевой узел перед вызовом обработчика
                  const targetExists = (nodes || []).some(n => n.id === autoTargetNode.id);
                  if (targetExists) {
                    code += `        await handle_callback_${autoTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}(fake_callback)\n`;
                  } else {
                    code += `        logging.warning(f"⚠️ Целевой узел автоперехода не найден: {autoTargetNode.id}, завершаем переход")\n`;
                    code += `        await message.answer("Переход завершен")\n`;
                  }
                }
                code += `        logging.info(f"✅ Автопереход выполнен: ${targetNode.id} -> ${autoTargetNode.id}")\n`;
              }
            }
          }
        } else {
          // Обработка кнопок без action='goto' или без target
          code += `\n@dp.message(lambda message: message.text == "${buttonText}")\n`;
          // Создаем безопасное имя функции на основе button ID или текста
          const safeFunctionName = (button.id || buttonText).replace(/[^a-zA-Z0-9_]/g, '_');
          code += `async def handle_reply_${safeFunctionName}(message: types.Message):\n`;

          // Проверяем, есть ли узлы с мультивыбором в боте, чтобы избежать вызова несуществующей функции
          const hasMultiSelectNodes2 = (nodes || []).some((node: any) =>
            node.data?.allowMultipleSelection === true && node.data?.keyboardType === 'reply'
          );

          // Проверяем, находится ли пользователь в режиме мультивыбора
          code += '    user_id = message.from_user.id\n';
          code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';

          if (hasMultiSelectNodes2) {
            code += '        # Пользователь в режиме мультивыбора, передаем управление общему обработчику\n';
            code += '        await handle_multi_select_reply(message)\n';
            code += '        return\n';
          } else {
            // Если нет узлов с мультивыбором, просто выходим из режима мультивыбора
            code += '        # Пользователь в режиме мультивыбора, но нет узлов с мультивыбором - очищаем состояние\n';
            code += '        user_data[user_id].pop("multi_select_node", None)\n';
            code += '        user_data[user_id].pop("multi_select_type", None)\n';
            code += '        user_data[user_id].pop(f"multi_select_{user_data[user_id].get("multi_select_node", "")}", None)\n';
          }
          code += '    \n';

          // Генерируем простой ответ
          code += `    text = "Вы нажали на кнопку: ${buttonText}"\n`;
          code += '    user_id = message.from_user.id\n';
          code += '    \n';

          // Инициализация переменных пользователя
          code += '    # Инициализируем базовые переменные пользователя если их нет\n';
          code += '    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):\n';
          code += '        user_obj = message.from_user\n';
          code += '        if user_obj is not None:\n';
          code += '            await init_user_variables(user_id, user_obj)\n';
          code += '    \n';

          const universalVarCodeLines2: string[] = [];
          generateUniversalVariableReplacement(universalVarCodeLines2, '    ');
          code += universalVarCodeLines2.join('\n');

          // Отправляем ответ и убираем клавиатуру
          code += '    await message.answer(text, reply_markup=ReplyKeyboardRemove())\n';
        }
      });
    });
  }
  const contactButtons = replyNodes.flatMap(node =>
    (node.data.buttons || []).filter((button: any) => button.action === 'contact')
  );

  const locationButtons = replyNodes.flatMap(node =>
    (node.data.buttons || []).filter((button: any) => button.action === 'location')
  );

  if (contactButtons.length > 0 || locationButtons.length > 0) {
    code += '\n# Обработчики специальных кнопок\n';

    if (contactButtons.length > 0) {
      code += '\n@dp.message(F.contact)\n';
      code += 'async def handle_contact(message: types.Message):\n';
      code += '    contact = message.contact\n';
      code += '    text = f"Спасибо за контакт!\\n"\n';
      code += '    text += f"Имя: {contact.first_name}\\n"\n';
      code += '    text += f"Телефон: {contact.phone_number}"\n';
      code += '    await message.answer(text)\n';
    }

    if (locationButtons.length > 0) {
      code += '\n@dp.message(F.location)\n';
      code += 'async def handle_location(message: types.Message):\n';
      code += '    location = message.location\n';
      code += '    text = f"Спасибо за геолокацию!\\n"\n';
      code += '    text += f"Широта: {location.latitude}\\n"\n';
      code += '    text += f"Долгота: {location.longitude}"\n';
      code += '    await message.answer(text)\n';
    }
  }
  return code;
}
