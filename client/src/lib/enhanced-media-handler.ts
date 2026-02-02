import { Node } from '@shared/schema';
import { formatTextForPython } from './format';
import { generateUniversalVariableReplacement } from './utils/generateUniversalVariableReplacement';
import { generateConditionalMessageLogic } from './Conditional';
import { generateInlineKeyboardCode } from './Keyboard';

/**
 * Генерирует код для обработки медиа-контента в узлах
 * @param node - Узел, для которого генерируется код
 * @param indent - Отступ для кода
 * @param context - Контекст вызова ('message' для обработчиков команд, 'callback' для callback-обработчиков)
 * @returns Сгенерированный Python-код
 */
export function generateEnhancedMediaHandlerCode(node: Node, indent: string = '    ', context: 'message' | 'callback' = 'callback'): string {
  let code = '';

  // Определяем переменную для получения user_id в зависимости от контекста
  const userIdSource = context === 'message' ? 'message.from_user.id' : 'callback_query.from_user.id';
  const sendMessageMethod = context === 'message' ? 'message.answer' : 'callback_query.message.answer';
  const editMessageMethod = context === 'message' ? 'message.edit_text' : 'callback_query.message.edit_text';
  const botSendMessageMethod = context === 'message' ? 'message.chat.id' : 'callback_query.from_user.id';
  const safeEditOrSendMethod = context === 'message' ? 'message' : 'callback_query';

  // Проверяем наличие медиа-контента
  const hasImage = node.data.imageUrl;
  const hasVideo = node.data.videoUrl;
  const hasAudio = node.data.audioUrl;
  const hasDocument = node.data.documentUrl;

  if (hasImage || hasVideo || hasAudio || hasDocument) {
    // Сохраняем медиа-URL в переменные для последующего использования
    if (hasImage) {
      code += `${indent}# Сохраняем imageUrl в переменную image_url_${node.id}\n`;
      code += `${indent}user_id = ${userIdSource}\n`;
      code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
      code += `${indent}user_data[user_id]["image_url_${node.id}"] = "${node.data.imageUrl}"\n`;
      code += `${indent}await update_user_data_in_db(user_id, "image_url_${node.id}", "${node.data.imageUrl}")\n`;
    }

    if (hasVideo) {
      code += `${indent}# Сохраняем videoUrl в переменную video_url_${node.id}\n`;
      code += `${indent}user_id = ${userIdSource}\n`;
      code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
      code += `${indent}user_data[user_id]["video_url_${node.id}"] = "${node.data.videoUrl}"\n`;
      code += `${indent}await update_user_data_in_db(user_id, "video_url_${node.id}", "${node.data.videoUrl}")\n`;
    }

    if (hasAudio) {
      code += `${indent}# Сохраняем audioUrl в переменную audio_url_${node.id}\n`;
      code += `${indent}user_id = ${userIdSource}\n`;
      code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
      code += `${indent}user_data[user_id]["audio_url_${node.id}"] = "${node.data.audioUrl}"\n`;
      code += `${indent}await update_user_data_in_db(user_id, "audio_url_${node.id}", "${node.data.audioUrl}")\n`;
    }

    if (hasDocument) {
      code += `${indent}# Сохраняем documentUrl в переменную document_url_${node.id}\n`;
      code += `${indent}user_id = ${userIdSource}\n`;
      code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
      code += `${indent}user_data[user_id]["document_url_${node.id}"] = "${node.data.documentUrl}"\n`;
      code += `${indent}await update_user_data_in_db(user_id, "document_url_${node.id}", "${node.data.documentUrl}")\n`;
    }

    // Отправляем медиа с текстом в качестве подписи
    if (hasImage) {
      code += `${indent}# Отправляем изображение с текстом\n`;
      code += `${indent}try:\n`;
      code += `${indent}    processed_caption = replace_variables_in_text(text, user_vars)\n`;

      // Добавляем клавиатуру, если она есть
      if (node.data.buttons && node.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(node.data.buttons, `${indent}    `, node.id, node.data, [node.id]);
        code += `${indent}    await bot.send_photo(${botSendMessageMethod}, "${node.data.imageUrl}", caption=processed_caption, reply_markup=keyboard)\n`;
      } else {
        code += `${indent}    await bot.send_photo(${botSendMessageMethod}, "${node.data.imageUrl}", caption=processed_caption)\n`;
      }
      code += `${indent}except Exception as e:\n`;
      code += `${indent}    logging.error(f"Ошибка отправки изображения: {e}")\n`;
      code += `${indent}    logging.error(f"URL изображения: ${node.data.imageUrl}")\n`;
      code += `${indent}    logging.error(f"Тип ошибки: {type(e).__name__}")\n`;
      code += `${indent}    # Fallback на обычное сообщение\n`;
      if (context === 'message') {
        code += `${indent}    await message.answer(processed_caption)\n`;
      } else {
        code += `${indent}    await safe_edit_or_send(callback_query, processed_caption)\n`;
      }
    } else if (hasVideo) {
      code += `${indent}# Отправляем видео с текстом\n`;
      code += `${indent}try:\n`;
      code += `${indent}    processed_caption = replace_variables_in_text(text, user_vars)\n`;

      if (node.data.buttons && node.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(node.data.buttons, `${indent}    `, node.id, node.data, [node.id]);
        code += `${indent}    await bot.send_video(${botSendMessageMethod}, "${node.data.videoUrl}", caption=processed_caption, reply_markup=keyboard)\n`;
      } else {
        code += `${indent}    await bot.send_video(${botSendMessageMethod}, "${node.data.videoUrl}", caption=processed_caption)\n`;
      }
      code += `${indent}except Exception as e:\n`;
      code += `${indent}    logging.error(f"Ошибка отправки видео: {e}")\n`;
      code += `${indent}    logging.error(f"URL видео: ${node.data.videoUrl}")\n`;
      code += `${indent}    logging.error(f"Тип ошибки: {type(e).__name__}")\n`;
      code += `${indent}    # Fallback на обычное сообщение\n`;
      if (context === 'message') {
        code += `${indent}    await message.answer(processed_caption)\n`;
      } else {
        code += `${indent}    await safe_edit_or_send(callback_query, processed_caption)\n`;
      }
    } else if (hasAudio) {
      code += `${indent}# Отправляем аудио с текстом\n`;
      code += `${indent}try:\n`;
      code += `${indent}    processed_caption = replace_variables_in_text(text, user_vars)\n`;

      if (node.data.buttons && node.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(node.data.buttons, `${indent}    `, node.id, node.data, [node.id]);
        code += `${indent}    await bot.send_audio(${botSendMessageMethod}, "${node.data.audioUrl}", caption=processed_caption, reply_markup=keyboard)\n`;
      } else {
        code += `${indent}    await bot.send_audio(${botSendMessageMethod}, "${node.data.audioUrl}", caption=processed_caption)\n`;
      }
      code += `${indent}except Exception as e:\n`;
      code += `${indent}    logging.error(f"Ошибка отправки аудио: {e}")\n`;
      code += `${indent}    logging.error(f"URL аудио: ${node.data.audioUrl}")\n`;
      code += `${indent}    logging.error(f"Тип ошибки: {type(e).__name__}")\n`;
      code += `${indent}    # Fallback на обычное сообщение\n`;
      if (context === 'message') {
        code += `${indent}    await message.answer(processed_caption)\n`;
      } else {
        code += `${indent}    await safe_edit_or_send(callback_query, processed_caption)\n`;
      }
    } else if (hasDocument) {
      code += `${indent}# Отправляем документ с текстом\n`;
      code += `${indent}try:\n`;
      code += `${indent}    processed_caption = replace_variables_in_text(text, user_vars)\n`;

      if (node.data.buttons && node.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(node.data.buttons, `${indent}    `, node.id, node.data, [node.id]);
        code += `${indent}    await bot.send_document(${botSendMessageMethod}, "${node.data.documentUrl}", caption=processed_caption, reply_markup=keyboard)\n`;
      } else {
        code += `${indent}    await bot.send_document(${botSendMessageMethod}, "${node.data.documentUrl}", caption=processed_caption)\n`;
      }
      code += `${indent}except Exception as e:\n`;
      code += `${indent}    logging.error(f"Ошибка отправки документа: {e}")\n`;
      code += `${indent}    logging.error(f"URL документа: ${node.data.documentUrl}")\n`;
      code += `${indent}    logging.error(f"Тип ошибки: {type(e).__name__}")\n`;
      code += `${indent}    # Fallback на обычное сообщение\n`;
      if (context === 'message') {
        code += `${indent}    await message.answer(processed_caption)\n`;
      } else {
        code += `${indent}    await safe_edit_or_send(callback_query, processed_caption)\n`;
      }
    }
  } else {
    // Если нет медиа, используем обычную логику
    code += `${indent}# Нет медиа-контента, используем обычную отправку сообщения\n`;
    code += `${indent}try:\n`;
    code += `${indent}    if keyboard:\n`;
    if (context === 'message') {
      code += `${indent}        await message.answer(text, reply_markup=keyboard)\n`;
    } else {
      code += `${indent}        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n`;
    }
    code += `${indent}    else:\n`;
    code += `${indent}        await ${sendMessageMethod}(text)\n`;
    code += `${indent}except Exception as e:\n`;
    code += `${indent}    logging.debug(f"Ошибка отправки сообщения: {e}")\n`;
    code += `${indent}    if keyboard:\n`;
    code += `${indent}        await ${sendMessageMethod}(text, reply_markup=keyboard)\n`;
    code += `${indent}    else:\n`;
    code += `${indent}        await ${sendMessageMethod}(text)\n`;
  }

  return code;
}

