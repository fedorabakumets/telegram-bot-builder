/**
 * @fileoverview Утилиты для генерации путей к медиафайлам
 *
 * Предоставляет функции для преобразования путей к файлам в сгенерированном Python-коде.
 * Функция ищет папку uploads динамически, поднимаясь по родительским директориям.
 * Работает на Windows, Linux и в контейнерах (Railway, Docker).
 *
 * @module utils/findUploadsPath
 */

/**
 * Генерирует Python-функцию для универсального поиска папки uploads
 * 
 * @description
 * Функция ищет папку uploads, поднимаясь по родительским директориям от текущего файла.
 * Это позволяет работать на локальной машине, в Railway и других средах.
 * 
 * @param {string} indent - Отступ для кода
 * @returns {string} Python-код функции get_full_media_path
 */
export function generateFindUploadsPathFunction(indent: string = '    '): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}def get_full_media_path(path):`);
  codeLines.push(`${indent}    """`);
  codeLines.push(`${indent}    Универсальная функция поиска папки uploads.`);
  codeLines.push(`${indent}    Ищет uploads, поднимаясь по родительским директориям.`);
  codeLines.push(`${indent}    Работает на Windows, Linux, в Docker и Railway.`);
  codeLines.push(`${indent}    """`);
  codeLines.push(`${indent}    if not path:`);
  codeLines.push(`${indent}        return path`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}    # HTTP/HTTPS URL возвращаем как есть`);
  codeLines.push(`${indent}    if path.startswith('http://') or path.startswith('https://'):`);
  codeLines.push(`${indent}        return path`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}    # Убираем ведущие / для относительных путей`);
  codeLines.push(`${indent}    relative_path = path.lstrip('/')`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}    # Получаем директорию текущего скрипта`);
  codeLines.push(`${indent}    current_dir = os.path.dirname(os.path.abspath(__file__))`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}    # Ищем папку uploads, поднимаясь по директориям (макс. 5 уровней)`);
  codeLines.push(`${indent}    for _ in range(5):`);
  codeLines.push(`${indent}        candidate = os.path.join(current_dir, relative_path)`);
  codeLines.push(`${indent}        if os.path.exists(candidate):`);
  codeLines.push(`${indent}            return candidate`);
  codeLines.push(`${indent}        # Поднимаемся на уровень выше`);
  codeLines.push(`${indent}        parent_dir = os.path.dirname(current_dir)`);
  codeLines.push(`${indent}        if parent_dir == current_dir:  # достигли корня`);
  codeLines.push(`${indent}            break`);
  codeLines.push(`${indent}        current_dir = parent_dir`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}    # Если не нашли - возвращаем путь от корня проекта`);
  codeLines.push(`${indent}    # Это запасной вариант для Railway/Docker`);
  codeLines.push(`${indent}    return '/app/' + relative_path if relative_path else path`);

  return codeLines.join('\n');
}
