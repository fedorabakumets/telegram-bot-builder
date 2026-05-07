/**
 * @fileoverview Zod-схема для валидации параметров шаблона psql-query
 * @module templates/psql-query/psql-query.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров узла psql_query */
export const psqlQueryParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** SQL-запрос, поддерживает {переменные} */
  query: z.string(),
  /** Имя переменной для сохранения результата */
  saveResultTo: z.string(),
  /** Формат результата */
  resultFormat: z.enum(['json', 'text', 'first_row', 'affected']),
  /** Шаблон строки для формата text */
  textTemplate: z.string(),
  /** ID следующего узла для автоперехода */
  autoTransitionTo: z.string(),
});

/** Тип параметров, выведенный из схемы */
export type PsqlQueryParams = z.infer<typeof psqlQueryParamsSchema>;
