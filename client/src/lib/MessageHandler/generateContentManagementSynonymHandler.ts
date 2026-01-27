import { Node } from '../../../../shared/schema';

export function generateContentManagementSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const messageText = node.data.messageText || (
    node.type === 'pin_message' ? "✅ Сообщение закреплено" :
      node.type === 'unpin_message' ? "✅ Сообщение откреплено" :
        node.type === 'delete_message' ? "🗑️ Сообщение успешно удалено!" :
          "✅ Действие выполнено"
  );

  let code = `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} ")) and message.chat.type in ['group', 'supergroup'])\n`;
  code += `async def ${node.type}_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик синонима '${synonym}' для ${node.type}\n`;
  code += `    Работает в группах с ответом на сообщение или с указанием ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевое сообщение\n`;
  code += `    target_message_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        # Если есть ответ на сообщение - используем его\n`;
  code += `        target_message_id = message.reply_to_message.message_id\n`;
  code += `        logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для сообщения {target_message_id} (через ответ)")\n`;
  code += `    else:\n`;
  code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_message_id = int(text_parts[1])\n`;
  code += `            logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для сообщения {target_message_id} (через ID)")\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    \n`;
  code += `    try:\n`;

  if (node.type === 'pin_message') {
    const disableNotification = node.data.disableNotification || false;
    code += `        # Закрепляем сообщение\n`;
    code += `        await bot.pin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id,\n`;
    code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id}")\n`;
  } else if (node.type === 'unpin_message') {
    code += `        # Открепляем сообщение\n`;
    code += `        await bot.unpin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id}")\n`;
  } else if (node.type === 'delete_message') {
    code += `        # Удаляем сообщение\n`;
    code += `        await bot.delete_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id}")\n`;
  }

  code += `    \n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для выполнения операции")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка {current_node_type}: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")\n`;
  code += `\n`;

  return code;
}
