/**
 * @fileoverview Генерация кода для проверки и инициализации сессии Client API
 *
 * Этот модуль генерирует Python-код для проверки авторизации Client API
 * (Userbot) и получения сессии из базы данных. Использует Telethon для
 * отправки сообщений от имени пользователя.
 *
 * @module generateBroadcastClientSession
 */

/**
 * Генерирует код для проверки и получения сессии Client API
 *
 * @param {string} indent - Отступ для кода
 * @param {string} errorMessage - Сообщение об ошибке
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientSession(
  indent: string = '    ',
  errorMessage: string = '❌ Ошибка рассылки'
): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Проверка авторизации Client API`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);
  codeLines.push(`${indent}        client_session = await conn.fetchrow(`);
  codeLines.push(`${indent}            "SELECT session_string, user_id, api_id, api_hash FROM user_telegram_settings WHERE is_active = 1 LIMIT 1"`);
  codeLines.push(`${indent}        )`);
  codeLines.push(`${indent}        logging.info(f"🔑 Client API сессия: user_id={client_session['user_id'] if client_session else 'None'}")`);
  codeLines.push(`${indent}        if client_session:`);
  codeLines.push(`${indent}            logging.info(f"🔑 API ID: {client_session.get('api_id', 'None')[:10] if client_session.get('api_id') else 'None'}...")`);
  codeLines.push(`${indent}except Exception as e:`);
  codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения сессии Client API: {e}")`);
  codeLines.push(`${indent}    await callback_query.message.answer("${errorMessage}")`);
  codeLines.push(`${indent}    return`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}if not client_session:`);
  codeLines.push(`${indent}    logging.error("❌ Client API не авторизован")`);
  codeLines.push(`${indent}    await callback_query.message.answer("⚠️ Требуется авторизация Client API во вкладке Telegram Client")`);
  codeLines.push(`${indent}    return`);

  return codeLines.join('\n');
}

/**
 * Генерирует код для инициализации клиента Telethon
 *
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientInit(indent: string = '    '): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Проверка credentials перед инициализацией`);
  codeLines.push(`${indent}api_id_val = client_session["api_id"] if client_session else None`);
  codeLines.push(`${indent}api_hash_val = client_session["api_hash"] if client_session else None`);
  codeLines.push(`${indent}session_string_val = client_session["session_string"] if client_session else None`);
  codeLines.push(`${indent}if not api_id_val or not api_hash_val or not session_string_val:`);
  codeLines.push(`${indent}    logging.error("❌ Client API: отсутствуют credentials или сессия")`);
  codeLines.push(`${indent}    logging.error(f"🔍 Debug: api_id={api_id_val}, api_hash={'present' if api_hash_val else 'None'}, session={'present' if session_string_val else 'None'}")`);
  codeLines.push(`${indent}    error_msg = "⚠️ Client API не настроен: "`);
  codeLines.push(`${indent}    if not api_id_val or not api_hash_val: error_msg += "Нет API credentials. "`);
  codeLines.push(`${indent}    if not session_string_val: error_msg += "Нет сессии. Авторизуйтесь во вкладке Telegram Client."`);
  codeLines.push(`${indent}    await callback_query.message.answer(error_msg)`);
  codeLines.push(`${indent}    return`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Инициализация Client API (Telethon)`);
  codeLines.push(`${indent}from telethon import TelegramClient`);
  codeLines.push(`${indent}from telethon.sessions import StringSession`);
  codeLines.push(`${indent}from telethon.tl.types import Message`);
  codeLines.push(`${indent}import os`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Универсальная функция для поиска пути к uploads`);
  codeLines.push(`${indent}def get_full_media_path(url_or_path):`);
  codeLines.push(`${indent}    if not url_or_path:`);
  codeLines.push(`${indent}        return None`);
  codeLines.push(`${indent}    if url_or_path.startswith('http://') or url_or_path.startswith('https://'):`);
  codeLines.push(`${indent}        return url_or_path`);
  codeLines.push(`${indent}    # Если файл существует по абсолютному пути, возвращаем его`);
  codeLines.push(`${indent}    if os.path.exists(url_or_path):`);
  codeLines.push(`${indent}        return url_or_path`);
  codeLines.push(`${indent}    # Извлекаем путь относительно папки uploads (убираем ведущие /uploads/ или C:/uploads/)`);
  codeLines.push(`${indent}    import re`);
  codeLines.push(`${indent}    match = re.search(r'[\\/](uploads[\\/].+)$', url_or_path)`);
  codeLines.push(`${indent}    if match:`);
  codeLines.push(`${indent}        # Убираем 'uploads/' из начала, оставляем только '40/...'`);
  codeLines.push(`${indent}        relative_path = re.sub(r'^uploads[\\/]', '', match.group(1))`);
  codeLines.push(`${indent}    else:`);
  codeLines.push(`${indent}        relative_path = url_or_path`);
  codeLines.push(`${indent}    # Ищем папку uploads начиная от текущей директории`);
  codeLines.push(`${indent}    current_dir = os.path.dirname(os.path.abspath(__file__))`);
  codeLines.push(`${indent}    while current_dir != os.path.dirname(current_dir):  # Пока не достигнем корня`);
  codeLines.push(`${indent}        uploads_path = os.path.join(current_dir, 'uploads')`);
  codeLines.push(`${indent}        full_path = os.path.join(uploads_path, relative_path)`);
  codeLines.push(`${indent}        if os.path.exists(full_path):`);
  codeLines.push(`${indent}            return full_path`);
  codeLines.push(`${indent}        current_dir = os.path.dirname(current_dir)`);
  codeLines.push(`${indent}    return url_or_path`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Создание клиента из сессии`);
  codeLines.push(`${indent}api_id = int(client_session["api_id"])`);
  codeLines.push(`${indent}api_hash = client_session["api_hash"]`);
  codeLines.push(`${indent}session_string = client_session["session_string"]`);
  codeLines.push(`${indent}logging.info(f"🔧 Инициализация Telethon: api_id={api_id}, session={session_string[:20]}...")`);
  codeLines.push(`${indent}app = TelegramClient(StringSession(session_string), api_id=api_id, api_hash=api_hash)`);

  return codeLines.join('\n');
}
