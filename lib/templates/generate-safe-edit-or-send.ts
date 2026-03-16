/**
 * @fileoverview Генерация функции safe_edit_or_send через Jinja2 шаблон
 * @module templates/generate-safe-edit-or-send
 */

import type { SafeEditOrSendTemplateParams } from './safe-edit-or-send/safe-edit-or-send.params';
import { generateSafeEditOrSend as typedGenerateSafeEditOrSend } from './typed-renderer';

/**
 * Генерация функции safe_edit_or_send
 * @param options - Параметры функции
 * @returns Сгенерированный Python код функции
 */
export function generateSafeEditOrSend(options: SafeEditOrSendTemplateParams): string {
  return typedGenerateSafeEditOrSend(options);
}
