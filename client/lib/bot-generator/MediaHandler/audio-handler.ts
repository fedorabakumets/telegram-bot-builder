/*
 * Модуль для генерации обработчика аудио в Telegram боте
 */

export function generateAudioHandlerCode(): string {
  // Возвращаем строку с кодом обработчика аудио на Python
  return `
# Обработчик получения аудио от пользователя
@dp.message(F.audio | F.voice)
async def handle_audio_input(message: types.Message):
    user_id = message.from_user.id
    logging.info(f"🎵 Получено аудио от пользователя {user_id}")
    
    # Проверяем, ожидаем ли мы ввод аудио - проверяем waiting_for_input с типом audio
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        logging.info(f"Аудио от пользователя {user_id} проигнорировано - не ожидается ввод")
        return
    
    # Получаем конфигурацию ожидания
    waiting_config = user_data[user_id]["waiting_for_input"]
    # Проверяем, что тип ожидания - аудио
    if not (isinstance(waiting_config, dict) and waiting_config.get("type") == "audio"):
        logging.info(f"Аудио от пользователя {user_id} проигнорировано - ожидается другой тип ввода")
        return
    
    audio_config = waiting_config
    audio_variable = audio_config.get("variable", "user_audio")
    node_id = audio_config.get("node_id", "unknown")
    next_node_id = audio_config.get("next_node_id")
    
    # Получаем file_id аудио (поддерживаем и audio, и voice)
    if message.audio:
        audio_file_id = message.audio.file_id
    elif message.voice:
        audio_file_id = message.voice.file_id
    else:
        logging.error("Не удалось получить file_id аудио")
        return
    logging.info(f"🎵 Получен file_id аудио: {audio_file_id}")

    # Регистрируем аудио через API для получения URL
    audio_url = None
    try:
        if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
            media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-audio"
        else:
            media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-audio"

        # Сначала сохраняем сообщение чтобы получить message_id
        saved_msg = await save_message_to_api(
            user_id=str(user_id),
            message_type="user",
            message_text="[Аудио ответ]",
            node_id=node_id,
            message_data={"audio": {"file_id": audio_file_id}, "is_audio_answer": True}
        )

        if saved_msg and "id" in saved_msg:
            media_payload = {
                "messageId": saved_msg["id"],
                "fileId": audio_file_id,
                "botToken": BOT_TOKEN,
                "mediaType": "audio"
            }

            # Определяем, использовать ли SSL для медиа-запросов
            is_localhost_media = "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url
            is_https_media = media_api_url.startswith("https://")
            use_ssl_media = is_https_media and not is_localhost_media  # SSL только для внешних https://
            logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")

            # Создаём connector с правильным SSL
            connector = TCPConnector(ssl=use_ssl_media)

            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    if response.status == 200:
                        result = await response.json()
                        audio_url = result.get("url")
                        logging.info(f"Аудио зарегистрировано, URL: {audio_url}")
                    else:
                        error_text = await response.text()
                        logging.warning(f"Не удалось зарегистрировать аудио: {response.status} - {error_text}")
    except Exception as reg_error:
        logging.warning(f"Ошибка при регистрации аудио: {reg_error}")

    # Сохраняем в пользовательские данные как объект с URL
    audio_data = {
        "value": audio_file_id,
        "type": "audio",
        "audioUrl": audio_url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    user_data[user_id][audio_variable] = audio_data

    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, audio_variable, audio_data)
    if saved_to_db:
        logging.info(f"✅ Аудио сохранено в БД: {audio_variable} = {audio_file_id}, URL = {audio_url} (пользователь {user_id})")
    else:
        logging.warning(f"⚠️ Не удалось сохранить аудио в БД, данные сохранены локально")

    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]

    logging.info(f"🎵 Аудио сохранено: {audio_variable} = {audio_file_id}, URL = {audio_url}")
    
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
            
            # Добавляем навигацию для каждого узла - отправляем сообщение напрямую
            # (здесь будет сгенерированный код навигации)
            # Код навигации будет внедряться сюда во время генерации бота
            
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return
`;
}

// Функция для проверки необходимости добавления обработчика аудио
export function hasAudioInput(nodes: any[]): boolean {
  return (nodes || []).some(node => node.data.enableAudioInput);
}