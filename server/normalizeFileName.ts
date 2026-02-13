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
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')  // удаляем все недопустимые символы (только буквы, цифры, _, пробелы, дефисы)
    .replace(/\s+/g, '_')       // заменяем пробелы и другие пробельные символы на подчеркивания
    .replace(/_{2,}/g, '_')     // заменяем множественные подчеркивания на одно
    .replace(/^-+|-+$/g, '');   // удаляем дефисы в начале и конце
  
  // Убедимся, что имя не начинается с точки или подчеркивания
  if (normalized.startsWith('.')) {
    normalized = 'file_' + normalized.substring(1);
  } else if (normalized.startsWith('_')) {
    normalized = 'file' + normalized;
  }
  
  // Ограничиваем длину имени файла (обычно файловые системы ограничены ~255 символами)
  if (normalized.length > 100) {
    normalized = normalized.substring(0, 100);
  }
  
  // Убедимся, что имя не пустое
  if (!normalized || normalized === '_' || normalized === '') {
    normalized = 'unnamed_bot';
  }
  
  return normalized;
}