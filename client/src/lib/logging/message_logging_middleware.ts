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
    middlewareCodeLines.push('        # Если есть фото и сообщение сохранено, регистрируем медиа');
    middlewareCodeLines.push('        if photo_file_id and saved_message and "id" in saved_message:');
    middlewareCodeLines.push('            try:');
    middlewareCodeLines.push('                if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):');
    middlewareCodeLines.push('                    media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"');
    middlewareCodeLines.push('                else:');
    middlewareCodeLines.push('                    media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"');
    middlewareCodeLines.push('                ');
    middlewareCodeLines.push('                media_payload = {');
    middlewareCodeLines.push('                    "messageId": saved_message["id"],');
    middlewareCodeLines.push('                    "fileId": photo_file_id,');
    middlewareCodeLines.push('                    "botToken": BOT_TOKEN,');
    middlewareCodeLines.push('                    "mediaType": "photo"');
    middlewareCodeLines.push('                }');
    middlewareCodeLines.push('                ');
    middlewareCodeLines.push('                # Определяем, использовать ли SSL для медиа-запросов');
    middlewareCodeLines.push('                use_ssl_media = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)');
    middlewareCodeLines.push('                logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")');
    middlewareCodeLines.push('                # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER');
    middlewareCodeLines.push('                if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:');
    middlewareCodeLines.push('                    use_ssl_media = False');
    middlewareCodeLines.push('                    logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")');
    middlewareCodeLines.push('                ');
    middlewareCodeLines.push('                if use_ssl_media:');
    middlewareCodeLines.push('                    # Для внешних соединений используем SSL-контекст');
    middlewareCodeLines.push('                    connector = TCPConnector(ssl=True)');
    middlewareCodeLines.push('                else:');
    middlewareCodeLines.push('                    # Для локальных соединений не используем SSL-контекст');
    middlewareCodeLines.push('                    # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения');
    middlewareCodeLines.push('                    import ssl');
    middlewareCodeLines.push('                    ssl_context = ssl.create_default_context()');
    middlewareCodeLines.push('                    ssl_context.check_hostname = False');
    middlewareCodeLines.push('                    ssl_context.verify_mode = ssl.CERT_NONE');
    middlewareCodeLines.push('                    connector = TCPConnector(ssl=ssl_context)');
    middlewareCodeLines.push('                ');
    middlewareCodeLines.push('                async with aiohttp.ClientSession(connector=connector) as session:');
    middlewareCodeLines.push('                    async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:');
    middlewareCodeLines.push('                        if response.status == 200:');
    middlewareCodeLines.push('                            message_id = saved_message.get("id")');
    middlewareCodeLines.push('                            logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")');
    middlewareCodeLines.push('                        else:');
    middlewareCodeLines.push('                            error_text = await response.text()');
    middlewareCodeLines.push('                            logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")');
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
