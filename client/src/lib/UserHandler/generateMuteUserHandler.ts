export function generateMuteUserHandler(node: Node): string {
  let code = `\n# Mute User Handler\n`;
  const duration = node.data.duration || 3600;
  const reason = node.data.reason || 'Нарушение правил группы';
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || 'замутить, мут, заткнуть';

  // Permissions для мута
  const canSendMessages = node.data.canSendMessages || false;
  const canSendMediaMessages = node.data.canSendMediaMessages || false;
  const canSendPolls = node.data.canSendPolls || false;
  const canSendOtherMessages = node.data.canSendOtherMessages || false;
  const canAddWebPagePreviews = node.data.canAddWebPagePreviews || false;
  const canChangeGroupInfo = node.data.canChangeGroupInfo || false;
  const canInviteUsers2 = node.data.canInviteUsers2 || false;
  const canPinMessages2 = node.data.canPinMessages2 || false;

  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');

  // Генерируем обработчик команды /mute_user
  code += `@dp.message(Command("mute_user"))\n`;
  code += `async def mute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    \"\"\"\n`;
  code += `    Обработчик команды /mute_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    \"\"\"\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer(\"❌ Команда работает только в группах\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == \"text_mention\":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer(\"❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия\")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer(\"❌ Не удалось определить пользователя для ограничения\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Вычисляем время окончания мута\n`;
  code += `        from datetime import datetime, timedelta\n`;
  code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
  code += `        \n`;
  code += `        # Ограничиваем пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
  code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'},\n`;
  code += `                can_send_polls=${canSendPolls ? 'True' : 'False'},\n`;
  code += `                can_send_other_messages=${canSendOtherMessages ? 'True' : 'False'},\n`;
  code += `                can_add_web_page_previews=${canAddWebPagePreviews ? 'True' : 'False'},\n`;
  code += `                can_change_info=${canChangeGroupInfo ? 'True' : 'False'},\n`;
  code += `                can_invite_users=${canInviteUsers2 ? 'True' : 'False'},\n`;
  code += `                can_pin_messages=${canPinMessages2 ? 'True' : 'False'}\n`;
  code += `            ),\n`;
  code += `            until_date=until_date\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        hours = ${duration} // 3600\n`;
  code += `        minutes = (${duration} % 3600) // 60\n`;
  code += `        time_str = f\"{hours}ч {minutes}м\" if hours > 0 else f\"{minutes}м\"\n`;
  code += `        \n`;
  code += `        await message.answer(f\"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}\")\n`;
  code += `        logging.info(f\"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на ${duration} секунд\")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if \"not enough rights\" in str(e) or \"CHAT_ADMIN_REQUIRED\" in str(e):\n`;
  code += `            await message.answer(\"❌ Недостаточно прав для ограничения пользователя\")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f\"❌ Ошибка: {e}\")\n`;
  code += `        logging.error(f\"Ошибка ограничения пользователя: {e}\")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(\"❌ Произошла неожиданная ошибка\")\n`;
  code += `        logging.error(f\"Неожиданная ошибка при ограничении: {e}\")\n`;
  code += `\n`;

  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }

  code += `@dp.message(${condition})\n`;
  code += `async def mute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для ограничения пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;

  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для ограничения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Вычисляем время окончания мута\n`;
  code += `        from datetime import datetime, timedelta\n`;
  code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
  code += `        \n`;
  code += `        # Ограничиваем пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
  code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'},\n`;
  code += `                can_send_polls=${canSendPolls ? 'True' : 'False'},\n`;
  code += `                can_send_other_messages=${canSendOtherMessages ? 'True' : 'False'},\n`;
  code += `                can_add_web_page_previews=${canAddWebPagePreviews ? 'True' : 'False'},\n`;
  code += `                can_change_info=${canChangeGroupInfo ? 'True' : 'False'},\n`;
  code += `                can_invite_users=${canInviteUsers2 ? 'True' : 'False'},\n`;
  code += `                can_pin_messages=${canPinMessages2 ? 'True' : 'False'}\n`;
  code += `            ),\n`;
  code += `            until_date=until_date\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        hours = ${duration} // 3600\n`;
  code += `        minutes = (${duration} % 3600) // 60\n`;
  code += `        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на ${duration} секунд")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для ограничения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка ограничения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при ограничении: {e}")\n`;
  code += `\n`;

  return code;
}
