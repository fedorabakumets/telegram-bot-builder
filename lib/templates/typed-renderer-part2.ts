/**
 * @fileoverview Типизированные обёртки для рендеринга Jinja2 шаблонов (часть 2)
 * @module templates/typed-renderer-part2
 */

import { z } from 'zod';
import type {
  HeaderTemplateParams,
  DatabaseTemplateParams,
  MainTemplateParams,
} from './types';
import {
  headerParamsSchema,
  databaseParamsSchema,
  mainParamsSchema,
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

/**
 * Генерация универсальных fallback обработчиков с валидацией параметров
 * @param params - Параметры универсальных обработчиков
 * @returns Сгенерированный Python код обработчиков
 */
export function generateUniversalHandlers(params: { userDatabaseEnabled?: boolean }): string {
  const validated = universalHandlersParamsSchema.parse(params);
  return renderPartialTemplate('universal-handlers/universal-handlers.py.jinja2', validated);
}

/**
 * Генерация функции запуска бота (main) с валидацией параметров
 * @param params - Параметры запуска бота
 * @returns Сгенерированный Python код функции main
 */
export function generateMain(params: MainTemplateParams): string {
  const validated = mainParamsSchema.parse(params);
  return renderPartialTemplate('main/main.py.jinja2', validated);
}

/**
 * Zod схема для валидации параметров универсальных обработчиков
 */
const universalHandlersParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional().default(false),
});
