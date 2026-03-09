/**
 * @fileoverview Тип пропсов счёта ответов
 * @description Свойства для компонента ResponseCount
 */

/**
 * Свойства счёта ответов
 */
export interface ResponseCountProps {
  /** Текущая страница */
  currentPage: number;
  /** Общее количество страниц */
  totalPages: number;
  /** Количество элементов на странице */
  itemsPerPage: number;
  /** Общее количество ответов */
  totalCount: number;
}
