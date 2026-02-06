export function generateMediaFileFunctions() {
  let code = '';

  // Add media file functions that handle photo registration and processing
  code += `
# Функция для получения пути к файлу в папке uploads
def get_upload_file_path(file_path):
    """Получает правильный путь к файлу в папке uploads

    Args:
        file_path: Путь к файлу в формате /uploads/...

    Returns:
        Полный путь к файлу в файловой системе
    """
    import os
    # Получаем директорию файла бота
    bot_dir = os.path.dirname(os.path.abspath(__file__))
    # Поднимаемся на два уровня выше к корню проекта
    project_root = os.path.dirname(os.path.dirname(bot_dir))  # поднимаемся из bots/bot_17_24 в bots, затем в корень
    # Формируем путь к файлу, убирая начальный символ '/' и используя правильные разделители
    relative_path = file_path[1:]  # убираем начальный '/'
    return os.path.join(project_root, relative_path)

async def register_telegram_photo(message_id: int, file_id: str, bot_token: str, media_type: str = "photo"):
    """Регистр��рует фото из Telegram в системе

    Args:
        message_id: ID сообщения в базе данных
        file_id: ID файла в Telegram
        bot_token: Токен бота для доступа к API Telegram
        media_type: Тип медиа ('photo', 'document', etc.)
    """
    try:
        if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
            media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
        else:
            media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"

        media_payload = {
            "messageId": message_id,
            "fileId": file_id,
            "botToken": bot_token,
            "mediaType": media_type
        }

        # Определяем, использовать ли SSL для медиа-запросов
        use_ssl_media = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)
        logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")
        # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER
        if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:
            use_ssl_media = False
            logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")

        if use_ssl_media:
            # Для внешних соединений используем SSL-контекст
            connector = aiohttp.TCPConnector(ssl=True)
        else:
            # Для локальных соединений не используем SSL-контекст
            # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connector = aiohttp.TCPConnector(ssl=ssl_context)

        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")
                    return await response.json()
                else:
                    error_text = await response.text()
                    logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")
                    return None
    except Exception as e:
        logging.error(f"Ошибка при регистрации медиа: {e}")
        return None

async def download_and_save_photo(file_id: str, bot_token: str, filename: str = None):
    """Скачивает фото из Telegram и сохраняет его локальн��

    Args:
        file_id: ID файла в Telegram
        bot_token: Токен бота для доступа к API Telegram
        filename: Имя файла для сохранения (опционально)

    Returns:
        П��ть к сохраненному файлу или None в случае ошибки
    """
    try:
        import tempfile
        import os

        # Получаем информацию о файле
        file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(file_info_url) as response:
                if response.status != 200:
                    logging.error(f"❌ Не уда��ось получить информацию о файле: {response.status}")
                    return None

                file_info = await response.json()
                if not file_info.get("ok"):
                    logging.error(f"❌ Ошибка Telegram API при получении информации о файле: {file_info}")
                    return None

                file_path = file_info["result"]["file_path"]

                # Формируем URL для скачивания файла
                download_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"

                # Определ���ем имя файла, если не задано
                if not filename:
                    filename = os.path.basename(file_path)

                # Создаем временную директорию для сохранения фото
                temp_dir = os.path.join(tempfile.gettempdir(), "telegram_bot_photos")
                os.makedirs(temp_dir, exist_ok=True)

                file_path_full = os.path.join(temp_dir, filename)

                # Скачиваем и сохраняем файл
                async with session.get(download_url) as file_response:
                    if file_response.status == 200:
                        with open(file_path_full, "wb") as f:
                            async for chunk in file_response.content.iter_chunked(8192):
                                f.write(chunk)

                        logging.info(f"📷 Фото успешно скача��о и сохранено: {file_path_full}")
                        return file_path_full
                    else:
                        logging.error(f"❌ Не удалось скачать фото: {file_response.status}")
                        return None
    except Exception as e:
        logging.error(f"Ошибка при скачивании фото: {e}")
        return None

async def send_photo_with_caption(chat_id: int, photo_source, caption: str = None, **kwargs):
    """Отправляет фото с подписью и сохраняет в базу данных

    Args:
        chat_id: ID чата для отправки
        photo_source: Источник фото (file_id, URL или путь к файлу)
        caption: Подпись к фото (опционально)

    Returns:
        Результат отправки сообщения
    """
    try:
        # Проверяем, является ли photo_source относительным путем к локальному файлу
        if isinstance(photo_source, str) and photo_source.startswith('/uploads/'):
            # Для локальных файлов используем FSInputFile для отправки напрямую с диска
            file_path = get_upload_file_path(photo_source)
            result = await bot.send_photo(chat_id, FSInputFile(file_path), caption=caption, **kwargs)
        else:
            result = await bot.send_photo(chat_id, photo_source, caption=caption, **kwargs)

        # Сохраняем сообщение в базу данных
        message_data_obj = {"message_id": result.message_id if result else None}

        # Сохраняем информацию о фото
        if result and hasattr(result, "photo") and result.photo:
            largest_photo = result.photo[-1]
            message_data_obj["photo"] = {
                "file_id": largest_photo.file_id,
                "file_unique_id": largest_photo.file_unique_id,
                "width": largest_photo.width,
                "height": largest_photo.height
            }

        await save_message_to_api(
            user_id=str(chat_id),
            message_type="bot",
            message_text=caption or "[Фото]",
            message_data=message_data_obj
        )

        return result
    except Exception as e:
        logging.error(f"Ошибка при отправк�� фото: {e}")
        # Если отправка с фото не удалась, пробуем отправить просто текст
        if caption:
            return await bot.send_message(chat_id, caption, **kwargs)

def get_user_media_attachments(user_id: int):
    """Получает список медиа-вложений пользователя из его переменных

    Args:
        user_id: ID пользователя

    Returns:
        Список медиа-вложений
    """
    user_vars = get_user_variables(user_id)
    media_types = ["photo", "video", "audio", "document", "voice", "animation"]
    attachments = {}

    for media_type in media_types:
        if media_type in user_vars:
            media_data = user_vars[media_type]
            if isinstance(media_data, dict) and "value" in media_data:
                attachments[media_type] = media_data["value"]
            elif media_data is not None:
                attachments[media_type] = media_data

    return attachments

def clear_user_media_attachments(user_id: int):
    """Очищает медиа-вложения пользователя

    Args:
        user_id: ID пользователя
    """
    media_types = ["photo", "video", "audio", "document", "voice", "animation"]

    for media_type in media_types:
        if user_id in user_data and media_type in user_data[user_id]:
            del user_data[user_id][media_type]
            logging.debug(f"🗑️ Очищено медиа '{media_type}' для пользователя {user_id}")
`;

  return code;
}
