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

/**
 * Пример вызова replace_variables_in_text с dot-notation.
 * Демонстрирует подстановку вложенного пути {validate_response.result.first_name}
 * из JSON-строки, сохранённой в переменной пользователя.
 */
export const dotNotationUsageExample = {
  text: 'Привет, {validate_response.result.first_name}! Твой ID: {user_id}',
  variables: {
    validate_response: '{"result": {"first_name": "Иван"}}',
    user_id: 42,
  },
  /** Ожидаемый результат после подстановки */
  expected: 'Привет, Иван! Твой ID: 42',
};
