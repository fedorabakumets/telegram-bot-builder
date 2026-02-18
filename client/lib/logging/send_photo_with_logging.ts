/**
 * @fileoverview Утилита для генерации кода обертки метода bot.send_photo с логированием
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * создающего обертку для метода bot.send_photo с автоматическим
 * логированием отправки фото и регистрации медиа в базе данных.
 *
 * @module send_photo_with_logging
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код обертку для метода bot.send_photo с автоматическим логированием отправки фото и регистрации медиа
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена обертка
 */
export function send_photo_with_logging(codeLines: string[]) {
    const photoWrapperCodeLines: string[] = [];
    
    photoWrapperCodeLines.push('# Обертка для bot.send_photo с сохранением');
    photoWrapperCodeLines.push('original_send_photo = bot.send_photo');
    photoWrapperCodeLines.push('async def send_photo_with_logging(chat_id, photo, *args, caption=None, node_id=None, **kwargs):');
    photoWrapperCodeLines.push('    """Обертка для bot.send_photo с автоматическим сохранением и регистрацией медиа"""');
    photoWrapperCodeLines.push('    # Проверяем, является ли photo относительным путем к локальному файлу');
    photoWrapperCodeLines.push('    if isinstance(photo, str) and photo.startswith("/uploads/"):');
    photoWrapperCodeLines.push('        file_path = get_upload_file_path(photo)');
    photoWrapperCodeLines.push('        result = await original_send_photo(chat_id, FSInputFile(file_path), *args, caption=caption, **kwargs)');
    photoWrapperCodeLines.push('    else:');
    photoWrapperCodeLines.push('        result = await original_send_photo(chat_id, photo, *args, caption=caption, **kwargs)');
    photoWrapperCodeLines.push('    ');
    photoWrapperCodeLines.push('    # Создаем message_data с информацией о фото');
    photoWrapperCodeLines.push('    message_data_obj = {"message_id": result.message_id if result else None}');
    photoWrapperCodeLines.push('    ');
    photoWrapperCodeLines.push('    # Сохраняем информацию о фото');
    photoWrapperCodeLines.push('    if result and hasattr(result, "photo") and result.photo:');
    photoWrapperCodeLines.push('        largest_photo = result.photo[-1]');
    photoWrapperCodeLines.push('        message_data_obj["photo"] = {');
    photoWrapperCodeLines.push('            "file_id": largest_photo.file_id,');
    photoWrapperCodeLines.push('            "file_unique_id": largest_photo.file_unique_id,');
    photoWrapperCodeLines.push('            "width": largest_photo.width,');
    photoWrapperCodeLines.push('            "height": largest_photo.height');
    photoWrapperCodeLines.push('        }');
    photoWrapperCodeLines.push('    # Если photo это строка (URL), сохраняем URL');
    photoWrapperCodeLines.push('    elif isinstance(photo, str):');
    photoWrapperCodeLines.push('        message_data_obj["photo_url"] = photo');
    photoWrapperCodeLines.push('    ');
    photoWrapperCodeLines.push('    # Извлекаем информацию о кнопках из reply_markup');
    photoWrapperCodeLines.push('    if "reply_markup" in kwargs:');
    photoWrapperCodeLines.push('        try:');
    photoWrapperCodeLines.push('            reply_markup = kwargs["reply_markup"]');
    photoWrapperCodeLines.push('            buttons_data = []');
    photoWrapperCodeLines.push('            if hasattr(reply_markup, "inline_keyboard"):');
    photoWrapperCodeLines.push('                for row in reply_markup.inline_keyboard:');
    photoWrapperCodeLines.push('                    for btn in row:');
    photoWrapperCodeLines.push('                        button_info = {"text": btn.text}');
    photoWrapperCodeLines.push('                        if hasattr(btn, "url") and btn.url:');
    photoWrapperCodeLines.push('                            button_info["url"] = btn.url');
    photoWrapperCodeLines.push('                        if hasattr(btn, "callback_data") and btn.callback_data:');
    photoWrapperCodeLines.push('                            button_info["callback_data"] = btn.callback_data');
    photoWrapperCodeLines.push('                        buttons_data.append(button_info)');
    photoWrapperCodeLines.push('                if buttons_data:');
    photoWrapperCodeLines.push('                    message_data_obj["buttons"] = buttons_data');
    photoWrapperCodeLines.push('                    message_data_obj["keyboard_type"] = "inline"');
    photoWrapperCodeLines.push('        except Exception as e:');
    photoWrapperCodeLines.push('            logging.warning(f"Не удалось извлечь кнопки из send_photo: {e}")');
    photoWrapperCodeLines.push('    ');
    photoWrapperCodeLines.push('    # Сохраняем сообщение в базу данных');
    photoWrapperCodeLines.push('    saved_message = await save_message_to_api(');
    photoWrapperCodeLines.push('        user_id=str(chat_id),');
    photoWrapperCodeLines.push('        message_type="bot",');
    photoWrapperCodeLines.push('        message_text=caption or "[Фото]",');
    photoWrapperCodeLines.push('        node_id=node_id,');
    photoWrapperCodeLines.push('        message_data=message_data_obj');
    photoWrapperCodeLines.push('    )');
    photoWrapperCodeLines.push('    ');
    photoWrapperCodeLines.push('    # Если фото отправлено от бота с file_id, регистрируем медиа');
    photoWrapperCodeLines.push('    if result and hasattr(result, "photo") and result.photo and saved_message and "id" in saved_message:');
    photoWrapperCodeLines.push('        try:');
    photoWrapperCodeLines.push('            largest_photo = result.photo[-1]');
    photoWrapperCodeLines.push('            if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):');
    photoWrapperCodeLines.push('                media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"');
    photoWrapperCodeLines.push('            else:');
    photoWrapperCodeLines.push('                media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"');
    photoWrapperCodeLines.push('            ');
    photoWrapperCodeLines.push('            media_payload = {');
    photoWrapperCodeLines.push('                "messageId": saved_message["id"],');
    photoWrapperCodeLines.push('                "fileId": largest_photo.file_id,');
    photoWrapperCodeLines.push('                "botToken": BOT_TOKEN,');
    photoWrapperCodeLines.push('                "mediaType": "photo"');
    photoWrapperCodeLines.push('            }');
    photoWrapperCodeLines.push('            ');
    photoWrapperCodeLines.push('            # Определяем, использовать ли SSL для медиа-запросов');
    photoWrapperCodeLines.push('            use_ssl_media = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)');
    photoWrapperCodeLines.push('            logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")');
    photoWrapperCodeLines.push('            # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER');
    photoWrapperCodeLines.push('            if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:');
    photoWrapperCodeLines.push('                use_ssl_media = False');
    photoWrapperCodeLines.push('                logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")');
    photoWrapperCodeLines.push('            ');
    photoWrapperCodeLines.push('            if use_ssl_media:');
    photoWrapperCodeLines.push('                # Для внешних соединений используем SSL-контекст');
    photoWrapperCodeLines.push('                connector = TCPConnector(ssl=True)');
    photoWrapperCodeLines.push('            else:');
    photoWrapperCodeLines.push('                # Для локальных соединений не используем SSL-контекст');
    photoWrapperCodeLines.push('                # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения');
    photoWrapperCodeLines.push('                import ssl');
    photoWrapperCodeLines.push('                ssl_context = ssl.create_default_context()');
    photoWrapperCodeLines.push('                ssl_context.check_hostname = False');
    photoWrapperCodeLines.push('                ssl_context.verify_mode = ssl.CERT_NONE');
    photoWrapperCodeLines.push('                connector = TCPConnector(ssl=ssl_context)');
    photoWrapperCodeLines.push('            ');
    photoWrapperCodeLines.push('            async with aiohttp.ClientSession(connector=connector) as session:');
    photoWrapperCodeLines.push('                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:');
    photoWrapperCodeLines.push('                    if response.status == 200:');
    photoWrapperCodeLines.push('                        bot_message_id = saved_message.get("id")');
    photoWrapperCodeLines.push('                        logging.info(f"✅ Медиа бота зарегистрировано для сообщения {bot_message_id}")');
    photoWrapperCodeLines.push('                    else:');
    photoWrapperCodeLines.push('                        error_text = await response.text()');
    photoWrapperCodeLines.push('                        logging.warning(f"⚠️ Не удалось зарегистрировать медиа бота: {response.status} - {error_text}")');
    photoWrapperCodeLines.push('        except Exception as media_error:');
    photoWrapperCodeLines.push('            logging.warning(f"Ошибка при регистрации медиа бота: {media_error}")');
    photoWrapperCodeLines.push('    ');
    photoWrapperCodeLines.push('    return result');
    photoWrapperCodeLines.push('');
    photoWrapperCodeLines.push('bot.send_photo = send_photo_with_logging');
    photoWrapperCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(photoWrapperCodeLines, 'send_photo_with_logging.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
