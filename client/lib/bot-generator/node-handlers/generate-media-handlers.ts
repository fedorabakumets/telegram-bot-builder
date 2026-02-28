/**
 * @fileoverview Обработка медиа-узлов (стикеры, голос, анимации)
 * 
 * Модуль создаёт Python-код для отправки медиафайлов различных типов
 * через callback query в Telegram боте.
 * 
 * @module bot-generator/node-handlers/generate-media-handlers
 */

import { Button } from '../../bot-generator';
import { generateButtonText } from '../../format';

/**
 * Генерирует Python-код для отправки стикера
 */
export function generateStickerHandler(
  targetNode: any,
  indent: string = '    '
): string {
  const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
  
  let code = '';
  code += `${indent}sticker_url = "${stickerUrl}"\n`;
  code += `${indent}try:\n`;
  code += `${indent}    # Проверяем, является ли это локальным файлом\n`;
  code += `${indent}    if is_local_file(sticker_url):\n`;
  code += `${indent}        # Отправляем локальный файл\n`;
  code += `${indent}        file_path = get_local_file_path(sticker_url)\n`;
  code += `${indent}        if os.path.exists(file_path):\n`;
  code += `${indent}            sticker_file = FSInputFile(file_path)\n`;
  code += `${indent}        else:\n`;
  code += `${indent}            raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        # Используяям URL или file_id для стикеров\n`;
  code += `${indent}        sticker_file = sticker_url\n`;
  code += `${indent}\n`;

  if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons?.length > 0) {
    code += generateInlineButtons(targetNode.data.buttons, indent);
    code += `${indent}    await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n`;
  } else {
    code += `${indent}    await bot.send_sticker(callback_query.from_user.id, sticker_file)\n`;
  }

  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка отправки стикера: {e}")\n`;
  code += `${indent}    await safe_edit_or_send(callback_query, f"❌ Не удалось отправить стикер")\n`;

  return code;
}

/**
 * Генерирует Python-код для отправки голосового сообщения
 */
export function generateVoiceHandler(
  targetNode: any,
  indent: string = '    '
): string {
  const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
  const duration = targetNode.data.duration || 30;

  let code = '';
  code += `${indent}voice_url = "${voiceUrl}"\n`;
  code += `${indent}duration = ${duration}\n`;
  code += `${indent}try:\n`;
  code += `${indent}    # Проверяем, является ли это локальным файлом\n`;
  code += `${indent}    if is_local_file(voice_url):\n`;
  code += `${indent}        # Отправляем локальный файл\n`;
  code += `${indent}        file_path = get_local_file_path(voice_url)\n`;
  code += `${indent}        if os.path.exists(file_path):\n`;
  code += `${indent}            voice_file = FSInputFile(file_path)\n`;
  code += `${indent}        else:\n`;
  code += `${indent}            raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        # Используем URL для внешних файлов\n`;
  code += `${indent}        voice_file = voice_url\n`;
  code += `${indent}\n`;

  if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons?.length > 0) {
    code += generateInlineButtons(targetNode.data.buttons, indent);
    code += `${indent}    await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n`;
  } else {
    code += `${indent}    await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n`;
  }

  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка отправки голосового сообщения: {e}")\n`;
  code += `${indent}    await safe_edit_or_send(callback_query, f"❌ Не удалось отправить голосовое сообщение")\n`;

  return code;
}

/**
 * Генерирует Python-код для отправки анимации (GIF)
 */
export function generateAnimationHandler(
  targetNode: any,
  indent: string = '    '
): string {
  const caption = targetNode.data.mediaCaption || "🎬 Анимация";
  const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";

  let code = '';
  if (caption.includes('\n')) {
    code += `${indent}caption = """${caption}"""\n`;
  } else {
    const escapedCaption = caption.replace(/"/g, '\\"');
    code += `${indent}caption = "${escapedCaption}"\n`;
  }

  code += `${indent}animation_url = "${animationUrl}"\n`;
  code += `${indent}try:\n`;
  code += `${indent}    # Проверяем, является ли это локальным файлом\n`;
  code += `${indent}    if is_local_file(animation_url):\n`;
  code += `${indent}        # Отпяяяяавляем локальный файл\n`;
  code += `${indent}        file_path = get_local_file_path(animation_url)\n`;
  code += `${indent}        if os.path.exists(file_path):\n`;
  code += `${indent}            animation_file = FSInputFile(file_path)\n`;
  code += `${indent}        else:\n`;
  code += `${indent}            raise FileNotFoundError(f"Локальный файл не наяден: {file_path}")\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        # Используем URL для внешних файлов\n`;
  code += `${indent}        animation_file = animation_url\n`;
  code += `${indent}\n`;

  if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons?.length > 0) {
    code += generateInlineButtons(targetNode.data.buttons, indent);
    code += `${indent}    await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n`;
  } else {
    code += `${indent}    await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n`;
  }

  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка отправки анимации: {e}")\n`;
  code += `${indent}    await safe_edit_or_send(callback_query, f"❌ Не удалось отправить анимацию\\n{caption}")\n`;

  return code;
}

/**
 * Вспомогательная функция для генерации inline кнопок
 */
function generateInlineButtons(buttons: Button[], indent: string): string {
  let code = '';
  code += `${indent}    builder = InlineKeyboardBuilder()\n`;
  buttons.forEach((btn: Button, index: number) => {
    if (btn.action === "url") {
      code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
    } else if (btn.action === 'goto') {
      const baseCallbackData = btn.target || btn.id || 'no_action';
      const callbackData = `${baseCallbackData}_btn_${index}`;
      code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
    } else if (btn.action === 'command' && btn.target) {
      const commandCallback = `cmd_${btn.target.replace('/', '')}`;
      code += `${indent}    # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
      code += `${indent}    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
    }
  });
  code += `${indent}    keyboard = builder.as_markup()\n`;
  return code;
}
