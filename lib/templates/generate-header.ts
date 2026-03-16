/**
 * @fileoverview Генерация заголовка через типизированный рендерер
 * @module templates/generate-header
 */

import type { HeaderTemplateParams } from './types';
import { generateHeader as typedGenerateHeader } from './typed-renderer-part2';

/**
 * Генерация заголовка файла (UTF-8 кодировка)
 * @param options - Параметры заголовка
 * @returns Сгенерированный Python код заголовка
 */
export function generateHeader(options: HeaderTemplateParams = {}): string {
  return typedGenerateHeader(options);
}
