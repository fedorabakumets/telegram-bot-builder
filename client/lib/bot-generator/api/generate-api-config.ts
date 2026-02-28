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

  // Применяем автоматическое добавление комментариев
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generate-api-config.ts');
  return commentedCodeLines.join('\n');
}
