// ============================================================================
// УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ И ОБРАБОТКИ ТЕКСТА
// ============================================================================

/**
 * Создает безопасное имя функции Python из идентификатора узла.
 * Функция преобразует строку в корректное имя функции Python,
 * соответствующее правилам именования переменных в Python.
 * 
 * Выполняет следующие преобразования:
 * - Заменяет все недопустимые символы на подчеркивания (_)
 * - Добавляет префикс "node_" если имя начинается с цифры
 * - Сохраняет только буквы, цифры и подчеркивания
 * 
 * @param nodeId - Исходный идентификатор узла для преобразования
 * @returns Безопасное имя функции Python
 * 
 * @example
 * // Обычное имя узла
 * const functionName = createSafeFunctionName("user_input_node");
 * // Возвращает: "user_input_node"
 * 
 * @example
 * // Имя с недопустимыми символами
 * const functionName = createSafeFunctionName("my-node@123");
 * // Возвращает: "my_node_123"
 * 
 * @example
 * // Имя, начинающееся с цифры
 * const functionName = createSafeFunctionName("123_input");
 * // Возвращает: "node_123_input"
 * 
 * @example
 * // Специальные символы
 * const functionName = createSafeFunctionName("test-function.name!");
 * // Возвращает: "test_function_name_"
 */
export function createSafeFunctionName(nodeId: string): string {
  let safeName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
  // Python функции не могут начинаться с цифры
  if (/^\d/.test(safeName)) {
    safeName = 'node_' + safeName;
  }
  return safeName;
}
