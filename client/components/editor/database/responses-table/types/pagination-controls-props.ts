/**
 * @fileoverview Тип пропсов управления пагинацией
 * @description Свойства для компонента PaginationControls
 */

/**
 * Свойства кнопок пагинации
 */
export interface PaginationControlsProps {
  /** Текущая страница */
  currentPage: number;
  /** Общее количество страниц */
  totalPages: number;
  /** Перейти на страницу */
  goToPage: (page: number) => void;
  /** Предыдущая страница */
  prevPage: () => void;
  /** Следующая страница */
  nextPage: () => void;
}
