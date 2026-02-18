import { Node } from '@shared/schema';

export function generateDemoteUserHandler(node: Node): string {
  let code = `\n# Demote User Handler\n`;

  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['понизить', 'снять с админки', 'демоут'];

  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');

  // Генерируем обработчик команды /demote_user
  code += `@dp.message(Command("demote_user"))\n`;
  code += `async def demote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /demote_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
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
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для понижения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для понижения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Понижаем пользователя - убираем все права админа\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=False,\n`;
  code += `            can_delete_messages=False,\n`;
  code += `            can_invite_users=False,\n`;
  code += `            can_restrict_members=False,\n`;
  code += `            can_pin_messages=False,\n`;
  code += `            can_promote_members=False,\n`;
  code += `            can_manage_video_chats=False,\n`;
  code += `            can_manage_topics=False,\n`;
  code += `            is_anonymous=False\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} снят с должности администратора!")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} понижен администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для понижения администраторов")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка понижения админа: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при понижении админа: {e}")\n`;
  code += `\n`;

  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }

  code += `@dp.message(${condition})\n`;
  code += `async def demote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для снятия прав администратора с пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
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
  code += `        await message.answer("❌ Не удалось определить пользователя для снятия прав администратора")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем права администратора\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=False,\n`;
  code += `            can_delete_messages=False,\n`;
  code += `            can_invite_users=False,\n`;
  code += `            can_restrict_members=False,\n`;
  code += `            can_pin_messages=False,\n`;
  code += `            can_promote_members=False,\n`;
  code += `            can_manage_video_chats=False,\n`;
  code += `            can_manage_topics=False,\n`;
  code += `            is_anonymous=False\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")\n`;
  code += `        logging.info(f"Права администратора сняты с пользователя {target_user_id} пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для снятия прав администратора")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка снятия прав администратора: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при снятии прав администратора: {e}")\n`;
  code += `\n`;

  return code;
}
