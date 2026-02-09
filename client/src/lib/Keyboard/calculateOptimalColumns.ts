// ============================================================================
// ГЕНЕРАТОРЫ КЛАВИАТУР И КНОПОК
// ============================================================================

/**
 * Вычисляет оптимальное количество колонок для отображения кнопок в интерфейсе.
 * Функция анализирует количество кнопок и дополнительные параметры для определения
 * наиболее подходящего количества колонок с целью улучшения пользовательского опыта.
 * 
 * @param buttons - Массив кнопок для анализа
 * @param nodeData - Дополнительные данные узла (опционально)
 * @returns Количество колонок для оптимального отображения
 * 
 * @example
 * // Для множественного выбора
 * const columns = calculateOptimalColumns(buttons, { allowMultipleSelection: true });
 * // Возвращает: 2
 * 
 * @example
 * // Для обычных кнопок (6+ кнопок)
 * const columns = calculateOptimalColumns([...Array(8)].map((_, i) => ({ id: i })));
 * // Возвращает: 2
 * 
 * @example
 * // Для обычных кнопок (3-5 кнопок)
 * const columns = calculateOptimalColumns([...Array(4)].map((_, i) => ({ id: i })));
 * // Возвращает: 1
 */
/**
 * Вычисляет оптимальное количество колонок для отображения кнопок в интерфейсе.
 * Функция анализирует количество кнопок и дополнительные параметры для определения
 * наиболее подходящего количества колонок с целью улучшения пользовательского опыта.
 *
 * @param buttons - Массив кнопок для анализа
 * @param nodeData - Дополнительные данные узла (опционально)
 * @returns Количество колонок для оптимального отображения
 *
 * @example
 * // Для множественного выбора
 * const columns = calculateOptimalColumns(buttons, { allowMultipleSelection: true });
 * // Возвращает: 2
 *
 * @example
 * // Для обычных кнопок (6+ кнопок)
 * const columns = calculateOptimalColumns([...Array(8)].map((_, i) => ({ id: i })));
 * // Возвращает: 2
 *
 * @example
 * // Для обычных кнопок (3-5 кнопок)
 * const columns = calculateOptimalColumns([...Array(4)].map((_, i) => ({ id: i })));
 * // Возвращает: 1
 */
export function calculateOptimalColumns(buttons: any[], nodeData?: any): number {
  if (!buttons || buttons.length === 0) return 1;

  const totalButtons = buttons.length;

  // Если это множественный выбор, всегда используем 2 колонки для красивого вида и постоянного расположения
  if (nodeData?.allowMultipleSelection) {
    return 2;
  }

  // Стандартная логика для обычных кнопок
  if (totalButtons >= 6) {
    return 2; // Для 6+ кнопок - 2 колонки
  } else if (totalButtons >= 3) {
    return 1; // Для 3-5 кнопок - 1 колонка для удобочитаемости
  } else {
    return 1; // Для 1-2 кнопок - 1 колонка
  }
}

// Для совместимости с Node.js тестами
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateOptimalColumns };
}
