
/**
 * Генерирует код функций для работы с медиафайлами
 * @returns Сгенерированный код функций для работы с медиафайлами
 */
export function generateMediaFileFunctions(): string {
  const lines = [
    'def is_local_file(url: str) -> bool:',
    '    """Проверяет, является ли URL локальным загруженным файлом"""',
    '    return url.startswith("/uploads/") or url.startswith("uploads/")',
    '',
    'def get_local_file_path(url: str) -> str:',
    '    """Получает локальный путь к файлу из URL"""',
    '    if url.startswith("/"):',
    '        return url[1:]  # Убираем ведущий слеш',
    '    return url',
  ];

  return lines.join('\n');
}