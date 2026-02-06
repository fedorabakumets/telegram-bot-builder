/**
 * Функция для правильного форматирования текста с поддержкой многострочности.
 * Выполняет преобразование строк в корректные строковые литералы Python,
 * автоматически выбирая подходящий формат в зависимости от содержимого.
 * 
 * Логика форматирования:
 * - Для пустых строк возвращает пустые двойные кавычки
 * - Для многострочного текста (содержит \n) использует тройные кавычки (""")
 * - Для однострочного текста экранирует кавычки и заключает в двойные кавычки
 * 
 * @param text - Исходный текст для форматирования
 * @returns Отформатированная строка, готовая для использования в Python коде
 * 
 * @example
 * // Пустая строка
 * const formatted = formatTextForPython('');
 * // Возвращает: '""'
 * 
 * @example
 * // Однострочный текст без кавычек
 * const formatted = formatTextForPython('Hello World');
 * // Возвращает: '"Hello World"'
 * 
 * @example
 * // Однострочный текст с кавычками
 * const formatted = formatTextForPython('Say "hello"');
 * // Возвращает: '"Say \"hello\""'
 * 
 * @example
 * // Многострочный текст
 * const formatted = formatTextForPython('Line 1\nLine 2\nLine 3');
 * // Возвращает: '"""Line 1\nLine 2\nLine 3"""'
 * 
 * @example
 * // Многострочный текст с кавычками
 * const formatted = formatTextForPython('First line\nSay "hi"\nLast line');
 * // Возвращает: '"""First line\nSay "hi"\nLast line"""'
 */
export function formatTextForPython(text: string): string {
  if (!text) return '""';

  // Для многострочного текста используем тройные кавычки
  if (text.includes('\n')) {
    return `"""${text}"""`;
  } else {
    // Для однострочного текста экранируем только кавычки
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}
