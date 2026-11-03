/**
 * @fileoverview Тестовые данные для шаблона middleware
 * @module templates/middleware/middleware.fixture
 */

import type { MiddlewareTemplateParams } from './middleware.params';

/** Валидные параметры: БД включена, авторегистрация включена */
export const validParamsEnabled: MiddlewareTemplateParams & { /** Состояние базы в тестовой фикстуре. */ userDatabaseEnabled: boolean } = {
  userDatabaseEnabled: true,
  autoRegisterUsers: true,
};

/** Валидные параметры: БД выключена, авторегистрация включена */
export const validParamsDisabled: MiddlewareTemplateParams & { /** Состояние базы в тестовой фикстуре. */ userDatabaseEnabled: boolean } = {
  userDatabaseEnabled: false,
  autoRegisterUsers: true,
};

/** Валидные параметры: авторегистрация выключена */
export const validParamsNoAutoRegister: MiddlewareTemplateParams & { /** Состояние базы в тестовой фикстуре. */ userDatabaseEnabled: boolean } = {
  userDatabaseEnabled: false,
  autoRegisterUsers: false,
};

/** Валидные параметры: только БД без авторегистрации */
export const validParamsDbOnly: MiddlewareTemplateParams & { /** Состояние базы в тестовой фикстуре. */ userDatabaseEnabled: boolean } = {
  userDatabaseEnabled: true,
  autoRegisterUsers: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};

/** Валидные параметры: БД включена, авторегистрация включена, сохранение фото включено */
export const validParamsWithSaveMedia: MiddlewareTemplateParams & { /** Состояние базы в тестовой фикстуре. */ userDatabaseEnabled: boolean } = {
  userDatabaseEnabled: true,
  autoRegisterUsers: true,
  saveIncomingMedia: true,
};

/** Валидные параметры: БД включена, авторегистрация включена, сохранение фото выключено */
export const validParamsNoSaveMedia: MiddlewareTemplateParams & { /** Состояние базы в тестовой фикстуре. */ userDatabaseEnabled: boolean } = {
  userDatabaseEnabled: true,
  autoRegisterUsers: true,
  saveIncomingMedia: false,
};
