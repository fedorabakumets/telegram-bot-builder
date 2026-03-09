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

    # Сохраняем сообщение в БД
    saved_msg = await save_message_to_api(
        user_id=str(user_id),
        message_type="user",
        message_text="[Аудио ответ]",
        node_id=node_id,
        message_data={"audio": {"file_id": audio_file_id}, "is_audio_answer": True}
    )

    # Сохраняем медиа в БД напрямую
    media_result = None
    if saved_msg and "id" in saved_msg:
        file_type = "voice" if message.voice else "audio"
        media_result = await save_media_to_db(
            file_id=audio_file_id,
            file_type=file_type,
            file_name=f"{file_type}_{audio_file_id}",
            file_size=(message.audio.file_size if message.audio else message.voice.file_size) or 0,
            mime_type=(message.audio.mime_type if message.audio else "audio/ogg") or "audio/ogg"
        )
        
        # Связываем медиа с сообщением
        if media_result:
            await link_media_to_message(
                message_id=saved_msg["id"],
                media_id=media_result["id"],
                media_kind=file_type,
                order_index=0
            )

    # Сохраняем в пользовательские данные как объект с URL
    audio_data = {
        "value": audio_file_id,
        "type": "audio",
        "audioUrl": media_result["url"] if media_result else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    user_data[user_id][audio_variable] = audio_data

    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, audio_variable, audio_data)
    if saved_to_db:
        logging.info(f"✅ Аудио сохранено в БД: {audio_variable} = {audio_file_id} (пользователь {user_id})")
    else:
        logging.warning(f"⚠️ Не удалось сохранить аудио в БД, данные сохранены локально")

    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]

    logging.info(f"🎵 Аудио сохранено: {audio_variable} = {audio_file_id}")
    
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