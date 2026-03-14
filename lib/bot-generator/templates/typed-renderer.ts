/**
 * @fileoverview Типизированные обёртки для рендеринга Jinja2 шаблонов
 * @module templates/typed-renderer
 */

import type {
  ImportsTemplateParams,
  ConfigTemplateParams,
  HeaderTemplateParams,
  DatabaseTemplateParams,
  UtilsTemplateParams,
  MainTemplateParams,
} from './types';
import {
  importsParamsSchema,
  configParamsSchema,
  headerParamsSchema,
  databaseParamsSchema,
  utilsParamsSchema,
  mainParamsSchema,
} from './schemas';
import { renderPartialTemplate } from './template-renderer';

/**
 * Генерация Python импортов с валидацией параметров
 * @param params - Параметры импортов
 * @returns Сгенерированный Python код импортов
 */
export function generateImports(params: ImportsTemplateParams): string {
  const validated = importsParamsSchema.parse(params);
  return renderPartialTemplate('imports/imports.py.jinja2', validated);
}

/**
 * Генерация конфигурации бота с валидацией параметров
 * @param params - Параметры конфигурации
 * @returns Сгенерированный Python код конфигурации
 */
export function generateConfig(params: ConfigTemplateParams): string {
  const validated = configParamsSchema.parse(params);
  return renderPartialTemplate('config/config.py.jinja2', validated);
}
