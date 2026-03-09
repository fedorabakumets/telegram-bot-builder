/**
 * @fileoverview Генерация кода отправки изображения в start_handler
 *
 * Модуль создаёт Python-код для отправки изображения из start узла
 * с использованием attachedMedia переменных.
 * Гарантирует что переменная keyboard определена (None если нет кнопок).
 *
 * @module bot-generator/CommandHandler/generateStartHandlerImageSend
 */

import type { Node } from '@shared/schema';

/**
 * Генерирует Python-код для отправки изображения в start_handler
 *
 * @param node - Узел start с данными изображения
 * @param codeLines - Массив строк кода для добавления
 *
 * @example
 * const codeLines: string[] = [];
 * generateStartHandlerImageSend(node, codeLines);
 */
export function generateStartHandlerImageSend(
  node: Node,
  codeLines: string[]
): void {
  const attachedMedia = node.data?.attachedMedia || [];
  const imageUrl = node.data?.imageUrl;
  const formatMode = node.data?.formatMode;
  const markdown = node.data?.markdown;

  // Определяем parse_mode
  let parseModeValue: string | null = null;
  if (markdown) {
    parseModeValue = 'Markdown';
  } else if (formatMode === 'html') {
    parseModeValue = 'HTML';
  } else if (formatMode === 'markdown') {
    parseModeValue = 'Markdown';
  }

  // Проверяем, есть ли изображение для отправки
  if (imageUrl && imageUrl !== 'undefined' && attachedMedia.length > 0) {
    codeLines.push('');
    codeLines.push('    # 🖼️ Отправляем изображение из attachedMedia');
    codeLines.push(`    image_url = "${imageUrl}"`);
    codeLines.push('    logging.info(f"🖼️ Отправка изображения: {image_url}")');
    codeLines.push('');
    codeLines.push('    # Подставляем переменные в caption (text и all_user_vars определены выше)');
    codeLines.push('    # Заменяем переменные в тексте\n');
    codeLines.push('    # Получаем фильтры переменных для замены\n');
    codeLines.push('    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n');
    codeLines.push('    caption = replace_variables_in_text(text, all_user_vars, variable_filters)\n');
    codeLines.push('');
    codeLines.push('    # Гарантируем что keyboard определена (None если нет кнопок)');
    codeLines.push('    if \'keyboard\' not in locals():');
    codeLines.push('        keyboard = None');
    codeLines.push('');
    codeLines.push('    # Отправляем изображение с URL и клавиатурой');
    codeLines.push('    try:');
    if (parseModeValue) {
      codeLines.push(`        # Режим форматирования: ${parseModeValue}`);
      codeLines.push('        if keyboard is not None:');
      codeLines.push('            await bot.send_photo(');
      codeLines.push('                chat_id=message.chat.id,');
      codeLines.push('                photo=image_url,');
      codeLines.push('                caption=caption,');
      codeLines.push(`                parse_mode="${parseModeValue}",`);
      codeLines.push('                reply_markup=keyboard');
      codeLines.push('            )');
      codeLines.push('        else:');
      codeLines.push('            await bot.send_photo(');
      codeLines.push('                chat_id=message.chat.id,');
      codeLines.push('                photo=image_url,');
      codeLines.push('                caption=caption,');
      codeLines.push(`                parse_mode="${parseModeValue}"`);
      codeLines.push('            )');
    } else {
      codeLines.push('        if keyboard is not None:');
      codeLines.push('            await bot.send_photo(');
      codeLines.push('                chat_id=message.chat.id,');
      codeLines.push('                photo=image_url,');
      codeLines.push('                caption=caption,');
      codeLines.push('                reply_markup=keyboard');
      codeLines.push('            )');
      codeLines.push('        else:');
      codeLines.push('            await bot.send_photo(');
      codeLines.push('                chat_id=message.chat.id,');
      codeLines.push('                photo=image_url,');
      codeLines.push('                caption=caption');
      codeLines.push('            )');
    }
    codeLines.push('        logging.info(f"✅ Изображение отправлено: {image_url}")');
    codeLines.push('    except Exception as e:');
    codeLines.push('        logging.error(f"❌ Ошибка отправки изображения: {e}")');
    codeLines.push('        # Fallback: отправляем только текст');
    codeLines.push('        if keyboard is not None:');
    codeLines.push('            await message.answer(caption, reply_markup=keyboard)');
    codeLines.push('        else:');
    codeLines.push('            await message.answer(caption)');
    codeLines.push('');
  }
}
