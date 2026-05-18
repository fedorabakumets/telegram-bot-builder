/**
 * @fileoverview Тестовые данные для шаблона загрузки контента
 * @module templates/content/content.fixture
 */

import type { ContentTemplateParams } from './content.params';

/** Валидные параметры с интервалом по умолчанию */
export const validParams: ContentTemplateParams = {
  projectId: 245,
  reloadIntervalSeconds: 60,
};

/** Валидные параметры с кастомным интервалом */
export const validParamsCustomInterval: ContentTemplateParams = {
  projectId: 100,
  reloadIntervalSeconds: 30,
};
