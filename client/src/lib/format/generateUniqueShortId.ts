/**
 * Функция для создания уникальных коротких ID для узлов
 * @param nodeId ID узла для которого создается короткий ID
 * @param allNodeIds Список всех ID узлов для проверки уникальности
 * @returns Уникальный короткий ID для узла
 */
export function generateUniqueShortId(nodeId: string, allNodeIds: readonly string[]): string {
  if (!nodeId) return 'node';

  // Особая обработка для узлов интересов
  if (nodeId.endsWith('_interests')) {
    const prefix = nodeId.replace('_interests', '');
    // Возвращаем первые 5-6 символов префикса для уникальности
    return prefix.substring(0, Math.min(6, prefix.length));
  }

  // Для метро и других узлов используем старую логику
  const baseShortId = nodeId.slice(-10).replace(/^_+/, '');

  // Проверяем уникальность среди всех узлов
  const conflicts = allNodeIds.filter(id => {
    const otherShortId = id.slice(-10).replace(/^_+/, '');
    return otherShortId === baseShortId && id !== nodeId;
  });

  // Если конфликтов нет, возвращаем базовый ID
  if (conflicts.length === 0) {
    return baseShortId;
  }

  // Если есть конфликты, берем более уникальную часть
  return nodeId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
}
