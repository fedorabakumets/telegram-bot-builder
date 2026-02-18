import { Node } from '@shared/schema';

// ============================================================================
// ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ
// ============================================================================
export function generateBanUserHandler(node: Node): string {
  let code = `\n# Ban User Handler\n`;
  const reason = node.data.reason || 'Нарушение правил группы';
  const untilDate = node.data.untilDate || 0;
  const synonyms = node.data.synonyms || ['забанить', 'бан', 'заблокировать'];

  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');

  // Генерируем обработчик команды /ban_user
  code += `@dp.message(Command("ban_user"))\n`;
  code += `async def ban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /ban_user\n`;
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
  code += `        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
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
  code += `        await message.answer("❌ Не удалось определить пользователя для блокировки")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Баним пользователя\n`;
  if (untilDate && untilDate > 0) {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    code += `            until_date=${untilDate}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до {untilDate}\\nПричина: ${reason}")\n`;
  } else {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
  }
  code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для блокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка блокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при блокировке: {e}")\n`;
  code += `\n`;

  // Генерируем условие для работы в любых группах (синонимы)
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}]) and message.chat.type in ['group', 'supergroup']`;

  code += `@dp.message(${condition})\n`;
  code += `async def ban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для блокировки пользователя\n`;
  code += `    Синонимы: ${synonymsList.join(', ')}\n`;
  code += `    Работает в любых группах где бот имеет права администратора\n`;
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
  code += `        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
  // Автоматическое определение пользователя из упоминаний
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
  code += `        await message.answer("❌ Не удалось определить пользователя для блокировки")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Баним пользователя\n`;
  if (untilDate && untilDate > 0) {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    code += `            until_date=${untilDate}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до {untilDate}\\nПричина: ${reason}")\n`;
  } else {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
  }
  code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для блокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка блокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при блокировке: {e}")\n`;
  code += `\n`;

  return code;
}
