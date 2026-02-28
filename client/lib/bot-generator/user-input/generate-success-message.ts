/**
 * @fileoverview Генерация отправки подтверждающего сообщения
 * 
 * Модуль создаёт Python-код для отправки пользователю
 * сообщения об успешном сохранении данных.
 * 
 * @module bot-generator/user-input/generate-success-message
 */

/**
 * Генерирует Python-код для отправки success_message
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код отправки сообщения
 */
export function generateSuccessMessage(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Отправляем подтверждающее сообщение только если оно задано\n`;
  code += `${indent}success_message = waiting_config.get("success_message", "")\n`;
  code += `${indent}if success_message:\n`;
  code += `${indent}    logging.info(f"DEBUG: Отправляем подтверждение с текстом: {success_message}")\n`;
  code += `${indent}    await message.answer(success_message)\n`;
  code += `${indent}    logging.info(f"✅ Отправлено подтверждение: {success_message}")\n`;
  return code;
}
