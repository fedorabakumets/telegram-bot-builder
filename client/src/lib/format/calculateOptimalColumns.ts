// ============================================================================
// ГЕНЕРАТОРЫ КЛАВИАТУР И КНОПОК
// ============================================================================
// Функция для вычисления оптимального количества колонок для кнопок

export function calculateOptimalColumns(buttons: any[], nodeData?: any): number {
  if (!buttons || buttons.length === 0) return 1;

  const totalButtons = buttons.length;

  // Если это множественный выбор, всегда используем 2 колонки для красивого вида
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
