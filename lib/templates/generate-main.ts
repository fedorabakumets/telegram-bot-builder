/**
 * @fileoverview Генерация функции запуска бота (main) через Jinja2 шаблон
 * @module templates/generate-main
 */

import type { MainTemplateParams } from './main/main.params';
import { generateMain as typedGenerateMain } from './typed-renderer-part2';

/**
 * Генерация функции запуска бота (main)
 * @param options - Параметры запуска
 * @returns Сгенерированный Python код функции main
 */
export function generateMain(options: MainTemplateParams): string {
  return typedGenerateMain(options);
}
