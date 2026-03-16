/**
 * @fileoverview Адаптер для генерации клавиатуры через Jinja2 шаблон
 *
 * Обеспечивает обратную совместимость со старым API generateKeyboard(Node)
 * но использует Jinja2 шаблон keyboard.py.jinja2 для генерации кода.
 *
 * @module bot-generator/Keyboard/generateKeyboard.adapter
 */

import type { Node } from '@shared/schema';
import { generateKeyboard } from '../../templates/keyboard';
import type { KeyboardTemplateParams } from '../../templates/keyboard';
import { generateWaitingStateCode } from '../format/generateWaitingStateCode';
import { toPythonBoolean } from '../format/toPythonBoolean';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';

/**
 * Адаптер для генерации клавиатуры через Jinja2 шаблон
 *
 * @param node - Узел для генерации клавиатуры
 * @param allNodeIds - Массив всех ID узлов для генерации коротких ID
 * @returns Сгенерированный код клавиатуры
 */
export function generateKeyboardAdapter(node: Node, allNodeIds: string[] = []): string {
  let code = '';

  // Определяем режим форматирования в начале
  const hasConditionalMessages = node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0;

  // Определяем отступ в зависимости от наличия условных сообщений
  const indent3 = hasConditionalMessages ? '        ' : '    ';

  // Примечание: generateUniversalVariableReplacement вызывается в месте вызова этой функции
  code += '\n';

  // Проверяем наличие изображения в узле
  const hasImage = node.data.imageUrl && node.data.imageUrl.trim() !== '' && node.data.imageUrl !== 'undefined';
  if (hasImage) {
    if (node.data.imageUrl) {
      code += `    # Узел содержит изображение: ${node.data.imageUrl}\n`;
      // Проверяем, является ли URL относительным путем к локальному файлу
      if (node.data.imageUrl.startsWith('/uploads/')) {
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

    if (node.data.formatMode === 'markdown' || node.data.markdown === true || node.data.formatMode === 'html') {
      parseMode = ', parse_mode=current_parse_mode';
    } else {
      parseMode = ', parse_mode=current_parse_mode if current_parse_mode else None';
    }
  } else {
    if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
      parseMode = ', parse_mode=ParseMode.MARKDOWN';
    } else if (node.data.formatMode === 'html') {
      parseMode = ', parse_mode=ParseMode.HTML';
    } else {
      parseMode = '';
    }
  }

  // НОВАЯ ЛОГИКА: Сбор ввода как дополнительная функциональность к обычным кнопкам
  const hasRegularButtons = node.data.keyboardType !== "none" && node.data.buttons && node.data.buttons.length > 0;
  const hasInputCollection = node.data.collectUserInput === true || node.data.enableTextInput === true ||
    node.data.enablePhotoInput === true || node.data.enableVideoInput === true ||
    node.data.enableAudioInput === true || node.data.enableDocumentInput === true;

  code += `    has_regular_buttons = ${toPythonBoolean(hasRegularButtons)}\n`;
  code += `    has_input_collection = ${toPythonBoolean(hasInputCollection)}\n`;

  // CASE 1: Есть обычные кнопки + сбор ввода
  if (hasRegularButtons && hasInputCollection) {
    if (hasConditionalMessages) {
      code += '    \n';
      code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
      code += '    if use_conditional_keyboard:\n';
      code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
      code += '    else:\n';
      code += '        # Отправляем обычные кнопки если условной клавиатуры нет\n';
    }

    const indent4 = hasConditionalMessages ? '        ' : '    ';

    // Генерируем клавиатуру через Jinja2
    const keyboardParams: KeyboardTemplateParams = {
      keyboardType: node.data.keyboardType as 'inline' | 'reply' | 'none',
      buttons: node.data.buttons,
      keyboardLayout: node.data.keyboardLayout,
      oneTimeKeyboard: node.data.oneTimeKeyboard,
      resizeKeyboard: node.data.resizeKeyboard,
      allowMultipleSelection: node.data.allowMultipleSelection,
      multiSelectVariable: node.data.multiSelectVariable,
      nodeId: node.id,
      allNodeIds,
      indentLevel: indent4,
      parseMode: node.data.formatMode === 'markdown' ? 'markdown' : node.data.formatMode === 'html' ? 'html' : 'none',
    };

    if (node.data.allowMultipleSelection) {
      const completeButton = node.data.buttons?.find((btn: any) => btn.action === 'complete');
      if (completeButton && completeButton.text && completeButton.target) {
        keyboardParams.completeButton = {
          text: completeButton.text,
          target: completeButton.target,
        };
      }
    }

    code += generateKeyboard(keyboardParams);

    // Проверяем наличие изображения
    if (hasImage) {
      code += `${indent4}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
    } else {
      code += `${indent4}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
    }

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

  // CASE 2: Только сбор ввода БЕЗ обычных кнопок
  else if (!hasRegularButtons && hasInputCollection) {
    if (node.data.responseType === 'buttons' && node.data.responseOptions && node.data.responseOptions.length > 0) {
      const buttonType = node.data.inputButtonType || 'inline';

      if (buttonType === 'reply') {
        code += '    \n';
        code += '    # Создаем reply клавиатуру для сбора ответов\n';
        code += '    builder = ReplyKeyboardBuilder()\n';
        node.data.responseOptions.forEach((option: any) => {
          code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
        });

        const adjustCode = getAdjustCodeForResponseOptions(node.data.responseOptions, node.data);
        code += `    ${adjustCode}\n`;

        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

        if (hasImage) {
          code += `    await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `    await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }
      } else {
        code += '    \n';
        code += '    # Создаем inline клавиатуру для сбора ответов\n';
        code += '    builder = InlineKeyboardBuilder()\n';
        node.data.responseOptions.forEach((option: any) => {
          const callbackData = `input_${node.id}_${option.id}`;
          code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="${callbackData}"))\n`;
        });

        const adjustCode = getAdjustCodeForResponseOptions(node.data.responseOptions, node.data);
        code += `    ${adjustCode}\n`;
        code += '    keyboard = builder.as_markup()\n';

        if (hasImage) {
          code += `    await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `    await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
        }
      }
    } else {
      if (hasConditionalMessages) {
        code += '    \n';
        code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
        code += '    if use_conditional_keyboard:\n';
        code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
        code += '    else:\n';

        if (hasImage) {
          code += '        await bot.send_photo(message.chat.id, image_url, caption=text, parse_mode=current_parse_mode if current_parse_mode else None)\n';
        } else {
          code += `        await message.answer(text${parseMode})\n`;
        }
      } else {
        code += '    \n';

        if (hasImage) {
          code += `    await bot.send_photo(message.chat.id, image_url, caption=text${parseMode}, node_id="${node.id}")\n`;
        } else {
          code += `    await message.answer(text${parseMode}, node_id="${node.id}")\n`;
        }
      }
    }

    code += '    \n';
    code += '    # Устанавливаем состояние ожидания ввода с полной структурой\n';
    if (node && node.data) {
      code += generateWaitingStateCode(node, '    ');
    }

    return code;
  }

  // CASE 3: Только обычные кнопки БЕЗ сбора ввода
  else {
    code += `    # DEBUG: Узел ${node.id} - hasRegularButtons=${toPythonBoolean(hasRegularButtons)}, hasInputCollection=${toPythonBoolean(hasInputCollection)}\n`;

    if (hasConditionalMessages) {
      code += '    \n';
      code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
      code += '    if use_conditional_keyboard:\n';
      code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
      code += '        return  # Возвращаемся чтобы не отправлять сообщение дважды\n';
      code += '    \n';
    }

    if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      // Генерируем клавиатуру через Jinja2
      const keyboardParams: KeyboardTemplateParams = {
        keyboardType: 'reply',
        buttons: node.data.buttons,
        keyboardLayout: node.data.keyboardLayout,
        oneTimeKeyboard: node.data.oneTimeKeyboard,
        resizeKeyboard: node.data.resizeKeyboard,
        allowMultipleSelection: node.data.allowMultipleSelection,
        multiSelectVariable: node.data.multiSelectVariable,
        nodeId: node.id,
        allNodeIds,
        indentLevel: indent3,
        parseMode: node.data.formatMode === 'markdown' ? 'markdown' : node.data.formatMode === 'html' ? 'html' : 'none',
      };

      if (node.data.allowMultipleSelection) {
        const completeButton = node.data.buttons?.find((btn: any) => btn.action === 'complete');
        if (completeButton && completeButton.text && completeButton.target) {
          keyboardParams.completeButton = {
            text: completeButton.text,
            target: completeButton.target,
          };
        }
      }

      code += generateKeyboard(keyboardParams);

      if (hasImage) {
        code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      } else {
        code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      }

      // Инициализируем состояние множественного выбора
      if (node.data.allowMultipleSelection) {
        const selectionButtons = node.data.buttons.filter((button: any) => button.action === 'selection');
        if (selectionButtons.length > 0) {
          code += `${indent3}\n`;
          code += `${indent3}# Инициализируем состояние множественного выбора\n`;
          code += `${indent3}user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_${node.id}"] = []\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_node"] = "${node.id}"\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_type"] = "reply"\n`;
        }
      }
    } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Для inline с множественным выбором нужна дополнительная логика
      if (node.data.allowMultipleSelection) {
        const universalVarCodeLines: string[] = [];
        generateUniversalVariableReplacement(universalVarCodeLines, { node, indentLevel: indent3 });
        code += universalVarCodeLines.join('\n');

        const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';

        code += `${indent3}# Загружаем ранее выбранные интересы из базы данных для восстановления состояния\n`;
        code += `${indent3}if user_id not in user_data:\n`;
        code += `${indent3}    user_data[user_id] = {}\n`;
        code += `${indent3}\n`;
        code += `${indent3}# Получаем сохраненные интересы из базы данных\n`;
        code += `${indent3}saved_interests = []\n`;
        code += `${indent3}if all_user_vars:\n`;
        code += `${indent3}    # Ищем интересы в любой переменной, которая может их содержать\n`;
        code += `${indent3}    for var_name, var_data in all_user_vars.items():\n`;
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
      }

      // Генерируем клавиатуру через Jinja2
      const keyboardParams: KeyboardTemplateParams = {
        keyboardType: 'inline',
        buttons: node.data.buttons,
        keyboardLayout: node.data.keyboardLayout,
        oneTimeKeyboard: node.data.oneTimeKeyboard,
        resizeKeyboard: node.data.resizeKeyboard,
        allowMultipleSelection: node.data.allowMultipleSelection,
        multiSelectVariable: node.data.multiSelectVariable,
        nodeId: node.id,
        allNodeIds,
        indentLevel: indent3,
        parseMode: node.data.formatMode === 'markdown' ? 'markdown' : node.data.formatMode === 'html' ? 'html' : 'none',
      };

      if (node.data.allowMultipleSelection) {
        const completeButton = node.data.buttons?.find((btn: any) => btn.action === 'complete');
        if (completeButton && completeButton.text && completeButton.target) {
          keyboardParams.completeButton = {
            text: completeButton.text,
            target: completeButton.target,
          };
        }
      }

      code += generateKeyboard(keyboardParams);

      if (hasImage) {
        code += `${indent3}await bot.send_photo(message.chat.id, image_url, caption=text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      } else {
        code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode}, node_id="${node.id}")\n`;
      }
    }
  }

  return code;
}

/**
 * Вспомогательная функция для получения кода adjust для response options
 */
function getAdjustCodeForResponseOptions(responseOptions: any[], nodeData: any): string {
  const totalButtons = responseOptions.length;
  if (nodeData?.keyboardLayout && !nodeData.keyboardLayout.autoLayout) {
    const rowSizes = nodeData.keyboardLayout.rows.map((row: any) => row.buttonIds.length);
    return `builder.adjust(${rowSizes.join(', ')})`;
  }
  // Простая логика для response options
  if (totalButtons >= 6) {
    return 'builder.adjust(2)';
  } else if (totalButtons >= 3) {
    return 'builder.adjust(1)';
  } else {
    return 'builder.adjust(1)';
  }
}
