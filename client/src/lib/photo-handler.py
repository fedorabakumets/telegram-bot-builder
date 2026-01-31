"""
Модуль для обработки фото в Telegram боте
"""
import logging
from datetime import datetime, timezone
import aiohttp
from aiogram import types


async def save_message_to_api(user_id: str, message_type: str, message_text: str, node_id: str, message_data: dict = None):
    """
    Функция заглушка для сохранения сообщения в API
    Реализация будет зависеть от основного кода бота
    """
    pass


async def update_user_data_in_db(user_id: int, variable_name: str, photo_data: dict):
    """
    Функция заглушка для обновления данных пользователя в БД
    Реализация будет зависеть от основного кода бота
    """
    pass


async def get_user_from_db(user_id: int):
    """
    Функция заглушка для получения данных пользователя из БД
    Реализация будет зависеть от основного кода бота
    """
    pass


async def handle_photo_input(message: types.Message, user_data: dict, API_BASE_URL: str, PROJECT_ID: str, BOT_TOKEN: str, generateNodeNavigation):
    """
    Обработчик получения фото от пользователя
    """
    user_id = message.from_user.id
    logging.info(f"📸 Получено фото от пользователя {user_id}")
    
    # Проверяем, ожидаем ли мы ввод фото - проверяем waiting_for_input с типом photo
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        logging.info(f"Фото от пользователя {user_id} проигнорировано - не ожидается ввод")
        return
    
    # Получаем конфигурацию ожидания
    waiting_config = user_data[user_id]["waiting_for_input"]
    # Проверяем, что тип ожидания - фото
    if not (isinstance(waiting_config, dict) and waiting_config.get("type") == "photo"):
        logging.info(f"Фото от пользователя {user_id} проигнорировано - ожидается другой тип ввода")
        return
    
    photo_config = waiting_config
    photo_variable = photo_config.get("variable", "user_photo")
    node_id = photo_config.get("node_id", "unknown")
    next_node_id = photo_config.get("next_node_id")
    
    # Получаем file_id фото (берем последнее - лучшее качество)
    photo_file_id = message.photo[-1].file_id
    logging.info(f"Получен file_id фото: {photo_file_id}")
    
    # Регистрируем фото через API для получения URL
    photo_url = None
    try:
        if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
            media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
        else:
            media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
        
        # Сначала сохраняем сообщение чтобы получить message_id
        saved_msg = await save_message_to_api(
            user_id=str(user_id),
            message_type="user",
            message_text="[Фото ответ]",
            node_id=node_id,
            message_data={"photo": {"file_id": photo_file_id}, "is_photo_answer": True}
        )
        
        if saved_msg and "id" in saved_msg:
            media_payload = {
                "messageId": saved_msg["id"],
                "fileId": photo_file_id,
                "botToken": BOT_TOKEN,
                "mediaType": "photo"
            }
            
            # Определяем, использовать ли SSL для медиа-запросов
            use_ssl_media3 = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)
            logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media3}")
            # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER
            if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:
                use_ssl_media3 = False
                logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")
            
            if use_ssl_media3:
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
                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    if response.status == 200:
                        result = await response.json()
                        photo_url = result.get("url")
                        logging.info(f"Фото зарегистрировано, URL: {photo_url}")
                    else:
                        error_text = await response.text()
                        logging.warning(f"Не удалось зарегистрировать фото: {response.status} - {error_text}")
    except Exception as reg_error:
        logging.warning(f"Ошибка при регистрации фото: {reg_error}")
    
    # Сохраняем в пользовательские данные как объект с URL
    photo_data = {
        "value": photo_file_id,
        "type": "photo",
        "photoUrl": photo_url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    user_data[user_id][photo_variable] = photo_data
    
    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, photo_variable, photo_data)
    if saved_to_db:
        logging.info(f"Фото сохранено в БД: {photo_variable} (пользователь {user_id})")
    else:
        logging.warning(f"Не удалось сохранить фото в БД, данные сохранены локально")
    
    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]
    
    logging.info(f"Фото сохранено: {photo_variable} = {photo_file_id}, URL = {photo_url}")
    
    # Переходим к следующему узлу если указан
    if next_node_id:
        logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")
        try:
            # Получаем данные пользователя для замены переменных
            user_record = await get_user_from_db(user_id)
            if user_record and "user_data" in user_record:
                user_vars = user_record["user_data"]
            else:
                user_vars = user_data.get(user_id, {})
            
            # Генерируем навигацию для каждого узла
            generateNodeNavigation(next_node_id, user_vars, message)
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return