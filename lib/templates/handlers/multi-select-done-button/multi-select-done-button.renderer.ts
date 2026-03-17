import type { MultiSelectDoneButtonTemplateParams } from './multi-select-done-button.params';
import { renderPartialTemplate } from '../../template-renderer';

export function generateMultiSelectDoneButtonTemplate(params: MultiSelectDoneButtonTemplateParams): string {
  return renderPartialTemplate('handlers/multi-select-done-button/multi-select-done-button.py.jinja2', params);
}
