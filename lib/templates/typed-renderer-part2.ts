/**
 * @fileoverview Типизированные обёртки для рендеринга Jinja2 шаблонов (часть 2)
 * @module templates/typed-renderer-part2
 */

import type {
  HeaderTemplateParams,
  DatabaseTemplateParams,
} from './types';
import {
  headerParamsSchema,
  databaseParamsSchema,
} from './schemas';
import { renderPartialTemplate } from './template-renderer';

/**
 * Генерация заголовка файла с валидацией параметров
 * @param params - Параметры заголовка
 * @returns Сгенерированный Python код заголовка
 */
export function generateHeader(params: HeaderTemplateParams): string {
  const validated = headerParamsSchema.parse(params);
  return renderPartialTemplate('header/header.py.jinja2', validated);
}

/**
 * Генерация функций базы данных с валидацией параметров
 * @param params - Параметры базы данных
 * @returns Сгенерированный Python код базы данных
 */
export function generateDatabase(params: DatabaseTemplateParams): string {
  const validated = databaseParamsSchema.parse(params);
  return renderPartialTemplate('database/database.py.jinja2', validated);
}
