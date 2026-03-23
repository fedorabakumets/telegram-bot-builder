/**
 * @fileoverview Тестовые данные для шаблона утилит
 * @module templates/utils/utils-template.fixture
 */

import type { UtilsTemplateParams } from './utils-template.params';

/** Валидные параметры: БД включена */
export const validParamsEnabled: UtilsTemplateParams = {
  userDatabaseEnabled: true,
};

/** Валидные параметры: БД выключена */
export const validParamsDisabled: UtilsTemplateParams = {
  userDatabaseEnabled: false,
};

/** Валидные параметры: adminOnly включён */
export const validParamsAdminOnly: UtilsTemplateParams = {
  userDatabaseEnabled: false,
  adminOnly: true,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};
