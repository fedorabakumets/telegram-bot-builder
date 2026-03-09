/*
 * Модуль для генерации обработчика фото в Telegram боте
 */

export function generatePhotoHandlerCode(): string {
  // Возвращаем строку с кодом обработчика фото на Python
  return `
# Обработчик получения фото от пользователя
@dp.message(F.photo)
async def handle_photo_input(message: types.Message):
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

    # Сохраняем сообщение в БД
    saved_msg = await save_message_to_api(
        user_id=str(user_id),
        message_type="user",
        message_text="[Фото ответ]",
        node_id=node_id,
        message_data={"photo": {"file_id": photo_file_id}, "is_photo_answer": True}
    )

    # Сохраняем медиа в БД напрямую
    media_result = None
    if saved_msg and "id" in saved_msg:
        media_result = await save_media_to_db(
            file_id=photo_file_id,
            file_type="photo",
            file_name=f"photo_{photo_file_id}",
            file_size=message.photo[-1].file_size if message.photo[-1].file_size else 0,
            mime_type="image/jpeg"
        )
        
        # Связываем медиа с сообщением
        if media_result:
            await link_media_to_message(
                message_id=saved_msg["id"],
                media_id=media_result["id"],
                media_kind="photo",
                order_index=0
            )

    # Сохраняем в пользовательские данные как объект с URL
    photo_data = {
        "value": photo_file_id,
        "type": "photo",
        "photoUrl": media_result["url"] if media_result else None,
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

    logging.info(f"Фото сохранено: {photo_variable} = {photo_file_id}")

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
            # (здесь будет сгенерированный код навигации)
            # Код навигации будет внедряться сюда во время генерации бота

        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

    return
`;
}

// Функция для проверки необходимости добавления обработчика фото
export function hasPhotoInput(nodes: any[]): boolean {
  return (nodes || []).some(node => node.data.enablePhotoInput);
}