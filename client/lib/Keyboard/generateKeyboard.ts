import { Node } from '@shared/schema';
import { Button } from "../bot-generator";
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateButtonText } from '../format/generateButtonText';
import { generateWaitingStateCode } from '../format/generateWaitingStateCode';
import { toPythonBoolean } from '../format/toPythonBoolean';
import { calculateOptimalColumns } from './calculateOptimalColumns';
import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';


/**
 * Генерирует код клавиатуры для узла
 * Примечание: generateUniversalVariableReplacement должен вызываться в месте вызова generateKeyboard
 * @param node - Узел для генерации клавиатуры
 * @returns Сгенерированный код клавиатуры
 */
export function generateKeyboard(node: Node): string {
  let code = '';

  // Определяем режим форматирования в начале
  const hasConditionalMessages = node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0;

  // Определяем отступ в зависимости от наличия условных сообщений
  const indent3 = hasConditionalMessages ? '        ' : '    ';

  // Примечание: generateUniversalVariableReplacement вызывается в месте вызова этой функции
  // Здесь мы только добавляем пустую строку для разделения кода
  code += '\n';

  // Проверяем наличие изображения в узле
  const hasImage = node.data.imageUrl && node.data.imageUrl.trim() !== '' && node.data.imageUrl !== 'undefined';
  if (hasImage) {
    if (node.data.imageUrl) {
      code += `    # Узел содержит изображение: ${node.data.imageUrl}\n`;
      // Проверяем, является ли URL относительным путем к локальному файлу
      if (node.data.imageUrl.startsWith('/uploads/')) {
        // Для локальных файлов используем FSInputFile для отправки напрямую с диска
        code += `    image_path = get_upload_file_path("${node.data.imageUrl}")\n`;
        code += `    image_url = FSInputFile(image_path)\n`;
      } else {
        code += `    image_url = "${node.data.imageUrl}"\n`;
      }
    }
    code += '    \n';
  }

  // Добавляем поддержку условных сообщений для клавиатуры
  if (hasConditionalMessages) {
    code += '    # Проверка условных сообщений для клавиатуры\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    code += '    \n';

    // Use conditional message if available, otherwise use default text
    code += '    # Используем условное сообщение если есть подходящее условие\n';
    code += '    if "text" not in locals():\n';
    code += '        # Используем исходный текст клавиатуры если условие не сработало\n';
    code += '        pass  # text уже установлен выше\n';
    code += '    \n';
    code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
    code += '    use_conditional_keyboard = conditional_keyboard is not None\n';
  }

  // Генерируем parseMode строку для использования в коде
  let parseMode = '';

  if (hasConditionalMessages) {
    // Для узлов с условными сообщениями - проверяем приоритет условного режима
    code += '    # Определяем режим форматирования (приоритет у условного сообщения)\n';
    code += '    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n';
    code += '        current_parse_mode = conditional_parse_mode\n';
    code += '    else:\n';
    if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
      code += '        current_parse_mode = ParseMode.MARKDOWN\n';
    } else if (node.data.formatMode === 'html') {
      code += '        current_parse_mode = ParseMode.HTML\n';
    } else {
      code += '        current_parse_mode = None\n';
    }

    // Для узлов с условными сообщениями используем current_parse_mode
    if (node.data.formatMode === 'markdown' || node.data.markdown === true || node.data.formatMode === 'html') {
      parseMode = ', parse_mode=current_parse_mode';
    } else {
      parseMode = ', parse_mode=current_parse_mode if current_parse_mode else None';
    }
  } else {
    // Для узлов без условных сообщений - используем прямые значения ParseMode
    if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
      parseMode = ', parse_mode=ParseMode.MARKDOWN';
    } else if (node.data.formatMode === 'html') {
      parseMode = ', parse_mode=ParseMode.HTML';
    } else {
      parseMode = '';
    }
  }

  // НОВАЯ ЛОГИКА: Сбор ввода как дополнительная функциональность к обычным кнопкам
  // Определяем есть ли обычные кнопки у узла
  const hasRegularButtons = node.data.keyboardType !== "none" && node.data.buttons && node.data.buttons.length > 0;

  // Определяем включен ли сбор пользовательского ввода ИЛИ текстовый/медиа ввод
  const hasInputCollection = node.data.collectUserInput === true || node.data.enableTextInput === true ||
    node.data.enablePhotoInput === true || node.data.enableVideoInput === true ||
    node.data.enableAudioInput === true || node.data.enableDocumentInput === true;

  // Добавляем логирование для отладки (используем Python переменные)
  code += `    has_regular_buttons = ${toPythonBoolean(hasRegularButtons)}\n`;
  code += `    has_input_collection = ${toPythonBoolean(hasInputCollection)}\n`;
  // code += `    logging.info(f"DEBUG: generateKeyboard для узла ${node.id} - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=${node.data.collectUserInput}, enableTextInput=${node.data.enableTextInput}, enablePhotoInput=${node.data.enablePhotoInput}, enableVideoInput=${node.data.enableVideoInput}, enableAudioInput=${node.data.enableAudioInput}, enableDocumentInput=${node.data.enableDocumentInput}")\n`;

  // CASE 1: Есть обычные кнопки + сбор ввода = обычные кнопки работают + дополнительно сохраняются как ответы
  if (hasRegularButtons && hasInputCollection) {
    // Проверяем условную клавиатуру только если есть условные сообщения
    if (hasConditionalMessages) {
      code += '    \n';
      code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
      code += '    if use_conditional_keyboard:\n';
      code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
      code += '    else:\n';
      code += '        # Отправляем обычные кнопки если условной клавиатуры нет\n';
    }

    const indent4 = hasConditionalMessages ? '        ' : '    ';

    // Отправляем обычные кнопки как обычно (используем правильный отступ)
    if (node.data.keyboardType === "reply") {
      code += `${indent4}# Создаем reply клавиатуру (+ дополнительный сбор ответов включен)\n`;
      code += `${indent4}builder = ReplyKeyboardBuilder()\n`;
      node.data.buttons.forEach(button => {
        if (button.action === "contact" && button.requestContact) {
          code += `${indent4}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
        } else if (button.action === "location" && button.requestLocation) {
          code += `${indent4}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
        } else {
          code += `${indent4}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
        }
      });

      const columns = calculateOptimalColumns(node.data.buttons, node.data);
      code += `${indent4}builder.adjust(${columns})\n`;
      const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
      const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
      code += `${indent4}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

      // Проверяем наличие изображения
      if (hasImage) {
        code += `${indent4}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      } else {
        code += `${indent4}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      }

    } else if (node.data.keyboardType === "inline") {
      code += `${indent4}# Создаем inline клавиатуру (+ дополнительный сбор ответов включен)\n`;
      code += `${indent4}builder = InlineKeyboardBuilder()\n`;
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `${indent4}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `${indent4}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        } else if (button.action === 'command') {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `${indent4}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
        }
      });

      code += `${indent4}builder.adjust(2)  # Используем 2 колонки для консистентности\n`;
      code += `${indent4}keyboard = builder.as_markup()\n`;

      // Проверяем наличие изображения
      if (hasImage) {
        code += `${indent4}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      } else {
        code += `${indent4}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      }
    }

    // Закрываем блок else если были условные сообщения
    if (hasConditionalMessages) {
      code += '    \n';
    }

    // Дополнительно настраиваем сбор ответов с полной структурой ожидания ввода
    code += '    \n';
    code += '    # Дополнительно: настраиваем полную структуру ожидания ввода для узла с кнопками\n';
    if (node && node.data) {
      code += generateWaitingStateCode(node, '    ');
    }

    return code;
  }


  // CASE 2: Только сбор ввода БЕЗ обычных кнопок = специальные кнопки для сбора или текстовый ввод
  else if (!hasRegularButtons && hasInputCollection) {

    // Если настроены специальные кнопки ответа
    if (node.data.responseType === 'buttons' && node.data.responseOptions && node.data.responseOptions.length > 0) {
      const buttonType = node.data.inputButtonType || 'inline';

      if (buttonType === 'reply') {
        code += '    \n';
        code += '    # Создаем reply клавиатуру для сбора ответов\n';
        code += '    builder = ReplyKeyboardBuilder()\n';
        node.data.responseOptions.forEach(option => {
          code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
        });
        const columns = calculateOptimalColumns(node.data.responseOptions, node.data);
        code += `    builder.adjust(${columns})\n`;
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

        // Проверяем наличие изображения
        if (hasImage) {
          code += `    await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `    await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }

      } else {
        // inline кнопки для сбора ответов
        code += '    \n';
        code += '    # Создаем inline клавиатуру для сбора ответов\n';
        code += '    builder = InlineKeyboardBuilder()\n';
        node.data.responseOptions.forEach(option => {
          const callbackData = `input_${node.id}_${option.id}`;
          code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="${callbackData}"))\n`;
        });

        // Автоматическое распределение колонок
        const columns = calculateOptimalColumns(node.data.responseOptions, node.data);
        code += `    builder.adjust(${columns})\n`;
        code += '    keyboard = builder.as_markup()\n';

        // Проверяем наличие изображения
        if (hasImage) {
          code += `    await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `    await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }
      }

    } else {
      // Текстовый ввод - проверяем условную клавиатуру только если есть условные сообщения
      if (hasConditionalMessages) {
        code += '    \n';
        code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
        code += '    if use_conditional_keyboard:\n';
        code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
        code += '    else:\n';

        // Проверяем наличие изображения для условной клавиатуры
        if (hasImage) {
          code += '        await bot.send_photo(message.chat.id, image_url, caption=text, parse_mode=current_parse_mode if current_parse_mode else None)\n';
        } else {
          code += `        await message.answer(text${parseMode})\n`;
        }
      } else {
        code += '    \n';

        // Проверяем наличие изображения
        if (hasImage) {
          code += `    await bot.send_photo(message.chat.id, image_url, caption=text${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `    await message.answer(text${parseMode}, node_id="${node.id}")\n`;
        }
      }
    }

    // Устанавливаем состояние ожидания ввода
    code += '    \n';
    code += '    # Устанавливаем состояние ожидания ввода с полной структурой\n';
    if (node && node.data) {
      code += generateWaitingStateCode(node, '    ');
    }

    return code;
  }


  // CASE 3: Только обычные кнопки БЕЗ сбора ввода = работает как раньше
  else {
    code += `    # DEBUG: Узел ${node.id} - hasRegularButtons=${toPythonBoolean(hasRegularButtons)}, hasInputCollection=${toPythonBoolean(hasInputCollection)}\n`;
    // code += `    logging.info(f"DEBUG: Узел ${node.id} обработка кнопок - keyboardType=${node.data.keyboardType}, buttons=${node.data.buttons ? node.data.buttons.length : 0}")\n`;

    // Проверяем условную клавиатуру только если есть условные сообщения
    if (hasConditionalMessages) {
      code += '    \n';
      code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
      code += '    if use_conditional_keyboard:\n';
      code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
      code += '        return  # Возвращаемся чтобы не отправлять сообщение дважды\n';
      code += '    \n';
    }

    if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      // Проверяем, есть ли множественный выбор
      if (node.data.allowMultipleSelection) {
        code += `${indent3}# Создаем reply клавиатуру с поддержкой множественного выбора\n`;
        code += `${indent3}builder = ReplyKeyboardBuilder()\n`;

        // Разделяем кнопки на опции выбора и обычные кнопки
        const selectionButtons = node.data.buttons.filter(button => button.action === 'selection');
        const regularButtons = node.data.buttons.filter(button => button.action !== 'selection');

        // Добавляем кнопки для множественного выбора
        selectionButtons.forEach(button => {
          code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
        });

        // Добавляем обычные кнопки
        regularButtons.forEach(button => {
          if (button.action === "contact" && button.requestContact) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
          } else if (button.action === "location" && button.requestLocation) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
          } else {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
          }
        });

        // Добавляем кнопку завершения, если есть опции выбора
        if (selectionButtons.length > 0) {
          const continueText = node.data.continueButtonText || 'Готово';
          code += `${indent3}builder.add(KeyboardButton(text="${continueText}"))\n`;
        }

        const columns = calculateOptimalColumns(node.data.buttons, node.data);
        code += `${indent3}builder.adjust(${columns})\n`;
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `${indent3}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

        // Проверяем наличие изображения
        if (hasImage) {
          code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }

        // Инициализируем состояние множественного выбора
        if (selectionButtons.length > 0) {
          code += `${indent3}\n`;
          code += `${indent3}# Инициализируем состояние множественного выбора\n`;
          code += `${indent3}user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_${node.id}"] = []\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_node"] = "${node.id}"\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_type"] = "reply"\n`;
        }
      } else {
        // Обычная reply клавиатура
        code += `${indent3}builder = ReplyKeyboardBuilder()\n`;
        node.data.buttons.forEach((button: Button) => {
          if (button.action === "contact" && button.requestContact) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
          } else if (button.action === "location" && button.requestLocation) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
          } else {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
          }
        });

        const columns = calculateOptimalColumns(node.data.buttons, node.data);
        code += `${indent3}builder.adjust(${columns})\n`;
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `${indent3}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

        // Проверяем наличие изображения
        if (hasImage) {
          code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }
      }
    } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Проверяем, есть ли множественный выбор
      if (node.data.allowMultipleSelection) {
        // Добавляем универсальную функцию замены переменных для доступа к user_vars
        const universalVarCodeLines2: string[] = [];
        generateUniversalVariableReplacement(universalVarCodeLines2, indent3);
        code += universalVarCodeLines2.join('\n');

        // Добавляем логику загрузки ранее выбранных интересов
        const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';

        code += `${indent3}# Загружаем ранее выбранные интересы из базы данных для восстановления состояния\n`;
        code += `${indent3}if user_id not in user_data:\n`;
        code += `${indent3}    user_data[user_id] = {}\n`;
        code += `${indent3}\n`;
        code += `${indent3}# Получаем сохраненные интересы из базы данных\n`;
        code += `${indent3}saved_interests = []\n`;
        code += `${indent3}if user_vars:\n`;
        code += `${indent3}    # Ищем интересы в любой переменной, которая может их содержать\n`;
        code += `${indent3}    for var_name, var_data in user_vars.items():\n`;
        code += `${indent3}        if "интерес" in var_name.lower() or var_name == "interests" or var_name == "${multiSelectVariable}":\n`;
        code += `${indent3}            if isinstance(var_data, dict) and "value" in var_data:\n`;
        code += `${indent3}                interests_str = var_data["value"]\n`;
        code += `${indent3}            elif isinstance(var_data, str):\n`;
        code += `${indent3}                interests_str = var_data\n`;
        code += `${indent3}            else:\n`;
        code += `${indent3}                interests_str = str(var_data) if var_data else ""\n`;
        code += `${indent3}            \n`;
        code += `${indent3}            if interests_str:\n`;
        code += `${indent3}                saved_interests = [interest.strip() for interest in interests_str.split(",")]\n`;
        code += `${indent3}                logging.info(f"Восстановлены интересы из БД: {saved_interests}")\n`;
        code += `${indent3}                break\n`;
        code += `${indent3}\n`;
        code += `${indent3}# Инициализируем состояние множественного выбора с сохраненными интересами\n`;
        code += `${indent3}user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy()\n`;
        code += `${indent3}user_data[user_id]["multi_select_node"] = "${node.id}"\n`;
        code += `${indent3}logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")\n`;
        code += `${indent3}\n`;

        code += `${indent3}# Создаем inline клавиатуру с поддержкой множественного выбора\n`;
        code += `${indent3}builder = InlineKeyboardBuilder()\n`;

        // Разделяем кнопки на опции выбора и обычные кнопки
        const selectionButtons = node.data.buttons.filter(button => button.action === 'selection');
        const regularButtons = node.data.buttons.filter(button => button.action !== 'selection');

        // Добавляем кнопки для множественного выбора с логикой галочек
        selectionButtons.forEach(button => {
          const buttonValue = button.target || button.id || button.text;
          const safeVarName = buttonValue.toLowerCase().replace(/[^a-z0-9]/g, '_');
          code += `${indent3}# Проверяем каждый интерес и добавляем галочку если он выбран\n`;
          code += `${indent3}logging.info(f"🔧 /START: Проверяем галочку для кнопки '${button.text}' в списке: {saved_interests}")\n`;
          code += `${indent3}${safeVarName}_selected = "${button.text}" in saved_interests\n`;
          code += `${indent3}logging.info(f"🔍 /START: РЕЗУЛЬТАТ для '${button.text}': selected={${safeVarName}_selected}")\n`;
          code += `${indent3}${safeVarName}_text = "✅ ${button.text}" if ${safeVarName}_selected else "${button.text}"\n`;
          code += `${indent3}logging.info(f"📱 /START: СОЗДАЕМ КНОПКУ: text='{${safeVarName}_text}'")\n`;
          code += `${indent3}builder.add(InlineKeyboardButton(text=${safeVarName}_text, callback_data="multi_select_start_${buttonValue}"))\n`;
        });

        // Добавляем обычные кнопки
        regularButtons.forEach((button: Button) => {
          if (button.action === "url") {
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
          } else if (button.action === 'goto') {
            const callbackData = button.target || button.id || 'no_action';
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
          } else if (button.action === 'command') {
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
          }
        });
        code += `${indent3}\n`;

        // Добавляем кнопку завершения, если есть опции выбора
        if (selectionButtons.length > 0) {
          const continueText = node.data.continueButtonText || 'Готово';
          code += `${indent3}builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
        }

        // Автоматическое распределение колонок
        // Для множественного выбора учитываем все кнопки: селекции + регулярные + "Готово"
        const allButtons: Button[] = [...selectionButtons, ...regularButtons];
        if (selectionButtons.length > 0) {
          allButtons.push({
            id: `continue_${node.id}`,
            text: node.data.continueButtonText || 'Готово',
            action: 'goto',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          });
        }
        const columns = calculateOptimalColumns(allButtons, node.data);
        code += `${indent3}builder.adjust(${columns})\n`;
        code += `${indent3}keyboard = builder.as_markup()\n`;

        // Проверяем наличие изображения
        if (hasImage) {
          code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }

        // Состояние множественного выбора уже инициализировано выше с сохраненными значениями
      } else {
        // Обычная inline клавиатура
        code += `${indent3}# Создаем inline клавиатуру с кнопками\n`;
        // code += `${indent3}logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${node.id} с ${node.data.buttons ? node.data.buttons.length : 0} кнопками")\n`;
        code += `${indent3}builder = InlineKeyboardBuilder()\n`;
        node.data.buttons.forEach((button: Button) => {
          if (button.action === "url") {
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
          } else if (button.action === 'goto') {
            // Если есть target, используем его, иначе используем ID кнопки как callback_data
            const callbackData = button.target || button.id || 'no_action';
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
          } else if (button.action === 'command') {
            // Для кнопок команд создаем специальную callback_data
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
          }
        });

        // Автоматическое распределение колонок
        const columns = calculateOptimalColumns(node.data.buttons, node.data);
        code += `${indent3}builder.adjust(${columns})\n`;
        code += `${indent3}keyboard = builder.as_markup()\n`;

        // Проверяем наличие изображения
        if (hasImage) {
          code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }
      }
    } else {
      // Без клавиатуры
      // Проверяем наличие изображения
      if (hasImage) {
        code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text${parseMode}, node_id="${node.id}")\n`;
      } else {
        code += `${indent3}await message.answer(text${parseMode}, node_id="${node.id}")\n`;
      }
    }
  }

  return code;
}
