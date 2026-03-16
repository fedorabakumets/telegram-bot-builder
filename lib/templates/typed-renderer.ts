/**
 * @fileoverview Типизированные обёртки для рендеринга Jinja2 шаблонов
 * @module templates/typed-renderer
 */

import { z } from 'zod';
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

/**
 * Генерация функции safe_edit_or_send с валидацией параметров
 * @param params - Параметры safe_edit_or_send
 * @returns Сгенерированный Python код функции
 */
export function generateSafeEditOrSend(params: {
  hasInlineButtonsOrSpecialNodes?: boolean;
  hasAutoTransitions?: boolean;
}): string {
  const validated = safeEditOrSendParamsSchema.parse(params);
  return renderPartialTemplate('safe-edit-or-send/safe-edit-or-send.py.jinja2', validated);
}

/**
 * Zod схема для валидации параметров safe_edit_or_send
 */
const safeEditOrSendParamsSchema = z.object({
  hasInlineButtonsOrSpecialNodes: z.boolean().optional().default(false),
  hasAutoTransitions: z.boolean().optional().default(false),
});
