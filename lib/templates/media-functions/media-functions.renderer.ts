/**
 * @fileoverview Renderer для шаблона Python-функций работы с медиафайлами
 * @module templates/media-functions/media-functions.renderer
 */

import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код функций save_media_to_db, link_media_to_message,
 * get_upload_file_path, register_telegram_photo, send_photo_with_caption.
 * Заменяет generateSaveMediaToDb + generateMediaFileFunctions из MediaHandler.
 */
export function generateMediaFunctions(): string {
  return renderPartialTemplate('media-functions/media-functions.py.jinja2', {});
}
