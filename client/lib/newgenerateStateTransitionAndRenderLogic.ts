import { Button, ResponseOption } from './bot-generator';
import { generateConditionalMessageLogic } from './Conditional';
import { formatTextForPython, generateButtonText, toPythonBoolean, generateWaitingStateCode, escapeForJsonString } from './format';
import { generateInlineKeyboardCode } from './Keyboard';
import { generateAttachedMediaVars, generateConditionalBranch, generateConditionalMessages, generateInlineKeyboardSend, generateMediaSaveVars, generateParseMode, generateReplyKeyboardSend } from './bot-generator/transitions';

export function newgenerateStateTransitionAndRenderLogic(nodes: any[], code: string, allNodeIds: any[], connections: any[]) {
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      code += generateConditionalBranch(index, targetNode.id, '            ');
      
      if (targetNode.type === 'message' && targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardSend(targetNode, '                ');
      } else if (targetNode.type === 'message' && targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateReplyKeyboardSend(targetNode, '                ');

        if (targetNode.data.enableTextInput || targetNode.data.collectUserInput ||
          targetNode.data.enablePhotoInput || targetNode.data.enableVideoInput ||
          targetNode.data.enableAudioInput || targetNode.data.enableDocumentInput) {
          if (targetNode && targetNode.data) {
            code += generateWaitingStateCode(targetNode, '                ');
          }
        }
      } else if (targetNode.type === 'message') {
        if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
          code += generateConditionalMessages(targetNode, '                ');
        } else {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                text = ${formattedText}\n`;
        }

        code += generateParseMode(targetNode, '                ');
        code += generateMediaSaveVars(targetNode, '                ');
        code += generateAttachedMediaVars(targetNode, '                ');

        // Проверяем наличие медиа-контента (imageUrl, videoUrl, audioUrl, documentUrl)
        const hasImage = targetNode.data.imageUrl;
        const hasVideo = targetNode.data.videoUrl;
        const hasAudio = targetNode.data.audioUrl;
        const hasDocument = targetNode.data.documentUrl;

        if (hasImage || hasVideo || hasAudio || hasDocument) {
          // Отправляем медиа с текстом в качестве подписи (caption)
          if (hasImage) {
            // Проверяем, является ли URL относительным путем к локальному файлу
            if (targetNode.data.imageUrl.startsWith('/uploads/')) {
              code += `                image_path = get_upload_file_path("${targetNode.data.imageUrl}")\n`;
              code += `                image_url = FSInputFile(image_path)\n`;
              code += `                await bot.send_photo(message.chat.id, image_url, caption=text, parse_mode=parse_mode)\n`;
            } else {
              code += `                await bot.send_photo(message.chat.id, "${targetNode.data.imageUrl}", caption=text, parse_mode=parse_mode)\n`;
            }
          } else if (hasVideo) {
            // Проверяем, является ли URL относительным путем к локальному файлу
            if (targetNode.data.videoUrl && targetNode.data.videoUrl.startsWith('/uploads/')) {
              code += `                video_path = get_upload_file_path("${targetNode.data.videoUrl}")\n`;
              code += `                video_url = FSInputFile(video_path)\n`;
              code += `                await bot.send_video(message.chat.id, video_url, caption=text, parse_mode=parse_mode)\n`;
            } else {
              code += `                await bot.send_video(message.chat.id, "${targetNode.data.videoUrl}", caption=text, parse_mode=parse_mode)\n`;
            }
          } else if (hasAudio) {
            // Проверяем, является ли URL относительным путем к локальному файлу
            if (targetNode.data.audioUrl && targetNode.data.audioUrl.startsWith('/uploads/')) {
              code += `                audio_path = get_upload_file_path("${targetNode.data.audioUrl}")\n`;
              code += `                audio_url = FSInputFile(audio_path)\n`;
              code += `                await bot.send_audio(message.chat.id, audio_url, caption=text, parse_mode=parse_mode)\n`;
            } else {
              code += `                await bot.send_audio(message.chat.id, "${targetNode.data.audioUrl}", caption=text, parse_mode=parse_mode)\n`;
            }
          } else if (hasDocument) {
            // Проверяем, является ли URL относительным путем к локальному файлу
            if (targetNode.data.documentUrl && targetNode.data.documentUrl.startsWith('/uploads/')) {
              code += `                document_path = get_upload_file_path("${targetNode.data.documentUrl}")\n`;
              code += `                document_url = FSInputFile(document_path)\n`;
              code += `                await bot.send_document(message.chat.id, document_url, caption=text, parse_mode=parse_mode)\n`;
            } else {
              code += `                await bot.send_document(message.chat.id, "${targetNode.data.documentUrl}", caption=text, parse_mode=parse_mode)\n`;
            }
          }
        } else {
          // Добавляем кнопки если есть
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
            // Используем универсальную функцию для создания inline клавиатуры
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
            code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
          } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
            code += '                builder = ReplyKeyboardBuilder()\n';
            targetNode.data.buttons.forEach((button: { text: string; }) => {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
            });
            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
            code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
            code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
          } else {
            code += '                await message.answer(text, parse_mode=parse_mode)\n';
          }
        }
      } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || targetNode.data.inputPrompt || "Введите ваш ответ:");
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
        const minLength = targetNode.data.minLength || 0;
        const maxLength = targetNode.data.maxLength || 0;
        const inputTimeout = targetNode.data.inputTimeout || 60;
        const saveToDatabase = targetNode.data.saveToDatabase || false;
        const placeholder = targetNode.data.placeholder || "";
        const responseOptions = targetNode.data.responseOptions || [];
        const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
        const allowSkip = targetNode.data.allowSkip || false;

        code += `                prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
        if (placeholder) {
          code += `                placeholder_text = "${placeholder}"\n`;
          code += '                prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
        }

        // Проверяем, является ли это узлом ответа на кнопку
        if (responseType === 'buttons' && responseOptions.length > 0) {
          // Для узлов ответа на кнопки настраиваем button_response_config
          code += '                \n';
          code += '                # Создаем кнопки для выбора ответа\n';
          code += '                builder = InlineKeyboardBuilder()\n';

          // Создаем кнопки для вариантов ответа
          const responseButtons = responseOptions.map((option: ResponseOption | string, index: number) => {
            const normalizedOption: ResponseOption = typeof option === 'string'
              ? { text: option, value: option }
              : option;
            return {
              text: normalizedOption.text,
              action: 'goto',
              target: `response_${targetNode.id}_${index}`,
              id: `response_${targetNode.id}_${index}`
            };
          });

          if (allowSkip) {
            responseButtons.push({
              text: "⏭️ Пропустить",
              action: 'goto',
              target: `skip_${targetNode.id}`,
              id: `skip_${targetNode.id}`
            });
          }

          // Используем универсальную функцию для создания inline клавиатуры
          code += generateInlineKeyboardCode(responseButtons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += '                await message.answer(prompt_text, reply_markup=keyboard)\n';
          code += '                \n';
          code += '                # Настраиваем конфигурацию кнопочного ответа\n';
          code += '                user_data[user_id]["button_response_config"] = {\n';
          code += `                    "variable": "${inputVariable}",\n`;
          code += `                    "node_id": "${targetNode.id}",\n`;
          code += `                    "timeout": ${inputTimeout},\n`;
          code += `                    "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
          code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
          code += '                    "selected": [],\n';
          code += '                    "success_message": "",\n';
          code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
          code += '                    "options": [\n';

          // Добавляем каждый вариант ответа с индивидуальными настройками навигации
          responseOptions.forEach((option: ResponseOption, index: number) => {
            const optionValue = option.value || option.text;
            const action = option.action || 'goto';
            const target = option.target || '';
            const url = option.url || '';

            code += '                        {\n';
            code += `                            "text": "${escapeForJsonString(option.text)}",\n`;
            code += `                            "value": "${escapeForJsonString(optionValue)}",\n`;
            code += `                            "action": "${action}",\n`;
            code += `                            "target": "${target}",\n`;
            code += `                            "url": "${url}",\n`;
            code += `                            "callback_data": "response_${targetNode.id}_${index}"\n`;
            code += '                        }';
            if (index < responseOptions.length - 1) {
              code += ',';
            }
            code += '\n';
          });

          code += '                    ],\n';

          // Находим следующий узел для этого user-input узла (fallback)
          const nextConnection = connections.find(conn => conn.source === targetNode.id);
          if (nextConnection) {
            code += `                    "next_node_id": "${nextConnection.target}"\n`;
          } else {
            code += '                    "next_node_id": None\n';
          }
          code += '                }\n';
        } else {
          // Для узлов текстового ввода используем waiting_for_input
          code += '                await message.answer(prompt_text)\n';
          code += '                \n';

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем collectUserInput перед установкой waiting_for_input
          const textNodeCollectInput = targetNode.data.collectUserInput === true ||
            targetNode.data.enableTextInput === true ||
            targetNode.data.enablePhotoInput === true ||
            targetNode.data.enableVideoInput === true ||
            targetNode.data.enableAudioInput === true ||
            targetNode.data.enableDocumentInput === true;

          if (textNodeCollectInput) {
            code += '                # Настраиваем ожидание ввода (collectUserInput=true)\n';
            code += '                user_data[user_id]["waiting_for_input"] = {\n';
            code += `                    "type": "${inputType}",\n`;
            code += `                    "variable": "${inputVariable}",\n`;
            code += '                    "validation": "",\n';
            code += `                    "min_length": ${minLength},\n`;
            code += `                    "max_length": ${maxLength},\n`;
            code += `                    "timeout": ${inputTimeout},\n`;
            code += '                    "required": True,\n';
            code += '                    "allow_skip": False,\n';
            code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
            code += '                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
            code += '                    "success_message": "",\n';
            code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
            code += `                    "node_id": "${targetNode.id}",\n`;

            // Находим следующий узел для этого user-input узла
            const nextConnection = connections.find(conn => conn.source === targetNode.id);
            if (nextConnection) {
              code += `                    "next_node_id": "${nextConnection.target}"\n`;
            } else {
              code += '                    "next_node_id": None\n';
            }
            code += '                }\n';
          } else {
            code += `                # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
          }
        }
      } else if (targetNode.type === 'message') {
        // Обработка узлов сообщений
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                await fake_message.answer(${formattedText})\n`;
        code += `                logging.info(f"Отправлено сообщение узла ${targetNode.id}")\n`;
      } else {
        // Для других типов узлов просто логируем
        code += `                logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
      }
    });

    code += '            else:\n';
    code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '            # No nodes available for navigation\n';
    code += '            logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  code += '        except Exception as e:\n';
  code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '\n';
  return code;
}
