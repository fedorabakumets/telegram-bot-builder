import { Node } from '../../../../shared/schema';

export function generatePromoteUserHandler(node: Node): string {
  let code = `\n# Promote User Handler\n`;

  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['повысить', 'админ', 'назначить'];

  // Admin rights
  const canChangeInfo = node.data.canChangeInfo || false;
  const canDeleteMessages = node.data.canDeleteMessages || true;
  const canBanUsers = node.data.canBanUsers || false;
  const canInviteUsers = node.data.canInviteUsers || true;
  const canPinMessages = node.data.canPinMessages || true;
  const canAddAdmins = node.data.canAddAdmins || false;
  const canRestrictMembers = node.data.canRestrictMembers || false;
  const canPromoteMembers = node.data.canPromoteMembers || false;
  const canManageVideoChats = node.data.canManageVideoChats || false;
  const canManageTopics = node.data.canManageTopics || false;
  const isAnonymous = node.data.isAnonymous || false;

  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');

  // Генерируем обработчик команды /promote_user
  code += `@dp.message(Command("promote_user"))\n`;
  code += `async def promote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /promote_user\n`;
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
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для повышения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для повышения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Повышаем пользователя до админа\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=${canChangeInfo ? 'True' : 'False'},\n`;
  code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
  code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
  code += `            can_restrict_members=${canRestrictMembers ? 'True' : 'False'},\n`;
  code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'},\n`;
  code += `            can_promote_members=${canPromoteMembers ? 'True' : 'False'},\n`;
  code += `            can_manage_video_chats=${canManageVideoChats ? 'True' : 'False'},\n`;
  if (canManageTopics) {
    code += `            can_manage_topics=${canManageTopics ? 'True' : 'False'},\n`;
  }
  code += `            is_anonymous=${isAnonymous ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором!")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} назначен администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e) or "RIGHT_FORBIDDEN" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для назначения администраторов. Бот должен быть администратором с правом назначать других администраторов.")\n`;
  code += `        elif "USER_NOT_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь не является участником группы")\n`;
  code += `        elif "USER_ALREADY_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь уже является администратором")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка назначения админа: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при назначении админа: {e}")\n`;
  code += `\n`;

  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }

  code += `@dp.message(${condition})\n`;
  code += `async def promote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для назначения пользователя администратором\n`;
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
  code += `        await message.answer("❌ Не удалось определить пользователя для назначения администратором")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Назначаем пользователя администратором\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=${canChangeInfo ? 'True' : 'False'},\n`;
  code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
  code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
  code += `            can_restrict_members=${canRestrictMembers ? 'True' : 'False'},\n`;
  code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'},\n`;
  code += `            can_promote_members=${canPromoteMembers ? 'True' : 'False'},\n`;
  code += `            can_manage_video_chats=${canManageVideoChats ? 'True' : 'False'},\n`;
  if (canManageTopics) {
    code += `            can_manage_topics=${canManageTopics ? 'True' : 'False'},\n`;
  }
  code += `            is_anonymous=${isAnonymous ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Создаем список предоставленных прав\n`;
  code += `        rights = []\n`;
  if (canChangeInfo) code += `        rights.append("изменение информации")\n`;
  if (canDeleteMessages) code += `        rights.append("удаление сообщений")\n`;
  if (canBanUsers) code += `        rights.append("блокировка пользователей")\n`;
  if (canInviteUsers) code += `        rights.append("приглашение пользователей")\n`;
  if (canPinMessages) code += `        rights.append("закрепление сообщений")\n`;
  if (canRestrictMembers) code += `        rights.append("ограничение участников")\n`;
  if (canPromoteMembers) code += `        rights.append("назначение администраторов")\n`;
  if (canManageVideoChats) code += `        rights.append("управление видеочатами")\n`;
  if (canManageTopics) code += `        rights.append("управление темами")\n`;

  code += `        rights_text = ", ".join(rights) if rights else "базовые права администратора"\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором\\nПрава: {rights_text}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e) or "RIGHT_FORBIDDEN" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для назначения администратора. Бот должен быть администратором с правом назначать других администраторов.")\n`;
  code += `        elif "USER_NOT_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь не является участником группы")\n`;
  code += `        elif "USER_ALREADY_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь уже является администратором")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка назначения администратора: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при назначении администратора: {e}")\n`;
  code += `\n`;

  return code;
}