/**
 * Генерирует обработчик для узла с поддержкой медиа и текста
 * @param node - Узел, для которого генерируется обработчик
 * @returns Сгенерированный Python-код обработчика
 */
export function generateEnhancedMessageHandler(node: Node): string {
  let code = '';

  // Для узлов типа command создаем отдельный обработчик
  if (node.type === 'command') {
    code += `\n@dp.message(Command("${node.data.command}"))\n`;
    code += `async def ${node.data.command.replace(/\//g, '')}_handler(message: types.Message):\n`;
    code += '    user_id = message.from_user.id\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    \n';

    // Устанавливаем текст сообщения
    const messageText = node.data.messageText || "Сообщение";
    const formattedText = formatTextForPython(messageText);
    code += `    text = ${formattedText}\n`;
    code += '    \n';

    // Заменяем переменные в тексте
    code += generateUniversalVariableReplacement('    ');

    // Обработка условных сообщений
    if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
      code += '    \n';
      code += '    # Проверяем условные сообщения\n';
      code += '    user_vars = await get_user_from_db(user_id)\n';
      code += '    if not user_vars:\n';
      code += '        user_vars = user_data.get(user_id, {})\n';
      code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
      code += '    \n';
    } else {
      code += '    user_vars = await get_user_from_db(user_id)\n';
      code += '    if not user_vars:\n';
      code += '        user_vars = user_data.get(user_id, {})\n';
      code += '    \n';
    }

    // Создаем клавиатуру, если есть кнопки
    if (node.data.buttons && node.data.buttons.length > 0) {
      code += generateInlineKeyboardCode(node.data.buttons, '    ', node.id, node.data, [node.id]);
    } else {
      code += '    keyboard = None\n';
    }

    // Добавляем обработку медиа-контента
    code += generateEnhancedMediaHandlerCode(node, '    ', node.type === 'command' ? 'message' : 'callback');
  } else {
    // Для узлов типа message создаем callback-обработчик
    code += `\n@dp.callback_query(lambda c: c.data == "${node.id}" or c.data.startswith("${node.id}_btn_"))\n`;
    code += `async def handle_callback_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query: types.CallbackQuery):\n`;
    code += '    await callback_query.answer()\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
    code += '    \n';

    // Устанавливаем текст сообщения
    const messageText = node.data.messageText || "Сообщение";
    const formattedText = formatTextForPython(messageText);
    code += `    text = ${formattedText}\n`;
    code += '    \n';

    // Заменяем переменные в тексте
    code += generateUniversalVariableReplacement('    ');

    // Обработка условных сообщений
    if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
      code += '    \n';
      code += '    # Проверяем условные сообщения\n';
      code += '    user_vars = await get_user_from_db(user_id)\n';
      code += '    if not user_vars:\n';
      code += '        user_vars = user_data.get(user_id, {})\n';
      code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
      code += '    \n';
    } else {
      code += '    user_vars = await get_user_from_db(user_id)\n';
      code += '    if not user_vars:\n';
      code += '        user_vars = user_data.get(user_id, {})\n';
      code += '    \n';
    }

    // Создаем клавиатуру, если есть кнопки
    if (node.data.buttons && node.data.buttons.length > 0) {
      code += generateInlineKeyboardCode(node.data.buttons, '    ', node.id, node.data, [node.id]);
    } else {
      code += '    keyboard = None\n';
    }

    // Добавляем обработку медиа-контента
    code += generateEnhancedMediaHandlerCode(node, '    ', node.type === 'command' ? 'message' : 'callback');
  }

  return code;
}