import { generateButtonText } from '../format/generateButtonText';
import { formatTextForPython } from '../format/formatTextForPython';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { generateUniversalVariableReplacement } from '../utils/generateUniversalVariableReplacement';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateAttachedMediaSendCode } from '../MediaHandler/generateAttachedMediaSendCode';
import { Node } from '@shared/schema';

// ============================================================================
// ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ КОМАНД И СООБЩЕНИЙ
// ============================================================================

/**
 * Генерирует Python код обработчика команды /start для Telegram бота на основе конфигурации узла.
 * 
 * Эта функция создает асинхронный обработчик команды /start, который включает:
 * - Декоратор для регистрации команды в диспетчере бота
 * - Логирование вызова команды
 * - Проверки безопасности (приватные чаты, права администратора, авторизация)
 * - Регистрацию и сохранение информации о пользователе в БД и локальном хранилище
 * - Инициализацию пользовательских переменных и переменных окружения
 * - Поддержку множественного выбора с восстановлением состояния
 * - Обработку условных сообщений на основе данных пользователя
 * - Генерацию клавиатуры для интерактивного ответа
 * - Автоматические переходы между узлами (если настроены)
 * - Универсальную замену переменных в тексте сообщения
 * 
 * @param node - Узел конфигурации команды, содержащий настройки и данные команды
 * @param userDatabaseEnabled - Флаг, указывающий на использование базы данных для хранения пользователей
 * @returns Строку с Python кодом обработчика команды /start
 * 
 * @example
 * const node = {
 *   data: {
 *     messageText: "🤖 Добро пожаловать в наш бот!\n\nВыберите ваши интересы:",
 *     isPrivateOnly: true,
 *     adminOnly: false,
 *     requiresAuth: false,
 *     enableConditionalMessages: true,
 *     conditionalMessages: [...],
 *     allowMultipleSelection: true,
 *     buttons: [
 *       { text: "Спорт", action: "selection", target: "sport" },
 *       { text: "Музыка", action: "selection", target: "music" },
 *       { text: "Путешествия", action: "selection", target: "travel" }
 *     ],
 *     enableAutoTransition: true,
 *     autoTransitionTo: "main_menu",
 *     collectUserInput: true
 *   }
 * };
 * const code = generateStartHandler(node, true);
 */
