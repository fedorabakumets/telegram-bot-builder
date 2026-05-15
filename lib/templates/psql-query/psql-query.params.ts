/**
 * @fileoverview Параметры шаблона psql-query
 * @module templates/psql-query/psql-query.params
 */

/** Параметры для генерации кода узла psql_query */
export interface PsqlQueryTemplateParams {
  /** ID узла */
  nodeId: string;
  /** SQL-запрос, поддерживает {переменные} */
  query: string;
  /** Имя переменной для сохранения результата (пустая строка если не нужно) */
  saveResultTo: string;
  /** Формат результата: json | text | first_row | affected */
  resultFormat: 'json' | 'text' | 'first_row' | 'affected';
  /** Шаблон строки для формата text (напр. "{name} — {value}") */
  textTemplate: string;
  /** ID следующего узла для автоперехода (пустая строка если нет) */
  autoTransitionTo: string;
  /** Источник подключения: builtin (db_pool), env (переменная окружения), custom (прямой URL) */
  connectionSource: 'builtin' | 'env' | 'custom';
  /** Имя переменной окружения для подключения (при connectionSource === 'env') */
  connectionEnvVar: string;
  /** Connection string для прямого подключения (при connectionSource === 'custom') */
  connectionString: string;
}
