/**
 * @fileoverview Экспорт Zod схем для валидации параметров шаблонов
 * @module templates/schemas
 */

export { importsParamsSchema, type ImportsParams } from './imports-schema';
export { configParamsSchema, type ConfigParams } from './config-schema';
export { botParamsSchema, botNodeSchema, type BotParams } from './bot-schema';
export { headerParamsSchema, type HeaderParams } from './header-schema';
export { databaseParamsSchema, type DatabaseParams } from './database-schema';
export { utilsParamsSchema, type UtilsParams } from './utils-schema';
export { mainParamsSchema, type MainParams } from './main-schema';
