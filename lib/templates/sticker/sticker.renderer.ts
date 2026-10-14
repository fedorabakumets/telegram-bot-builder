/**
 * @fileoverview Функция рендеринга шага сценария «стикер»
 * @module templates/sticker/sticker.renderer
 */

import type { StickerTemplateParams } from './sticker.params';
import { stickerParamsSchema } from './sticker.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Оставляет источник файла как есть: file_id, HTTP URL или /uploads/.
 * Значение из поля URL, которое не похоже на ссылку, считается file_id
 * (так палитра пишет оба варианта в stickerUrl).
 * @param params - Исходные параметры узла
 * @returns Параметры с одним активным источником
 */
function resolveStickerSource(params: StickerTemplateParams): StickerTemplateParams {
  const fileId = (params.stickerFileId || '').trim();
  const url = (params.stickerUrl || '').trim();
  if (fileId) {
    return { ...params, stickerFileId: fileId, stickerUrl: '', isLocalStickerUrl: false };
  }
  if (url.startsWith('/uploads/')) {
    return { ...params, stickerUrl: url, stickerFileId: '', isLocalStickerUrl: true };
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { ...params, stickerUrl: url, stickerFileId: '', isLocalStickerUrl: false };
  }
  if (url) {
    return { ...params, stickerFileId: url, stickerUrl: '', isLocalStickerUrl: false };
  }
  return { ...params, stickerFileId: '', stickerUrl: '', isLocalStickerUrl: false };
}

/**
 * Генерация Python-шага отправки стикера.
 * Поле command в данных узла не читается: отправка только при входе в блок.
 * @param params - Параметры стикера
 * @returns Сгенерированный Python-код обработчика
 */
export function generateSticker(params: StickerTemplateParams): string {
  const resolved = resolveStickerSource(params);
  const validated = stickerParamsSchema.parse({
    ...resolved,
    disableNotification: resolved.disableNotification ?? false,
    autoTransitionTo: (resolved.autoTransitionTo || '').trim(),
    isLocalStickerUrl: resolved.isLocalStickerUrl ?? false,
  });
  return renderPartialTemplate('sticker/sticker.py.jinja2', validated);
}
