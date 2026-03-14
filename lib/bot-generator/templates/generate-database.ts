/**
 * @fileoverview Генерация базы данных через типизированный рендерер
 * @module templates/generate-database
 */

import type { DatabaseTemplateParams } from './types';
import { generateDatabase as typedGenerateDatabase } from './typed-renderer-part2';

/**
 * Генерация функций базы данных
 * @param options - Параметры базы данных
 * @returns Сгенерированный Python код базы данных
 */
export function generateDatabase(options: DatabaseTemplateParams): string {
  return typedGenerateDatabase(options);
}
