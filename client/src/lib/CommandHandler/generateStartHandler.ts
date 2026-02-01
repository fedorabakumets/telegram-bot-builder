import { generateButtonText } from '../format/generateButtonText';
import { formatTextForPython } from '../format/formatTextForPython';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { generateUniversalVariableReplacement } from '../utils/generateUniversalVariableReplacement';
import { generateAttachedMediaSendCode } from '../format/generateAttachedMediaSendCode';
import { Node } from '@shared/schema';

// ============================================================================
// ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ КОМАНД И СООБЩЕНИЙ
// ============================================================================
export function generateStartHandler(node: Node, userDatabaseEnabled: boolean): string {
  let code = '\n@dp.message(CommandStart())\n';
  code += 'async def start_handler(message: types.Message):\n';

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Регистрируем пользователя и сохраняем его данные
  code += '\n    # Регистрируем пользователя в системе\n';
  code += '    user_id = message.from_user.id\n';
  code += '    username = message.from_user.username\n';
  code += '    first_name = message.from_user.first_name\n';
  code += '    last_name = message.from_user.last_name\n';
  code += '    \n';

  if (userDatabaseEnabled) {
    code += '    # Сохраняем пользователя в базу данных\n';
    code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
    code += '    \n';
    code += '    # Сохраняем переменные пользователя в базу данных\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    await update_user_data_in_db(user_id, "user_name", user_name)\n';
    code += '    await update_user_data_in_db(user_id, "first_name", first_name)\n';
    code += '    await update_user_data_in_db(user_id, "last_name", last_name)\n';
    code += '    await update_user_data_in_db(user_id, "username", username)\n';
    code += '    \n';
    code += '    # Резервное сохранение в локальное хранилище\n';
    code += '    if not saved_to_db:\n';
    code += '        user_data[user_id] = {\n';
    code += '            "username": username,\n';
    code += '            "first_name": first_name,\n';
    code += '            "last_name": last_name,\n';
    code += '            "user_name": user_name,\n';
    code += '            "registered_at": message.date\n';
    code += '        }\n';
    code += '        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")\n';
    code += '    else:\n';
    code += '        logging.info(f"Пользователь {user_id} сохранен в базу данных")\n\n';
  } else {
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    \n';
  }

  // Используем универсальную замену переменных для инициализации
  code += generateUniversalVariableReplacement('    ');

  // Восстанавливаем состояние множественного выбора ТОЛЬКО если он включен
  if (node.data.allowMultipleSelection) {
    code += '    saved_interests = []\n';
    code += '    \n';

    if (userDatabaseEnabled) {
      code += '    # Восстанавливаем состояние множественного выбора из БД\n';
      code += '    user_record = await get_user_from_db(user_id)\n';
      code += '    \n';
      code += '    if user_record and isinstance(user_record, dict):\n';
      code += '        user_data_field = user_record.get("user_data", {})\n';
      code += '        if isinstance(user_data_field, str):\n';
      code += '            import json\n';
      code += '            try:\n';
      code += '                user_vars = json.loads(user_data_field)\n';
      code += '            except:\n';
      code += '                user_vars = {}\n';
      code += '        elif isinstance(user_data_field, dict):\n';
      code += '            user_vars = user_data_field\n';
      code += '        else:\n';
      code += '            user_vars = {}\n';
      code += '        \n';
      code += '        # Ищем сохраненные интересы\n';
      code += '        for var_name, var_data in user_vars.items():\n';
      code += '            if "интерес" in var_name.lower() or var_name == "user_interests":\n';
      code += '                if isinstance(var_data, str) and var_data:\n';
      code += '                    saved_interests = [interest.strip() for interest in var_data.split(",")]\n';
      code += '                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")\n';
      code += '                    break\n';
    } else {
      code += '    # Восстанавливаем состояние из локального хранилища\n';
      code += '    if user_id in user_data:\n';
      code += '        for var_name, var_data in user_data[user_id].items():\n';
      code += '            if "интерес" in var_name.lower() or var_name == "user_interests":\n';
      code += '                if isinstance(var_data, str) and var_data:\n';
      code += '                    saved_interests = [interest.strip() for interest in var_data.split(",")]\n';
      code += '                    logging.info(f"Восстановлены интересы: {saved_interests}")\n';
      code += '                    break\n';
      code += '                elif isinstance(var_data, list):\n';
      code += '                    saved_interests = var_data\n';
      code += '                    logging.info(f"Восстановлены интересы: {saved_interests}")\n';
      code += '                    break\n';
    }

    code += '    \n';
    code += '    # Инициализируем состояние множественного выбора\n';
    code += '    if user_id not in user_data:\n';
    code += '        user_data[user_id] = {}\n';
    const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';
    code += `    user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy() if saved_interests else []\n`;
    code += `    user_data[user_id]["multi_select_node"] = "${node.id}"\n`;
    code += '    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")\n';
    code += '    \n';
  }

  // Создаем клавиатуру с восстановленными галочками для множественного выбора
  if (node.data.allowMultipleSelection) {
    code += '    # Создаем клавиатуру с восстановленными галочками\n';
    code += '    builder = InlineKeyboardBuilder()\n';
    code += '    \n';
    code += '    # Функция для проверки совпадения интересов\n';
    code += '    def check_interest_match(button_text, saved_list):\n';
    code += '        """Проверяет, есть ли интерес в сохраненном списке"""\n';
    code += '        if not saved_list:\n';
    code += '            return False\n';
    code += '        # Убираем эмодзи и галочки для сравнения\n';
    code += '        clean_button = button_text.replace("✅ ", "").replace("⬜ ", "").strip()\n';
    code += '        for saved_interest in saved_list:\n';
    code += '            clean_saved = saved_interest.replace("✅ ", "").replace("⬜ ", "").strip()\n';
    code += '            if clean_button == clean_saved or clean_button in clean_saved or clean_saved in clean_button:\n';
    code += '                return True\n';
    code += '        return False\n';
    code += '    \n';

    // Добавляем кнопки интересов с галочками
    const buttons = node.data.buttons || [];
    const interestButtons = buttons.filter(btn => btn.action === 'selection');

    interestButtons.forEach(button => {
      const buttonText = button.text || 'Неизвестно';
      const buttonTarget = button.target || button.id;
      code += `    ${buttonTarget}_selected = check_interest_match("${buttonText}", saved_interests)\n`;
      code += `    ${buttonTarget}_text = "✅ ${buttonText}" if ${buttonTarget}_selected else "${buttonText}"\n`;
      code += `    builder.add(InlineKeyboardButton(text=${buttonTarget}_text, callback_data="multi_select_${node.id}_${buttonTarget}"))\n`;
      code += '    \n';
    });

    // Добавляем кнопки команд и другие кнопки ПЕРЕД кнопкой "Готово"
    const allButtons = node.data.buttons || [];
    const nonSelectionButtons = allButtons.filter(btn => btn.action !== 'selection');

    nonSelectionButtons.forEach(button => {
      if (button.action === 'command') {
        const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      } else if (button.action === 'url') {
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      }
    });

    // Добавляем кнопку "Готово"
    const continueTarget = node.data.continueButtonTarget || 'next';
    const continueText = node.data.continueButtonText || 'Готово';
    code += `    builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
    code += '    builder.adjust(2)  # Используем 2 колонки для консистентности\n';
    code += '    keyboard = builder.as_markup()\n';
    code += '    \n';
  }

  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "Привет! Добро пожаловать!";
  const formattedText = formatTextForPython(messageText);

  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    // Инициализируем text основным сообщением ПЕРЕД проверкой условий
    code += '    # Проверяем условные сообщения\n';
    code += `    text = ${formattedText}  # Основной текст узла как fallback\n`;
    code += '    conditional_parse_mode = None\n';
    code += '    conditional_keyboard = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';

    // Generate conditional logic using helper function - условия теперь переопределят text если нужно
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ', node.data);

    // Не нужен else блок - text уже инициализирован основным сообщением
    code += '    \n';
  } else {
    code += `    text = ${formattedText}\n`;
  }

  // Для множественного выбора используем уже созданную клавиатуру
  if (node.data.allowMultipleSelection) {
    code += '    await message.answer(text, reply_markup=keyboard)\n';
    return code;
  }

  // Генерируем клавиатуру
  const keyboardCode = generateKeyboard(node);

  // ИСПРАВЛЕНИЕ: Добавляем автопереход для узлов start, если он настроен
  if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
    // Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true
    if (node.data.collectUserInput !== false) {
      const autoTransitionTarget = node.data.autoTransitionTo;
      const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');

      code += keyboardCode;
      code += '\n    # АВТОПЕРЕХОД: Переходим к следующему узлу автоматически (только если collectUserInput=true)\n';
      code += `    logging.info(f"⚡ Автопереход от узла ${node.id} к узлу ${autoTransitionTarget}")\n`;
      code += '    # Создаем временный callback_query объект для вызова обработчика\n';
      code += '    from aiogram.types import CallbackQuery\n';
      code += '    temp_callback = CallbackQuery(\n';
      code += '        id="auto_transition",\n';
      code += '        from_user=message.from_user,\n';
      code += `        data="${autoTransitionTarget}",\n`;
      code += '        chat_instance=str(message.chat.id),\n';
      code += '        message=message\n';
      code += '    )\n';
      code += `    await handle_callback_${safeFunctionName}(temp_callback)\n`;
      code += `    logging.info(f"✅ Автопереход выполнен: ${node.id} -> ${autoTransitionTarget}")\n`;
      return code; // Возвращаем без добавления keyboardCode повторно
    } else {
      code += '\n    # Автопереход пропущен: collectUserInput=false\n';
      code += `    logging.info(f"ℹ️ Узел ${node.id} не собирает ответы (collectUserInput=false)")\n`;
    }
  }

  // Проверяем наличие attachedMedia (включая imageUrl) и генерируем соответствующий код
  const attachedMedia = node.data.attachedMedia || [];
  if (attachedMedia.length > 0) {
    // Создаем карту медиапеременных для этого узла
    const mediaVariablesMap = new Map();
    attachedMedia.forEach(mediaVar => {
      // Определяем тип медиа по имени переменной
      let mediaType = 'photo'; // по умолчанию
      if (mediaVar.startsWith('video_url_')) mediaType = 'video';
      else if (mediaVar.startsWith('audio_url_')) mediaType = 'audio';
      else if (mediaVar.startsWith('document_url_')) mediaType = 'document';

      mediaVariablesMap.set(mediaVar, {
        type: mediaType,
        variable: mediaVar
      });
    });

    // Генерируем код для отправки медиа, адаптируя его для использования в start_handler
    let mediaCode = '';

    // Сначала сохраняем значение переменной из imageUrl в базу данных
    mediaCode += `    # Сохраняем значение переменной ${attachedMedia[0]} в базу данных\n`;
    mediaCode += `    await update_user_data_in_db(user_id, "${attachedMedia[0]}", "${node.data.imageUrl}")\n`;
    mediaCode += '\n';
    mediaCode += '    # Обновляем user_vars, чтобы включить только что сохраненную переменную\n';
    mediaCode += '    user_vars = await get_user_from_db(user_id)\n';
    mediaCode += '    if not user_vars:\n';
    mediaCode += '        user_vars = user_data.get(user_id, {})\n';
    mediaCode += '    if not isinstance(user_vars, dict):\n';
    mediaCode += '        user_vars = user_data.get(user_id, {})\n';
    mediaCode += '\n';
    mediaCode += '    # Проверяем наличие прикрепленного медиа из переменной\n';
    mediaCode += '    attached_media = None\n';
    mediaCode += `    if user_vars and "${attachedMedia[0]}" in user_vars:\n`;
    mediaCode += `        media_data = user_vars["${attachedMedia[0]}"]\n`;
    mediaCode += '        if isinstance(media_data, dict) and "value" in media_data:\n';
    mediaCode += '            attached_media = media_data["value"]\n';
    mediaCode += '        elif isinstance(media_data, str):\n';
    mediaCode += '            attached_media = media_data\n';
    mediaCode += '        # Также проверяем, может быть переменная хранится напрямую в user_data\n';
    mediaCode += `    elif "${attachedMedia[0]}" in user_data.get(user_id, {}):\n`;
    mediaCode += `        attached_media = user_data[user_id]["${attachedMedia[0]}"]\n`;
    mediaCode += '\n';
    mediaCode += '    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение\n';
    mediaCode += '    if attached_media and str(attached_media).strip():\n';
    mediaCode += `        logging.info(f"📎 Отправка фото из переменной ${attachedMedia[0]}: {attached_media}")\n`;
    mediaCode += '        try:\n';
    mediaCode += '            # Заменяем переменные в тексте перед отправкой медиа\n';
    mediaCode += '            processed_caption = replace_variables_in_text(text, user_vars)\n';

    const keyboardParam = (node.data.allowMultipleSelection || node.data.keyboardType !== 'none') ? ', reply_markup=keyboard' : '';
    const parseModeParam = node.data.formatMode && node.data.formatMode !== 'none' ? `, parse_mode=ParseMode.${node.data.formatMode.toUpperCase()}` : '';

    // Преобразуем внутренний путь в публичный URL, если это внутренний путь
    mediaCode += '            # Преобразуем внутренний путь в публичный URL\n';
    mediaCode += '            public_url = attached_media\n';
    mediaCode += '            if attached_media.startswith("/uploads/"):\n';
    mediaCode += '                # Получаем базовый URL сервера из API_BASE_URL и добавляем путь\n';
    mediaCode += '                if API_BASE_URL.endswith("/"):\n';
    mediaCode += '                    public_url = API_BASE_URL + attached_media[1:]  # Убираем начальный слэш\n';
    mediaCode += '                else:\n';
    mediaCode += '                    public_url = API_BASE_URL + attached_media\n';
    mediaCode += '            \n';
    mediaCode += `            await bot.send_photo(message.chat.id, public_url, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
    mediaCode += '        except Exception as e:\n';
    mediaCode += '            logging.error(f"Ошибка отправки фото: {e}")\n';
    mediaCode += '            # Fallback на обычное сообщение при ошибке\n';
    mediaCode += `            await message.answer(text${parseModeParam}${keyboardParam})\n`;
    mediaCode += '    else:\n';
    mediaCode += '        # Медиа не найдено, отправляем обычное текстовое сообщение\n';
    mediaCode += `        logging.info(f"📝 Медиа ${attachedMedia[0]} не найдено, отправка текстового сообщения")\n`;
    mediaCode += '        # Заменяем переменные в тексте перед отправкой\n';
    mediaCode += '        processed_text = replace_variables_in_text(text, user_vars)\n';
    mediaCode += `        await message.answer(processed_text${parseModeParam}${keyboardParam})\n`;

    if (mediaCode) {
      // Если есть медиа, возвращаем код с медиа вместо обычного сообщения
      return code + mediaCode;
    }
  }

  // Если не было автоперехода, добавляем клавиатуру
  return code + keyboardCode;
}
