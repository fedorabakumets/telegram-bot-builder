/**
 * Утилита для нормализации имени проекта в допустимое имя файла
 * 
 * @param projectName - Исходное имя проекта
 * @returns Нормализованное имя файла (без расширения)
 */
export function normalizeProjectNameToFile(projectName: string): string {
  // Удаляем или заменяем недопустимые символы для имен файлов
  // Оставляем только буквы, цифры, подчеркивания и дефисы
  let normalized = projectName
    .toLowerCase()  // преобразуем в нижний регистр
    .trim()         // удаляем пробелы по краям
    .replace(/[^\w\s-]/g, '_')  // заменяем все недопустимые символы на подчеркивания
    .replace(/\s+/g, '_');      // заменяем пробелы на подчеркивания
  
  // Убедимся, что имя не начинается с точки или подчеркивания
  if (normalized.startsWith('.') || normalized.startsWith('_')) {
    normalized = 'file_' + normalized;
  }
  
  // Ограничиваем длину имени файла (обычно файловые системы ограничены ~255 символами)
  if (normalized.length > 100) {
    normalized = normalized.substring(0, 100);
  }
  
  // Убедимся, что имя не пустое
  if (!normalized || normalized === '_') {
    normalized = 'unnamed_bot';
  }
  
  return normalized;
}