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

// ============================================================================
// ИМПОРТЫ
// ============================================================================

/**
 * Генерация Python импортов с валидацией параметров
 * @param params - Параметры импортов
 * @returns Сгенерированный Python код импортов
 */
export function generateImports(params: ImportsTemplateParams): string {
  const validated = importsParamsSchema.parse(params);
  return renderPartialTemplate('imports/imports.py.jinja2', validated);
}

// ============================================================================
// ЗАГОЛОВОК
// ============================================================================

/**
 * Генерация заголовка файла с валидацией параметров
 * @param params - Параметры заголовка
 * @returns Сгенерированный Python код заголовка
 */
export function generateHeader(params: HeaderTemplateParams): string {
  const validated = headerParamsSchema.parse(params);
  return renderPartialTemplate('header/header.py.jinja2', validated);
}

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

/**
 * Генерация конфигурации бота с валидацией параметров
 * @param params - Параметры конфигурации
 * @returns Сгенерированный Python код конфигурации
 */
export function generateConfig(params: ConfigTemplateParams): string {
  const validated = configParamsSchema.parse(params);
  return renderPartialTemplate('config/config.py.jinja2', validated);
}

// ============================================================================
// SAFE_EDIT_OR_SEND
// ============================================================================

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

// ============================================================================
// БАЗА ДАННЫХ
// ============================================================================

/**
 * Генерация функций базы данных с валидацией параметров
 * @param params - Параметры базы данных
 * @returns Сгенерированный Python код базы данных
 */
export function generateDatabase(params: DatabaseTemplateParams): string {
  const validated = databaseParamsSchema.parse(params);
  return renderPartialTemplate('database/database.py.jinja2', validated);
}

// ============================================================================
// УНИВЕРСАЛЬНЫЕ ОБРАБОТЧИКИ
// ============================================================================

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
 * Zod схема для валидации параметров универсальных обработчиков
 */
const universalHandlersParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional().default(false),
});

// ============================================================================
// УТИЛИТЫ
// ============================================================================

/**
 * Генерация утилитарных функций с валидацией параметров
 * @param params - Параметры утилит
 * @returns Сгенерированный Python код утилит
 */
export function generateUtils(params: UtilsTemplateParams): string {
  const validated = utilsParamsSchema.parse(params);
  return renderPartialTemplate('utils/utils.py.jinja2', validated);
}

// ============================================================================
// MAIN (ЗАПУСК БОТА)
// ============================================================================

/**
 * Генерация функции запуска бота (main) с валидацией параметров
 * @param params - Параметры запуска бота
 * @returns Сгенерированный Python код функции main
 */
export function generateMain(params: MainTemplateParams): string {
  const validated = mainParamsSchema.parse(params);
  return renderPartialTemplate('main/main.py.jinja2', validated);
}
