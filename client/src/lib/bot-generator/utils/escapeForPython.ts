// Функция для правильного экранирования строк в Python коде с поддержкой UTF-8
export function escapeForPython(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\') // Экранируем обратные слеши первыми
    .replace(/"/g, '\\"') // Экранируем двойные кавычки
    .replace(/\n/g, '\\n') // Экранируем переводы строк
    .replace(/\r/g, '\\r') // Экранируем возврат каретки
    .replace(/\t/g, '\\t'); // Экранируем табуляции
}
