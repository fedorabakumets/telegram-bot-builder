/**
 * @fileoverview Публичный экспорт шаблона базы данных
 * @module templates/database
 */

export type { DatabaseTemplateParams } from './database.params';
export { databaseParamsSchema, type DatabaseParams } from './database.schema';
export { generateDatabase } from './database.renderer';
export * as databaseFixtures from './database.fixture';
