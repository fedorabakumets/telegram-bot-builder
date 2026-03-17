/**
 * @fileoverview Тестовые данные (фикстуры) для шаблона get_user_variables
 * @module templates/user-variables-func/user-variables-func.fixture
 */

import type { UserVariablesFuncTemplateParams } from './user-variables-func.params';

/** Параметры без отступа (корневой уровень) */
export const validParamsNoIndent: UserVariablesFuncTemplateParams = {};

/** Параметры с отступом в 4 пробела */
export const validParamsIndent4: UserVariablesFuncTemplateParams = {
  indentLevel: '    ',
};

/** Параметры с отступом в 8 пробелов (вложенная функция) */
export const validParamsIndent8: UserVariablesFuncTemplateParams = {
  indentLevel: '        ',
};

/** Параметры с пустой строкой отступа (эквивалентно без отступа) */
export const validParamsEmptyIndent: UserVariablesFuncTemplateParams = {
  indentLevel: '',
};

/** Ожидаемый вывод без отступа */
export const expectedOutputNoIndent = `def get_user_variables(user_id):`;

/** Ожидаемый вывод с отступом 4 пробела */
export const expectedOutputIndent4 = `    def get_user_variables(user_id):`;
