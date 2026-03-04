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
    apiFunctionCodeLines.push('        api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"');
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
    apiFunctionCodeLines.push('        # Определяем, требуется ли SSL (True только для https:// URL без localhost)');
    apiFunctionCodeLines.push('        is_localhost = "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url');
    apiFunctionCodeLines.push('        is_https = api_url.startswith("https://")');
    apiFunctionCodeLines.push('        use_ssl = is_https and not is_localhost  # SSL только для внешних https://');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        # Создаём connector с правильным SSL');
    apiFunctionCodeLines.push('        connector = TCPConnector(ssl=use_ssl)');
    apiFunctionCodeLines.push('        ');
    apiFunctionCodeLines.push('        async with aiohttp.ClientSession(connector=connector) as session:');
    apiFunctionCodeLines.push('            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=API_TIMEOUT)) as response:');
    apiFunctionCodeLines.push('                if response.status == 200:');
    apiFunctionCodeLines.push('                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")');
    apiFunctionCodeLines.push('                    response_data = await response.json()');
    apiFunctionCodeLines.push('                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id');
    apiFunctionCodeLines.push('                elif response.status == 429:');
    apiFunctionCodeLines.push('                    logging.warning(f"⚠️ Слишком много запросов: {user_id}")');
    apiFunctionCodeLines.push('                    return None');
    apiFunctionCodeLines.push('                else:');
    apiFunctionCodeLines.push('                    error_text = await response.text()');
    apiFunctionCodeLines.push('                    logging.error(f"❌ Ошибка API: {response.status} - {error_text}")');
    apiFunctionCodeLines.push('                    return None');
    apiFunctionCodeLines.push('    except Exception as e:');
    apiFunctionCodeLines.push('        logging.error(f"Ошибка подключения к API: {e}")');
    apiFunctionCodeLines.push('    return None');
    apiFunctionCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(apiFunctionCodeLines, 'save_message_to_api.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
