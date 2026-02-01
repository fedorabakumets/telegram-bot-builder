/**
 * Вспомогательная функция для фильтрации inline узлов
 * @param {any[]} nodes - Массив узлов для фильтрации
 * @returns {any[]} Отфильтрованный массив inline узлов
 */
export function filterInlineNodes(nodes: any[]): any[] {
  // Генерируем обработчики обратного вызова для inline кнопок И целевых узлов ввода
  return (nodes || []).filter(node => node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
  );
}
