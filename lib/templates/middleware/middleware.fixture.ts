/**
 * @fileoverview Тестовые данные для шаблона middleware
 * @module templates/middleware/middleware.fixture
 */

import type { MiddlewareTemplateParams } from './middleware.params';

/** Валидные параметры: БД включена, авторегистрация включена */
export const validParamsEnabled: MiddlewareTemplateParams = {
  userDatabaseEnabled: true,
  autoRegisterUsers: true,
};

/** Валидные параметры: БД выключена, авторегистрация включена */
export const validParamsDisabled: MiddlewareTemplateParams = {
  userDatabaseEnabled: false,
  autoRegisterUsers: true,
};

/** Валидные параметры: авторегистрация выключена */
export const validParamsNoAutoRegister: MiddlewareTemplateParams = {
  userDatabaseEnabled: false,
  autoRegisterUsers: false,
};

/** Валидные параметры: только БД без авторегистрации */
export const validParamsDbOnly: MiddlewareTemplateParams = {
  userDatabaseEnabled: true,
  autoRegisterUsers: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};
