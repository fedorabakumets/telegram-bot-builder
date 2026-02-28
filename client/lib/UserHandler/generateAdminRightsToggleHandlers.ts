import { createSafeFunctionName } from '../bot-generator/format/createSafeFunctionName';




export function generateAdminRightsToggleHandlers(node: any): string {
  const safeFunctionName = createSafeFunctionName(node.id);
  let code = '\n';

  // Список основных админ прав включая управление историями
  const adminRights = [
    'can_change_info',
    'can_delete_messages',
    'can_restrict_members',
    'can_invite_users',
    'can_pin_messages',
    'can_manage_video_chats',
    'can_post_stories',
    'can_edit_stories',
    'can_delete_stories',
    'is_anonymous',
    'can_promote_members'
  ];

  // Создаем обработчик для каждого права
  adminRights.forEach(rightKey => {
    const shortRightKey = rightKey.substring(0, 12); // Обрезаем ключ права до 12 символов
    code += `# Обработчик переключения права: ${rightKey}\n`;
    code += `@dp.callback_query(lambda c: c.data.startswith("tr_${shortRightKey}_"))\n`;
    code += `async def toggle_${rightKey}_${safeFunctionName}(callback_query: types.CallbackQuery, bot):\n`;
    code += `    """\n`;
    code += `    Переключает право ${rightKey} для пользователя\n`;
    code += `    """\n`;
    code += `    await callback_query.answer()\n`;
    code += `    \n`;
    code += `    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>\n`;
    code += `    try:\n`;
    code += `        data_parts = callback_query.data.split('_')\n`;
    code += `        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']\n`;
    code += `        if len(data_parts) < 4:\n`;
    code += `            raise ValueError("Недостаточно частей в callback_data")\n`;
    code += `        target_user_id = int(data_parts[-2])\n`;
    code += `        node_hash = data_parts[-1]\n`;
    code += `        logging.info(f"Переключаем право ${rightKey} для пользователя {target_user_id}")\n`;
    code += `    except (ValueError, IndexError) as e:\n`;
    code += `        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")\n`;
    code += `        await callback_query.answer("❌ Ошибка в данных кнопки")\n`;
    code += `        return\n`;
    code += `    \n`;
    code += `    user_id = callback_query.from_user.id\n`;
    code += `    chat_id = callback_query.message.chat.id\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Проверяем права БОТА на управление правами администраторов\n`;
    code += `        bot_member = await bot.get_chat_member(chat_id, bot.id)\n`;
    code += `        if bot_member.status not in ['administrator', 'creator']:\n`;
    code += `            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")\n`;
    code += `            return\n`;
    code += `            \n`;
    code += `        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):\n`;
    code += `            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")\n`;
    code += `            return\n`;
    code += `        \n`;
    code += `        # Получаем текущие права целевого пользователя\n`;
    code += `        target_member = await bot.get_chat_member(chat_id, target_user_id)\n`;
    code += `        if target_member.status not in ['administrator', 'creator']:\n`;
    code += `            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")\n`;
    code += `            return\n`;
    code += `        \n`;
    code += `        # Получаем текущее состояние права\n`;
    code += `        current_value = getattr(target_member, '${rightKey}', False)\n`;
    code += `        new_value = not current_value\n`;
    code += `        \n`;
    code += `        # Подготавливаем права для обновления\n`;
    code += `        permissions = {\n`;
    adminRights.forEach(right => {
      code += `            '${right}': getattr(target_member, '${right}', False),\n`;
    });
    code += `        }\n`;
    code += `        permissions['${rightKey}'] = new_value\n`;
    code += `        \n`;
    code += `        # Применяем изменения\n`;
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    adminRights.forEach(right => {
      code += `            ${right}=permissions['${right}'],\n`;
    });
    code += `        )\n`;
    code += `        \n`;
    code += `        # Обновляем клавиатуру с новым состоянием\n`;
    code += `        keyboard = await create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
    code += `        \n`;
    code += `        # Обновляем сообщение\n`;
    code += `        text = "⚙️ Управление правами администратора"\n`;
    code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n`;
    code += `        \n`;
    code += `        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право '${rightKey}' для пользователя {target_user_id}")\n`;
    code += `        \n`;
    code += `    except Exception as e:\n`;
    code += `        logging.error(f"Ошибка при переключении права ${rightKey}: {e}")\n`;
    code += `        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")\n`;
    code += `\n`;
  });

  // Обработчик кнопки обновления
  code += `# Обработчик кнопки обновления прав\n`;
  code += `@dp.callback_query(lambda c: c.data.startswith("ref_"))\n`;
  code += `async def refresh_admin_rights_${safeFunctionName}(callback_query: types.CallbackQuery, bot):\n`;
  code += `    """\n`;
  code += `    Обновляет отображение прав администратора\n`;
  code += `    """\n`;
  code += `    await callback_query.answer("🔄 Обновляем...")\n`;
  code += `    \n`;
  code += `    # Парсим данные: ref_<user_id>_<node_hash>\n`;
  code += `    data_parts = callback_query.data.split('_')\n`;
  code += `    target_user_id = int(data_parts[-2])\n`;
  code += `    \n`;
  code += `    chat_id = callback_query.message.chat.id\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Создаем обновленную клавиатуру\n`;
  code += `        keyboard = await create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
  code += `        \n`;
  code += `        # Обновляем сообщение\n`;
  code += `        text = "⚙️ Управление правами администратора"\n`;
  code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n`;
  code += `        \n`;
  code += `        logging.info(f"Обновлены права для пользователя {target_user_id}")\n`;
  code += `        \n`;
  code += `    except Exception as e:\n`;
  code += `        logging.error(f"Ошибка при обновлении прав: {e}")\n`;
  code += `        await safe_edit_or_send(callback_query, "❌ Не удалось обновить права. Попробуйте позже.")\n`;
  code += `\n`;

  return code;
}
