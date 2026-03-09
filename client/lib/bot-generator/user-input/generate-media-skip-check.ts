/**
 * @fileoverview Генерация проверки кнопок пропуска для медиа-узлов
 * 
 * Модуль создаёт Python-код для проверки pending_skip_buttons
 * и очистки состояний ожидания медиа.
 * 
 * @module bot-generator/user-input/generate-media-skip-check
 */

/**
 * Тип медиа: "photo", "video", "audio", "document"
 */
export type MediaType = 'photo' | 'video' | 'audio' | 'document';

/**
 * Генерирует Python-код для проверки pending_skip_buttons
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки
 */
export function generateMediaSkipCheck(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}# ИСПРАВЛЕНИЕ: Проверяем pending_skip_buttons для медиа-узлов (фото/видео/аудио)\n`;
  code += `${indent}# Эта проверка нужна когда узел ожидает медиа, но пользователь нажал reply-кнопку с skipDataCollection\n`;
  code += `${indent}if user_id in user_data and "pending_skip_buttons" in user_data[user_id]:\n`;
  code += `${indent}    pending_buttons = user_data[user_id]["pending_skip_buttons"]\n`;
  code += `${indent}    user_text = message.text\n`;
  return code;
}

/**
 * Генерирует Python-код для поиска нажатой кнопки пропуска
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код поиска кнопки
 */
export function generateSkipButtonSearch(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}for skip_btn in pending_buttons:\n`;
  code += `${indent}    if skip_btn.get("text") == user_text:\n`;
  code += `${indent}        skip_target = skip_btn.get("target")\n`;
  code += `${indent}        logging.info(f"⏭️ Нажата кнопка skipDataCollection для медиа-узла: {user_text} -> {skip_target}")\n`;
  return code;
}

/**
 * Генерирует Python-код для очистки состояний ожидания медиа
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код очистки
 */
export function generateMediaWaitingCleanup(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Очищаем pending_skip_buttons и любые медиа-ожидания\n`;
  code += `${indent}if "pending_skip_buttons" in user_data[user_id]:\n`;
  code += `${indent}    del user_data[user_id]["pending_skip_buttons"]\n`;
  code += `${indent}# Проверяем и очищаем waiting_for_input если тип соответствует медиа\n`;
  code += `${indent}if "waiting_for_input" in user_data[user_id]:\n`;
  code += `${indent}    waiting_config = user_data[user_id]["waiting_for_input"]\n`;
  code += `${indent}    if isinstance(waiting_config, dict) and waiting_config.get("type") in ["photo", "video", "audio", "document"]:\n`;
  code += `${indent}        del user_data[user_id]["waiting_for_input"]\n`;
  return code;
}
