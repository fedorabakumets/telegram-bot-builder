/**
 * @fileoverview Валидация пользовательского ввода
 * Агрегирует функции валидации различных типов ввода
 */

import { generateLengthValidation } from './validate-length';
import { generateEmailValidation } from './validate-email';
import { generateNumberValidation } from './validate-number';
import { generatePhoneValidation } from './validate-phone';

/**
 * Генерирует код валидации пользовательского ввода
 * @returns {string} Python код валидации
 */
export const generateUserInputValidation = (): string => {
  let code = '    # Валидация типа ввода\n';
  code += '    input_type = input_config.get("type", "text")\n';
  code += '    \n';
  code += generateLengthValidation();
  code += generateEmailValidation();
  code += generateNumberValidation();
  code += generatePhoneValidation();
  return code;
};
