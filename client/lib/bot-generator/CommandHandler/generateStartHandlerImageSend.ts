/**
 * @fileoverview Генерация кода отправки изображения в start_handler
 *
 * Модуль создаёт Python-код для отправки изображения из start узла
 * с использованием attachedMedia переменных.
 *
 * @module bot-generator/CommandHandler/generateStartHandlerImageSend
 */

import type { Node } from '@shared/schema';

/**
 * Генерирует Python-код для отправки изображения в start_handler
 *
 * @param node - Узел start с данными изображения
 * @param codeLines - Массив строк кода для добавления
 * @param userDatabaseEnabled - Включена ли база данных пользователей
 *
 * @example
 * const codeLines: string[] = [];
 * generateStartHandlerImageSend(node, codeLines, false);
 */
export function generateStartHandlerImageSend(
  node: Node,
  codeLines: string[],
  userDatabaseEnabled: boolean
): void {
  const attachedMedia = node.data?.attachedMedia || [];
  const imageUrl = node.data?.imageUrl;

  // Проверяем, есть ли изображение для отправки
  if (imageUrl && imageUrl !== 'undefined' && attachedMedia.length > 0) {
    // Находим переменную для изображения
    const imageVar = attachedMedia.find(v => 
      v.includes('image') && v.includes('Url')
    ) || attachedMedia.find(v => 
      v.startsWith('imageUrlVar')
    ) || `image_url_${node.id || 'unknown'}`;

    codeLines.push('');
    codeLines.push('    # 🖼️ Отправляем изображение из attachedMedia');
    codeLines.push(`    image_url = "${imageUrl}"`);
    codeLines.push('    logging.info(f"🖼️ Отправка изображения: {image_url}")');
    codeLines.push('');
    codeLines.push('    # Подставляем переменные в caption');
    codeLines.push('    caption = replace_variables_in_text(text, all_user_vars)');
    codeLines.push('');
    codeLines.push('    # Отправляем изображение с URL');
    codeLines.push('    try:');
    codeLines.push('        await bot.send_photo(');
    codeLines.push('            chat_id=message.chat.id,');
    codeLines.push('            photo=image_url,');
    codeLines.push('            caption=caption');
    codeLines.push('        )');
    codeLines.push('        logging.info(f"✅ Изображение отправлено: {image_url}")');
    codeLines.push('    except Exception as e:');
    codeLines.push('        logging.error(f"❌ Ошибка отправки изображения: {e}")');
    codeLines.push('        # Fallback: отправляем только текст');
    codeLines.push('        await message.answer(caption)');
    codeLines.push('');
  }
}
