import { isLoggingEnabled } from "../bot-generator";

// ============================================================================
// ГЕНЕРАТОРЫ МЕДИА И УСЛОВНЫХ СООБЩЕНИЙ
// ============================================================================
// Функция для генерации кода отправки медиа из attachedMedia
export function generateAttachedMediaSendCode(
  attachedMedia: string[],
  mediaVariablesMap: Map<string, { type: string; variable: string; }>,
  text: string,
  parseMode: string,
  keyboard: string,
  nodeId: string,
  indentLevel: string,
  autoTransitionTo?: string): string {
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
  code += `${indentLevel}if user_vars and "${mediaVariable}" in user_vars:\n`;
  code += `${indentLevel}    media_data = user_vars["${mediaVariable}"]\n`;
  code += `${indentLevel}    if isinstance(media_data, dict) and "value" in media_data:\n`;
  code += `${indentLevel}        attached_media = media_data["value"]\n`;
  code += `${indentLevel}    elif isinstance(media_data, str):\n`;
  code += `${indentLevel}        attached_media = media_data\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Если медиа найдено, отправляем с медиа, иначе обычное сообщение\n`;
  code += `${indentLevel}if attached_media and str(attached_media).strip():\n`;
  code += `${indentLevel}    logging.info(f"📎 Отправка ${mediaType} медиа из переменной ${mediaVariable}: {attached_media}")\n`;
  code += `${indentLevel}    try:\n`;

  // Генерируем код отправки в зависимости от типа медиа
  const keyboardParam = keyboard !== 'None' ? ', reply_markup=keyboard' : '';
  const parseModeParam = parseMode ? `, parse_mode=ParseMode.${parseMode.toUpperCase()}` : '';

  switch (mediaType) {
    case 'photo':
      code += `${indentLevel}        await bot.send_photo(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    case 'video':
      code += `${indentLevel}        await bot.send_video(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    case 'audio':
      code += `${indentLevel}        await bot.send_audio(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    case 'document':
      code += `${indentLevel}        await bot.send_document(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    default:
      code += `${indentLevel}        # Неизвестный тип медиа: ${mediaType}, fallback на обычное сообщение\n`;
      const autoTransitionFlagDefault = autoTransitionTo ? ', is_auto_transition=True' : '';
      code += `${indentLevel}        await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlagDefault}${parseMode})\n`;
  }

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход после отправки медиа
  if (autoTransitionTo) {
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indentLevel}        \n`;
    code += `${indentLevel}        # ⚡ Автопереход к узлу ${autoTransitionTo}\n`;
    code += `${indentLevel}        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")\n`;
    code += `${indentLevel}        await handle_callback_${safeAutoTargetId}(callback_query)\n`;
    code += `${indentLevel}        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")\n`;
    code += `${indentLevel}        return\n`;
  }

  code += `${indentLevel}    except Exception as e:\n`;
  code += `${indentLevel}        logging.error(f"Ошибка отправки ${mediaType}: {e}")\n`;
  code += `${indentLevel}        # Fallback на обычное сообщение при ошибке\n`;
  const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
  code += `${indentLevel}        await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})\n`;
  code += `${indentLevel}else:\n`;
  code += `${indentLevel}    # Медиа не найдено, отправляем обычное текстовое сообщение\n`;
  code += `${indentLevel}    logging.info(f"📝 Медиа ${mediaVariable} не найдено, отправка текстового сообщения")\n`;
  code += `${indentLevel}    await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})\n`;

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход и для случая без медиа
  if (autoTransitionTo) {
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indentLevel}    \n`;
    code += `${indentLevel}    # ⚡ Автопереход к узлу ${autoTransitionTo}\n`;
    code += `${indentLevel}    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")\n`;
    code += `${indentLevel}    await handle_callback_${safeAutoTargetId}(callback_query)\n`;
    code += `${indentLevel}    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")\n`;
    code += `${indentLevel}    return\n`;
  }

  return code;
}
