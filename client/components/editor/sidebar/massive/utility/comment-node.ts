/**
 * @fileoverview Определение ноды-комментария для палитры компонентов
 * @module components/editor/sidebar/massive/utility/comment-node
 */

import { ComponentDefinition } from '@shared/schema';

/** Определение ноды-комментария */
export const commentNode: ComponentDefinition = {
  id: 'comment-node',
  name: '📝 Комментарий',
  description: 'Текстовая заметка на холсте — не влияет на логику бота',
  icon: 'fas fa-sticky-note',
  color: 'bg-yellow-100 text-yellow-700',
  type: 'comment',
  defaultData: {
    /** Текст комментария */
    messageText: '',
    /** Цвет фона заметки */
    commentColor: 'yellow',
  },
};
