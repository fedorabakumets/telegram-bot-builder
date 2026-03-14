/**
 * @fileoverview Функция рендеринга шаблона стикера
 * @module templates/sticker/sticker.renderer
 */

import type { StickerTemplateParams } from './sticker.params';
import { stickerParamsSchema } from './sticker.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика стикера с валидацией параметров
 * @param params - Параметры стикера
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = generateSticker({
 *   nodeId: 'sticker_1',
 *   stickerFileId: 'CAACAgQAAxkBAAIC',
 *   mediaCaption: 'Привет!',
 * });
 * ```
 */
export function generateSticker(params: StickerTemplateParams): string {
  const validated = stickerParamsSchema.parse(params);
  return renderPartialTemplate('sticker/sticker.py.jinja2', validated);
}
