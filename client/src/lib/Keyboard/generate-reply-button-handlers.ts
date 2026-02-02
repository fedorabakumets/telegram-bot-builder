import { z } from 'zod';
import { Node, buttonSchema } from '@shared/schema';
import { formatTextForPython, toPythonBoolean, generateButtonText, calculateOptimalColumns, generateWaitingStateCode } from "../format";
import { generateUniversalVariableReplacement } from "../utils/generateUniversalVariableReplacement";
import { generateConditionalMessageLogic } from "../Conditional";

// Import Button type from the main bot-generator to avoid duplicates
import { Button } from "../../bot-generator";

export function generateReplyButtonHandlers(nodes: Node[] | undefined): string {
  let code = '';
  const replyNodes = (nodes || []).filter(node =>
    node.data.keyboardType === 'reply' && node.data.buttons && node.data.buttons.length > 0
  );

  if (replyNodes.length > 0) {
    code += '\n# Обработчики reply кнопок\n';
    const processedReplyButtons = new Set<string>();

    replyNodes.forEach(node => {
      (node.data.buttons || []).forEach((button: any) => {
        if (button.action === 'goto' && button.target) {
          const buttonText = button.text;

          // Избегаем дублирования обработяиков
          if (processedReplyButtons.has(buttonText)) return;
          processedReplyButtons.add(buttonText);

          // Находим целевой узел
          const targetNode = (nodes || []).find(n => n.id === button.target);
          if (targetNode) {
            code += `\n@dp.message(lambda message: message.text == "${buttonText}")\n`;
            // Создаем безопасное имя функции на основе button ID
            const safeFunctionName = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `async def handle_reply_${safeFunctionName}(message: types.Message):\n`;

            // Генерируем ответ для целевого узла
            const targetText = targetNode.data.messageText || "Сообщение";
            const formattedTargetText = formatTextForPython(targetText);
            code += `    text = ${formattedTargetText}\n`;

            // Добавляем замену переменных для reply кнопок
            code += '    user_id = message.from_user.id\n';

            const skipDataCollection = button.skipDataCollection === true;
            code += `    skip_collection = ${toPythonBoolean(skipDataCollection)}\n`;
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
            code += '            # Сохраняем в базу данных\n';
            code += '            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)\n';
            code += '            if saved_to_db:\n';
            code += '                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")\n';
            code += '            else:\n';
            code += '                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
            code += '            \n';
            code += '            # Очищаем состояние ожидания после сохранения\n';
            code += '            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")\n';
            code += '            del user_data[user_id]["waiting_for_input"]\n';
            code += '        elif isinstance(waiting_config, dict):\n';
            code += '            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")\n';
            code += '    elif skip_collection:\n';
            code += `        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")\n`;
            code += '    \n';

            code += generateUniversalVariableReplacement('    ');

            // Обрабатываем клавиатуру для целевого узла
            if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button) => {
                code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
              });
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
                code += `        "skip_buttons": ${skipButtonsJson}\n`;
                code += `    }\n`;
                code += `    logging.info(f"✅ Состояние ожидания настроено: type='${primaryInputType}', modes=[${modesStr}] для переменной ${targetVarName} (узел ${targetNode.id})")\n`;
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

            } else if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Проверка условных сообщений для целевогя узла\n';
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
              code += '    if use_conditional_keyboard:\n';

              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `        await message.answer(text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
              code += '    else:\n';
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command') {
                  const commandName = btn.target ? btn.target.replace('/', '') : 'unknown';
                  const callbackData = `cmd_${commandName}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
              code += `        builder.adjust(${columns})\n`;
              code += '        keyboard = builder.as_markup()\n';
              code += `        await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;

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

              if (targetNode.data.collectUserInput === true ||
                targetNode.data.enableTextInput === true ||
                targetNode.data.enablePhotoInput === true ||
                targetNode.data.enableVideoInput === true ||
                targetNode.data.enableAudioInput === true ||
                targetNode.data.enableDocumentInput === true) {
                code += '    \n';
                code += generateWaitingStateCode(targetNode, '    ', 'message.from_user.id');
              }
            }
          }
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
  