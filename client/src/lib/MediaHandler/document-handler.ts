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
    
    # Сохраняем в пользовательские данные
    user_data[user_id][document_variable] = document_file_id
    
    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, document_variable, document_file_id)
    if saved_to_db:
        logging.info(f"✅ Документ сохранен в БД: {document_variable} = {document_file_id} (пользователь {user_id})")
    else:
        logging.warning(f"⚠️ Не удалось сохранить документ в БД, данные сохранены локально")
    
    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]
    
    logging.info(f"📄 Документ сохранен: {document_variable} = {document_file_id}")
    
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