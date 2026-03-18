/**
 * @fileoverview Экспорт модуля обработчика геолокации
 * @module templates/map/index
 */

export type { MapTemplateParams, KeyboardType, FormatMode } from './map.params';
export type { MapParams } from './map.schema';
export { mapParamsSchema } from './map.schema';
export { generateMap } from './map.renderer';
export * from './map.fixture';
