/**
 * Функции для логирования сообщений в базу данных
 */

/**
 * Экранирует строковое значение для безопасного использования в Python-коде
 * @param {string} value - Значение для экранирования
 * @returns {string} Экранированное значение
 */
function escapePythonString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'None';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  // Экранируем кавычки и обратные слэши для использования в Python строках
  const escaped = value
    .toString()
    .replace(/\\/g, '\\\\')  // Экранируем обратные слэши
    .replace(/'/g, "\\'")    // Экранируем одинарные кавычки
    .replace(/"/g, '\\"');   // Экранируем двойные кавычки

  return `'${escaped}'`;
}

/**
 * Генерирует код для логирования сообщений в базу данных
 * @param {boolean} userDatabaseEnabled - Флаг включения пользовательской базы данных
 * @param {number | null} projectId - ID проекта
 * @param {boolean} hasInlineButtonsValue - Результат вызова hasInlineButtons
 * @returns {string} Сгенерированный код для логирования сообщений
 */
export function generateMessageLoggingCode(userDatabaseEnabled: boolean, projectId: number | null, hasInlineButtonsValue: boolean): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  let code = '';

  code += '# API configuration для сохранения сообщений\n';
  code += '# Определяем URL сервера автоматически\n';
  code += 'def get_api_base_url():\n';
  code += '    # Сначала пробуем получить из переменных окружения\n';
  code += '    env_url = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN"))\n';
  code += '    if env_url:\n';
  code += '        # Если URL начинается с http/https, используем как есть\n';
  code += '        if env_url.startswith(("http://", "https://")):\n';
  code += '            # ИСПРАВЛЕНИЕ: Для локальных адресов всегда используем http, а не https\n';
  code += '            if "localhost" in env_url or "127.0.0.1" in env_url or "0.0.0.0" in env_url:\n';
  code += '                if env_url.startswith("https://"):\n';
  code += '                    # Заменяем https на http для локальных адресов\n';
  code += '                    env_url = "http://" + env_url[8:]  # Убираем "https://" и добавляем "http://"\n';
  code += '            return env_url\n';
  code += '        # Если нет, добавляем протокол\n';
  code += '        elif ":" in env_url:  # содержит порт\n';
  code += '            return f"http://{env_url}"\n';
  code += '        else:  # домен без порта\n';
  code += '            return f"https://{env_url}"\n';
  code += '    \n';
  code += '    # Пытаемся определить URL автоматически\n';
  code += '    try:\n';
  code += '        import socket\n';
  code += '        # Получаем IP-адрес машины\n';
  code += '        hostname = socket.gethostname()\n';
  code += '        local_ip = socket.gethostbyname(hostname)\n';
  code += '        \n';
  code += '        # Определяем порт из переменной окружения или используем 5000 по умолчанию\n';
  code += '        port = os.getenv("API_PORT", "5000")\n';
  code += '        \n';
  code += '        # Проверяем, является ли IP локальным\n';
  code += '        if local_ip.startswith(("127.", "192.168.", "10.", "172.")) or local_ip == "::1":\n';
  code += '            # Для локальных IP используем localhost\n';
  code += '            return f"http://localhost:{port}"\n';
  code += '        else:\n';
  code += '            # Для внешних IP используем IP-адрес\n';
  code += '            return f"http://{local_ip}:{port}"\n';
  code += '    except:\n';
  code += '        # Если не удалось определить автоматически, используем localhost с портом из переменной окружения\n';
  code += '        port = os.getenv("API_PORT", "5000")\n';
  code += '        return f"http://localhost:{port}"\n';
  code += '\n';
  code += 'API_BASE_URL = get_api_base_url()\n';
  code += 'logging.info(f"📡 API Base URL определён как: {API_BASE_URL}")\n';
  code += `PROJECT_ID = int(os.getenv("PROJECT_ID", ${escapePythonString(projectId || 0)}))  # ID проекта в системе\n\n`;

  code += '# Функция для сохранения сообщений в базу данных через API\n';
  code += 'async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):\n';
  code += '    """Сохраняет сообщение в базу данных через API"""\n';
  code += '    try:\n';
  code += '        # Формируем полный URL для API\n';
  code += '        if API_BASE_URL.startswith("http"):\n';
  code += '            api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"\n';
  code += '        else:\n';
  code += '            api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"\n';
  code += '        \n';
  code += '        payload = {\n';
  code += '            "userId": str(user_id),\n';
  code += '            "messageType": message_type,\n';
  code += '            "messageText": message_text,\n';
  code += '            "nodeId": node_id,\n';
  code += '            "messageData": message_data or {}\n';
  code += '        }\n';
  code += '        \n';
  code += '        logging.debug(f"💾 Отправка сообщения в API: {payload}")\n';
  code += '        logging.debug(f"📡 API URL: {api_url}")\n';
  code += '        \n';
  code += '        # Определяем, использовать ли SSL\n';
  code += '        use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)\n';
  code += '        logging.debug(f"🔒 SSL требуется для URL {api_url}: {use_ssl}")\n';
  code += '        # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER\n';
  code += '        if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:\n';
  code += '            use_ssl = False\n';
  code += '            logging.debug(f"🔓 SSL принудительно отключен для локального URL: {api_url}")\n';
  code += '        \n';
  code += '        if use_ssl:\n';
  code += '            # Для внешних соединений используем SSL-контекст\n';
  code += '            connector = TCPConnector(ssl=True)\n';
  code += '        else:\n';
  code += '            # Для локальных соединений не используем SSL-контекст\n';
  code += '            # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения\n';
  code += '            import ssl\n';
  code += '            ssl_context = ssl.create_default_context()\n';
  code += '            ssl_context.check_hostname = False\n';
  code += '            ssl_context.verify_mode = ssl.CERT_NONE\n';
  code += '            connector = TCPConnector(ssl=ssl_context)\n';
  code += '        \n';
  code += '        async with aiohttp.ClientSession(connector=connector) as session:\n';
  code += '            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
  code += '                if response.status == 200:\n';
  code += '                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")\n';
  code += '                    response_data = await response.json()\n';
  code += '                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id\n';
  code += '                elif response.status == 429:\n';
  code += '                    logging.warning(f"⚠️ Слишком много запросов при попытке сохранить сообщение: {user_id}, {message_type}")\n';
  code += '                    return None\n';
  code += '                else:\n';
  code += '                    error_text = await response.text()\n';
  code += '                    logging.error(f"❌ Не удалось сохранить сообщение: {response.status} - {error_text}")\n';
  code += '                    logging.error(f"Отправленный payload: {payload}")\n';
  code += '                    return None\n';
  code += '    except aiohttp.ClientConnectorError as e:\n';
  code += '        logging.error(f"Ошибка подключения к API: {e}")\n';
  code += '    except asyncio.TimeoutError as e:\n';
  code += '        logging.error(f"Таймаут при обращении к API: {e}")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Неизвестная ошибка при сохранении сообщения: {type(e).__name__}: {e}")\n';
  code += '    return None\n\n';

  code += '# Middleware для сохранения входящих сообщений\n';
  code += 'async def message_logging_middleware(handler, event: types.Message, data: dict):\n';
  code += '    """Middleware для автоматического сохранения входящих сообщений от пользователей"""\n';
  code += '    try:\n';
  code += '        # Сохраняем входящее сообщение от пользователя\n';
  code += '        user_id = str(event.from_user.id)\n';
  code += '        message_text = event.text or event.caption or "[медиа]"\n';
  code += '        message_data = {"message_id": event.message_id}\n';
  code += '        \n';
  code += '        # Проверяем наличие фото\n';
  code += '        photo_file_id = None\n';
  code += '        if event.photo:\n';
  code += '            # Берем фото наибольшего размера (последнее в списке)\n';
  code += '            largest_photo = event.photo[-1]\n';
  code += '            photo_file_id = largest_photo.file_id\n';
  code += '            message_data["photo"] = {\n';
  code += '                "file_id": largest_photo.file_id,\n';
  code += '                "file_unique_id": largest_photo.file_unique_id,\n';
  code += '                "width": largest_photo.width,\n';
  code += '                "height": largest_photo.height,\n';
  code += '                "file_size": largest_photo.file_size if hasattr(largest_photo, "file_size") else None\n';
  code += '            }\n';
  code += '            if not message_text or message_text == "[медиа]":\n';
  code += '                message_text = "[Фото]"\n';
  code += '        \n';
  code += '        # Сохраняем сообщение в базу данных\n';
  code += '        saved_message = await save_message_to_api(\n';
  code += '            user_id=user_id,\n';
  code += '            message_type="user",\n';
  code += '            message_text=message_text,\n';
  code += '            message_data=message_data\n';
  code += '        )\n';
  code += '        \n';
  code += '        # Если есть фото и сообщение сохранено, регистрируем медиа\n';
  code += '        if photo_file_id and saved_message and "id" in saved_message:\n';
  code += '            try:\n';
  code += '                if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):\n';
  code += '                    media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '                else:\n';
  code += '                    media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '                \n';
  code += '                media_payload = {\n';
  code += '                    "messageId": saved_message["id"],\n';
  code += '                    "fileId": photo_file_id,\n';
  code += '                    "botToken": BOT_TOKEN,\n';
  code += '                    "mediaType": "photo"\n';
  code += '                }\n';
  code += '                \n';
  code += '                # Определяем, использовать ли SSL для медиа-запросов\n';
  code += '                use_ssl_media = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)\n';
  code += '                logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")\n';
  code += '                # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER\n';
  code += '                if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:\n';
  code += '                    use_ssl_media = False\n';
  code += '                    logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")\n';
  code += '                \n';
  code += '                if use_ssl_media:\n';
  code += '                    # Для внешних соединений используем SSL-контекст\n';
  code += '                    connector = TCPConnector(ssl=True)\n';
  code += '                else:\n';
  code += '                    # Для локальных соединений не используем SSL-контекст\n';
  code += '                    # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения\n';
  code += '                    import ssl\n';
  code += '                    ssl_context = ssl.create_default_context()\n';
  code += '                    ssl_context.check_hostname = False\n';
  code += '                    ssl_context.verify_mode = ssl.CERT_NONE\n';
  code += '                    connector = TCPConnector(ssl=ssl_context)\n';
  code += '                \n';
  code += '                async with aiohttp.ClientSession(connector=connector) as session:\n';
  code += '                    async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
  code += '                        if response.status == 200:\n';
  code += '                            message_id = saved_message.get("id")\n';
  code += '                            logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")\n';
  code += '                        else:\n';
  code += '                            error_text = await response.text()\n';
  code += '                            logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")\n';
  code += '            except Exception as media_error:\n';
  code += '                logging.warning(f"Ошибка при регистрации медиа: {media_error}")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")\n';
  code += '    \n';
  code += '    # Продолжаем обработку сообщения\n';
  code += '    return await handler(event, data)\n\n';

  // Добавляем callback_query middleware только если в боте есть inline кнопки
  if (hasInlineButtonsValue) {
    code += '# Middleware для сохранения нажатий на кнопки\n';
    code += 'async def callback_query_logging_middleware(handler, event: types.CallbackQuery, data: dict):\n';
    code += '    """Middleware для автоматического сохранения нажатий на кнопки"""\n';
    code += '    try:\n';
    code += '        user_id = str(event.from_user.id)\n';
    code += '        callback_data = event.data or ""\n';
    code += '        \n';
    code += '        # Пытаемся найти текст кнопки из сообщения\n';
    code += '        button_text = None\n';
    code += '        if event.message and hasattr(event.message, "reply_markup"):\n';
    code += '            reply_markup = event.message.reply_markup\n';
    code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
    code += '                for row in reply_markup.inline_keyboard:\n';
    code += '                    for btn in row:\n';
    code += '                        if hasattr(btn, "callback_data") and btn.callback_data == callback_data:\n';
    code += '                            button_text = btn.text\n';
    code += '                            break\n';
    code += '                    if button_text:\n';
    code += '                        break\n';
    code += '        \n';
    code += '        # Сохраняем информацию о нажатии кнопки\n';
    code += '        message_text_to_save = f"[Нажата кнопка: {button_text}]" if button_text else "[Нажата кнопка]"\n';
    code += '        await save_message_to_api(\n';
    code += '            user_id=user_id,\n';
    code += '            message_type="user",\n';
    code += '            message_text=message_text_to_save,\n';
    code += '            message_data={\n';
    code += '                "button_clicked": True,\n';
    code += '                "button_text": button_text,\n';
    code += '                "callback_data": callback_data\n';
    code += '            }\n';
    code += '        )\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка в middleware сохранения нажатий кнопок: {e}")\n';
    code += '    \n';
    code += '    # Продолжаем обработку callback query\n';
    code += '    return await handler(event, data)\n\n';
  }

  code += '# Обертка для сохранения исходящих сообщений\n';
  code += 'original_send_message = bot.send_message\n';
  code += 'async def send_message_with_logging(chat_id, text, *args, node_id=None, **kwargs):\n';
  code += '    """Обертка для bot.send_message с автоматическим сохранением"""\n';
  code += '    result = await original_send_message(chat_id, text, *args, **kwargs)\n';
  code += '    \n';
  code += '    # Извлекаем информацию о кнопках из reply_markup\n';
  code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
  code += '    if "reply_markup" in kwargs:\n';
  code += '        try:\n';
  code += '            reply_markup = kwargs["reply_markup"]\n';
  code += '            buttons_data = []\n';
  code += '            # Обработка inline клавиатуры\n';
  code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                for row in reply_markup.inline_keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "url") and btn.url:\n';
  code += '                            button_info["url"] = btn.url\n';
  code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                            button_info["callback_data"] = btn.callback_data\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "inline"\n';
  code += '            # Обработка reply клавиатуры\n';
  code += '            elif hasattr(reply_markup, "keyboard"):\n';
  code += '                for row in reply_markup.keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "request_contact") and btn.request_contact:\n';
  code += '                            button_info["request_contact"] = True\n';
  code += '                        if hasattr(btn, "request_location") and btn.request_location:\n';
  code += '                            button_info["request_location"] = True\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "reply"\n';
  code += '        except Exception as e:\n';
  code += '            logging.warning(f"Не удалось извлечь кнопки: {e}")\n';
  code += '    \n';
  code += '    # Сохраняем синхронно для гарантии доставки\n';
  code += '    await save_message_to_api(\n';
  code += '        user_id=str(chat_id),\n';
  code += '        message_type="bot",\n';
  code += '        message_text=text,\n';
  code += '        node_id=node_id,\n';
  code += '        message_data=message_data_obj\n';
  code += '    )\n';
  code += '    return result\n\n';
  code += 'bot.send_message = send_message_with_logging\n\n';

  code += '# Обертка для message.answer с сохранением\n';
  code += 'original_answer = types.Message.answer\n';
  code += 'async def answer_with_logging(self, text, *args, node_id=None, **kwargs):\n';
  code += '    """Обертка для message.answer с автоматическим сохранением"""\n';
  code += '    result = await original_answer(self, text, *args, **kwargs)\n';
  code += '    \n';
  code += '    # Извлекаем информацию о кнопках из reply_markup\n';
  code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
  code += '    if "reply_markup" in kwargs:\n';
  code += '        try:\n';
  code += '            reply_markup = kwargs["reply_markup"]\n';
  code += '            buttons_data = []\n';
  code += '            # Обработка inline клавиатуры\n';
  code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                for row in reply_markup.inline_keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "url") and btn.url:\n';
  code += '                            button_info["url"] = btn.url\n';
  code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                            button_info["callback_data"] = btn.callback_data\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "inline"\n';
  code += '            # Обработка reply клавиатуры\n';
  code += '            elif hasattr(reply_markup, "keyboard"):\n';
  code += '                for row in reply_markup.keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "request_contact") and btn.request_contact:\n';
  code += '                            button_info["request_contact"] = True\n';
  code += '                        if hasattr(btn, "request_location") and btn.request_location:\n';
  code += '                            button_info["request_location"] = True\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "reply"\n';
  code += '        except Exception as e:\n';
  code += '            logging.warning(f"Не удалось извлечь кнопки: {e}")\n';
  code += '    \n';
  code += '    # Сохраняем синхронно для гарантии доставки\n';
  code += '    await save_message_to_api(\n';
  code += '        user_id=str(self.chat.id),\n';
  code += '        message_type="bot",\n';
  code += '        message_text=text if isinstance(text, str) else str(text),\n';
  code += '        node_id=node_id,\n';
  code += '        message_data=message_data_obj\n';
  code += '    )\n';
  code += '    return result\n\n';
  code += 'types.Message.answer = answer_with_logging\n\n';

  code += '# Обертка для bot.send_photo с сохранением\n';
  code += 'original_send_photo = bot.send_photo\n';
  code += 'async def send_photo_with_logging(chat_id, photo, *args, caption=None, node_id=None, **kwargs):\n';
  code += '    """Обертка для bot.send_photo с автоматическим сохранением"""\n';
  code += '    # Проверяем, является ли photo относительным путем к локальному файлу\n';
  code += '    if isinstance(photo, str) and photo.startswith("/uploads/"):\n';
  code += '        file_path = get_upload_file_path(photo)\n';
  code += '        result = await original_send_photo(chat_id, FSInputFile(file_path), *args, caption=caption, **kwargs)\n';
  code += '    else:\n';
  code += '        result = await original_send_photo(chat_id, photo, *args, caption=caption, **kwargs)\n';
  code += '    \n';
  code += '    # Создаем message_data с информацией о фото\n';
  code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
  code += '    \n';
  code += '    # Сохраняем информацию о фото\n';
  code += '    if result and hasattr(result, "photo") and result.photo:\n';
  code += '        largest_photo = result.photo[-1]\n';
  code += '        message_data_obj["photo"] = {\n';
  code += '            "file_id": largest_photo.file_id,\n';
  code += '            "file_unique_id": largest_photo.file_unique_id,\n';
  code += '            "width": largest_photo.width,\n';
  code += '            "height": largest_photo.height\n';
  code += '        }\n';
  code += '    # Если photo это строка (URL), сохраняем URL\n';
  code += '    elif isinstance(photo, str):\n';
  code += '        message_data_obj["photo_url"] = photo\n';
  code += '    \n';
  code += '    # Извлекаем информацию о кнопках из reply_markup\n';
  code += '    if "reply_markup" in kwargs:\n';
  code += '        try:\n';
  code += '            reply_markup = kwargs["reply_markup"]\n';
  code += '            buttons_data = []\n';
  code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                for row in reply_markup.inline_keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "url") and btn.url:\n';
  code += '                            button_info["url"] = btn.url\n';
  code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                            button_info["callback_data"] = btn.callback_data\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "inline"\n';
  code += '        except Exception as e:\n';
  code += '            logging.warning(f"Не удалось извлечь кнопки из send_photo: {e}")\n';
  code += '    \n';
  code += '    # Сохраняем сообщение в базу данных\n';
  code += '    saved_message = await save_message_to_api(\n';
  code += '        user_id=str(chat_id),\n';
  code += '        message_type="bot",\n';
  code += '        message_text=caption or "[Фото]",\n';
  code += '        node_id=node_id,\n';
  code += '        message_data=message_data_obj\n';
  code += '    )\n';
  code += '    \n';
  code += '    # Если фото отправлено от бота с file_id, регистрируем медиа\n';
  code += '    if result and hasattr(result, "photo") and result.photo and saved_message and "id" in saved_message:\n';
  code += '        try:\n';
  code += '            largest_photo = result.photo[-1]\n';
  code += '            if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):\n';
  code += '                media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '            else:\n';
  code += '                media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '            \n';
  code += '            media_payload = {\n';
  code += '                "messageId": saved_message["id"],\n';
  code += '                "fileId": largest_photo.file_id,\n';
  code += '                "botToken": BOT_TOKEN,\n';
  code += '                "mediaType": "photo"\n';
  code += '            }\n';
  code += '            \n';
  code += '            # Определяем, использовать ли SSL для медиа-запросов\n';
  code += '            use_ssl_media = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)\n';
  code += '            logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")\n';
  code += '            # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER\n';
  code += '            if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:\n';
  code += '                use_ssl_media = False\n';
  code += '                logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")\n';
  code += '            \n';
  code += '            if use_ssl_media:\n';
  code += '                # Для внешних соединений используем SSL-контекст\n';
  code += '                connector = TCPConnector(ssl=True)\n';
  code += '            else:\n';
  code += '                # Для локальных соединений не используем SSL-контекст\n';
  code += '                # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения\n';
  code += '                import ssl\n';
  code += '                ssl_context = ssl.create_default_context()\n';
  code += '                ssl_context.check_hostname = False\n';
  code += '                ssl_context.verify_mode = ssl.CERT_NONE\n';
  code += '                connector = TCPConnector(ssl=ssl_context)\n';
  code += '            \n';
  code += '            async with aiohttp.ClientSession(connector=connector) as session:\n';
  code += '                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
  code += '                    if response.status == 200:\n';
  code += '                        bot_message_id = saved_message.get("id")\n';
  code += '                        logging.info(f"✅ Медиа бота зарегистрировано для сообщения {bot_message_id}")\n';
  code += '                    else:\n';
  code += '                        error_text = await response.text()\n';
  code += '                        logging.warning(f"⚠️ Не удалось зарегистрировать медиа бота: {response.status} - {error_text}")\n';
  code += '        except Exception as media_error:\n';
  code += '            logging.warning(f"Ошибка при регистрации медиа бота: {media_error}")\n';
  code += '    \n';
  code += '    return result\n\n';
  code += 'bot.send_photo = send_photo_with_logging\n\n';

  return code;
}