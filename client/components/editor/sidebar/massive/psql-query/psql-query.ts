/**
 * @fileoverview Определение узла PostgreSQL для палитры сайдбара редактора
 * @module components/editor/sidebar/massive/psql-query/psql-query
 */

import { ComponentDefinition } from '@shared/schema';

/** Определение компонента узла PostgreSQL-запроса к базе данных */
export const psqlQueryNode: ComponentDefinition = {
  id: 'psql-query',
  name: 'PostgreSQL',
  description: 'Выполнение SQL-запросов к PostgreSQL базе данных',
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
    connectionSource: 'builtin',
    connectionEnvVar: '',
    connectionString: '',
  },
};
