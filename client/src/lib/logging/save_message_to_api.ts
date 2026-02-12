/**
 * @fileoverview Утилита для генерации кода функции сохранения сообщений в базу данных через API
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего асинхронное сохранение сообщений в базу данных
 * через HTTP API с обработкой ошибок и SSL-соединений.
 *
 * @module save_message_to_api
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код асинхронную функцию для сохранения сообщений в базу данных через API
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function save_message_to_api(codeLines: string[]) {
    const apiFunctionCodeLines: string[] = [];
    
    apiFunctionCodeLines.push('# Функция для сохранения сообщений в базу данных через API');
    apiFunctionCodeLines.push('async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):');
    apiFunctionCodeLines.push('    """Сохраняет сообщение в базу данных через API"""');
    apiFunctionCodeLines.push('    try:');
    apiFunctionCodeLines.push('        # Формируем полный URL для API');
    apiFunctionCodeLines.push('        if API_BASE_URL.startswith("http"):');
    apiFunctionCodeLines.push('            api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"');
    apiFunctionCodeLines.push('        else:');
    apiFunctionCodeLines.push('            api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        payload = {');
    apiFunctionCodeLines.push('            "userId": str(user_id),');
    apiFunctionCodeLines.push('            "messageType": message_type,');
    apiFunctionCodeLines.push('            "messageText": message_text,');
    apiFunctionCodeLines.push('            "nodeId": node_id,');
    apiFunctionCodeLines.push('            "messageData": message_data or {}');
    apiFunctionCodeLines.push('        }');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        logging.debug(f"💾 Отправка сообщения в API: {payload}")');
    apiFunctionCodeLines.push('        logging.debug(f"📡 API URL: {api_url}")');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        # Определяем, использовать ли SSL');
    apiFunctionCodeLines.push('        use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)');
    apiFunctionCodeLines.push('        logging.debug(f"🔒 SSL требуется для URL {api_url}: {use_ssl}")');
    apiFunctionCodeLines.push('        # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER');
    apiFunctionCodeLines.push('        if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:');
    apiFunctionCodeLines.push('            use_ssl = False');
    apiFunctionCodeLines.push('            logging.debug(f"🔓 SSL принудительно отключен для локального URL: {api_url}")');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        if use_ssl:');
    apiFunctionCodeLines.push('            # Для внешних соединений используем SSL-контекст');
    apiFunctionCodeLines.push('            connector = TCPConnector(ssl=True)');
    apiFunctionCodeLines.push('        else:');
    apiFunctionCodeLines.push('            # Для локальных соединений не используем SSL-контекст');
    apiFunctionCodeLines.push('            # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения');
    apiFunctionCodeLines.push('            import ssl');
    apiFunctionCodeLines.push('            ssl_context = ssl.create_default_context()');
    apiFunctionCodeLines.push('            ssl_context.check_hostname = False');
    apiFunctionCodeLines.push('            ssl_context.verify_mode = ssl.CERT_NONE');
    apiFunctionCodeLines.push('            connector = TCPConnector(ssl=ssl_context)');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        async with aiohttp.ClientSession(connector=connector) as session:');
    apiFunctionCodeLines.push('            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:');
    apiFunctionCodeLines.push('                if response.status == 200:');
    apiFunctionCodeLines.push('                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")');
    apiFunctionCodeLines.push('                    response_data = await response.json()');
    apiFunctionCodeLines.push('                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id');
    apiFunctionCodeLines.push('                elif response.status == 429:');
    apiFunctionCodeLines.push('                    logging.warning(f"⚠️ Слишком много запросов при попытке сохранить сообщение: {user_id}, {message_type}")');
    apiFunctionCodeLines.push('                    return None');
    apiFunctionCodeLines.push('                else:');
    apiFunctionCodeLines.push('                    error_text = await response.text()');
    apiFunctionCodeLines.push('                    logging.error(f"❌ Не удалось сохранить сообщение: {response.status} - {error_text}")');
    apiFunctionCodeLines.push('                    logging.error(f"Отправленный payload: {payload}")');
    apiFunctionCodeLines.push('                    return None');
    apiFunctionCodeLines.push('    except aiohttp.ClientConnectorError as e:');
    apiFunctionCodeLines.push('        logging.error(f"Ошибка подключения к API: {e}")');
    apiFunctionCodeLines.push('    except asyncio.TimeoutError as e:');
    apiFunctionCodeLines.push('        logging.error(f"Таймаут при обращении к API: {e}")');
    apiFunctionCodeLines.push('    except Exception as e:');
    apiFunctionCodeLines.push('        logging.error(f"Неизвестная ошибка при сохранении сообщения: {type(e).__name__}: {e}")');
    apiFunctionCodeLines.push('    return None');
    apiFunctionCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(apiFunctionCodeLines, 'save_message_to_api.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
