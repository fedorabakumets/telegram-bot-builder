/**
 * @fileoverview Генерация конфигурации через типизированный рендерер
 * @module templates/generate-config
 */

import type { ConfigTemplateParams } from './types';
import { generateConfig as typedGenerateConfig } from './typed-renderer';

/**
 * Генерация конфигурации бота
 * @param options - Параметры конфигурации
 * @returns Сгенерированный Python код конфигурации
 */
export function generateConfig(options: ConfigTemplateParams): string {
  return typedGenerateConfig(options);
}
