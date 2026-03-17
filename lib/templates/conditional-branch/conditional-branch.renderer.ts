import type { ConditionalBranchTemplateParams } from './conditional-branch.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateConditionalBranch(params: ConditionalBranchTemplateParams): string {
  return renderPartialTemplate('conditional-branch/conditional-branch.py.jinja2', params);
}
