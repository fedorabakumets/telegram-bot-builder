/**
 * @fileoverview Типизированные обёртки для рендеринга Jinja2 шаблонов (часть 3)
 * @module templates/typed-renderer-part3
 */

import type {
  UtilsTemplateParams,
  MainTemplateParams,
} from './types';
import {
  utilsParamsSchema,
  mainParamsSchema,
} from './schemas';
import { renderPartialTemplate } from './template-renderer';

/**
 * Генерация утилитарных функций с валидацией параметров
 * @param params - Параметры утилит
 * @returns Сгенерированный Python код утилит
 */
export function generateUtils(params: UtilsTemplateParams): string {
  const validated = utilsParamsSchema.parse(params);
  return renderPartialTemplate('utils/utils.py.jinja2', validated);
}

/**
 * Генерация функции запуска бота с валидацией параметров
 * @param params - Параметры запуска
 * @returns Сгенерированный Python код запуска
 */
export function generateMain(params: MainTemplateParams): string {
  const validated = mainParamsSchema.parse(params);
  return renderPartialTemplate('main/main.py.jinja2', validated);
}
