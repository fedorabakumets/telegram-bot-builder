/**
 * @fileoverview Генерация Python импортов через типизированный рендерер
 * @module templates/generate-imports
 */

import type { ImportsTemplateParams } from './types';
import { generateImports as typedGenerateImports } from './typed-renderer';

/**
 * Генерация Python импортов
 * @param options - Параметры генерации
 * @returns Сгенерированный Python код импортов
 */
export function generateImports(options: ImportsTemplateParams): string {
  return typedGenerateImports(options);
}
