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
  /** Источник подключения: builtin (db_pool), env (переменная окружения), custom (прямой URL) */
  connectionSource: z.enum(['builtin', 'env', 'custom']).default('builtin'),
  /** Имя переменной окружения для подключения (при env) */
  connectionEnvVar: z.string().default(''),
  /** Connection string для прямого подключения (при custom) */
  connectionString: z.string().default(''),
});

/** Тип параметров, выведенный из схемы */
export type PsqlQueryParams = z.infer<typeof psqlQueryParamsSchema>;
