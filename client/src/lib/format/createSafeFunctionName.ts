// ============================================================================
// УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ И ОБРАБОТКИ ТЕКСТА
// ============================================================================
// Функция для создания безопасного имени функции Python


export function createSafeFunctionName(nodeId: string): string {
  let safeName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
  // Python функции не могут начинаться с цифры
  if (/^\d/.test(safeName)) {
    safeName = 'node_' + safeName;
  }
  return safeName;
}
