/**
 * @fileoverview Экспорт модуля шаблона узла psql_query
 * @module templates/psql-query/index
 */

export type { PsqlQueryTemplateParams } from './psql-query.params';
export type { PsqlQueryParams } from './psql-query.schema';
export { psqlQueryParamsSchema } from './psql-query.schema';
export {
  collectPsqlQueryEntries,
  generatePsqlQueryHandlers,
} from './psql-query.renderer';
export * from './psql-query.fixture';
