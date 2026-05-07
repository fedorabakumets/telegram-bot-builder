/**
 * @fileoverview Определение узла SQL-запроса для палитры сайдбара редактора
 * @module components/editor/sidebar/massive/psql-query/psql-query
 */

import { ComponentDefinition } from '@shared/schema';

/** Определение компонента узла прямого SQL-запроса к базе данных */
export const psqlQueryNode: ComponentDefinition = {
  id: 'psql-query',
  name: 'SQL-запрос',
  description: 'Прямой SQL-запрос к базе данных бота',
  icon: 'fas fa-database',
  color: 'bg-violet-100 text-violet-600',
  type: 'psql_query' as any,
  defaultData: {
    query: '',
    saveResultTo: '',
    resultFormat: 'first_row',
    textTemplate: '',
    enableAutoTransition: false,
    autoTransitionTo: '',
  },
};
