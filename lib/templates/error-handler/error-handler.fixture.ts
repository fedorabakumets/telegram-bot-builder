/**
 * @fileoverview Тестовые данные для шаблона error-handler
 * @module templates/error-handler/error-handler.fixture
 */

import type { ErrorHandlerTemplateParams } from './error-handler.params';

/** Валидные параметры: без отступа */
export const validParamsDefault: ErrorHandlerTemplateParams = {};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: ErrorHandlerTemplateParams = {
  indentLevel: '    ',
};

/** Ожидаемый вывод: блок except */
export const expectedOutputExcept = 'except Exception as e:';
