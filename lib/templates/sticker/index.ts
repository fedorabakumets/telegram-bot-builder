/**
 * @fileoverview Экспорт модуля стикера
 * @module templates/sticker/index
 */

export type { StickerTemplateParams } from './sticker.params';
export type { StickerParams } from './sticker.schema';
export { stickerParamsSchema } from './sticker.schema';
export { generateSticker } from './sticker.renderer';
export * from './sticker.fixture';
