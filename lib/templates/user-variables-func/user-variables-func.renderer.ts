import type { UserVariablesFuncTemplateParams } from './user-variables-func.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateGetUserVariablesFunction(params: UserVariablesFuncTemplateParams = {}): string {
  return renderPartialTemplate('user-variables-func/user-variables-func.py.jinja2', params);
}
