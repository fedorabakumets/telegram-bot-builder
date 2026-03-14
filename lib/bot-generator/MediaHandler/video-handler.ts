/*
 * Модуль для генерации обработчика видео в Telegram боте
 */

export function generateVideoHandlerCode(): string {
  // Возвращаем строку с кодом обработчика видео на Python
  return `
# Обработчик получения видео от пользователя
@dp.message(F.video)
async def handle_video_input(message: types.Message):
    user_id = message.from_user.id
    logging.info(f"🎥 Получено видео от пользователя {user_id}")
    
    # Проверяем, ожидаем ли мы ввод видео - проверяем waiting_for_input с типом video
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        logging.info(f"Видео от пользователя {user_id} проигнорировано - не ожидается ввод")
        return
    
    # Получаем конфигурацию ожидания
    waiting_config = user_data[user_id]["waiting_for_input"]
    # Проверяем, что тип ожидания - видео
    if not (isinstance(waiting_config, dict) and waiting_config.get("type") == "video"):
        logging.info(f"Видео от пользователя {user_id} проигнорировано - ожидается другой тип ввода")
        return
    
    video_config = waiting_config
    video_variable = video_config.get("variable", "user_video")
    node_id = video_config.get("node_id", "unknown")
    next_node_id = video_config.get("next_node_id")
    
    # Получаем file_id видео
    video_file_id = message.video.file_id
    logging.info(f"🎥 Получен file_id видео: {video_file_id}")

    # Сохраняем сообщение в БД
    saved_msg = await save_message_to_api(
        user_id=str(user_id),
        message_type="user",
        message_text="[Видео ответ]",
        node_id=node_id,
        message_data={"video": {"file_id": video_file_id}, "is_video_answer": True}
    )

    # Сохраняем медиа в БД напрямую
    media_result = None
    if saved_msg and "id" in saved_msg:
        media_result = await save_media_to_db(
            file_id=video_file_id,
            file_type="video",
            file_name=f"video_{video_file_id}",
            file_size=message.video.file_size if message.video.file_size else 0,
            mime_type=message.video.mime_type or "video/mp4"
        )
        
        # Связываем медиа с сообщением
        if media_result:
            await link_media_to_message(
                message_id=saved_msg["id"],
                media_id=media_result["id"],
                media_kind="video",
                order_index=0
            )

    # Сохраняем в пользовательские данные как объект с URL
    video_data = {
        "value": video_file_id,
        "type": "video",
        "videoUrl": media_result["url"] if media_result else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    user_data[user_id][video_variable] = video_data

    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, video_variable, video_data)
    if saved_to_db:
        logging.info(f"✅ Видео сохранено в БД: {video_variable} = {video_file_id} (пользователь {user_id})")
    else:
        logging.warning(f"⚠️ Не удалось сохранить видео в БД, данные сохранены локально")

    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]

    logging.info(f"🎥 Видео сохранено: {video_variable} = {video_file_id}")
    
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
            logging.error(f"Ошибка при пярехояе к следующему узлу {next_node_id}: {e}")
    
    return
`;
}

// Функция для проверки необходимости добавления обработчика видео
export function hasVideoInput(nodes: any[]): boolean {
  return (nodes || []).some(node => node.data.enableVideoInput);
}