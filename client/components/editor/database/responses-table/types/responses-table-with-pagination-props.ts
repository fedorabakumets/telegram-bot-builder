/**
 * @fileoverview Тип пропсов для таблицы ответов с пагинацией
 * @description Свойства для компонента ResponsesTableWithPagination
 */

import type { UserBotData } from '@shared/schema';

/**
 * Свойства таблицы ответов с пагинацией
 */
export interface ResponsesTableWithPaginationProps {
  /** Список пользователей */
  users: UserBotData[];
  /** Количество ответов на странице */
  itemsPerPage?: number;
}
