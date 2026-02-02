import { isLoggingEnabled } from "../bot-generator";
import { generateWaitingStateCode } from "./generateWaitingStateCode";

// ============================================================================
// ГЕНЕРАТОРЫ МЕДИА И УСЛОВНЫХ СООБЩЕНИЙ
// ============================================================================
// Функция для генерации кода отправки медиа из attachedMedia
export function generateAttachedMediaSendCode(
  attachedMedia: string[],
  mediaVariablesMap: Map<string, { type: string; variable: string; }>,
  _text: string,
  parseMode: string,
  keyboard: string,
  nodeId: string,
  indentLevel: string,
  autoTransitionTo?: string,
  collectUserInput: boolean = true,
  nodeData?: any): string {
  if (!attachedMedia || attachedMedia.length === 0) {
    return '';
  }

  // Пока поддерживаем только первую медиапеременную
  const firstMediaVar = attachedMedia[0];
  const mediaInfo = mediaVariablesMap.get(firstMediaVar);

  if (!mediaInfo) {
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Медиапеременная ${firstMediaVar} не найдена в mediaVariablesMap`);
    return '';
  }

  const { type: mediaType, variable: mediaVariable } = mediaInfo;

  let code = '';
  code += `${indentLevel}# Проверяем наличие прикрепленного медиа из переменной ${mediaVariable}\n`;
  code += `${indentLevel}attached_media = None\n`;

  // Проверяем, является ли переменная imageUrl или documentUrl (прямые URL-адреса)
  if (mediaVariable.startsWith('image_url_') || mediaVariable.startsWith('document_url_') ||
      mediaVariable.startsWith('video_url_') || mediaVariable.startsWith('audio_url_')) {
    // Для переменных типа image_url_{nodeId} используем прямое значение из переменной
    // Вместо поиска по полю вроде imageUrl, ищем по самой переменной image_url_{nodeId}
    code += `${indentLevel}if user_vars and "${mediaVariable}" in user_vars:\n`;
    code += `${indentLevel}    media_data = user_vars["${mediaVariable}"]\n`;
    code += `${indentLevel}    if isinstance(media_data, dict) and "value" in media_data:\n`;
    code += `${indentLevel}        attached_media = media_data["value"]\n`;
    code += `${indentLevel}    elif isinstance(media_data, str):\n`;
    code += `${indentLevel}        attached_media = media_data\n`;
    code += `${indentLevel}else:\n`;
    code += `${indentLevel}    # Проверяем, есть ли медиа в переменных пользователя\n`;
    code += `${indentLevel}    user_id = callback_query.from_user.id\n`;
    code += `${indentLevel}    user_node_vars = user_data.get(user_id, {})\n`;
    code += `${indentLevel}    if "${mediaVariable}" in user_node_vars:\n`;
    code += `${indentLevel}        attached_media = user_node_vars["${mediaVariable}"]\n`;
  } else {
    // Для других типов переменных используем стандартную логику
    code += `${indentLevel}if user_vars and "${mediaVariable}" in user_vars:\n`;
    code += `${indentLevel}    media_data = user_vars["${mediaVariable}"]\n`;
    code += `${indentLevel}    if isinstance(media_data, dict) and "value" in media_data:\n`;
    code += `${indentLevel}        attached_media = media_data["value"]\n`;
    code += `${indentLevel}    elif isinstance(media_data, str):\n`;
    code += `${indentLevel}        attached_media = media_data\n`;
  }

  code += `${indentLevel}\n`;
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда устанавливаем состояние ожидания ввода для collectUserInput=true
  if (collectUserInput && nodeData) {
    code += `${indentLevel}# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Устанавливаем состояние ожидания ввода для узла ${nodeId}\n`;
    code += generateWaitingStateCode(nodeData, indentLevel);
    code += `${indentLevel}logging.info(f"✅ Узел ${nodeId} настроен для сбора ввода (collectUserInput=true) после отправки медиа")\n`;
  }

  code += `${indentLevel}# Если медиа найдено, отправляем с медиа, иначе обычное сообщение\n`;
  code += `${indentLevel}if attached_media and str(attached_media).strip():\n`;
  code += `${indentLevel}    logging.info(f"📎 Отправка ${mediaType} медиа из переменной ${mediaVariable}: {attached_media}")\n`;
  code += `${indentLevel}    try:\n`;
  code += `${indentLevel}        # Заменяем переменные в тексте перед отправкой медиа\n`;
  code += `${indentLevel}        processed_caption = replace_variables_in_text(text, user_vars)\n`;

  // Генерируем код отправки в зависимости от типа медиа
  const keyboardParam = keyboard !== 'None' ? ', reply_markup=keyboard' : '';
  const parseModeParam = parseMode ? `, parse_mode=ParseMode.${parseMode.toUpperCase()}` : '';

  switch (mediaType) {
    case 'photo':
      code += `${indentLevel}        await bot.send_photo(callback_query.from_user.id, attached_media, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
      break;
    case 'video':
      code += `${indentLevel}        await bot.send_video(callback_query.from_user.id, attached_media, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
      break;
    case 'audio':
      code += `${indentLevel}        await bot.send_audio(callback_query.from_user.id, attached_media, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
      break;
    case 'document':
      code += `${indentLevel}        await bot.send_document(callback_query.from_user.id, attached_media, caption=processed_caption${parseModeParam}${keyboardParam})\n`;
      break;
    default:
      code += `${indentLevel}        # Неизвестный тип медиа: ${mediaType}, fallback на обычное сообщение\n`;
      const autoTransitionFlagDefault = autoTransitionTo ? ', is_auto_transition=True' : '';
      code += `${indentLevel}        await safe_edit_or_send(callback_query, processed_caption, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlagDefault}${parseMode})\n`;
  }

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход после отправки медиа
  if (autoTransitionTo) {
    code += `${indentLevel}        \n`;
    code += `${indentLevel}        # Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true\n`;
    code += `${indentLevel}        if ${collectUserInput.toString()}:  // Convert boolean to string representation\n`;
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indentLevel}            # ⚡ Автопереход к узлу ${autoTransitionTo}\n`;
    code += `${indentLevel}            logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")\n`;
    code += `${indentLevel}            await handle_callback_${safeAutoTargetId}(callback_query)\n`;
    code += `${indentLevel}            logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")\n`;
    code += `${indentLevel}            return\n`;
    code += `${indentLevel}        else:\n`;
    code += `${indentLevel}            # Автопереход пропущен: collectUserInput=false\n`;
    code += `${indentLevel}            logging.info(f"ℹ️ Узел ${nodeId} не собирает ответы (collectUserInput=false)")\n`;
  }

  code += `${indentLevel}    except Exception as e:\n`;
  code += `${indentLevel}        logging.error(f"Ошибка отправки ${mediaType}: {e}")\n`;
  code += `${indentLevel}        # Fallback на обычное сообщение при ошибке\n`;
  const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
  code += `${indentLevel}        await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})\n`;
  code += `${indentLevel}else:\n`;
  code += `${indentLevel}    # Медиа не найдено, отправляем обычное текстовое сообщение\n`;
  code += `${indentLevel}    logging.info(f"📝 Медиа ${mediaVariable} не найдено, отправка текстового сообщения")\n`;
  code += `${indentLevel}    # Заменяем переменные в тексте перед отправкой\n`;
  code += `${indentLevel}    processed_text = replace_variables_in_text(text, user_vars)\n`;
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если collectUserInput=true, не отправляем сообщение, так как узел ожидает ввод
  code += `${indentLevel}    if ${collectUserInput ? 'True' : 'False'}:\n`;
  code += `${indentLevel}        # Узел ожидает ввод, не отправляем сообщение\n`;
  code += `${indentLevel}        logging.info(f"ℹ️ Узел ${nodeId} ожидает ввод, пропускаем отправку сообщения")\n`;
  code += `${indentLevel}    else:\n`;
  code += `${indentLevel}        await safe_edit_or_send(callback_query, processed_text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})\n`;

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход и для случая без медиа
  if (autoTransitionTo) {
    code += `${indentLevel}    \n`;
    code += `${indentLevel}    # Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true\n`;
    code += `${indentLevel}    if ${collectUserInput.toString()}:  // Convert boolean to string representation\n`;
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indentLevel}        # ⚡ Автопереход к узлу ${autoTransitionTo}\n`;
    code += `${indentLevel}        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")\n`;
    code += `${indentLevel}        await handle_callback_${safeAutoTargetId}(callback_query)\n`;
    code += `${indentLevel}        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")\n`;
    code += `${indentLevel}        return\n`;
    code += `${indentLevel}    else:\n`;
    code += `${indentLevel}        # Автопереход пропущен: collectUserInput=false\n`;
    code += `${indentLevel}        logging.info(f"ℹ️ Узел ${nodeId} не собирает ответы (collectUserInput=false)")\n`;
  }

  return code;
}