export function generateStartHandler(node: Node, userDatabaseEnabled: boolean, mediaVariablesMap?: Map<string, { type: string; variable: string; }>): string {
  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Декоратор и сигнатура функции
  codeLines.push('\n@dp.message(CommandStart())');
  codeLines.push('async def start_handler(message: types.Message):');

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    codeLines.push('    if not await is_private_chat(message):');
    codeLines.push('        await message.answer("❌ Эта команда доступна только в приватных чатах")');
    codeLines.push('        return');
  }

  if (node.data.adminOnly) {
    codeLines.push('    if not await is_admin(message.from_user.id):');
    codeLines.push('        await message.answer("❌ У вас нет прав для выполнения этой команды")');
    codeLines.push('        return');
  }

  if (node.data.requiresAuth) {
    codeLines.push('    if not await check_auth(message.from_user.id):');
    codeLines.push('        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")');
    codeLines.push('        return');
  }

  // Регистрируем пользователя и сохраняем его данные
  codeLines.push('');
  codeLines.push('    # Регистрируем пользователя в системе');
  codeLines.push('    user_id = message.from_user.id');
  codeLines.push('    username = message.from_user.username');
  codeLines.push('    first_name = message.from_user.first_name');
  codeLines.push('    last_name = message.from_user.last_name');
  codeLines.push('');

  if (userDatabaseEnabled) {
    codeLines.push('    # Сохраняем пользователя в базу данных');
    codeLines.push('    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)');
    codeLines.push('');
    codeLines.push('    # Сохраняем переменные пользователя в базу данных');
    codeLines.push('    user_name = init_user_variables(user_id, message.from_user)');
    codeLines.push('    await update_user_data_in_db(user_id, "user_name", user_name)');
    codeLines.push('    await update_user_data_in_db(user_id, "first_name", first_name)');
    codeLines.push('    await update_user_data_in_db(user_id, "last_name", last_name)');
    codeLines.push('    await update_user_data_in_db(user_id, "username", username)');
    codeLines.push('');
    codeLines.push('    # Резервное сохранение в локальное хранилище');
    codeLines.push('    if not saved_to_db:');
    codeLines.push('        user_data[user_id] = {');
    codeLines.push('            "username": username,');
    codeLines.push('            "first_name": first_name,');
    codeLines.push('            "last_name": last_name,');
    codeLines.push('            "user_name": user_name,');
    codeLines.push('            "registered_at": message.date');
    codeLines.push('        }');
    codeLines.push('        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")');
    codeLines.push('    else:');
    codeLines.push('        logging.info(f"Пользователь {user_id} сохранен в базу данных")');
    codeLines.push('');
  } else {
    codeLines.push('    # Инициализируем базовые переменные пользователя');
    codeLines.push('    user_name = init_user_variables(user_id, message.from_user)');
    codeLines.push('');
  }

  // Используем универсальную замену переменных для инициализации
  const variableReplacementCode = generateUniversalVariableReplacement('    ');
  const variableLines = variableReplacementCode.split('\n').filter(line => line.trim());
  codeLines.push(...variableLines);

  // Сохраняем медиа-переменные из данных узла в user_data (для использования в других узлах)
  if (node.data.imageUrl) {
    codeLines.push(`    # Сохраняем imageUrl в переменную image_url_${node.id}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["image_url_${node.id}"] = "${node.data.imageUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "image_url_${node.id}", "${node.data.imageUrl}")`);
    }
  }
  if (node.data.documentUrl) {
    codeLines.push(`    # Сохраняем documentUrl в переменную document_url_${node.id}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["document_url_${node.id}"] = "${node.data.documentUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "document_url_${node.id}", "${node.data.documentUrl}")`);
    }
  }
  if (node.data.videoUrl) {
    codeLines.push(`    # Сохраняем videoUrl в переменную video_url_${node.id}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["video_url_${node.id}"] = "${node.data.videoUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "video_url_${node.id}", "${node.data.videoUrl}")`);
    }
  }
  if (node.data.audioUrl) {
    codeLines.push(`    # Сохраняем audioUrl в переменную audio_url_${node.id}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["audio_url_${node.id}"] = "${node.data.audioUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "audio_url_${node.id}", "${node.data.audioUrl}")`);
    }
  }

  // Восстанавливаем состояние множественного выбора ТОЛЬКО если он включен
  if (node.data.allowMultipleSelection) {
    codeLines.push('');
    codeLines.push('    saved_interests = []');
    codeLines.push('');

    if (userDatabaseEnabled) {
      codeLines.push('    # Восстанавливаем состояние множественного выбора из БД');
      codeLines.push('    user_record = await get_user_from_db(user_id)');
      codeLines.push('');
      codeLines.push('    if user_record and isinstance(user_record, dict):');
      codeLines.push('        user_data_field = user_record.get("user_data", {})');
      codeLines.push('        if isinstance(user_data_field, str):');
      codeLines.push('            import json');
      codeLines.push('            try:');
      codeLines.push('                user_vars = json.loads(user_data_field)');
      codeLines.push('            except:');
      codeLines.push('                user_vars = {}');
      codeLines.push('        elif isinstance(user_data_field, dict):');
      codeLines.push('            user_vars = user_data_field');
      codeLines.push('        else:');
      codeLines.push('            user_vars = {}');
      codeLines.push('        ');
      codeLines.push('        # Ищем сохраненные интересы');
      codeLines.push('        for var_name, var_data in user_vars.items():');
      codeLines.push('            if "интерес" in var_name.lower() or var_name == "user_interests":');
      codeLines.push('                if isinstance(var_data, str) and var_data:');
      codeLines.push('                    saved_interests = [interest.strip() for interest in var_data.split(",")]');
      codeLines.push('                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")');
      codeLines.push('                    break');
    } else {
      codeLines.push('    # Восстанавливаем состояние из локального хранилища');
      codeLines.push('    if user_id in user_data:');
      codeLines.push('        for var_name, var_data in user_data[user_id].items():');
      codeLines.push('            if "интерес" in var_name.lower() or var_name == "user_interests":');
      codeLines.push('                if isinstance(var_data, str) and var_data:');
      codeLines.push('                    saved_interests = [interest.strip() for interest in var_data.split(",")]');
      codeLines.push('                    logging.info(f"Восстановлены интересы: {saved_interests}")');
      codeLines.push('                    break');
      codeLines.push('                elif isinstance(var_data, list):');
      codeLines.push('                    saved_interests = var_data');
      codeLines.push('                    logging.info(f"Восстановлены интересы: {saved_interests}")');
      codeLines.push('                    break');
    }

    codeLines.push('');
    codeLines.push('    # Инициализируем состояние множественного выбора');
    codeLines.push('    if user_id not in user_data:');
    codeLines.push('        user_data[user_id] = {}');
    codeLines.push(`    user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy() if saved_interests else []`);
    codeLines.push(`    user_data[user_id]["multi_select_node"] = "${node.id}"`);
    codeLines.push('    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")');
    codeLines.push('');
  }

  // Создаем клавиатуру с восстановленными галочками для множественного выбора
  if (node.data.allowMultipleSelection) {
    codeLines.push('    # Создаем клавиатуру с восстановленными галочками');
    codeLines.push('    builder = InlineKeyboardBuilder()');
    codeLines.push('');
    codeLines.push('    # Функция для проверки совпадения интересов');
    codeLines.push('    def check_interest_match(button_text, saved_list):');
    codeLines.push('        """Проверяет, есть ли интерес в сохраненном списке"""');
    codeLines.push('        if not saved_list:');
    codeLines.push('            return False');
    codeLines.push('        # Убираем эмодзи и галочки для сравнения');
    codeLines.push('        clean_button = button_text.replace("✅ ", "").replace("⬜ ", "").strip()');
    codeLines.push('        for saved_interest in saved_list:');
    codeLines.push('            clean_saved = saved_interest.replace("✅ ", "").replace("⬜ ", "").strip()');
    codeLines.push('            if clean_button == clean_saved or clean_button in clean_saved or clean_saved in clean_button:');
    codeLines.push('                return True');
    codeLines.push('        return False');
    codeLines.push('');

    // Добавляем кнопки интересов с галочками
    const buttons = node.data.buttons || [];
    const interestButtons = buttons.filter(btn => btn.action === 'selection');

    interestButtons.forEach(button => {
      const buttonText = button.text || 'Неизвестно';
      const buttonTarget = button.target || button.id;
      codeLines.push(`    ${buttonTarget}_selected = check_interest_match("${buttonText}", saved_interests)`);
      codeLines.push(`    ${buttonTarget}_text = "✅ ${buttonText}" if ${buttonTarget}_selected else "${buttonText}"`);
      codeLines.push(`    builder.add(InlineKeyboardButton(text=${buttonTarget}_text, callback_data="multi_select_${node.id}_${buttonTarget}"))`);
      codeLines.push('');
    });

    // Добавляем кнопки команд и другие кнопки ПЕРЕД кнопкой "Готово"
    const allButtons = node.data.buttons || [];
    const nonSelectionButtons = allButtons.filter(btn => btn.action !== 'selection');

    nonSelectionButtons.forEach(button => {
      if (button.action === 'command') {
        const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
        codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))`);
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))`);
      } else if (button.action === 'url') {
        codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))`);
      }
    });

    // Добавляем кнопку "Готово"
    const continueText = node.data.continueButtonText || 'Готово';
    codeLines.push(`    builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))`);
    codeLines.push('    builder.adjust(2)  # Используем 2 колонки для консистентности');
    codeLines.push('    keyboard = builder.as_markup()');
    codeLines.push('');
  }

  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "Привет! Добро пожаловать!";
  const formattedText = formatTextForPython(messageText);

  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    // Инициализируем text основным сообщением ПЕРЕД проверкой условий
    codeLines.push('    # Проверяем условные сообщения');
    codeLines.push(`    text = ${formattedText}  # Основной текст узла как fallback`);
    codeLines.push('    conditional_parse_mode = None');
    codeLines.push('    conditional_keyboard = None');
    codeLines.push('');
    codeLines.push('    # Получаем данные пользователя для проверки условий');
    codeLines.push('    user_record = await get_user_from_db(user_id)');
    codeLines.push('    if not user_record:');
    codeLines.push('        user_record = user_data.get(user_id, {})');
    codeLines.push('');
    codeLines.push('    # Безопасно извлекаем user_data');
    codeLines.push('    if isinstance(user_record, dict):');
    codeLines.push('        if "user_data" in user_record and isinstance(user_record["user_data"], dict):');
    codeLines.push('            user_data_dict = user_record["user_data"]');
    codeLines.push('        else:');
    codeLines.push('            user_data_dict = user_record');
    codeLines.push('    else:');
    codeLines.push('        user_data_dict = {}');
    codeLines.push('');

    // Generate conditional logic using helper function - условия теперь переопределят text если нужно
    const conditionalCode = generateConditionalMessageLogic(node.data.conditionalMessages, '    ', node.data);
    const conditionalLines = conditionalCode.split('\n').filter(line => line.trim());
    codeLines.push(...conditionalLines);

    // Не нужен else блок - text уже инициализирован основным сообщением
    codeLines.push('');

    // Добавляем замену переменных в тексте для условных сообщений
    codeLines.push('');
    codeLines.push('    # Подставляем все доступные переменные пользователя в текст');
    codeLines.push('    user_vars = await get_user_from_db(user_id)');
    codeLines.push('    if not user_vars:');
    codeLines.push('        user_vars = user_data.get(user_id, {})');
    codeLines.push('');
    codeLines.push('    # get_user_from_db теперь возвращает уже обработанные user_data');
    codeLines.push('    if not isinstance(user_vars, dict):');
    codeLines.push('        user_vars = user_data.get(user_id, {})');
    codeLines.push('');
    codeLines.push('    # Заменяем все переменные в тексте');
    codeLines.push('    text = replace_variables_in_text(text, all_user_vars)');
  } else {
    codeLines.push(`    text = ${formattedText}`);

    // Добавляем замену переменных в тексте ПОСЛЕ определения переменной text
    codeLines.push('');
    codeLines.push('    # Подставляем все доступные переменные пользователя в текст');
    codeLines.push('    user_vars = await get_user_from_db(user_id)');
    codeLines.push('    if not user_vars:');
    codeLines.push('        user_vars = user_data.get(user_id, {})');
    codeLines.push('');
    codeLines.push('    # get_user_from_db теперь возвращает уже обработанные user_data');
    codeLines.push('    if not isinstance(user_vars, dict):');
    codeLines.push('        user_vars = user_data.get(user_id, {})');
    codeLines.push('');
    codeLines.push('    # Заменяем все переменные в тексте');
    codeLines.push('    text = replace_variables_in_text(text, all_user_vars)');
  }

  // Для множественного выбора используем уже созданную клавиатуру
  if (node.data.allowMultipleSelection) {
    codeLines.push('    await message.answer(text, reply_markup=keyboard)');

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
    return processedCode.join('\n');
  }

  // Генерируем клавиатуру
  const keyboardCode = generateKeyboard(node);
  const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
  codeLines.push(...keyboardLines);

  // Проверяем, есть ли прикрепленные медиафайлы
  const attachedMedia = node.data.attachedMedia || [];

  if (attachedMedia.length > 0) {
    // Используем переданный mediaVariablesMap
    if (mediaVariablesMap) {
      // Фильтруем mediaVariablesMap, чтобы получить только те переменные, которые связаны с этим узлом
      const filteredMediaVariablesMap = new Map<string, { type: string; variable: string; }>();

      attachedMedia.forEach((mediaVar: string) => {
        if (mediaVariablesMap.has(mediaVar)) {
          filteredMediaVariablesMap.set(mediaVar, mediaVariablesMap.get(mediaVar)!);
        }
      });

      // Генерируем код для отправки прикрепленных медиа
      const mediaCode = generateAttachedMediaSendCode(
        attachedMedia,
        filteredMediaVariablesMap,
        formattedText, // текст сообщения
        node.data.formatMode || 'HTML', // режим парсинга
        'keyboard', // клавиатура
        node.id, // ID узла
        '    ', // отступ
        node.data.autoTransitionTo, // автопереход
        node.data.collectUserInput !== false, // собирать пользовательский ввод
        undefined, // nodeData
        'message' // контекст обработчика
      );

      if (mediaCode.trim()) {
        // Заменяем обычную отправку сообщения на отправку с медиа
        const mediaLines = mediaCode.split('\n');
        codeLines.push(...mediaLines);
      } else {
        // Если код медиа не сгенерирован, используем обычную логику
        if (node.data.allowMultipleSelection) {
          codeLines.push('    await message.answer(text, reply_markup=keyboard)');
        } else {
          const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
          codeLines.push(`    await message.answer(text${keyboardParam})`);
        }
      }
    } else {
      // Если mediaVariablesMap не передан, используем обычную логику
      if (node.data.allowMultipleSelection) {
        codeLines.push('    await message.answer(text, reply_markup=keyboard)');
      } else {
        const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
        codeLines.push(`    await message.answer(text${keyboardParam})`);
      }
    }
  } else {
    // Обычная логика без медиа
    if (node.data.allowMultipleSelection) {
      codeLines.push('    await message.answer(text, reply_markup=keyboard)');
    } else {
      const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
      codeLines.push(`    await message.answer(text${keyboardParam})`);
    }
  }

  // ИСПРАВЛЕНИЕ: Добавляем автопереход для узлов start, если он настроен
  if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
    // Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true
    if (node.data.collectUserInput !== false) {
      const autoTransitionTarget = node.data.autoTransitionTo;
      const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');

      codeLines.push('');
      codeLines.push('    # АВТОПЕРЕХОД: Переходим к следующему узлу автоматически (только если collectUserInput=true)');
      codeLines.push(`    logging.info(f"⚡ Автопереход от узла ${node.id} к узлу ${autoTransitionTarget}")`);
      codeLines.push('    # Создаем временный callback_query объект для вызова обработчика');
      codeLines.push('    from aiogram.types import CallbackQuery');
      codeLines.push('    temp_callback = CallbackQuery(');
      codeLines.push('        id="auto_transition",');
      codeLines.push('        from_user=message.from_user,');
      codeLines.push(`        data="${autoTransitionTarget}",`);
      codeLines.push('        chat_instance=str(message.chat.id),');
      codeLines.push('        message=message');
      codeLines.push('    )');
      codeLines.push(`    await handle_callback_${safeFunctionName}(temp_callback)`);
      codeLines.push(`    logging.info(f"✅ Автопереход выполнен: ${node.id} -> ${autoTransitionTarget}")`);

      // Применяем автоматическое добавление комментариев ко всему коду
      const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
      return processedCode.join('\n');
    } else {
      codeLines.push('');
      codeLines.push('    # Автопереход пропущен: collectUserInput=false');
      codeLines.push(`    logging.info(f"ℹ️ Узел ${node.id} не собирает ответы (collectUserInput=false)")`);
    }
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
  return processedCode.join('\n');
}
