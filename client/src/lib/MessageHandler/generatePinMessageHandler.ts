import { Node } from '../../../../shared/schema';

// ============================================================================
// ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ УПРАВЛЕНИЯ КОНТЕНТОМ
// ============================================================================
export function generatePinMessageHandler(node: Node): string {
  let code = `\n# Pin Message Handler\n`;

  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const synonyms = node.data.synonyms || ['закрепить', 'прикрепить', 'зафиксировать'];
  const disableNotification = node.data.disableNotification || false;
  const targetGroupId = node.data.targetGroupId;

  // Генерируем обработчик callback запросов для команды закрепления
  code += `\n@dp.callback_query(lambda c: c.data.startswith("pin_message_${sanitizedNodeId}_"))\n`;
  code += `async def handle_callback_${sanitizedNodeId}(callback_query: types.CallbackQuery):\n`;
  code += `    """
`;
  code += `    Обработчик callback запросов команды закрепления
`;
  code += `    Работает в группах где бот имеет права администратора
`;
  code += `    """
`;
  code += `    user_id = callback_query.from_user.id
`;
  code += `    chat_id = callback_query.message.chat.id  # Определяем ID группы из контекста сообщения
`;
  code += `    
`;
  code += `    # Проверяем, что это группа
`;
  code += `    if callback_query.message.chat.type not in ['group', 'supergroup']:
`;
  code += `        await callback_query.message.answer("❌ Команда работает только в группах")
`;
  code += `        return
`;
  code += `    
`;
  code += `    # Определяем целевое сообщение из callback_data
`;
  code += `    target_message_id = int(callback_query.data.split('_')[-1]) if callback_query.data.split('_').length > 3 else None
`;
  code += `    
`;
  code += `    if not target_message_id:
`;
  code += `        await callback_query.message.answer("❌ Не удалось определить ID сообщения для закрепления")
`;
  code += `        return
`;
  code += `    
`;
  code += `    try:
`;
  code += `        await bot.pin_chat_message(
`;
  code += `            chat_id=chat_id,
`;
  code += `            message_id=target_message_id,
`;
  code += `            disable_notification=${disableNotification ? 'True' : 'False'}
`;
  code += `        )
`;
  code += `        await callback_query.message.answer("✅ Сообщение закреплено")
`;
  code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")
`;
  code += `    except TelegramBadRequest as e:
`;
  code += `        if "message to pin not found" in str(e) or "message not found" in str(e):
`;
  code += `            await callback_query.message.answer("❌ Сообщение не найдено")
`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
`;
  code += `            await callback_query.message.answer("❌ Недостаточно прав для закрепления сообщения")
`;
  code += `        else:
`;
  code += `            await callback_query.message.answer(f"❌ Ошибка: {e}")
`;
  code += `        logging.error(f"Ошибка закрепления сообщения: {e}")
`;
  code += `    except Exception as e:
`;
  code += `        await callback_query.message.answer("❌ Произошла неожиданная ошибка")
`;
  code += `        logging.error(f"Неожиданная ошибка при закреплении: {e}")
`;
  code += `    
`;
  code += `    try:
`;
  code += `        await callback_query.answer()
`;
  code += `    except:
`;
  code += `        pass
`;


  // Генерируем обработчик команды /pin_message
  code += `@dp.message(Command("pin_message"))\n`;
  code += `async def pin_message_${sanitizedNodeId}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /pin_message\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение или указание ID сообщения\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевое сообщение\n`;
  code += `    target_message_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_message_id = message.reply_to_message.message_id\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_message_id = int(text_parts[1])\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение или напишите /pin_message ID_сообщения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        await bot.pin_chat_message(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            message_id=target_message_id,\n`;
  code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        await message.answer("✅ Сообщение закреплено")\n`;
  code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для закрепления сообщения")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка закрепления сообщения: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при закреплении: {e}")\n`;
  code += `\n`;

  // Создаем универсальный обработчик, который работает в любых группах
  synonyms.forEach((synonym, index) => {
    const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');

    // Условие: проверяем синоним и что сообщение пришло из группы
    let condition = `lambda message: message.text and message.text.lower().startswith("${synonym.toLowerCase()}") and message.chat.type in ['group', 'supergroup']`;

    // Если указана конкретная группа, добавляем проверку ID группы
    if (targetGroupId) {
      condition += ` and str(message.chat.id) == "${targetGroupId}"`;
    }

    code += `\n@dp.message(${condition})\n`;
    code += `async def pin_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик для закрепления сообщения по команде '${synonym}'\n`;
    if (targetGroupId) {
      code += `    Работает только в группе ${targetGroupId}\n`;
    } else {
      code += `    Работает в любых группах где бот имеет права администратора\n`;
    }
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} в группе {chat_id}")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения в группе {chat_id}")\n`;
    code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
    code += `            return\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Закрепляем сообщение в текущей группе\n`;
    code += `        await bot.pin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id,\n`;
    code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer("✅ Сообщение закреплено")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для закрепления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка закрепления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при закреплении: {e}")\n`;
    code += `\n`;
  });

  return code;
}
