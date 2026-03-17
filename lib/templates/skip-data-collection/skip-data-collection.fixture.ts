/**
 * @fileoverview Тестовые данные для шаблона skip-data-collection
 * @module templates/skip-data-collection/skip-data-collection.fixture
 */

import type { SkipDataCollectionTemplateParams } from './skip-data-collection.params';

/** Валидные параметры: базовые */
export const validParamsBasic: SkipDataCollectionTemplateParams = {
  variableName: 'user_name',
  variableValue: 'message.text',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: SkipDataCollectionTemplateParams = {
  variableName: 'user_age',
  variableValue: 'int(message.text)',
  indentLevel: '        ',
};
