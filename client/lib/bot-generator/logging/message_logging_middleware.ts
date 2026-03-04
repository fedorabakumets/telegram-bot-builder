/**
 * @fileoverview Утилита для генерации кода middleware логирования входящих сообщений
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего middleware для автоматического логирования входящих
 * сообщений от пользователей в базу данных.
 *
 * @module message_logging_middleware
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код middleware для логирования входящих сообщений от пользователей
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлен middleware
 */
export function message_logging_middleware(codeLines: string[]) {
    const middlewareCodeLines: string[] = [];
    
    middlewareCodeLines.push('# Middleware для сохранения входящих сообщений');
    middlewareCodeLines.push('async def message_logging_middleware(handler, event: types.Message, data: dict):');
    middlewareCodeLines.push('    """Middleware для автоматического сохранения входящих сообщений от пользователей"""');
    middlewareCodeLines.push('    try:');
    middlewareCodeLines.push('        # Сохраняем входящее сообщение от пользователя');
    middlewareCodeLines.push('        user_id = str(event.from_user.id)');
    middlewareCodeLines.push('        message_text = event.text or event.caption or "[медиа]"');
    middlewareCodeLines.push('        message_data = {"message_id": event.message_id}');
    middlewareCodeLines.push('        ');
    middlewareCodeLines.push('        # Проверяем наличие фото');
    middlewareCodeLines.push('        photo_file_id = None');
    middlewareCodeLines.push('        if event.photo:');
    middlewareCodeLines.push('            # Берем фото наибольшего размера (последнее в списке)');
    middlewareCodeLines.push('            largest_photo = event.photo[-1]');
    middlewareCodeLines.push('            photo_file_id = largest_photo.file_id');
    middlewareCodeLines.push('            message_data["photo"] = {');
    middlewareCodeLines.push('                "file_id": largest_photo.file_id,');
    middlewareCodeLines.push('                "file_unique_id": largest_photo.file_unique_id,');
    middlewareCodeLines.push('                "width": largest_photo.width,');
    middlewareCodeLines.push('                "height": largest_photo.height,');
    middlewareCodeLines.push('                "file_size": largest_photo.file_size if hasattr(largest_photo, "file_size") else None');
    middlewareCodeLines.push('            }');
    middlewareCodeLines.push('            if not message_text or message_text == "[медиа]":');
    middlewareCodeLines.push('                message_text = "[Фото]"');
    middlewareCodeLines.push('        ');
    middlewareCodeLines.push('        # Сохраняем сообщение в базу данных');
    middlewareCodeLines.push('        saved_message = await save_message_to_api(');
    middlewareCodeLines.push('            user_id=user_id,');
    middlewareCodeLines.push('            message_type="user",');
    middlewareCodeLines.push('            message_text=message_text,');
    middlewareCodeLines.push('            message_data=message_data');
    middlewareCodeLines.push('        )');
    middlewareCodeLines.push('        ');
    middlewareCodeLines.push('        # Если есть фото и сообщение сохранено, регистрируем медиа в БД');
    middlewareCodeLines.push('        if photo_file_id and saved_message and "id" in saved_message:');
    middlewareCodeLines.push('            try:');
    middlewareCodeLines.push('                # Сохраняем медиа в БД напрямую');
    middlewareCodeLines.push('                media_result = await save_media_to_db(');
    middlewareCodeLines.push('                    file_id=photo_file_id,');
    middlewareCodeLines.push('                    file_type="photo",');
    middlewareCodeLines.push('                    file_name=f"photo_{photo_file_id}",');
    middlewareCodeLines.push('                    file_size=message.photo[-1].file_size if message.photo and message.photo[-1].file_size else 0,');
    middlewareCodeLines.push('                    mime_type="image/jpeg"');
    middlewareCodeLines.push('                )');
    middlewareCodeLines.push('                ');
    middlewareCodeLines.push('                # Связываем медиа с сообщением');
    middlewareCodeLines.push('                if media_result:');
    middlewareCodeLines.push('                    await link_media_to_message(');
    middlewareCodeLines.push('                        message_id=saved_message["id"],');
    middlewareCodeLines.push('                        media_id=media_result["id"],');
    middlewareCodeLines.push('                        media_kind="photo",');
    middlewareCodeLines.push('                        order_index=0');
    middlewareCodeLines.push('                    )');
    middlewareCodeLines.push('                    logging.info(f"✅ Медиа зарегистрировано для сообщения {saved_message[\'id\']}")');
    middlewareCodeLines.push('            except Exception as media_error:');
    middlewareCodeLines.push('                logging.warning(f"Ошибка при регистрации медиа: {media_error}")');
    middlewareCodeLines.push('    except Exception as e:');
    middlewareCodeLines.push('        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")');
    middlewareCodeLines.push('    ');
    middlewareCodeLines.push('    # Продолжаем обработку сообщения');
    middlewareCodeLines.push('    return await handler(event, data)');
    middlewareCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(middlewareCodeLines, 'message_logging_middleware.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
