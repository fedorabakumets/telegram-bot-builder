/**
 * @fileoverview Генерация конфигурации API
 *
 * Модуль создаёт Python-код для определения базового URL API
 * и PROJECT_ID, которые используются в медиа хендлерах.
 *
 * @module bot-generator/api/generate-api-config
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код для конфигурации API
 *
 * @param projectId - ID проекта (может быть null)
 * @returns Сгенерированный Python-код
 */
export function generateApiConfig(projectId: number | null): string {
  const codeLines: string[] = [];

  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │        Конфигурация API                 │');
  codeLines.push('# └─────────────────────────────────────────┘');

  // Функция для получения базового URL API
  codeLines.push('def get_api_base_url():');
  codeLines.push('    """Получает базовый URL API из переменных окружения');
  codeLines.push('    ');
  codeLines.push('    Returns:');
  codeLines.push('        str: Базовый URL API');
  codeLines.push('    """');
  codeLines.push('    # Пытаемся получить из переменных окружения');
  codeLines.push('    env_url = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN"))');
  codeLines.push('    ');
  codeLines.push('    if env_url:');
  codeLines.push('        # Проверяем, начинается ли URL с http:// или https://');
  codeLines.push('        if env_url.startswith("http://") or env_url.startswith("https://"):');
  codeLines.push('            return env_url');
  codeLines.push('        else:');
  codeLines.push('            # Добавляем https:// префикс если нет');
  codeLines.push('            return f"https://{env_url}"');
  codeLines.push('    ');
  codeLines.push('    # Возвращаем пустую строку если URL не найден');
  codeLines.push('    return ""');
  codeLines.push('');

  // Определяем API_BASE_URL
  codeLines.push('# Получаем базовый URL API');
  codeLines.push('API_BASE_URL = get_api_base_url()');
  codeLines.push('logging.info(f"📡 API Base URL определён как: {API_BASE_URL}")');
  codeLines.push('');

  // Определяем PROJECT_ID (всегда, по умолчанию 0)
  codeLines.push('# ID проекта для API запросов');
  codeLines.push(`PROJECT_ID = ${projectId !== null ? projectId : 0}`);
  codeLines.push('logging.info(f"📁 PROJECT_ID: {PROJECT_ID}")');
  codeLines.push('');

  // Определяем API_TIMEOUT (всегда, по умолчанию 10)
  codeLines.push('# Таймаут запросов к API (секунды)');
  codeLines.push('API_TIMEOUT = int(os.getenv("API_TIMEOUT", "10"))');
  codeLines.push('logging.info(f"⏱️ API_TIMEOUT: {API_TIMEOUT} сек")');
  codeLines.push('');

  // Определяем PROJECT_DIR (всегда)
  codeLines.push('# Директория проекта');
  codeLines.push('PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))');
  codeLines.push('logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")');
  codeLines.push('');

  // Создаём функцию-заглушку save_message_to_api (всегда, чтобы избежать ошибок)
  codeLines.push('# Функция сохранения сообщения (заглушка, переопределяется при включенной БД)');
  codeLines.push('async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):');
  codeLines.push('    """Заглушка - возвращает None если БД не включена"""');
  codeLines.push('    return None');
  codeLines.push('');

  // Создаём заглушки для DB-функций (всегда, чтобы избежать ошибок)
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │    Заглушки функций (при выключенной БД) │');
  codeLines.push('# └─────────────────────────────────────────┘');
  codeLines.push('def init_user_variables(user_id, user_obj=None):');
  codeLines.push('    """Заглушка - возвращает имя пользователя"""');
  codeLines.push('    if user_obj:');
  codeLines.push('        return user_obj.first_name or "Пользователь"');
  codeLines.push('    return "Пользователь"');
  codeLines.push('');
  codeLines.push('async def get_user_from_db(user_id):');
  codeLines.push('    """Заглушка - возвращает пустой dict"""');
  codeLines.push('    return {}');
  codeLines.push('');
  codeLines.push('def replace_variables_in_text(text, variables_dict):');
  codeLines.push('    """Заглушка - возвращает текст без замены"""');
  codeLines.push('    return text if text else ""');
  codeLines.push('');
  codeLines.push('def get_moscow_time():');
  codeLines.push('    """Заглушка - возвращает текущее время"""');
  codeLines.push('    from datetime import datetime, timezone');
  codeLines.push('    return datetime.now(timezone.utc).isoformat()');
  codeLines.push('');
  codeLines.push('async def update_user_data_in_db(user_id, key, value):');
  codeLines.push('    """Заглушка - ничего не делает"""');
  codeLines.push('    pass');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generate-api-config.ts');
  return commentedCodeLines.join('\n');
}
