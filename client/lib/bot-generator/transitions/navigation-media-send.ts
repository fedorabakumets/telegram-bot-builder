/**
 * @fileoverview Навигация: отправка медиа
 *
 * Модуль генерирует Python-код для отправки медиафайлов при навигации
 * к целевому узлу, включая обработку прикреплённых медиа и переменных.
 *
 * @module bot-generator/transitions/navigation-media-send
 */

import { Button } from '../../bot-generator';
import { generateButtonText, toPythonBoolean } from '../format';

/**
 * Параметры для генерации отправки медиа при навигации
 */
export interface NavigationMediaSendParams {
  /** Целевой узел навигации */
  navTargetNode: any;
  /** Переменные пользователя */
  userVars: string;
  /** Callback query from user id */
  userId: string;
}

/**
 * Генерирует код отправки медиа при навигации
 *
 * @param params - Параметры отправки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateNavigationMediaSend(
  params: NavigationMediaSendParams,
  indent: string = '            '
): string {
  const { navTargetNode, userVars, userId } = params;
  const hasAttachedMedia = navTargetNode.data.attachedMedia &&
    navTargetNode.data.attachedMedia.length > 0;

  let code = '';

  if (hasAttachedMedia) {
    code += generateAttachedMediaSend(navTargetNode, userVars, indent);
  } else {
    code += generateRegularMessageSend(navTargetNode, userVars, userId, indent);
  }

  return code;
}

/**
 * Генерирует код отправки прикреплённого медиа
 */
function generateAttachedMediaSend(
  navTargetNode: any,
  userVars: string,
  indent: string
): string {
  const attachedMedia = navTargetNode.data.attachedMedia;
  let code = '';

  code += `${indent}# Проверяем наличие прикрепленного медиа\n`;
  code += `${indent}nav_attached_media = None\n`;
  code += `${indent}if ${userVars} and "${attachedMedia[0]}" in ${userVars}:\n`;
  code += `${indent}    media_data = ${userVars}["${attachedMedia[0]}"]\n`;
  code += `${indent}    if isinstance(media_data, dict) and "value" in media_data:\n`;
  code += `${indent}        # Проверяем URL поля в зависимости от типа медиа\n`;
  code += `${indent}        if "photoUrl" in media_data and media_data["photoUrl"]:\n`;
  code += `${indent}            nav_attached_media = media_data["photoUrl"]\n`;
  code += `${indent}        elif "videoUrl" in media_data and media_data["videoUrl"]:\n`;
  code += `${indent}            nav_attached_media = media_data["videoUrl"]\n`;
  code += `${indent}        elif "audioUrl" in media_data and media_data["audioUrl"]:\n`;
  code += `${indent}            nav_attached_media = media_data["audioUrl"]\n`;
  code += `${indent}        elif "documentUrl" in media_data and media_data["documentUrl"]:\n`;
  code += `${indent}            nav_attached_media = media_data["documentUrl"]\n`;
  code += `${indent}        else:\n`;
  code += `${indent}            nav_attached_media = media_data["value"]\n`;
  code += `${indent}    elif isinstance(media_data, str):\n`;
  code += `${indent}        nav_attached_media = media_data\n`;
  code += `${indent}if nav_attached_media and str(nav_attached_media).strip():\n`;
  code += `${indent}    logging.info(f"📎 Отправка медиа из переменной ${attachedMedia[0]}: {nav_attached_media}")\n`;
  code += `${indent}    # Проверяем, является ли медиа относительным путем\n`;
  code += `${indent}    if str(nav_attached_media).startswith('/uploads/'):\n`;
  code += `${indent}        nav_attached_media_path = get_upload_file_path(nav_attached_media)\n`;
  code += `${indent}        nav_attached_media_url = FSInputFile(nav_attached_media_path)\n`;
  code += `${indent}        await bot.send_photo(callback_query.from_user.id, nav_attached_media_url, caption=nav_text)\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)\n`;
  code += `${indent}else:\n`;
  code += `${indent}    logging.info("📝 Медиа не найдено, отправка текстового сообщения")\n`;
  code += `${indent}    # Заменяем переменные в тексте\n`;
  code += `${indent}    nav_text = replace_variables_in_text(nav_text, user_vars)\n`;
  code += `${indent}    await callback_query.message.edit_text(nav_text)\n`;

  return code;
}

/**
 * Генерирует код отправки обычного сообщения
 */
function generateRegularMessageSend(
  navTargetNode: any,
  userVars: string,
  userId: string,
  indent: string
): string {
  let code = '';
  const hasReplyKeyboard = navTargetNode.data.keyboardType === 'reply' &&
    navTargetNode.data.buttons &&
    navTargetNode.data.buttons.length > 0;

  if (hasReplyKeyboard) {
    code += `${indent}# Отправка с reply клавиатурой\n`;
    code += `${indent}builder = ReplyKeyboardBuilder()\n`;
    navTargetNode.data.buttons.forEach((button: Button) => {
      if (button.action === "contact" && button.requestContact) {
        code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
      } else if (button.action === "location" && button.requestLocation) {
        code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
      } else {
        code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
      }
    });
    const resizeKeyboard = toPythonBoolean(navTargetNode.data.resizeKeyboard);
    const oneTimeKeyboard = toPythonBoolean(navTargetNode.data.oneTimeKeyboard);
    code += `${indent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
    code += `${indent}# Заменяем переменные в тексте\n`;
    code += `${indent}nav_text = replace_variables_in_text(nav_text, user_vars)\n`;
    code += `${indent}await bot.send_message(${userId}, nav_text, reply_markup=keyboard)\n`;
  } else {
    code += `${indent}# Заменяем переменные в тексте\n`;
    code += `${indent}nav_text = replace_variables_in_text(nav_text, user_vars)\n`;
    code += `${indent}await callback_query.message.edit_text(nav_text)\n`;
  }

  return code;
}
