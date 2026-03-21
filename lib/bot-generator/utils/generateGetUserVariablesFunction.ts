/**
 * Генерирует код функции для получения пользовательских переменных
 * Делегирует в Jinja2-шаблон templates/user-variables-func
 */

import { generateGetUserVariablesFunction as _generate } from '../../templates/user-variables-func';

export function generateGetUserVariablesFunction(indentLevel: string = ''): string {
  return _generate({ indentLevel });
}
