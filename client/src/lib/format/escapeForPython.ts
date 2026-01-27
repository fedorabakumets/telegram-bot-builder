/**
 * Функция для правильного экранирования строк в Python коде
 * @param text Текст для экранирования
 * @returns Экранированный текст, безопасный для использования в Python строках
 */
export function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}
