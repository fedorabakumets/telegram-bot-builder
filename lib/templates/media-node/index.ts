/**
 * @fileoverview Экспорт модуля медиа-ноды
 * @module templates/media-node/index
 */

export type { MediaNodeTemplateParams } from './media-node.params';
export type { MediaNodeParams } from './media-node.schema';
export { mediaNodeParamsSchema } from './media-node.schema';
export { generateMediaNode } from './media-node.renderer';
export * from './media-node.fixture';
