import { Node } from '../../../../shared/schema';

export function generateUnpinMessageHandler(node: Node): string {
  let code = `\n# Unpin Message Handler\n`;
  const synonyms = node.data.synonyms || ['открепить', 'отцепить', 'убрать закрепление'];
  const targetGroupId = node.data.targetGroupId;
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  // Генерируем обработчик callback запросов для команды открепления
  code += `\n@dp.callback_query(lambda c: c.data.startswith("unpin_message_${sanitizedNodeId}_"))\n`;
  code += `async def handle_callback_${sanitizedNodeId}(callback_query: types.CallbackQuery):\n`;
  code += `    """\n`;
  code += `    Обработчик callback запросов команды открепления\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    """\n`;
  code += `    user_id = callback_query.from_user.id\n`;
  code += `    chat_id = callback_query.message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if callback_query.message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await callback_query.message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        await bot.unpin_all_chat_messages(chat_id=chat_id)\n`;
  code += `        await callback_query.message.answer("✅ Все сообщения откреплены")\n`;
  code += `        logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to unpin not found" in str(e) or "not found" in str(e):\n`;
  code += `            await callback_query.message.answer("❌ Нечего откреплять")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await callback_query.message.answer("❌ Недостаточно прав для открепления")\n`;
  code += `        else:\n`;
  code += `            await callback_query.message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка открепления: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await callback_query.message.answer("❌ Произошла ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при откреплении: {e}")\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        await callback_query.answer()\n`;
  code += `    except:\n`;
  code += `        pass\n`;
  code += `\n`;

  // Генерируем обработчик команды /unpin_message
  code += `@dp.message(Command("unpin_message"))\n`;
  code += `async def unpin_message_${sanitizedNodeId}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /unpin_message\n`;
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
  code += `            # Если нет конкретного сообщения, открепляем все\n`;
  code += `            target_message_id = None\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        if target_message_id:\n`;
  code += `            await bot.unpin_chat_message(\n`;
  code += `                chat_id=chat_id,\n`;
  code += `                message_id=target_message_id\n`;
  code += `            )\n`;
  code += `            await message.answer("✅ Сообщение откреплено")\n`;
  code += `            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")\n`;
  code += `        else:\n`;
  code += `            await bot.unpin_all_chat_messages(chat_id=chat_id)\n`;
  code += `            await message.answer("✅ Все сообщения откреплены")\n`;
  code += `            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to unpin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для открепления сообщения")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка открепления сообщения: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при откреплении: {e}")\n`;
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
    code += `async def unpin_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик для открепления сообщения по команде '${synonym}'\n`;
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
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для открепления в группе {chat_id}")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для открепления в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения - открепим все в группе {chat_id}")\n`;
    code += `            # Если нет конкретного сообщения, открепляем все\n`;
    code += `            target_message_id = None\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Открепляем сообщение в текущей группе\n`;
    code += `        if target_message_id:\n`;
    code += `            await bot.unpin_chat_message(\n`;
    code += `                chat_id=chat_id,\n`;
    code += `                message_id=target_message_id\n`;
    code += `            )\n`;
    code += `            await message.answer("✅ Сообщение откреплено")\n`;
    code += `            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            await bot.unpin_all_chat_messages(chat_id=chat_id)\n`;
    code += `            await message.answer("✅ Все сообщения откреплены")\n`;
    code += `            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to unpin not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для открепления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка открепления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при откреплении: {e}")\n`;
    code += `\n`;
  });

  return code;
}
