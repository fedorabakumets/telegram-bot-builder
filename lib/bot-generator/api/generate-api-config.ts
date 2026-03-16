/**
 * @fileoverview Генерация конфигурации API
 *
 * Модуль создаёт Python-код для заглушек функций при выключенной БД.
 * PROJECT_ID и PROJECT_DIR определяются в config.py.jinja2.
 *
 * @module bot-generator/api/generate-api-config
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код для конфигурации API
 *
 * @param projectId - ID проекта (может быть null)
 * @param userDatabaseEnabled - Флаг включения БД (если false, генерируются заглушки)
 * @returns Сгенерированный Python-код
 */
export function generateApiConfig(projectId: number | null, userDatabaseEnabled: boolean = false): string {
  const codeLines: string[] = [];

  // Примечание: PROJECT_ID и PROJECT_DIR определяются в config.py.jinja2
  // Здесь генерируются только заглушки функций при выключенной БД

  // Создаём заглушки для DB-функций (ТОЛЬКО если БД выключена)
  if (!userDatabaseEnabled) {
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
    codeLines.push('async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):');
    codeLines.push('    """Заглушка - ничего не делает"""');
    codeLines.push('    return None');
    codeLines.push('');
  }

  // Применяем автоматическое добавление комментариев
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generate-api-config.ts');
  return commentedCodeLines.join('\n');
}
