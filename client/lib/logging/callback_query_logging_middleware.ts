/**
 * @fileoverview Утилита для генерации кода middleware логирования нажатий на inline-кнопки
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего middleware для автоматического логирования нажатий
 * на inline-кнопки в базу данных.
 *
 * @module callback_query_logging_middleware
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код middleware для логирования нажатий на inline-кнопки (если они используются)
 * @param {boolean} hasInlineButtonsValue - Флаг, указывающий на наличие inline-кнопок в боте
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлен middleware
 */
export function callback_query_logging_middleware(hasInlineButtonsValue: boolean, codeLines: string[]) {
    if (hasInlineButtonsValue) {
        const middlewareCodeLines: string[] = [];
        
        middlewareCodeLines.push('# Middleware для сохранения нажатий на кнопки');
        middlewareCodeLines.push('async def callback_query_logging_middleware(handler, event: types.CallbackQuery, data: dict):');
        middlewareCodeLines.push('    """Middleware для автоматического сохранения нажатий на кнопки"""');
        middlewareCodeLines.push('    try:');
        middlewareCodeLines.push('        user_id = str(event.from_user.id)');
        middlewareCodeLines.push('        callback_data = event.data or ""');
        middlewareCodeLines.push('        ');
        middlewareCodeLines.push('        # Пытаемся найти текст кнопки из сообщения');
        middlewareCodeLines.push('        button_text = None');
        middlewareCodeLines.push('        if event.message and hasattr(event.message, "reply_markup"):');
        middlewareCodeLines.push('            reply_markup = event.message.reply_markup');
        middlewareCodeLines.push('            if hasattr(reply_markup, "inline_keyboard"):');
        middlewareCodeLines.push('                for row in reply_markup.inline_keyboard:');
        middlewareCodeLines.push('                    for btn in row:');
        middlewareCodeLines.push('                        if hasattr(btn, "callback_data") and btn.callback_data == callback_data:');
        middlewareCodeLines.push('                            button_text = btn.text');
        middlewareCodeLines.push('                            break');
        middlewareCodeLines.push('                    if button_text:');
        middlewareCodeLines.push('                        break');
        middlewareCodeLines.push('        ');
        middlewareCodeLines.push('        # Сохраняем информацию о нажатии кнопки');
        middlewareCodeLines.push('        message_text_to_save = f"[Нажата кнопка: {button_text}]" if button_text else "[Нажата кнопка]"');
        middlewareCodeLines.push('        await save_message_to_api(');
        middlewareCodeLines.push('            user_id=user_id,');
        middlewareCodeLines.push('            message_type="user",');
        middlewareCodeLines.push('            message_text=message_text_to_save,');
        middlewareCodeLines.push('            message_data={');
        middlewareCodeLines.push('                "button_clicked": True,');
        middlewareCodeLines.push('                "button_text": button_text,');
        middlewareCodeLines.push('                "callback_data": callback_data');
        middlewareCodeLines.push('            }');
        middlewareCodeLines.push('        )');
        middlewareCodeLines.push('    except Exception as e:');
        middlewareCodeLines.push('        logging.error(f"Ошибка в middleware сохранения нажатий кнопок: {e}")');
        middlewareCodeLines.push('    ');
        middlewareCodeLines.push('    # Продолжаем обработку callback query');
        middlewareCodeLines.push('    return await handler(event, data)');
        middlewareCodeLines.push('');

        // Применяем автоматическое добавление комментариев ко всему коду
        const commentedCodeLines = processCodeWithAutoComments(middlewareCodeLines, 'callback_query_logging_middleware.ts');

        // Добавляем обработанные строки в исходный массив
        codeLines.push(...commentedCodeLines);
    }
}
