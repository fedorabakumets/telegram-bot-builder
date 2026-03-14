/**
 * @fileoverview Генерация запуска бота через типизированный рендерер
 * @module templates/generate-main
 */

import type { MainTemplateParams } from './types';
import { generateMain as typedGenerateMain } from './typed-renderer-part3';

/**
 * Генерация функции запуска бота
 * @param options - Параметры запуска
 * @returns Сгенерированный Python код запуска
 */
export function generateMain(options: MainTemplateParams): string {
  return typedGenerateMain(options);
}
