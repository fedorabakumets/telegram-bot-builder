/**
 * @fileoverview Утилита для генерации кода обертки метода bot.send_message с логированием
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * создающего обертку для метода bot.send_message с автоматическим
 * логированием исходящих сообщений в базу данных.
 *
 * @module send_message_with_logging
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код обертку для метода bot.send_message с автоматическим логированием исходящих сообщений
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена обертка
 */
export function send_message_with_logging(codeLines: string[]) {
    const wrapperCodeLines: string[] = [];
    
    wrapperCodeLines.push('# Обертка для сохранения исходящих сообщений');
    wrapperCodeLines.push('original_send_message = bot.send_message');
    wrapperCodeLines.push('async def send_message_with_logging(chat_id, text, *args, node_id=None, **kwargs):');
    wrapperCodeLines.push('    """Обертка для bot.send_message с автоматическим сохранением и логированием"""');
    wrapperCodeLines.push('    result = await original_send_message(chat_id, text, *args, **kwargs)');
    wrapperCodeLines.push('    ');
    wrapperCodeLines.push('    # Извлекаем информацию о кнопках из reply_markup');
    wrapperCodeLines.push('    message_data_obj = {"message_id": result.message_id if result else None}');
    wrapperCodeLines.push('    if "reply_markup" in kwargs:');
    wrapperCodeLines.push('        try:');
    wrapperCodeLines.push('            reply_markup = kwargs["reply_markup"]');
    wrapperCodeLines.push('            buttons_data = []');
    wrapperCodeLines.push('            # Обработка inline клавиатуры');
    wrapperCodeLines.push('            if hasattr(reply_markup, "inline_keyboard"):');
    wrapperCodeLines.push('                for row in reply_markup.inline_keyboard:');
    wrapperCodeLines.push('                    for btn in row:');
    wrapperCodeLines.push('                        button_info = {"text": btn.text}');
    wrapperCodeLines.push('                        if hasattr(btn, "url") and btn.url:');
    wrapperCodeLines.push('                            button_info["url"] = btn.url');
    wrapperCodeLines.push('                        if hasattr(btn, "callback_data") and btn.callback_data:');
    wrapperCodeLines.push('                            button_info["callback_data"] = btn.callback_data');
    wrapperCodeLines.push('                        buttons_data.append(button_info)');
    wrapperCodeLines.push('                if buttons_data:');
    wrapperCodeLines.push('                    message_data_obj["buttons"] = buttons_data');
    wrapperCodeLines.push('                    message_data_obj["keyboard_type"] = "inline"');
    wrapperCodeLines.push('            # Обработка reply клавиатуры');
    wrapperCodeLines.push('            elif hasattr(reply_markup, "keyboard"):');
    wrapperCodeLines.push('                for row in reply_markup.keyboard:');
    wrapperCodeLines.push('                    for btn in row:');
    wrapperCodeLines.push('                        button_info = {"text": btn.text}');
    wrapperCodeLines.push('                        if hasattr(btn, "request_contact") and btn.request_contact:');
    wrapperCodeLines.push('                            button_info["request_contact"] = True');
    wrapperCodeLines.push('                        if hasattr(btn, "request_location") and btn.request_location:');
    wrapperCodeLines.push('                            button_info["request_location"] = True');
    wrapperCodeLines.push('                        buttons_data.append(button_info)');
    wrapperCodeLines.push('                if buttons_data:');
    wrapperCodeLines.push('                    message_data_obj["buttons"] = buttons_data');
    wrapperCodeLines.push('                    message_data_obj["keyboard_type"] = "reply"');
    wrapperCodeLines.push('        except Exception as e:');
    wrapperCodeLines.push('            logging.warning(f"Не удалось извлечь кнопки: {e}")');
    wrapperCodeLines.push('    ');
    wrapperCodeLines.push('    # Сохраняем синхронно для гарантии доставки');
    wrapperCodeLines.push('    await save_message_to_api(');
    wrapperCodeLines.push('        user_id=str(chat_id),');
    wrapperCodeLines.push('        message_type="bot",');
    wrapperCodeLines.push('        message_text=text,');
    wrapperCodeLines.push('        node_id=node_id,');
    wrapperCodeLines.push('        message_data=message_data_obj');
    wrapperCodeLines.push('    )');
    wrapperCodeLines.push('    return result');
    wrapperCodeLines.push('');
    wrapperCodeLines.push('bot.send_message = send_message_with_logging');
    wrapperCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(wrapperCodeLines, 'send_message_with_logging.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
