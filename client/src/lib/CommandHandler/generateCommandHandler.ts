import { stripHtmlTags } from '../format/stripHtmlTags';
import { formatTextForPython } from '../format/formatTextForPython';
import { generateUniversalVariableReplacement } from '../utils/generateUniversalVariableReplacement';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { Node } from '@shared/schema';
import { isPrivateChatCheck } from '../SecurityChecks/isPrivateChatCheck';
import { isAdminCheck } from '../SecurityChecks/adminCheck';
import { isAuthCheck } from '../SecurityChecks/authCheck';

export function generateCommandHandler(node: Node, userDatabaseEnabled: boolean): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');

  let code = `\n@dp.message(Command("${command.replace('/', '')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

  // Добавляем логирование для отладки
  code += `    logging.info(f"Команда ${command} вызвана пользователем {message.from_user.id}")\n`;

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await isPrivateChatCheck(message):\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await isAdminCheck(message):\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await isAuthCheck(message):\n';
    code += '        return\n';
  }

  // Сохраняем информацию о команде в пользовательских данных
  code += '    # Сохраняем пользователя и статистику использования команд\n';
  code += '    user_id = message.from_user.id\n';
  code += '    username = message.from_user.username\n';
  code += '    first_name = message.from_user.first_name\n';
  code += '    last_name = message.from_user.last_name\n';
  code += '    \n';

  if (userDatabaseEnabled) {
    code += '    # Сохраняем пользователя в базу данных\n';
    code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    await update_user_data_in_db(user_id, "user_name", user_name)\n';
    code += '    await update_user_data_in_db(user_id, "first_name", first_name)\n';
    code += '    await update_user_data_in_db(user_id, "last_name", last_name)\n';
    code += '    await update_user_data_in_db(user_id, "username", username)\n';
    code += '    \n';
    code += '    # Обновляем статистику команд в БД\n';
    code += `    if saved_to_db:\n`;
    code += `        await update_user_data_in_db(user_id, "command_${command.replace('/', '')}", datetime.now().isoformat())\n`;
    code += '    \n';
  }

  code += '    # Сохранение в локальное хранилище\n';
  code += '    # Инициализируем базовые переменные пользователя в локальном хранилище\n';
  code += '    user_name = init_user_variables(user_id, message.from_user)\n';
  code += '    \n';
  code += '    if "commands_used" not in user_data[user_id]:\n';
  code += '        user_data[user_id]["commands_used"] = {}\n';
  code += `    user_data[user_id]["commands_used"]["${command}"] = user_data[user_id]["commands_used"].get("${command}", 0) + 1\n`;

  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки";
  const cleanedMessageText = stripHtmlTags(messageText); // Удаляем HTML теги
  const formattedText = formatTextForPython(cleanedMessageText);

  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += '\n    # Проверяем условные сообщения\n';
    code += '    text = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    if (userDatabaseEnabled) {
      code += '    user_record = await get_user_from_db(user_id)\n';
      code += '    if not user_record:\n';
      code += '        user_record = user_data.get(user_id, {})\n';
    } else {
      code += '    user_record = user_data.get(user_id, {})\n';
    }
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';

    // Generate conditional logic using helper function
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');

    // Add fallback
    code += '    else:\n';

    if (node.data.fallbackMessage) {
      const cleanedFallbackText = stripHtmlTags(node.data.fallbackMessage);
      const fallbackText = formatTextForPython(cleanedFallbackText);
      code += `        text = ${fallbackText}\n`;
      code += '        logging.info("Используется запасное сообщение")\n';
    } else {
      code += `        text = ${formattedText}\n`;
      code += '        logging.info("Используется основное сообщение узла")\n';
    }

    code += '    \n';

  // Сохраняем медиа-переменные из данных узла в user_data
  if (node.data.imageUrl) {
    code += `    # Сохраняем imageUrl в переменную image_url_${node.id}\n`;
    code += `    user_data[user_id]["image_url_${node.id}"] = "${node.data.imageUrl}"\n`;
    code += `    await update_user_data_in_db(user_id, "image_url_${node.id}", "${node.data.imageUrl}")\n`;
  }
  if (node.data.documentUrl) {
    code += `    # Сохраняем documentUrl в переменную document_url_${node.id}\n`;
    code += `    user_data[user_id]["document_url_${node.id}"] = "${node.data.documentUrl}"\n`;
    code += `    await update_user_data_in_db(user_id, "document_url_${node.id}", "${node.data.documentUrl}")\n`;
  }
  if (node.data.videoUrl) {
    code += `    # Сохраняем videoUrl в переменную video_url_${node.id}\n`;
    code += `    user_data[user_id]["video_url_${node.id}"] = "${node.data.videoUrl}"\n`;
    code += `    await update_user_data_in_db(user_id, "video_url_${node.id}", "${node.data.videoUrl}")\n`;
  }
  if (node.data.audioUrl) {
    code += `    # Сохраняем audioUrl в переменную audio_url_${node.id}\n`;
    code += `    user_data[user_id]["audio_url_${node.id}"] = "${node.data.audioUrl}"\n`;
    code += `    await update_user_data_in_db(user_id, "audio_url_${node.id}", "${node.data.audioUrl}")\n`;
  }

  // Добавляем универсальную замену переменных
  code += generateUniversalVariableReplacement('    ');
  } else {
    code += `\n    text = ${formattedText}\n`;

    // Сохраняем медиа-переменные из данных узла в user_data
    if (node.data.imageUrl) {
      code += `    # Сохраняем imageUrl в переменную image_url_${node.id}\n`;
      code += `    user_data[user_id]["image_url_${node.id}"] = "${node.data.imageUrl}"\n`;
      code += `    await update_user_data_in_db(user_id, "image_url_${node.id}", "${node.data.imageUrl}")\n`;
    }
    if (node.data.documentUrl) {
      code += `    # Сохраняем documentUrl в переменную document_url_${node.id}\n`;
      code += `    user_data[user_id]["document_url_${node.id}"] = "${node.data.documentUrl}"\n`;
      code += `    await update_user_data_in_db(user_id, "document_url_${node.id}", "${node.data.documentUrl}")\n`;
    }
    if (node.data.videoUrl) {
      code += `    # Сохраняем videoUrl в переменную video_url_${node.id}\n`;
      code += `    user_data[user_id]["video_url_${node.id}"] = "${node.data.videoUrl}"\n`;
      code += `    await update_user_data_in_db(user_id, "video_url_${node.id}", "${node.data.videoUrl}")\n`;
    }
    if (node.data.audioUrl) {
      code += `    # Сохраняем audioUrl в переменную audio_url_${node.id}\n`;
      code += `    user_data[user_id]["audio_url_${node.id}"] = "${node.data.audioUrl}"\n`;
      code += `    await update_user_data_in_db(user_id, "audio_url_${node.id}", "${node.data.audioUrl}")\n`;
    }

    // Добавляем универсальную замену переменных
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
  }

  // Проверяем наличие attachedMedia или прямых URL (imageUrl, documentUrl и т.д.) и генерируем соответствующий код
  let attachedMedia = node.data.attachedMedia || [];
  // Если attachedMedia пустой, проверяем другие поля медиа
  if (!attachedMedia || attachedMedia.length === 0) {
    if (node.data.imageUrl) {
      attachedMedia = [`image_url_${node.id}`];
    } else if (node.data.documentUrl) {
      attachedMedia = [`document_url_${node.id}`];
    } else if (node.data.videoUrl) {
      attachedMedia = [`video_url_${node.id}`];
    } else if (node.data.audioUrl) {
      attachedMedia = [`audio_url_${node.id}`];
    }
  }

  if (attachedMedia.length > 0) {
    // Создаем карту медиапеременных для этого узла
    const mediaVariablesMap = new Map();
    attachedMedia.forEach(mediaVar => {
      // Определяем тип медиа по имени переменной
      let mediaType = 'photo'; // по умолчанию
      if (mediaVar.startsWith('video_url_')) mediaType = 'video';
      else if (mediaVar.startsWith('audio_url_')) mediaType = 'audio';
      else if (mediaVar.startsWith('document_url_')) mediaType = 'document';
      else if (mediaVar.startsWith('image_url_')) mediaType = 'photo';

      mediaVariablesMap.set(mediaVar, {
        type: mediaType,
        variable: mediaVar
      });
    });

    // Генерируем код для отправки медиа, адаптируя его для использования в command_handler
    let mediaCode = '';

    // Сначала сохраняем значение переменной из imageUrl в базу данных
    const mediaUrl = node.data.imageUrl || node.data.documentUrl || node.data.videoUrl || node.data.audioUrl;
    mediaCode += `    # Сохраняем значение переменной ${attachedMedia[0]} в базу данных\n`;
    mediaCode += `    await update_user_data_in_db(user_id, "${attachedMedia[0]}", "${mediaUrl}")\n`;
    mediaCode += '\n';
    mediaCode += '    # Обновляем user_vars, чтобы включить только что сохраненную переменную\n';
    mediaCode += '    user_vars = await get_user_from_db(user_id)\n';
    mediaCode += '    if not user_vars:\n';
    mediaCode += '        user_vars = user_data.get(user_id, {})\n';
    mediaCode += '    if not isinstance(user_vars, dict):\n';
    mediaCode += '        user_vars = user_data.get(user_id, {})\n';
    mediaCode += '\n';
    mediaCode += '    # Проверяем наличие прикрепленного медиа из переменной\n';
    mediaCode += '    attached_media = None\n';
    mediaCode += `    if user_vars and "${attachedMedia[0]}" in user_vars:\n`;
    mediaCode += `        media_data = user_vars["${attachedMedia[0]}"]\n`;
    mediaCode += '        if isinstance(media_data, dict) and "value" in media_data:\n';
    mediaCode += '            attached_media = media_data["value"]\n';
    mediaCode += '        elif isinstance(media_data, str):\n';
    mediaCode += '            attached_media = media_data\n';
    mediaCode += '        # Также проверяем, может быть переменная хранится напрямую в user_data\n';
    mediaCode += `    elif "${attachedMedia[0]}" in user_data.get(user_id, {}):\n`;
    mediaCode += `        attached_media = user_data[user_id]["${attachedMedia[0]}"]\n`;
    mediaCode += '\n';
    mediaCode += '    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение\n';
    mediaCode += '    if attached_media and str(attached_media).strip():\n';

    // Определяем тип медиа и метод отправки
    let mediaType = 'photo';
    if (attachedMedia[0].startsWith('video_url_')) mediaType = 'video';
    else if (attachedMedia[0].startsWith('audio_url_')) mediaType = 'audio';
    else if (attachedMedia[0].startsWith('document_url_')) mediaType = 'document';

    mediaCode += `        logging.info(f"📎 Отправка ${mediaType} из переменной ${attachedMedia[0]}: {attached_media}")\n`;
    mediaCode += '        try:\n';
    mediaCode += '            # Заменяем переменные в тексте перед отправкой медиа\n';
    mediaCode += '            processed_caption = replace_variables_in_text(text, user_vars)\n';

    const keyboardParam = (node.data.allowMultipleSelection || node.data.keyboardType !== 'none') ? ', reply_markup=keyboard' : '';
    const parseModeParam = node.data.formatMode && node.data.formatMode !== 'none' ? `, parse_mode=ParseMode.${node.data.formatMode.toUpperCase()}` : '';

    // Преобразуем внутренний путь в публичный URL или file_id, если это внутренний путь
    mediaCode += '            # Проверяем, является ли путь внутренним (uploads)\n';
    mediaCode += '            if attached_media.startswith("/uploads/"):\n';  // Это будет преобразовано в Python код как .startswith()
    mediaCode += '                # Для внутренних файлов пытаемся загрузить их в Telegram и получить file_id\n';
    mediaCode += '                try:\n';
    mediaCode += '                    # Проверяем, доступен ли файл локально\n';
    mediaCode += '                    import os\n';
    mediaCode += '                    # Формируем полный путь к файлу на сервере\n';
    mediaCode += '                    server_file_path = os.getcwd() + attached_media  # Предполагаем, что путь относительно рабочей директории\n';
    mediaCode += '                    if os.path.exists(server_file_path):\n';

    // Определяем метод отправки в зависимости от типа медиа
    if (mediaType === 'photo') {
      mediaCode += '                        # Загружаем файл в Telegram и получаем file_id\n';
      mediaCode += '                        from aiogram.types import FSInputFile\n';
      mediaCode += '                        photo_file = FSInputFile(server_file_path)\n';
      mediaCode += '                        result = await bot.send_photo(message.chat.id, photo_file, caption=processed_caption)\n';
    } else if (mediaType === 'document') {
      mediaCode += '                        # Загружаем файл в Telegram и получаем file_id\n';
      mediaCode += '                        from aiogram.types import FSInputFile\n';
      mediaCode += '                        doc_file = FSInputFile(server_file_path)\n';
      mediaCode += '                        result = await bot.send_document(message.chat.id, doc_file, caption=processed_caption)\n';
    } else if (mediaType === 'video') {
      mediaCode += '                        # Загружаем файл в Telegram и получаем file_id\n';
      mediaCode += '                        from aiogram.types import FSInputFile\n';
      mediaCode += '                        video_file = FSInputFile(server_file_path)\n';
      mediaCode += '                        result = await bot.send_video(message.chat.id, video_file, caption=processed_caption)\n';
    } else if (mediaType === 'audio') {
      mediaCode += '                        # Загружаем файл в Telegram и получаем file_id\n';
      mediaCode += '                        from aiogram.types import FSInputFile\n';
      mediaCode += '                        audio_file = FSInputFile(server_file_path)\n';
      mediaCode += '                        result = await bot.send_audio(message.chat.id, audio_file, caption=processed_caption)\n';
    }

    mediaCode += '                        logging.info(f"🖼️ ' + (mediaType.charAt(0).toUpperCase() + mediaType.slice(1)) + ' успешно отправлено из локального файла: {attached_media}")\n';
    mediaCode += '                        return  # Завершаем выполнение, так как медиа уже отправлено\n';
    mediaCode += '                    else:\n';
    mediaCode += '                        logging.error(f"❌ Файл не найден на сервере: {server_file_path}")\n';
    mediaCode += '                        # Если файл не найден, используем публичный URL как резервный вариант\n';
    mediaCode += '                        public_url = attached_media\n';
    mediaCode += '                        if "localhost" in API_BASE_URL or "127.0.0.1" in API_BASE_URL or "0.0.0.0" in API_BASE_URL:\n';
    mediaCode += '                            # Для локальных адресов используем публичный URL (например, с доменом ngrok или другим публичным адресом)\n';
    mediaCode += '                            logging.warning(f"⚠️ Локальный URL не доступен для Telegram: {attached_media}")\n';
    mediaCode += '                            # Вместо этого отправляем текстовое сообщение с уведомлением\n';
    mediaCode += '                            await message.answer(processed_caption + "\\n(Медиа недоступно в тестовом режиме)")\n';
    mediaCode += '                            return  # Прерываем выполнение, чтобы не отправлять медиа\n';
    mediaCode += '                        else:\n';
    mediaCode += '                            # Для публичных адресов формируем полный URL\n';
    mediaCode += '                            if API_BASE_URL.endswith("/"):\n';
    mediaCode += '                                public_url = API_BASE_URL + attached_media[1:]  # Убираем начальный слэш\n';
    mediaCode += '                            else:\n';
    mediaCode += '                                public_url = API_BASE_URL + attached_media\n';
    mediaCode += '                        \n';
    mediaCode += `                        await bot.send_${mediaType}(message.chat.id, public_url, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
    mediaCode += '                except Exception as upload_error:\n';
    mediaCode += '                    logging.error(f"Ошибка при загрузке локального файла: {upload_error}")\n';
    mediaCode += '                    # В случае ошибки используем публичный URL как резервный вариант\n';
    mediaCode += '                    public_url = attached_media\n';
    mediaCode += '                    if "localhost" in API_BASE_URL or "127.0.0.1" in API_BASE_URL or "0.0.0.0" in API_BASE_URL:\n';
    mediaCode += '                        # Для локальных адресов используем публичный URL (например, с доменом ngrok или другим публичным адресом)\n';
    mediaCode += '                        logging.warning(f"⚠️ Локальный URL не доступен для Telegram: {attached_media}")\n';
    mediaCode += '                        # Вместо этого отправляем текстовое сообщение с уведомлением\n';
    mediaCode += '                        await message.answer(processed_caption + "\\n(Медиа недоступно в тестовом режиме)")\n';
    mediaCode += '                        return  # Прерываем выполнение, чтобы не отправлять медиа\n';
    mediaCode += '                    else:\n';
    mediaCode += '                        # Для публичных адресов формируем полный URL\n';
    mediaCode += '                        if API_BASE_URL.endswith("/"):\n';
    mediaCode += '                            public_url = API_BASE_URL + attached_media[1:]  # Убираем начальный слэш\n';
    mediaCode += '                        else:\n';
    mediaCode += '                            public_url = API_BASE_URL + attached_media\n';
    mediaCode += '                    \n';
    mediaCode += `                    await bot.send_${mediaType}(message.chat.id, public_url, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
    mediaCode += '            else:\n';
    mediaCode += '                # Для публичных URL используем стандартную логику\n';
    mediaCode += `                await bot.send_${mediaType}(message.chat.id, attached_media, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
    mediaCode += '        except Exception as e:\n';
    mediaCode += `            logging.error(f"Ошибка отправки ${mediaType}: {e}")\n`;
    mediaCode += '            # Fallback на обычное сообщение при ошибке\n';
    mediaCode += `            await message.answer(text${parseModeParam}${keyboardParam})\n`;
    mediaCode += '    else:\n';
    mediaCode += '        # Медиа не найдено, отправляем обычное текстовое сообщение\n';
    mediaCode += `        logging.info(f"📝 Медиа ${attachedMedia[0]} не найдено, отправка текстового сообщения")\n`;
    mediaCode += '        # Заменяем переменные в тексте перед отправкой\n';
    mediaCode += '        processed_text = replace_variables_in_text(text, user_vars)\n';
    mediaCode += `        await message.answer(processed_text${parseModeParam}${keyboardParam})\n`;

    if (mediaCode) {
      // Если есть медиа, возвращаем код с медиа вместо обычного сообщения
      return code + mediaCode;
    }
  }

  return code + generateKeyboard(node);
}
