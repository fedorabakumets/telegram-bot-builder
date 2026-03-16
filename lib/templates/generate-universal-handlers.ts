/**
 * @fileoverview Генерация универсальных fallback обработчиков через Jinja2 шаблон
 * @module templates/generate-universal-handlers
 */

import type { UniversalHandlersTemplateParams } from './universal-handlers/universal-handlers.params';
import { generateUniversalHandlers as typedGenerateUniversalHandlers } from './typed-renderer-part2';

/**
 * Генерация универсальных fallback обработчиков
 * @param options - Параметры обработчиков
 * @returns Сгенерированный Python код обработчиков
 */
export function generateUniversalHandlers(options: UniversalHandlersTemplateParams): string {
  return typedGenerateUniversalHandlers(options);
}
