/**
 * @fileoverview Генерация утилит через типизированный рендерер
 * @module templates/generate-utils
 */

import type { UtilsTemplateParams } from './types';
import { generateUtils as typedGenerateUtils } from './typed-renderer-part2';

/**
 * Генерация утилитарных функций
 * @param options - Параметры утилит
 * @returns Сгенерированный Python код утилит
 */
export function generateUtils(options: UtilsTemplateParams): string {
  return typedGenerateUtils(options);
}
