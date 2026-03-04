/*
 * Модуль для генерации обработчика документов в Telegram боте
 */

export function generateDocumentHandlerCode(): string {
  // Возвращаем строку с кодом обработчика документов на Python
  return `
# Обработчик получения документа от пользователя
@dp.message(F.document)
async def handle_document_input(message: types.Message):
    user_id = message.from_user.id
    logging.info(f"📄 Получен документ от пользователя {user_id}")
    
    # Проверяем, ожидаем ли мы ввод документа - проверяем waiting_for_input с типом document
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        logging.info(f"Документ от пользователя {user_id} проигнорирован - не ожидается ввод")
        return
    
    # Получаем конфигурацию ожидания
    waiting_config = user_data[user_id]["waiting_for_input"]
    # Проверяем, что тип ожидания - документ
    if not (isinstance(waiting_config, dict) and waiting_config.get("type") == "document"):
        logging.info(f"Документ от пользователя {user_id} проигнорирован - ожидается другой тип ввода")
        return
    
    document_config = waiting_config
    document_variable = document_config.get("variable", "user_document")
    node_id = document_config.get("node_id", "unknown")
    next_node_id = document_config.get("next_node_id")
    
    # Получаем file_id документа
    document_file_id = message.document.file_id
    logging.info(f"📄 Получен file_id документа: {document_file_id}")

    # Регистрируем документ через API для получения URL
    document_url = None
    try:
        if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
            media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-document"
        else:
            media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-document"

        # Сначала сохраняем сообщение чтобы получить message_id
        saved_msg = await save_message_to_api(
            user_id=str(user_id),
            message_type="user",
            message_text="[Документ ответ]",
            node_id=node_id,
            message_data={"document": {"file_id": document_file_id}, "is_document_answer": True}
        )

        if saved_msg and "id" in saved_msg:
            media_payload = {
                "messageId": saved_msg["id"],
                "fileId": document_file_id,
                "botToken": BOT_TOKEN,
                "mediaType": "document"
            }

            # Определяем, использовать ли SSL для медиа-запросов
            is_localhost_media = "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url
            is_https_media = media_api_url.startswith("https://")
            use_ssl_media = is_https_media and not is_localhost_media  # SSL только для внешних https://
            logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")

            # Создаём connector с правильным SSL
            connector = TCPConnector(ssl=use_ssl_media)

            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=15), ssl=use_ssl_media) as response:
                    if response.status == 200:
                        result = await response.json()
                        document_url = result.get("url")
                        logging.info(f"Документ зарегистрирован, URL: {document_url}")
                    else:
                        error_text = await response.text()
                        logging.warning(f"Не удалось зарегистрировать документ: {response.status} - {error_text}")
    except Exception as reg_error:
        logging.warning(f"Ошибка при регистрации документа: {reg_error}")

    # Сохраняем в пользовательские данные как объект с URL
    document_data = {
        "value": document_file_id,
        "type": "document",
        "documentUrl": document_url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    user_data[user_id][document_variable] = document_data

    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, document_variable, document_data)
    if saved_to_db:
        logging.info(f"✅ Документ сохранен в БД: {document_variable} = {document_file_id}, URL = {document_url} (пользователь {user_id})")
    else:
        logging.warning(f"⚠️ Не удалось сохранить документ в БД, данные сохранены локально")

    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]

    logging.info(f"📄 Документ сохранен: {document_variable} = {document_file_id}, URL = {document_url}")
    
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

// Функция для проверки необходимости добавления обработчика документов
export function hasDocumentInput(nodes: any[]): boolean {
  return (nodes || []).some(node => node.data.enableDocumentInput);
}