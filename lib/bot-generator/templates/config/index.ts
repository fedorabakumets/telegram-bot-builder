/**
 * @fileoverview Публичный экспорт шаблона конфигурации
 * @module templates/config
 */

export type { ConfigTemplateParams } from './config.params';
export { configParamsSchema, type ConfigParams } from './config.schema';
export { generateConfig } from './config.renderer';
export * as configFixtures from './config.fixture';
