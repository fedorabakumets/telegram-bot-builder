import { isLoggingEnabled } from '../bot-generator';

/**
 * Вспомогательная функция для обработки целей подключения
 * @param {any[]} connections - Массив соединений для обработки
 * @param {Set<string>} allReferencedNodeIds - Множество идентификаторов узлов для обновления
 */
export function processConnectionTargets(connections: any[], allReferencedNodeIds: Set<string>): void {
  // Добавляем все цели подключения, чтобы обеспечить наличие обработчика у каждого подключенного узла
  if (!Array.isArray(connections)) {
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔗 ГЕНЕРАТОР: connections не является массивом, пропускаем обработку`);
    return; // Просто возвращаемся, если connections не является массивом
  }
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔗 ГЕНЕРАТОР: Обрабатываем ${connections.length} соединений`);
  connections.forEach((connection, index) => {
    if (!connection) {
      // Пропускаем null/undefined соединения
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔗 ГЕНЕРАТОР: Пропускаем null/undefined соединение ${index}`);
      return;
    }
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔗 ГЕНЕРАТОР: Соединение ${index}: source=${connection.source} -> target=${connection.target}`);
    if (connection.target) {
      allReferencedNodeIds.add(connection.target);
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Добавлен target ${connection.target} в allReferencedNodeIds`);
    }
  });
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: Финальный allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);
}
