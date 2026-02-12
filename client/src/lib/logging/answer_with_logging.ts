/**
 * @fileoverview Утилита для генерации кода обертки метода types.Message.answer с логированием
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * создающего обертку для метода types.Message.answer с автоматическим
 * логированием исходящих сообщений в базу данных.
 *
 * @module answer_with_logging
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код обертку для метода types.Message.answer с автоматическим логированием исходящих сообщений
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена обертка
 */
export function answer_with_logging(codeLines: string[]) {
    const functionCodeLines: string[] = [];
    
    functionCodeLines.push('# Обертка для message.answer с сохранением');
    functionCodeLines.push('original_answer = types.Message.answer');
    functionCodeLines.push('async def answer_with_logging(self, text, *args, node_id=None, **kwargs):');
    functionCodeLines.push('    """Обертка для message.answer с автоматическим сохранением и логированием"""');
    functionCodeLines.push('    result = await original_answer(self, text, *args, **kwargs)');
    functionCodeLines.push('    ');
    functionCodeLines.push('    # Извлекаем информацию о кнопках из reply_markup');
    functionCodeLines.push('    message_data_obj = {"message_id": result.message_id if result else None}');
    functionCodeLines.push('    if "reply_markup" in kwargs:');
    functionCodeLines.push('        try:');
    functionCodeLines.push('            reply_markup = kwargs["reply_markup"]');
    functionCodeLines.push('            buttons_data = []');
    functionCodeLines.push('            # Обработка inline клавиатуры');
    functionCodeLines.push('            if hasattr(reply_markup, "inline_keyboard"):');
    functionCodeLines.push('                for row in reply_markup.inline_keyboard:');
    functionCodeLines.push('                    for btn in row:');
    functionCodeLines.push('                        button_info = {"text": btn.text}');
    functionCodeLines.push('                        if hasattr(btn, "url") and btn.url:');
    functionCodeLines.push('                            button_info["url"] = btn.url');
    functionCodeLines.push('                        if hasattr(btn, "callback_data") and btn.callback_data:');
    functionCodeLines.push('                            button_info["callback_data"] = btn.callback_data');
    functionCodeLines.push('                        buttons_data.append(button_info)');
    functionCodeLines.push('                if buttons_data:');
    functionCodeLines.push('                    message_data_obj["buttons"] = buttons_data');
    functionCodeLines.push('                    message_data_obj["keyboard_type"] = "inline"');
    functionCodeLines.push('            # Обработка reply клавиатуры');
    functionCodeLines.push('            elif hasattr(reply_markup, "keyboard"):');
    functionCodeLines.push('                for row in reply_markup.keyboard:');
    functionCodeLines.push('                    for btn in row:');
    functionCodeLines.push('                        button_info = {"text": btn.text}');
    functionCodeLines.push('                        if hasattr(btn, "request_contact") and btn.request_contact:');
    functionCodeLines.push('                            button_info["request_contact"] = True');
    functionCodeLines.push('                        if hasattr(btn, "request_location") and btn.request_location:');
    functionCodeLines.push('                            button_info["request_location"] = True');
    functionCodeLines.push('                        buttons_data.append(button_info)');
    functionCodeLines.push('                if buttons_data:');
    functionCodeLines.push('                    message_data_obj["buttons"] = buttons_data');
    functionCodeLines.push('                    message_data_obj["keyboard_type"] = "reply"');
    functionCodeLines.push('        except Exception as e:');
    functionCodeLines.push('            logging.warning(f"Не удалось извлечь кнопки: {e}")');
    functionCodeLines.push('    ');
    functionCodeLines.push('    # Сохраняем синхронно для гарантии доставки');
    functionCodeLines.push('    await save_message_to_api(');
    functionCodeLines.push('        user_id=str(self.chat.id),');
    functionCodeLines.push('        message_type="bot",');
    functionCodeLines.push('        message_text=text if isinstance(text, str) else str(text),');
    functionCodeLines.push('        node_id=node_id,');
    functionCodeLines.push('        message_data=message_data_obj');
    functionCodeLines.push('    )');
    functionCodeLines.push('    return result');
    functionCodeLines.push('');
    functionCodeLines.push('types.Message.answer = answer_with_logging');
    functionCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(functionCodeLines, 'answer_with_logging.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
