import { Node } from '../../../../shared/schema';

export function generateUserManagementSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  // Для admin_rights разрешаем работу в любых чатах, для остальных - только в группах
  const chatTypeFilter = node.type === 'admin_rights' ? '' : ` and message.chat.type in ['group', 'supergroup']`;
  let code = `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} "))${chatTypeFilter})\n`;
  code += `async def ${node.type}_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик синонима '${synonym}' для ${node.type}\n`;
  code += `    Работает в группах с ответом на сообщение или с указанием ID пользователя\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        # Если есть ответ на сообщение - используем его\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для пользователя {target_user_id} (через ответ)")\n`;
  code += `    else:\n`;
  code += `        # Если нет ответа, проверяем текст на наличие ID пользователя\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_user_id = int(text_parts[1])\n`;
  code += `            logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для пользователя {target_user_id} (через ID)")\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите '${synonym} ID_пользователя'")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя")\n`;
  code += `        return\n`;
  code += `    \n`;
  // Генерируем код в зависимости от типа узла
  code += `    # Тип текущего узла для логирования\n`;
  code += `    current_node_type = "${node.type}"\n`;
  code += `    try:\n`;
  if (node.type === 'ban_user') {
    const reason = node.data.reason || 'Нарушение правил группы';
    const untilDate = node.data.untilDate || 0;

    if (untilDate && untilDate > 0) {
      code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id, until_date=${untilDate})\n`;
      code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до ${untilDate}\\nПричина: ${reason}")\n`;
    } else {
      code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
      code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
    }
    code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id}")\n`;
  } else if (node.type === 'unban_user') {
    code += `        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id, only_if_banned=True)\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id}")\n`;
  } else if (node.type === 'kick_user') {
    const reason = node.data.reason || 'Нарушение правил группы';
    code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
    code += `        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id}")\n`;
  } else if (node.type === 'mute_user') {
    const duration = node.data.duration || 3600;
    const reason = node.data.reason || 'Нарушение правил группы';
    const canSendMessages = node.data.canSendMessages || false;
    const canSendMediaMessages = node.data.canSendMediaMessages || false;

    code += `        from datetime import datetime, timedelta\n`;
    code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
    code += `        await bot.restrict_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            permissions=types.ChatPermissions(\n`;
    code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
    code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'}\n`;
    code += `            ), until_date=until_date\n`;
    code += `        )\n`;
    code += `        hours = ${duration} // 3600\n`;
    code += `        minutes = (${duration} % 3600) // 60\n`;
    code += `        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id}")\n`;
  } else if (node.type === 'unmute_user') {
    code += `        await bot.restrict_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            permissions=types.ChatPermissions(\n`;
    code += `                can_send_messages=True, can_send_media_messages=True,\n`;
    code += `                can_send_polls=True, can_send_other_messages=True,\n`;
    code += `                can_add_web_page_previews=True\n`;
    code += `            )\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")\n`;
    code += `        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id}")\n`;
  } else if (node.type === 'promote_user') {
    const canDeleteMessages = node.data.canDeleteMessages !== false;
    const canInviteUsers = node.data.canInviteUsers !== false;
    const canPinMessages = node.data.canPinMessages !== false;

    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
    code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
    code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id}")\n`;
  } else if (node.type === 'demote_user') {
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            can_change_info=False, can_delete_messages=False,\n`;
    code += `            can_invite_users=False, can_restrict_members=False,\n`;
    code += `            can_pin_messages=False, can_promote_members=False\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")\n`;
    code += `        logging.info(f"Права администратора сняты с пользователя {target_user_id} администратором {user_id}")\n`;
  } else if (node.type === 'admin_rights') {
    // Для admin_rights узлов перенаправляем к callback обработчику
    const safeFunctionName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `        # Создаем Mock callback для эмуляции inline кнопки admin_rights\n`;
    code += `        class MockCallback:\n`;
    code += `            def __init__(self, data, user, msg):\n`;
    code += `                self.data = data\n`;
    code += `                self.from_user = user\n`;
    code += `                self.message = msg\n`;
    code += `            async def answer(self):\n`;
    code += `                pass  # Mock метод, ничего не делаем\n`;
    code += `            async def edit_text(self, text, **kwargs):\n`;
    code += `                try:\n`;
    code += `                    return await self.message.edit_text(text, **kwargs)\n`;
    code += `                except Exception as e:\n`;
    code += `                    logging.warning(f"Не удалось отредактировать сообщение: {e}")\n`;
    code += `                    return await self.message.answer(text, **kwargs)\n`;
    code += `        \n`;
    code += `        mock_callback = MockCallback("${node.id}", callback_query.from_user, callback_query.message)\n`;
    code += `        # bot уже определен глобально\n`;
    code += `        await handle_callback_${safeFunctionName}(mock_callback, bot)\n`;
    code += `        return  # Завершаем обработку, так как все сделано в callback\n`;
  }

  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
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
